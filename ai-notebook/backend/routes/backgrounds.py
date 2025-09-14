from flask import Blueprint, request, jsonify, send_file
from models import db, Setting
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
import tempfile
import json
from PIL import Image
import shutil
import sys
import threading
try:
    import fcntl  # Unix系统
except ImportError:
    fcntl = None  # Windows系统
try:
    import msvcrt  # Windows系统
except ImportError:
    msvcrt = None
import hashlib

# 添加 utils 目录到路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
from background_sync import sync_manager

backgrounds_bp = Blueprint('backgrounds', __name__)

# Configuration文件上传
UPLOAD_FOLDER = 'uploads/backgrounds'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_FILENAME_LENGTH = 255
ALLOWED_MIME_TYPES = {
    'image': ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/webm', 'video/quicktime']
}

# 确保上传目录存在（在非serverless环境中）
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except OSError as e:
    # 在Vercel等serverless环境中，文件系统是只读的
    print(f"[BACKGROUNDS] Warning: Cannot create upload directory in serverless environment: {e}")

# 文件锁机制，防止并发访问冲突 - 跨平台实现
if os.name == 'nt':  # Windows系统
    import msvcrt
    file_locks = {}  # 文件路径到锁对象的映射
    
    def acquire_file_lock(lock_name='background_upload'):
        """Windows系统文件锁实现"""
        try:
            # 使用线程锁作为替代方案
            if lock_name not in file_locks:
                file_locks[lock_name] = threading.Lock()
            return file_locks[lock_name].acquire(timeout=30)
        except Exception as e:
            print(f"[LOCK] Windows文件锁获取失败: {e}")
            return False
    
    def release_file_lock(lock_name='background_upload'):
        """Windows系统文件锁释放"""
        try:
            if lock_name in file_locks:
                file_locks[lock_name].release()
        except RuntimeError:
            pass
    
else:  # Unix/Linux系统
    import fcntl
    lock_files = {}  # 文件路径到文件描述符的映射
    
    def acquire_file_lock(lock_name='background_upload'):
        """Unix系统文件锁实现"""
        try:
            # 创建锁文件
            lock_file = f'/tmp/ai_notebook_{lock_name}.lock'
            fd = os.open(lock_file, os.O_CREAT | os.O_RDWR)
            
            # 获取排他锁
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            lock_files[lock_name] = fd
            return True
        except (IOError, OSError) as e:
            print(f"[LOCK] Unix文件锁获取失败: {e}")
            return False
    
    def release_file_lock(lock_name='background_upload'):
        """Unix系统文件锁释放"""
        try:
            if lock_name in lock_files:
                fd = lock_files[lock_name]
                fcntl.flock(fd, fcntl.LOCK_UN)
                os.close(fd)
                del lock_files[lock_name]
                
                # 清理锁文件
                lock_file = f'/tmp/ai_notebook_{lock_name}.lock'
                if os.path.exists(lock_file):
                    os.remove(lock_file)
        except Exception as e:
            print(f"[LOCK] Unix文件锁释放失败: {e}")

# 兼容层 - 使用线程锁作为备选方案
file_lock = threading.Lock()

def acquire_file_lock_backup():
    """备选文件锁实现 - 使用线程锁"""
    try:
        return file_lock.acquire(timeout=30)
    except Exception as e:
        print(f"[LOCK] 备选文件锁获取失败: {e}")
        return False

def release_file_lock_backup():
    """备选文件锁释放"""
    try:
        file_lock.release()
    except RuntimeError:
        pass

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in {'png', 'jpg', 'jpeg', 'gif', 'webp'}:
        return 'image'
    elif ext in {'mp4', 'webm', 'mov'}:
        return 'video'
    return 'unknown'

