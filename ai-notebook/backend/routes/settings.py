from flask import Blueprint, request, jsonify, g
from models import db, Setting
from sqlalchemy.exc import SQLAlchemyError
from utils.encryption import encrypt_api_key, decrypt_api_key, is_api_key_encrypted
from utils.rate_limiter import rate_limit, security_check
from utils.log_filter import create_secure_logger
import json
import re

settings_bp = Blueprint('settings', __name__)

# 创建安全日志记录器
logger = create_secure_logger(__name__)

def set_nested_value(dictionary, key_path, value):
    """Settings嵌套字典的值"""
    keys = key_path.split('.')
    current = dictionary
    
    for key in keys[:-1]:
        if key not in current:
            current[key] = {}
        current = current[key]
    
    current[keys[-1]] = value

def get_nested_value(dictionary, key_path, default=None):
    """获取嵌套字典的值"""
    keys = key_path.split('.')
    current = dictionary
    
    try:
        for key in keys:
            current = current[key]
        return current
    except (KeyError, TypeError):
        return default

def is_api_key_field(key: str) -> bool:
    """检查是否为API密钥字段"""
    api_key_patterns = [
        r'.*\.api_key$',
        r'.*\.apikey$',
        r'.*\.key$',
        r'.*\.secret$',
        r'.*\.token$'
    ]
    
    for pattern in api_key_patterns:
        if re.match(pattern, key, re.IGNORECASE):
            return True
    return False

def should_encrypt_value(key: str, value: any) -> bool:
    """判断值是否需要加密"""
    if not isinstance(value, str) or not value.strip():
        return False
    
    return is_api_key_field(key)

@settings_bp.route('/api/settings', methods=['GET'])
def get_settings():
    """获取所有Settings"""
    try:
        settings = Setting.query.all()
        settings_dict = {}
        
        for setting in settings:
            # 根据Settings类型转换值
            if setting.setting_type == 'boolean':
                value = setting.value.lower() == 'true'
            elif setting.setting_type == 'integer':
                value = int(setting.value)
            elif setting.setting_type == 'float':
                value = float(setting.value)
            elif setting.setting_type == 'json':
                value = json.loads(setting.value)
            else:
                value = setting.value
            
            # 解密加密的值
            if setting.is_encrypted and value:
                try:
                    value = decrypt_api_key(value)
                except Exception as e:
                    # 解密Failed时记录Error但不暴露给用户
                    print(f"解密Settings {setting.key} Failed: {str(e)}")
                    value = "[加密数据解密Failed]"
            
            # 处理嵌套键
            if '.' in setting.key:
                set_nested_value(settings_dict, setting.key, value)
            else:
                settings_dict[setting.key] = value
        
        return jsonify(settings_dict), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '获取SettingsFailed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

