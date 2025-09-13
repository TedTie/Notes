import os
import logging
from pathlib import Path
from typing import Tuple
from werkzeug.utils import secure_filename

# Configuration日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileSecurityChecker:
    """文件安全检查器"""
    
    def __init__(self):
        # 允许的文件扩展名
        self.allowed_extensions = {
            '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.csv',
            '.py', '.js', '.html', '.css', '.sql', '.sh', '.bat',
            '.log', '.conf', '.config', '.ini', '.properties'
        }
        
        # 危险的文件扩展名
        self.dangerous_extensions = {
            '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs'
        }
        
        # 受保护的目录
        self.protected_dirs = {
            'system32', 'windows', 'program files', '/etc', '/bin', '/sbin', '/root'
        }
        
        # 最大文件大小 (10MB)
        self.max_file_size = 10 * 1024 * 1024
    
    def check_file_path(self, file_path: str) -> Tuple[bool, str]:
        """检查文件路径是否安全"""
        try:
            # 规范化路径
            normalized_path = os.path.normpath(file_path)
            
            # 检查路径遍历攻击
            if '..' in normalized_path:
                return False, "检测到路径遍历攻击尝试"
            
            # 检查是否在受保护的目录中
            path_lower = normalized_path.lower()
            for protected_dir in self.protected_dirs:
                if protected_dir in path_lower:
                    return False, f"不允许访问受保护的目录: {protected_dir}"
            
            # 检查文件扩展名
            file_ext = Path(file_path).suffix.lower()
            if file_ext in self.dangerous_extensions:
                return False, f"不允许的文件类型: {file_ext}"
            
            return True, ""
            
        except Exception as e:
            logger.error(f"路径检查Error: {e}")
            return False, f"路径检查Failed: {str(e)}"
    
    def check_file_content(self, content: str, file_path: str = "") -> Tuple[bool, str]:
        """检查文件内容是否安全"""
        try:
            # 检查内容长度
            if len(content.encode('utf-8')) > self.max_file_size:
                return False, "文件内容过大"
            
            # 简单的危险内容检查
            content_lower = content.lower()
            
            # 检查一些明显的危险模式
            dangerous_keywords = [
                '<script', 'javascript:', 'eval(', 'exec(', 'system(',
                'shell_exec(', 'passthru(', '__import__('
            ]
            
            for keyword in dangerous_keywords:
                if keyword in content_lower:
                    logger.warning(f"检测到潜在危险内容: {keyword}")
                    return False, f"检测到潜在危险内容: {keyword}"
            
            return True, ""
            
        except Exception as e:
            logger.error(f"内容检查Error: {e}")
            return False, f"内容检查Failed: {str(e)}"
    
    def sanitize_filename(self, filename: str) -> str:
        """清理文件名"""
        # 使用werkzeug的secure_filename函数
        safe_filename = secure_filename(filename)
        
        # 确保文件名不为空
        if not safe_filename:
            safe_filename = 'unnamed_file.txt'
        
        return safe_filename
    
    def check_file_size(self, file_path: str) -> Tuple[bool, str]:
        """检查文件大小"""
        try:
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                if file_size > self.max_file_size:
                    return False, f"文件过大: {file_size} bytes"
            return True, ""
        except Exception as e:
            logger.error(f"文件大小检查Error: {e}")
            return False, f"文件大小检查Failed: {str(e)}"

def file_operation_security_check_func(operation: str, file_path: str, content: str = "") -> Tuple[bool, str]:
    """文件操作安全检查的便捷函数"""
    checker = FileSecurityChecker()
    
    # 检查文件路径
    path_ok, path_msg = checker.check_file_path(file_path)
    if not path_ok:
        return False, path_msg
    
    # 如果有内容，检查内容
    if content:
        content_ok, content_msg = checker.check_file_content(content, file_path)
        if not content_ok:
            return False, content_msg
    
    # 检查文件大小（对于现有文件）
    if operation in ['read', 'modify'] and os.path.exists(file_path):
        size_ok, size_msg = checker.check_file_size(file_path)
        if not size_ok:
            return False, size_msg
    
    return True, ""

def file_operation_security_check(operation: str):
    """文件操作安全检查装饰器"""
    def decorator(f):
        from functools import wraps
        from flask import request, jsonify, g
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # 获取请求数据
                if request.is_json:
                    data = request.get_json()
                else:
                    data = request.form.to_dict()
                
                if not data:
                    return jsonify({'error': '请求数据不能为空'}), 400
                
                file_path = data.get('file_path')
                content = data.get('content', '')
                
                # 执行安全检查
                is_valid, error_msg = file_operation_security_check_func(operation, file_path, content)
                if not is_valid:
                    return jsonify({'error': error_msg}), 400
                
                # 将验证后的数据存储到g对象中
                g.validated_file_data = data
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"文件操作安全检查时发生Error: {str(e)}")
                return jsonify({'error': f'安全检查Failed: {str(e)}'}), 500
        
        return decorated_function
    return decorator

# 创建全局安全检查器实例
file_security = FileSecurityChecker()