def validate_mime_type(file_path, expected_type):
    """增强的MIME类型验证 - 防止MIME类型欺骗"""
    try:
        import magic
        mime = magic.Magic(mime=True)
        detected_mime = mime.from_file(file_path)
        
        print(f"[MIME] 检测到MIME类型: {detected_mime}, 期望类型: {expected_type}")
        
        # 更严格的MIME类型验证
        if expected_type == 'image':
            allowed_image_types = set(ALLOWED_MIME_TYPES['image'])
            if detected_mime not in allowed_image_types:
                print(f"[MIME] 图片MIME类型验证失败: {detected_mime}")
                return False
                
        elif expected_type == 'video':
            allowed_video_types = set(ALLOWED_MIME_TYPES['video'])
            if detected_mime not in allowed_video_types:
                print(f"[MIME] 视频MIME类型验证失败: {detected_mime}")
                return False
        else:
            print(f"[MIME] 未知的期望类型: {expected_type}")
            return False
            
        return True
        
    except ImportError:
        # 如果没有magic库，使用文件头验证作为备选方案
        print("[MIME] Warning: python-magic库未安装，使用文件头验证")
        return validate_file_header(file_path, expected_type)
    except Exception as e:
        print(f"[MIME] MIME类型验证错误: {str(e)}")
        return False

def validate_file_header(file_path, expected_type):
    """文件头验证 - MIME库不可用时使用"""
    try:
        with open(file_path, 'rb') as f:
            header = f.read(32)  # 读取文件头
            
        # 图片文件头验证
        if expected_type == 'image':
            image_signatures = {
                b'\x89PNG': 'PNG',
                b'\xff\xd8': 'JPEG',
                b'GIF87a': 'GIF',
                b'GIF89a': 'GIF',
                b'RIFF': 'WebP'
            }
            
            for signature, format_name in image_signatures.items():
                if header.startswith(signature):
                    print(f"[HEADER] 检测到{format_name}图片格式")
                    return True
                    
        # 视频文件头验证
        elif expected_type == 'video':
            video_signatures = {
                b'ftypmp4': 'MP4',
                b'ftypisom': 'MP4',
                b'ftypM4V': 'M4V',
                b'webm': 'WebM',
                b'\x00\x00\x00\x20ftyp': 'MOV'
            }
            
            for signature, format_name in video_signatures.items():
                if signature in header[:50]:  # 视频文件头可能在不同位置
                    print(f"[HEADER] 检测到{format_name}视频格式")
                    return True
        
        print(f"[HEADER] 未识别的{expected_type}文件头")
        return False
        
    except Exception as e:
        print(f"[HEADER] 文件头验证错误: {str(e)}")
        return False

def validate_image_integrity(file_path):
    """验证图片文件完整性"""
    try:
        with open(file_path, 'rb') as f:
            header = f.read(32)
            
        # 验证图片文件头
        valid_headers = {
            b'\x89PNG': 'PNG',
            b'\xff\xd8': 'JPEG', 
            b'GIF87a': 'GIF',
            b'GIF89a': 'GIF',
            b'RIFF': 'WebP'
        }
        
        file_ext = file_path.lower().split('.')[-1]
        
        # 扩展名与文件头匹配验证
        header_valid = False
        for signature, format_name in valid_headers.items():
            if header.startswith(signature):
                # 验证扩展名与文件头是否匹配
                if (file_ext == 'png' and format_name == 'PNG') or \
                   (file_ext in ['jpg', 'jpeg'] and format_name == 'JPEG') or \
                   (file_ext == 'gif' and format_name == 'GIF') or \
                   (file_ext == 'webp' and format_name == 'WebP'):
                    header_valid = True
                    break
        
        if not header_valid:
            return False, "图片文件头与扩展名不匹配"
            
        # 尝试用PIL打开图片进行完整性验证
        try:
            with Image.open(file_path) as img:
                img.verify()  # 验证图片完整性
                return True, "图片完整性验证通过"
        except Exception as e:
            return False, f"图片文件损坏或格式错误: {str(e)}"
            
    except Exception as e:
        return False, f"图片完整性验证失败: {str(e)}"