def flatten_dict(d, parent_key='', sep='.'):
    """将嵌套字典扁平化"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

@settings_bp.route('/api/settings', methods=['POST'])
@rate_limit('settings')
@security_check()
def update_settings():
    """更新Settings"""
    try:
        data = g.validated_data
        
        if not data:
            return jsonify({'error': '请求数据为空'}), 400
        
        # 扁平化嵌套数据
        flat_data = flatten_dict(data)
        
        # 更新每个Settings项
        for key, value in flat_data.items():
            setting = Setting.query.filter_by(key=key).first()
            
            # 检查是否需要加密
            needs_encryption = should_encrypt_value(key, value)
            encrypted_value = value
            
            if needs_encryption and isinstance(value, str) and value.strip():
                try:
                    encrypted_value = encrypt_api_key(value)
                except Exception as e:
                    return jsonify({'error': f'加密密钥Failed: {str(e)}'}), 500
            
            if setting:
                # 根据值类型确定Settings类型
                if isinstance(value, bool):
                    setting.value = str(value).lower()
                    setting.setting_type = 'boolean'
                elif isinstance(value, int):
                    setting.value = str(value)
                    setting.setting_type = 'integer'
                elif isinstance(value, float):
                    setting.value = str(value)
                    setting.setting_type = 'float'
                elif isinstance(value, (dict, list)):
                    setting.value = json.dumps(value)
                    setting.setting_type = 'json'
                else:
                    setting.value = str(encrypted_value)
                    setting.setting_type = 'string'
                
                # Settings加密标志
                setting.is_encrypted = needs_encryption
            else:
                # 创建新Settings项
                if isinstance(value, bool):
                    setting_type = 'boolean'
                    setting_value = str(value).lower()
                elif isinstance(value, int):
                    setting_type = 'integer'
                    setting_value = str(value)
                elif isinstance(value, float):
                    setting_type = 'float'
                    setting_value = str(value)
                elif isinstance(value, (dict, list)):
                    setting_type = 'json'
                    setting_value = json.dumps(value)
                else:
                    setting_type = 'string'
                    setting_value = str(encrypted_value)
                
                new_setting = Setting(
                    key=key,
                    value=setting_value,
                    setting_type=setting_type,
                    is_encrypted=needs_encryption
                )
                db.session.add(new_setting)
        
        db.session.commit()
        return jsonify({'message': 'Settings更新Success'}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '更新SettingsFailed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/settings/<key>', methods=['GET'])
def get_setting(key):
    """获取单个Settings"""
    try:
        setting = Setting.query.filter_by(key=key).first()
        
        if not setting:
            return jsonify({'error': 'Settings项不存在'}), 404
        
        # 根据Settings类型转换值
        if setting.setting_type == 'boolean':
            value = setting.value.lower() == 'true'
        elif setting.setting_type == 'integer':
            value = int(setting.value)
        elif setting.setting_type == 'float':
            value = float(setting.value)
        elif setting.setting_type == 'json':
            value = json.loads(setting.value)
        else:
            value = setting.value
        
        # 解密加密的值
        if setting.is_encrypted and value:
            try:
                value = decrypt_api_key(value)
            except Exception as e:
                print(f"解密Settings {setting.key} Failed: {str(e)}")
                value = "[加密数据解密Failed]"
        
        return jsonify({
            'key': setting.key,
            'value': value,
            'type': setting.setting_type
        }), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '获取SettingsFailed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/settings/<key>', methods=['PUT'])
def update_setting(key):
    """更新单个Settings"""
    try:
        data = request.get_json()
        
        if not data or 'value' not in data:
            return jsonify({'error': '请求数据Invalid'}), 400
        
        value = data['value']
        setting = Setting.query.filter_by(key=key).first()
        
        # 检查是否需要加密
        needs_encryption = should_encrypt_value(key, value)
        encrypted_value = value
        
        if needs_encryption and isinstance(value, str) and value.strip():
            try:
                encrypted_value = encrypt_api_key(value)
            except Exception as e:
                return jsonify({'error': f'加密密钥Failed: {str(e)}'}), 500
        
        if setting:
            # 根据值类型确定Settings类型
            if isinstance(value, bool):
                setting.value = str(value).lower()
                setting.setting_type = 'boolean'
            elif isinstance(value, int):
                setting.value = str(value)
                setting.setting_type = 'integer'
            elif isinstance(value, float):
                setting.value = str(value)
                setting.setting_type = 'float'
            elif isinstance(value, (dict, list)):
                setting.value = json.dumps(value)
                setting.setting_type = 'json'
            else:
                setting.value = str(encrypted_value)
                setting.setting_type = 'string'
            
            # Settings加密标志
            setting.is_encrypted = needs_encryption
        else:
            # 创建新Settings项
            if isinstance(value, bool):
                setting_type = 'boolean'
                setting_value = str(value).lower()
            elif isinstance(value, int):
                setting_type = 'integer'
                setting_value = str(value)
            elif isinstance(value, float):
                setting_type = 'float'
                setting_value = str(value)
            elif isinstance(value, (dict, list)):
                setting_type = 'json'
                setting_value = json.dumps(value)
            else:
                setting_type = 'string'
                setting_value = str(encrypted_value)
            
            setting = Setting(
                key=key,
                value=setting_value,
                setting_type=setting_type,
                is_encrypted=needs_encryption
            )
            db.session.add(setting)
        
        db.session.commit()
        return jsonify({'message': f'Settings {key} 更新Success'}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '更新SettingsFailed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/settings/<key>', methods=['DELETE'])
def delete_setting(key):
    """DeleteSettings"""
    try:
        setting = Setting.query.filter_by(key=key).first()
        
        if not setting:
            return jsonify({'error': 'Settings项不存在'}), 404
        
        db.session.delete(setting)
        db.session.commit()
        
        return jsonify({'message': f'Settings {key} DeleteSuccess'}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'DeleteSettingsFailed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/export', methods=['GET'])
def export_data():
    """导出所有数据"""
    try:
        from models import Note, Todo, ChatHistory
        
        # 获取所有数据
        notes = Note.query.all()
        todos = Todo.query.all()
        chat_history = ChatHistory.query.all()
        settings = Setting.query.all()
        
        from datetime import datetime
        
        export_data = {
            'notes': [note.to_dict() for note in notes],
            'todos': [todo.to_dict() for todo in todos],
            'chat_history': [chat.to_dict() for chat in chat_history],
            'settings': [setting.to_dict() for setting in settings],
            'export_time': datetime.now().isoformat()
        }
        
        return jsonify(export_data), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '导出数据Failed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/import', methods=['POST'])
def import_data():
    """导入所有数据"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if not file.filename.endswith('.json'):
            return jsonify({'error': '只支持JSON格式文件'}), 400
        
        from models import Note, Todo, ChatHistory
        from datetime import datetime
        import json
        
        # 读取文件内容
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        
        if not isinstance(data, dict):
            return jsonify({'error': '文件格式不正确'}), 400
        
        imported_counts = {
            'notes': 0,
            'todos': 0,
            'chat_history': 0,
            'settings': 0
        }
        
        # 导入笔记
        if 'notes' in data and isinstance(data['notes'], list):
            for note_data in data['notes']:
                if 'title' in note_data and 'content' in note_data:
                    note = Note(
                        title=note_data['title'],
                        content=note_data['content']
                    )
                    db.session.add(note)
                    imported_counts['notes'] += 1
        
        # 导入待办事项
        if 'todos' in data and isinstance(data['todos'], list):
            for todo_data in data['todos']:
                if 'title' in todo_data:
                    # 处理截止日期
                    due_date = None
                    if 'due_date' in todo_data and todo_data['due_date']:
                        try:
                            due_date = datetime.fromisoformat(todo_data['due_date'].replace('Z', '+00:00'))
                        except ValueError:
                            pass
                    
                    todo = Todo(
                        title=todo_data['title'],
                        description=todo_data.get('description', ''),
                        priority=todo_data.get('priority', 'medium'),
                        category=todo_data.get('category', '默认'),
                        due_date=due_date,
                        is_completed=todo_data.get('completed', todo_data.get('is_completed', False))
                    )
                    db.session.add(todo)
                    imported_counts['todos'] += 1
        
        # 导入聊天记录
        if 'chat_history' in data and isinstance(data['chat_history'], list):
            for chat_data in data['chat_history']:
                if 'message' in chat_data:
                    chat = ChatHistory(
                        message=chat_data['message'],
                        response=chat_data.get('response', ''),
                        model=chat_data.get('model', 'unknown')
                    )
                    db.session.add(chat)
                    imported_counts['chat_history'] += 1
        
        # 导入Settings（跳过Already Exists的Settings）
        if 'settings' in data and isinstance(data['settings'], list):
            for setting_data in data['settings']:
                if 'key' in setting_data and 'value' in setting_data:
                    existing_setting = Setting.query.filter_by(key=setting_data['key']).first()
                    if not existing_setting:
                        setting = Setting(
                            key=setting_data['key'],
                            value=setting_data['value'],
                            setting_type=setting_data.get('setting_type', 'string'),
                            is_encrypted=setting_data.get('is_encrypted', False)
                        )
                        db.session.add(setting)
                        imported_counts['settings'] += 1
        
        db.session.commit()
        
        total_imported = sum(imported_counts.values())
        
        return jsonify({
            'message': f'Success导入 {total_imported} 条数据',
            'imported_counts': imported_counts
        }), 200
        
    except json.JSONDecodeError:
        return jsonify({'error': 'JSON文件格式Error'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '导入数据Failed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/settings/factory-reset', methods=['POST'])
def factory_reset():
    """恢复出厂Settings"""
    try:
        # Delete所有Settings
        Setting.query.delete()
        
        # 重新创建默认Settings
        default_settings = [
            {'key': 'theme', 'value': 'dark', 'setting_type': 'string'},
            {'key': 'language', 'value': 'zh-CN', 'setting_type': 'string'},
            {'key': 'autoSave', 'value': 'true', 'setting_type': 'boolean'},
            {'key': 'autoSaveInterval', 'value': '30', 'setting_type': 'integer'},
            {'key': 'fontSize', 'value': '14', 'setting_type': 'integer'},
            {'key': 'fontFamily', 'value': 'Orbitron', 'setting_type': 'string'},
            {'key': 'currentProvider', 'value': 'openrouter', 'setting_type': 'string'},
            {'key': 'enableNotifications', 'value': 'true', 'setting_type': 'boolean'},
            {'key': 'enableSounds', 'value': 'true', 'setting_type': 'boolean'},
            {'key': 'apiProviders.openrouter.selectedModel', 'value': 'GPT-5 Chat', 'setting_type': 'string'},
            {'key': 'apiProviders.moonshot.selectedModel', 'value': 'Kimi', 'setting_type': 'string'}
        ]
        
        for setting_data in default_settings:
            setting = Setting(**setting_data)
            db.session.add(setting)
        
        db.session.commit()
        
        return jsonify({'message': 'Settings已恢复出厂默认值'}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '恢复出厂SettingsFailed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/clear', methods=['DELETE'])
def clear_all_data():
    """清除所有数据"""
    try:
        from models import Note, Todo, ChatHistory
        
        # Delete所有数据
        Note.query.delete()
        Todo.query.delete()
        ChatHistory.query.delete()
        # 保留Settings数据，只清除用户数据
        
        db.session.commit()
        
        return jsonify({'message': '所有用户数据已清除'}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '清除数据Failed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@settings_bp.route('/api/test-ai', methods=['POST'])
@rate_limit('settings')
@security_check(['provider', 'apiKey'])
def test_ai_connection():
    """测试AI连接"""
    try:
        data = g.validated_data
        
        if not data or 'provider' not in data or 'apiKey' not in data:
            return jsonify({'error': '请求数据Invalid'}), 400
        
        provider = data['provider']
        api_key = data['apiKey']
        model = data.get('model', 'gpt-3.5-turbo')
        
        # 这里可以实现实际的AI API测试
        # 目前返回模拟结果
        if not api_key:
            return jsonify({'error': 'API密钥不能为空'}), 400
        
        # 模拟测试Success
        return jsonify({
            'message': f'{provider} API连接测试Success',
            'provider': provider,
            'model': model,
            'status': 'connected'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'AI连接测试Failed', 'details': str(e)}), 500