def validate_video_integrity(file_path):
    """验证视频文件完整性"""
    try:
        with open(file_path, 'rb') as f:
            header = f.read(64)
            
        # 视频文件头验证
        video_signatures = {
            b'ftypmp4': 'MP4',
            b'ftypisom': 'MP4', 
            b'ftypM4V': 'M4V',
            b'ftypqt': 'MOV',
            b'webm': 'WebM'
        }
        
        file_ext = file_path.lower().split('.')[-1]
        header_valid = False
        
        for signature, format_name in video_signatures.items():
            if signature in header:
                # 验证扩展名与文件头是否匹配
                if (file_ext == 'mp4' and format_name == 'MP4') or \
                   (file_ext == 'mov' and format_name == 'MOV') or \
                   (file_ext == 'webm' and format_name == 'WebM') or \
                   (file_ext == 'm4v' and format_name == 'M4V'):
                    header_valid = True
                    break
        
        if not header_valid:
            return False, "视频文件头与扩展名不匹配"
            
        # 检查文件大小合理性（最小1KB，最大50MB已在前面验证）
        file_size = os.path.getsize(file_path)
        if file_size < 1024:  # 小于1KB的视频文件可能有问题
            return False, "视频文件过小"
            
        return True, "视频文件头验证通过"
        
    except Exception as e:
        return False, f"视频完整性验证失败: {str(e)}"

def scan_for_malware(file_path):
    """增强的安全检查 - 多层面文件验证"""
    try:
        with open(file_path, 'rb') as f:
            header = f.read(1024)  # 增加读取范围到1KB
            
            # 检查可执行文件头
            executable_signatures = [
                (b'MZ', 'Windows可执行文件'),
                (b'\x7fELF', 'Linux可执行文件'),
                (b'\xca\xfe\xba\xbe', 'Java类文件'),
                (b'\xfe\xed\xfa', 'macOS可执行文件'),
                (b'#!', '脚本文件'),
                (b'\x25\x50\x44\x46', 'PDF文件'),
            ]
            
            for signature, description in executable_signatures:
                if header.startswith(signature):
                    print(f"[SECURITY] 检测到{description}")
                    return False, f"检测到{description}"
            
            # 检查脚本内容
            script_patterns = [
                (b'<?php', 'PHP脚本'),
                (b'<script', 'JavaScript脚本'),
                (b'javascript:', 'JavaScript代码'),
                (b'vbscript:', 'VBScript脚本'),
                (b'onload=', 'HTML事件脚本'),
                (b'onclick=', 'HTML事件脚本'),
            ]
            
            for pattern, description in script_patterns:
                if pattern in header.lower():
                    print(f"[SECURITY] 检测到{description}")
                    return False, f"检测到{description}"
            
            # 检查压缩包和归档文件（可能被用于绕过检查）
            archive_signatures = [
                (b'PK', 'ZIP压缩包'),
                (b'Rar!', 'RAR压缩包'),
                (b'7z\xbc\xaf\x27\x1c', '7Z压缩包'),
                (b'\x1f\x8b', 'GZIP压缩包'),
            ]
            
            for signature, description in archive_signatures:
                if header.startswith(signature):
                    print(f"[SECURITY] 检测到{description}")
                    return False, f"检测到{description}"
            
            return True, "安全检查通过"
            
    except Exception as e:
        return False, f"安全检查失败: {str(e)}"

@backgrounds_bp.route('/api/backgrounds/upload', methods=['POST'])
def upload_background():
    """上传Background文件 - 支持 Vercel 环境"""
    upload_id = str(uuid.uuid4())[:8]  # 用于跟踪此次上传的ID
    print(f"[UPLOAD-{upload_id}] Background upload request received")
    
    # 检测是否在 Vercel 环境中
    is_vercel = os.environ.get('VERCEL') == '1' or os.environ.get('VERCEL_ENV') is not None
    print(f"[UPLOAD-{upload_id}] Vercel environment detected: {is_vercel}")
    
    try:
        if 'file' not in request.files:
            print(f"[UPLOAD-{upload_id}] Error: No file in request")
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            print(f"[UPLOAD-{upload_id}] Error: Empty filename")
            return jsonify({'error': '没有选择文件'}), 400
        
        # 验证文件名长度
        if len(file.filename) > MAX_FILENAME_LENGTH:
            print(f"[UPLOAD-{upload_id}] Error: Filename too long ({len(file.filename)} chars)")
            return jsonify({'error': f'文件名过长，请使用少于{MAX_FILENAME_LENGTH}个字符的文件名'}), 400
        
        print(f"[UPLOAD-{upload_id}] Processing file: {file.filename}")
        
        if not allowed_file(file.filename):
            print(f"[UPLOAD-{upload_id}] Error: File type not allowed: {file.filename}")
            return jsonify({'error': 'Not Supported的文件格式。仅支持: ' + ', '.join(ALLOWED_EXTENSIONS)}), 400
        
        # 检查文件大小 - 使用内存高效的方式
        try:
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            print(f"[UPLOAD-{upload_id}] File size: {file_size} bytes")
            
            if file_size > MAX_FILE_SIZE:
                print(f"[UPLOAD-{upload_id}] Error: File too large ({file_size} bytes)")
                return jsonify({'error': f'文件过大，请选择小于{MAX_FILE_SIZE // (1024*1024)}MB的文件'}), 400
            
            if file_size == 0:
                print(f"[UPLOAD-{upload_id}] Error: Empty file")
                return jsonify({'error': '不能上传空文件'}), 400
                
        except Exception as e:
            print(f"[UPLOAD-{upload_id}] Error checking file size: {str(e)}")
            return jsonify({'error': 'File size check failed'}), 400
        
        # 生成唯一文件名
        file_id = str(uuid.uuid4())
        
        # Vercel 环境：返回 Base64 数据 URL
        if is_vercel:
            print(f"[UPLOAD-{upload_id}] Processing in Vercel environment - using Base64")
            
            # 读取文件内容
            file_content = file.read()
            file.seek(0)
            
            # 获取 MIME 类型
            import mimetypes
            mime_type, _ = mimetypes.guess_type(file.filename)
            if not mime_type:
                # 根据扩展名设置默认 MIME 类型
                ext = file.filename.rsplit('.', 1)[-1].lower()
                mime_type_map = {
                    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                    'png': 'image/png', 'gif': 'image/gif',
                    'webp': 'image/webp', 'mp4': 'video/mp4',
                    'webm': 'video/webm', 'mov': 'video/quicktime'
                }
                mime_type = mime_type_map.get(ext, 'application/octet-stream')
            
            # 转换为 Base64
            import base64
            base64_content = base64.b64encode(file_content).decode('utf-8')
            data_url = f"data:{mime_type};base64,{base64_content}"
            
            # 获取主题分类信息
            theme = request.form.get('theme', 'light')
            
            # 构建返回信息
            background_info = {
                'id': file_id,
                'original_name': file.filename,
                'file_url': data_url,  # 使用 Data URL
                'file_type': get_file_type(file.filename),
                'file_size': file_size,
                'theme': theme,
                'upload_time': datetime.now().isoformat(),
                'upload_id': upload_id,
                'storage_type': 'base64'  # 标记存储类型
            }
            
            print(f"[UPLOAD-{upload_id}] Vercel upload completed successfully")
            
            # 在 Vercel 环境中，我们仍然可以保存到数据库
            try:
                backgrounds_setting = Setting.query.filter_by(key='background_files').first()
                if backgrounds_setting:
                    backgrounds = json.loads(backgrounds_setting.value)
                else:
                    backgrounds = []
                
                backgrounds.append(background_info)
                
                if backgrounds_setting:
                    backgrounds_setting.value = json.dumps(backgrounds)
                else:
                    backgrounds_setting = Setting(key='background_files', value=json.dumps(backgrounds))
                    db.session.add(backgrounds_setting)
                
                db.session.commit()
                print(f"[UPLOAD-{upload_id}] Background info saved to database")
                
            except Exception as db_error:
                print(f"[UPLOAD-{upload_id}] Database save failed: {str(db_error)}")
                # 即使数据库保存失败，我们仍然返回成功，因为文件已经处理完成
            
            return jsonify({
                'message': '文件上传成功',
                'url': data_url,
                'filename': file.filename,
                'id': file_id,
                'size': file_size,
                'type': background_info['file_type'],
                'theme': theme
            }), 200
        
        # 本地环境：使用文件系统存储（原有逻辑）
        print(f"[UPLOAD-{upload_id}] Processing in local environment - using file system")
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        new_filename = f"{file_id}.{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, new_filename)
        
        print(f"[UPLOAD-{upload_id}] Saving file to: {file_path}")
        
        # Save文件（临时Save用于验证）
        try:
            file.save(file_path)
            print(f"[UPLOAD-{upload_id}] File saved successfully")
        except Exception as e:
            print(f"[UPLOAD-{upload_id}] Error saving file: {str(e)}")
            return jsonify({'error': '文件SaveFailed，请重试'}), 500
        
        # 执行安全检查
        print(f"[UPLOAD-{upload_id}] Running security scan...")
        is_safe, security_message = scan_for_malware(file_path)
        if not is_safe:
            print(f"[UPLOAD-{upload_id}] Security scan failed: {security_message}")
            os.remove(file_path)  # Delete不安全的文件
            return jsonify({'error': f'安全检查Failed: {security_message}'}), 400
        
        print(f"[UPLOAD-{upload_id}] Security scan passed")
        
        # 验证MIME类型
        expected_type = get_file_type(filename)
        print(f"[UPLOAD-{upload_id}] Expected file type: {expected_type}")
        
        if not validate_mime_type(file_path, expected_type):
            print(f"[UPLOAD-{upload_id}] MIME type validation failed")
            os.remove(file_path)  # DeleteMIME类型不匹配的文件
            return jsonify({'error': '文件类型与扩展名不匹配'}), 400
        
        print(f"[UPLOAD-{upload_id}] MIME type validation passed")
        
        # 获取文件Info
        file_type = get_file_type(filename)
        file_url = f"/api/backgrounds/file/{file_id}.{file_ext}"
        
        print(f"[UPLOAD-{upload_id}] File type: {file_type}, URL: {file_url}")
        
        # 获取Theme分类Info
        theme = request.form.get('theme', 'light')  # 默认为LightTheme
        
        print(f"[UPLOAD-{upload_id}] Theme: {theme}")
        
        # 如果是图片，生成缩略图
        thumbnail_url = None
        if file_type == 'image':
            try:
                print(f"[UPLOAD-{upload_id}] Generating thumbnail...")
                with Image.open(file_path) as img:
                    # 创建缩略图
                    img.thumbnail((300, 200), Image.Resampling.LANCZOS)
                    thumbnail_filename = f"{file_id}_thumb.{file_ext}"
                    thumbnail_path = os.path.join(UPLOAD_FOLDER, thumbnail_filename)
                    img.save(thumbnail_path)
                    thumbnail_url = f"/api/backgrounds/file/{thumbnail_filename}"
                    print(f"[UPLOAD-{upload_id}] Thumbnail generated: {thumbnail_url}")
            except Exception as e:
                print(f"[UPLOAD-{upload_id}] Thumbnail generation failed: {str(e)}")
                # 缩略图生成Failed不是致命Error，继续处理
        
        # Save文件Info到数据库
        background_info = {
            'id': file_id,
            'original_name': filename,
            'file_path': file_path,
            'file_url': file_url,
            'thumbnail_url': thumbnail_url,
            'file_type': file_type,
            'file_size': file_size,
            'theme': theme,  # 添加Theme分类
            'upload_time': datetime.now().isoformat(),
            'security_scan_passed': True,
            'upload_id': upload_id
        }
        
        print(f"[UPLOAD-{upload_id}] Background upload completed successfully")
        
        # 使用文件锁防止并发问题
        if not acquire_file_lock():
            # 清理已上传的文件
            try:
                os.remove(file_path)
                if thumbnail_url and os.path.exists(os.path.join(UPLOAD_FOLDER, f"{file_id}_thumb.{file_ext}")):
                    os.remove(os.path.join(UPLOAD_FOLDER, f"{file_id}_thumb.{file_ext}"))
            except:
                pass
            return jsonify({'error': '系统繁忙，请稍后重试'}), 503
        
        try:
            # 使用Sync管理器添加文件记录
            if not sync_manager.add_background_file(background_info):
                # 如果Sync管理器Failed，回退到原始方法
                print("[UPLOAD] Sync管理器Failed，使用原始方法")
                
                # 使用数据库锁防止竞态条件
                backgrounds_setting = Setting.query.filter_by(key='background_files').with_for_update().first()
                if backgrounds_setting:
                    backgrounds = json.loads(backgrounds_setting.value)
                else:
                    backgrounds = []
                
                backgrounds.append(background_info)
                
                if backgrounds_setting:
                    backgrounds_setting.value = json.dumps(backgrounds)
                else:
                    backgrounds_setting = Setting(key='background_files', value=json.dumps(backgrounds))
                    db.session.add(backgrounds_setting)
                
                db.session.commit()
        finally:
            release_file_lock()
        
        return jsonify({
            'id': file_id,
            'name': filename,
            'type': file_type,
            'url': file_url,
            'thumbnail_url': thumbnail_url,
            'size': file_size,
            'theme': theme
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@backgrounds_bp.route('/api/backgrounds', methods=['GET'])
def get_backgrounds():
    """获取所有Background文件"""
    try:
        backgrounds_setting = Setting.query.filter_by(key='background_files').first()
        if backgrounds_setting:
            backgrounds = json.loads(backgrounds_setting.value)
            # 返回简化的Info
            result = []
            for bg in backgrounds:
                result.append({
                    'id': bg['id'],
                    'name': bg['original_name'],
                    'type': bg['file_type'],
                    'url': bg['file_url'],
                    'thumbnail_url': bg.get('thumbnail_url'),
                    'size': bg['file_size'],
                    'theme': bg.get('theme', 'light')  # 兼容旧数据，默认为LightTheme
                })
            return jsonify(result)
        else:
            return jsonify([])
    except Exception as e:
        return jsonify({'error': f'获取Background列表Failed: {str(e)}'}), 500

@backgrounds_bp.route('/api/backgrounds/<file_id>', methods=['DELETE'])
def delete_background(file_id):
    """增强版本的DeleteBackground文件功能 - 修复竞态条件"""
    try:
        print(f"[DELETE] Starting deletion of background file: {file_id}")
        
        # 获取文件锁防止并发删除
        if not acquire_file_lock():
            return jsonify({'error': '系统繁忙，请稍后重试'}), 503
        
        try:
            # 首先验证文件是否存在 - 使用数据库锁
            backgrounds_setting = Setting.query.filter_by(key='background_files').with_for_update().first()
            if not backgrounds_setting:
                return jsonify({'error': 'Background文件列表不存在'}), 404
            
            backgrounds = json.loads(backgrounds_setting.value)
            
            # 查找要Delete的文件
            file_to_delete = None
            file_index = -1
            for i, bg in enumerate(backgrounds):
                if bg['id'] == file_id:
                    file_to_delete = bg
                    file_index = i
                    break
            
            if not file_to_delete:
                return jsonify({'error': 'Background文件不存在'}), 404
            
            print(f"[DELETE] Found file to delete: {file_to_delete}")
            
            # Delete物理文件 - 添加错误处理
            physical_files_deleted = True
            try:
                if os.path.exists(file_to_delete['file_path']):
                    os.remove(file_to_delete['file_path'])
                    print(f"[DELETE] Removed physical file: {file_to_delete['file_path']}")
                else:
                    print(f"[DELETE] Warning: Physical file not found: {file_to_delete['file_path']}")
                
                # Delete缩略图
                if file_to_delete.get('thumbnail_url'):
                    thumbnail_filename = file_to_delete['thumbnail_url'].split('/')[-1]
                    thumbnail_path = os.path.join(UPLOAD_FOLDER, thumbnail_filename)
                    if os.path.exists(thumbnail_path):
                        os.remove(thumbnail_path)
                        print(f"[DELETE] Removed thumbnail: {thumbnail_path}")
            except Exception as e:
                print(f"[DELETE] Warning: Failed to remove physical files: {e}")
                physical_files_deleted = False  # 标记物理文件删除失败，但继续数据库操作
            
            # 从列表中移除 - 安全的列表操作
            backgrounds = [bg for bg in backgrounds if bg['id'] != file_id]
            
            # 清理所有相关的BackgroundSettings（改进版）
            themes_to_check = ['light', 'dark']
            settings_cleaned = False
            
            for theme in themes_to_check:
                theme_bg_setting = Setting.query.filter_by(key=f'current_background_{theme}').first()
                if theme_bg_setting and theme_bg_setting.value == file_id:
                    theme_bg_setting.value = ''
                    settings_cleaned = True
                    print(f"[DELETE] Cleared {theme} theme background setting: {file_id}")
            
            # 清理旧的BackgroundSettings（向后兼容）
            old_bg_setting = Setting.query.filter_by(key='current_background').first()
            if old_bg_setting and old_bg_setting.value == file_id:
                db.session.delete(old_bg_setting)
                settings_cleaned = True
                print(f"[DELETE] Deleted old background setting: {file_id}")
            
            # 清理其他可能的旧格式Settings
            legacy_bg_settings = Setting.query.filter(
                Setting.key.like('%background%') & Setting.value == file_id
            ).all()
            
            for setting in legacy_bg_settings:
                if setting.key in ['background_light', 'background_dark', 'user_background']:
                    if setting.key.startswith('background_'):
                        setting.value = ''
                    else:
                        db.session.delete(setting)
                    settings_cleaned = True
                    print(f"[DELETE] Cleaned up legacy background setting {setting.key}: {file_id}")
            
            # 更新数据库 - 只在确认所有清理操作完成后
            backgrounds_setting.value = json.dumps(backgrounds)
            db.session.commit()
            
            print(f"[DELETE] Successfully deleted background file: {file_id}")
            
            # 返回适当的消息
            if physical_files_deleted and settings_cleaned:
                return jsonify({'message': 'Background文件删除成功，相关设置已清理'})
            elif physical_files_deleted:
                return jsonify({'message': 'Background文件删除成功，但部分设置清理被跳过'})
            else:
                return jsonify({'message': 'Background file record deleted, but physical file cleanup failed'})
                
        finally:
            release_file_lock()
            
    except Exception as e:
        # 确保在任何异常情况下都释放锁
        try:
            release_file_lock()
        except:
            pass
        
        db.session.rollback()
        print(f"[DELETE] Error deleting background file: {e}")
        return jsonify({'error': f'Delete failed: {str(e)}'}), 500

@backgrounds_bp.route('/api/backgrounds/file/<filename>', methods=['GET'])
def serve_background_file(filename):
    """提供Background文件访问 - 修复路径遍历漏洞"""
    try:
        # 安全验证：防止路径遍历攻击
        if not filename or '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': '无效的文件名'}), 400
        
        # 只允许特定扩展名
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'svg'}
        file_ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if file_ext not in allowed_extensions:
            return jsonify({'error': '不支持的文件类型'}), 400
        
        # 构建安全的文件路径
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # 验证文件路径是否在允许的目录内
        upload_folder_abs = os.path.abspath(UPLOAD_FOLDER)
        file_path_abs = os.path.abspath(file_path)
        
        if not file_path_abs.startswith(upload_folder_abs):
            return jsonify({'error': '访问被拒绝'}), 403
        
        # 检查文件是否存在且是文件（不是目录）
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # 设置安全的文件名
            safe_filename = secure_filename(filename)
            return send_file(file_path, download_name=safe_filename)
        else:
            return jsonify({'error': '文件不存在'}), 404
            
    except Exception as e:
        print(f"[ERROR] 文件访问错误: {str(e)}")
        return jsonify({'error': 'File access failed'}), 500

@backgrounds_bp.route('/api/settings/background', methods=['POST'])
def save_background_setting():
    """Save当前BackgroundSettings（按Theme分类）"""
    try:
        data = request.get_json()
        background_id = data.get('backgroundId')
        theme = data.get('theme', 'light')  # 获取Theme，默认为LightTheme
        
        # 添加调试日志
        print(f"[DEBUG] SaveBackgroundSettings - Received data: {data}")
        print(f"[DEBUG] BackgroundID: {background_id}, Theme: {theme}")
        
        # 根据Theme生成不同的Settings键
        setting_key = f'current_background_{theme}'
        print(f"[DEBUG] Settings key: {setting_key}")
        
        # Save当前BackgroundSettings
        current_bg_setting = Setting.query.filter_by(key=setting_key).first()
        print(f"[DEBUG] Query existing Settings: {current_bg_setting}")
        
        if current_bg_setting:
            print(f"[DEBUG] Update existing Settings, old value: {current_bg_setting.value}")
            current_bg_setting.value = background_id if background_id else ''
            print(f"[DEBUG] Update existing Settings, new value: {current_bg_setting.value}")
        else:
            print(f"[DEBUG] Create new Settings")
            current_bg_setting = Setting(key=setting_key, value=background_id if background_id else '')
            db.session.add(current_bg_setting)
            print(f"[DEBUG] New Settings added to session")
        
        print(f"[DEBUG] Ready to commit transaction")
        db.session.commit()
        print(f"[DEBUG] Transaction commit Success")
        
        # 验证Save结果
        verify_setting = Setting.query.filter_by(key=setting_key).first()
        print(f"[DEBUG] Verify Save result: {verify_setting.value if verify_setting else 'None'}")
        
        return jsonify({'message': f'{theme} theme background settings saved successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'SaveFailed: {str(e)}'}), 500

@backgrounds_bp.route('/api/settings/background', methods=['GET'])
def get_current_background():
    """获取当前BackgroundSettings（按Theme分类）"""
    try:
        theme = request.args.get('theme', 'light')  # 从查询参数获取Theme
        setting_key = f'current_background_{theme}'
        
        current_bg_setting = Setting.query.filter_by(key=setting_key).first()
        if current_bg_setting and current_bg_setting.value:
            return jsonify({'backgroundId': current_bg_setting.value, 'theme': theme})
        else:
            return jsonify({'backgroundId': None, 'theme': theme})
    except Exception as e:
        return jsonify({'error': f'获取BackgroundSettingsFailed: {str(e)}'}), 500

@backgrounds_bp.route('/api/settings/background', methods=['DELETE'])
def clear_background_setting():
    """清除当前BackgroundSettings"""
    try:
        current_bg_setting = Setting.query.filter_by(key='current_background').first()
        if current_bg_setting:
            db.session.delete(current_bg_setting)
            db.session.commit()
        
        return jsonify({'message': 'BackgroundSettings已清除'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'清除Failed: {str(e)}'}), 500

@backgrounds_bp.route('/api/backgrounds/sync', methods=['POST'])
def sync_backgrounds():
    """Sync数据库与文件系统的Background文件"""
    try:
        print("[SYNC] Started手动SyncBackground文件...")
        
        # 执行Sync
        success = sync_manager.sync_database_with_filesystem()
        
        if success:
            return jsonify({
                'message': 'Background文件SyncSuccess',
                'status': 'success'
            })
        else:
            return jsonify({
                'error': 'Background文件SyncFailed',
                'status': 'failed'
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': f'SyncFailed: {str(e)}',
            'status': 'error'
        }), 500

@backgrounds_bp.route('/api/backgrounds/validate', methods=['GET'])
def validate_backgrounds():
    """验证数据库与文件系统的一致性"""
    try:
        print("[VALIDATE] Started验证Background文件一致性...")
        
        # 执行验证
        validation_result = sync_manager.validate_consistency()
        
        return jsonify({
            'message': '验证Completed',
            'validation': validation_result,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': f'验证Failed: {str(e)}',
            'status': 'error'
        }), 500