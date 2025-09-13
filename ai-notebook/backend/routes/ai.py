from flask import Blueprint, request, jsonify, g
from models import db, Note, Todo, Setting
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from utils.time_utils import TimeUtils
from utils.rate_limiter import rate_limit, security_check, SecurityValidator
from utils.log_filter import create_secure_logger
from utils.ai_command_parser import command_parser, CommandType
from utils.file_operations import file_manager
from utils.web_search import web_search_tool
from utils.timeout_service import timeout_decorator, async_timeout_decorator, OperationProgressTracker
import os
import requests
import json
import re

ai_bp = Blueprint('ai', __name__)

# 创建安全日志记录器
logger = create_secure_logger(__name__)

def detect_search_intent(message):
    """检测用户消息是否需要网络搜索"""
    # 搜索关键词模式
    search_patterns = [
        r'搜索|查找|搜一下|查一下|找一下',
        r'最新|最近|现在|当前|今天|昨天|今年',
        r'新闻|消息|资讯|动态|情况',
        r'什么是|介绍一下|了解一下|告诉我',
        r'价格|股价|汇率|天气|温度',
        r'发生了什么|怎么样了|情况如何'
    ]
    
    # 检查是否包含搜索意图
    for pattern in search_patterns:
        if re.search(pattern, message, re.IGNORECASE):
            return True
    
    # 检查是否包含问号（询问性质）
    if '?' in message or '？' in message:
        return True
    
    return False

def extract_search_query(message):
    """从用户消息中提取搜索关键词"""
    # 移除常见的搜索前缀
    query = message
    prefixes = ['搜索', '查找', '搜一下', '查一下', '找一下', '什么是', '介绍一下', '了解一下', '告诉我']
    
    for prefix in prefixes:
        if query.startswith(prefix):
            query = query[len(prefix):].strip()
            break
    
    # 移除常见的后缀
    suffixes = ['怎么样', '如何', '吗', '呢', '?', '？']
    for suffix in suffixes:
        if query.endswith(suffix):
            query = query[:-len(suffix)].strip()
    
    return query if query else message

def handle_web_search(message, settings):
    """处理网络搜索请求"""
    try:
        # 检查网络搜索是否启用
        web_search_enabled = settings.get('ai_web_search_enabled', 'false')
        if web_search_enabled.lower() != 'true':
            return {
                'success': False,
                'error': 'AI网络搜索功能当前已被禁用。如需启用，请在Settings中开启相关权限。'
            }
        
        # 提取搜索查询
        search_query = extract_search_query(message)
        
        # 获取搜索引擎Settings
        search_engine = settings.get('ai_search_engine', 'duckduckgo')
        serper_api_key = settings.get('serper_api_key', '')
        
        # 执行搜索
        search_result = web_search_tool.search_web(
            query=search_query,
            search_engine=search_engine,
            api_key=serper_api_key if search_engine == 'serper' else None,
            max_results=5
        )
        
        if search_result['success']:
            # 格式化搜索结果
            formatted_results = web_search_tool.format_search_results(search_result)
            return {
                'success': True,
                'message': '网络搜索Completed',
                'data': {
                    'query': search_query,
                    'results': search_result['results'],
                    'formatted_text': formatted_results
                }
            }
        else:
            return {
                'success': False,
                'error': f'搜索Failed: {search_result.get("error", "未知Error")}'
            }
    
    except Exception as e:
        return {
            'success': False,
            'error': f'网络搜索处理Failed: {str(e)}'
        }

def handle_app_operation(parsed_command):
    """处理应用操作（笔记、待办事项、Settings）"""
    try:
        command_type = parsed_command.command_type
        content = parsed_command.content or parsed_command.raw_text
        
        # 笔记操作
        if command_type == CommandType.CREATE_NOTE:
            return handle_create_note(content)
        elif command_type == CommandType.EDIT_NOTE:
            return handle_edit_note(content)
        elif command_type == CommandType.DELETE_NOTE:
            return handle_delete_note(content)
        elif command_type == CommandType.SEARCH_NOTE:
            return handle_search_notes(content)
        elif command_type == CommandType.LIST_NOTES:
            return handle_list_notes()
        
        # 待办事项操作
        elif command_type == CommandType.CREATE_TODO:
            return handle_create_todo(content)
        elif command_type == CommandType.COMPLETE_TODO:
            return handle_complete_todo(content)
        elif command_type == CommandType.DELETE_TODO:
            return handle_delete_todo(content)
        elif command_type == CommandType.LIST_TODOS:
            return handle_list_todos()
        elif command_type == CommandType.GENERATE_TODOS:
            return handle_generate_todos(content)
        
        # Settings操作
        elif command_type == CommandType.CHANGE_THEME:
            return handle_change_theme(content)
        elif command_type == CommandType.CHANGE_LANGUAGE:
            return handle_change_language(content)
        elif command_type == CommandType.VIEW_SETTINGS:
            return handle_view_settings()
        elif command_type == CommandType.UPDATE_SETTINGS:
            return handle_update_settings(content)
        
        else:
            return {
                'success': False,
                'error': 'Not Supported的操作类型'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'操作执行Failed: {str(e)}'
        }

def handle_create_note(content):
    """创建笔记"""
    try:
        # 从内容中提取标题和内容
        lines = content.split('\n')
        title = lines[0] if lines else '新笔记'
        note_content = '\n'.join(lines[1:]) if len(lines) > 1 else content
        
        # 创建笔记
        note = Note(
            title=title[:100],  # 限制标题长度
            content=note_content,
            created_at=TimeUtils.now_local().replace(tzinfo=None),
            updated_at=TimeUtils.now_local().replace(tzinfo=None)
        )
        
        db.session.add(note)
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Success创建笔记：{title}',
            'data': {
                'id': note.id,
                'title': note.title,
                'content': note.content
            }
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'创建笔记Failed: {str(e)}'
        }

def handle_search_notes(query):
    """搜索笔记"""
    try:
        # 提取搜索关键词
        search_terms = [term for term in ['搜索', 'search', '查找', 'find'] if term in query.lower()]
        search_query = query
        for term in search_terms:
            search_query = search_query.replace(term, '').strip()
        
        if not search_query:
            return {
                'success': False,
                'error': '请提供搜索关键词'
            }
        
        # 搜索笔记
        notes = Note.query.filter(
            db.or_(
                Note.title.contains(search_query),
                Note.content.contains(search_query)
            )
        ).order_by(Note.updated_at.desc()).limit(10).all()
        
        results = []
        for note in notes:
            results.append({
                'id': note.id,
                'title': note.title,
                'content': note.content[:200] + '...' if len(note.content) > 200 else note.content,
                'created_at': note.created_at.isoformat(),
                'updated_at': note.updated_at.isoformat()
            })
        
        return {
            'success': True,
            'message': f'找到 {len(results)} 条相关笔记',
            'data': results
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'搜索笔记Failed: {str(e)}'
        }

def handle_list_notes():
    """列出所有笔记"""
    try:
        notes = Note.query.order_by(Note.updated_at.desc()).all()
        
        results = []
        for note in notes:
            results.append({
                'id': note.id,
                'title': note.title,
                'content': note.content[:100] + '...' if len(note.content) > 100 else note.content,
                'created_at': note.created_at.isoformat(),
                'updated_at': note.updated_at.isoformat()
            })
        
        return {
            'success': True,
            'message': f'共有 {len(results)} 条笔记',
            'data': results
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'获取笔记列表Failed: {str(e)}'
        }

def handle_create_todo(content):
    """创建待办事项"""
    try:
        # 从内容中提取任务描述
        task_content = content.replace('创建任务', '').replace('新建待办', '').replace('添加任务', '').strip()
        if not task_content:
            task_content = '新任务'
        
        # 创建待办事项
        todo = Todo(
            content=task_content,
            completed=False,
            created_at=TimeUtils.now_local().replace(tzinfo=None)
        )
        
        db.session.add(todo)
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Success创建待办事项：{task_content}',
            'data': {
                'id': todo.id,
                'content': todo.content,
                'completed': todo.completed
            }
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'创建待办事项Failed: {str(e)}'
        }

def handle_list_todos():
    """列出待办事项"""
    try:
        todos = Todo.query.order_by(Todo.created_at.desc()).all()
        
        results = []
        for todo in todos:
            results.append({
                'id': todo.id,
                'content': todo.content,
                'completed': todo.completed,
                'created_at': todo.created_at.isoformat()
            })
        
        pending_count = len([t for t in results if not t['completed']])
        completed_count = len([t for t in results if t['completed']])
        
        return {
            'success': True,
            'message': f'共有 {len(results)} 个待办事项（{pending_count} 个待Completed，{completed_count} 个已Completed）',
            'data': results
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'获取待办事项Failed: {str(e)}'
        }

def handle_change_theme(content):
    """切换Theme"""
    try:
        # 检测Theme类型
        if any(keyword in content.lower() for keyword in ['Dark', '暗色', '黑色', 'dark', 'night']):
            theme = 'dark'
        elif any(keyword in content.lower() for keyword in ['Light', '亮色', '白色', 'light', 'day']):
            theme = 'light'
        else:
            theme = 'auto'
        
        # 更新Settings
        setting = Setting.query.filter_by(key='theme').first()
        if setting:
            setting.value = theme
        else:
            setting = Setting(key='theme', value=theme)
            db.session.add(setting)
        
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Theme已切换为：{theme}',
            'data': {'theme': theme}
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'切换ThemeFailed: {str(e)}'
        }

def handle_view_settings():
    """查看Settings"""
    try:
        settings = Setting.query.all()
        
        settings_dict = {}
        for setting in settings:
            settings_dict[setting.key] = setting.value
        
        return {
            'success': True,
            'message': '当前SettingsInfo',
            'data': settings_dict
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'获取SettingsFailed: {str(e)}'
        }

def handle_edit_note(content):
    """编辑笔记"""
    try:
        # 简单实现：搜索最近的笔记进行编辑
        note = Note.query.order_by(Note.updated_at.desc()).first()
        if not note:
            return {
                'success': False,
                'error': '没有找到可编辑的笔记'
            }
        
        # 更新笔记内容
        note.content = content
        note.updated_at = TimeUtils.now_local().replace(tzinfo=None)
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Success编辑笔记：{note.title}',
            'data': {
                'id': note.id,
                'title': note.title,
                'content': note.content
            }
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'编辑笔记Failed: {str(e)}'
        }

def handle_delete_note(content):
    """Delete笔记"""
    try:
        # 简单实现：Delete最近的笔记
        note = Note.query.order_by(Note.updated_at.desc()).first()
        if not note:
            return {
                'success': False,
                'error': '没有找到可Delete的笔记'
            }
        
        title = note.title
        db.session.delete(note)
        db.session.commit()
        
        return {
            'success': True,
            'message': f'SuccessDelete笔记：{title}'
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'Delete笔记Failed: {str(e)}'
        }

def handle_complete_todo(content):
    """Completed待办事项"""
    try:
        # 简单实现：Completed最近的未Completed待办事项
        todo = Todo.query.filter_by(completed=False).order_by(Todo.created_at.desc()).first()
        if not todo:
            return {
                'success': False,
                'error': '没有找到未Completed的待办事项'
            }
        
        todo.completed = True
        db.session.commit()
        
        return {
            'success': True,
            'message': f'SuccessCompleted待办事项：{todo.content}',
            'data': {
                'id': todo.id,
                'content': todo.content,
                'completed': todo.completed
            }
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'Completed待办事项Failed: {str(e)}'
        }

def handle_delete_todo(content):
    """Delete待办事项"""
    try:
        # 简单实现：Delete最近的待办事项
        todo = Todo.query.order_by(Todo.created_at.desc()).first()
        if not todo:
            return {
                'success': False,
                'error': '没有找到可Delete的待办事项'
            }
        
        todo_content = todo.content
        db.session.delete(todo)
        db.session.commit()
        
        return {
            'success': True,
            'message': f'SuccessDelete待办事项：{todo_content}'
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'Delete待办事项Failed: {str(e)}'
        }

def handle_generate_todos(content):
    """AI生成待办事项"""
    try:
        # 调用现有的AI生成待办事项功能
        from routes.ai import generate_todos_from_text
        # 这里简化处理，实际应该调用AI服务
        return {
            'success': True,
            'message': 'AI待办事项生Success能需要进一步集成',
            'data': []
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'生成待办事项Failed: {str(e)}'
        }

def handle_change_language(content):
    """切换语言"""
    try:
        # 检测语言类型
        if any(keyword in content.lower() for keyword in ['中文', 'chinese', '中国', 'zh']):
            language = 'zh'
        elif any(keyword in content.lower() for keyword in ['英文', 'english', '英语', 'en']):
            language = 'en'
        else:
            language = 'zh'  # 默认中文
        
        # 更新Settings
        setting = Setting.query.filter_by(key='language').first()
        if setting:
            setting.value = language
        else:
            setting = Setting(key='language', value=language)
            db.session.add(setting)
        
        db.session.commit()
        
        return {
            'success': True,
            'message': f'语言已切换为：{"中文" if language == "zh" else "English"}',
            'data': {'language': language}
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': f'切换语言Failed: {str(e)}'
        }

def handle_update_settings(content):
    """更新Settings"""
    try:
        return {
            'success': True,
            'message': 'Settings更新功能需要具体的Settings项和值',
            'data': {}
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'更新SettingsFailed: {str(e)}'
        }

def handle_file_operation(parsed_command):
    """处理文件操作指令"""
    try:
        command_type = parsed_command.command_type
        file_path = parsed_command.file_path
        content = parsed_command.content
        
        if command_type == CommandType.READ_FILE:
            if not file_path:
                return {'success': False, 'error': '未指定文件路径'}
            result = file_manager.read_file(file_path)
            return result
            
        elif command_type == CommandType.WRITE_FILE:
            if not file_path:
                return {'success': False, 'error': '未指定文件路径'}
            if content is None:
                return {'success': False, 'error': '未指定文件内容'}
            result = file_manager.write_file(file_path, content)
            return result
            
        elif command_type == CommandType.CREATE_FILE:
            if not file_path:
                return {'success': False, 'error': '未指定文件路径'}
            result = file_manager.create_file(file_path, content or '')
            return result
            
        elif command_type == CommandType.DELETE_FILE:
            if not file_path:
                return {'success': False, 'error': '未指定文件路径'}
            # Delete操作需要确认令牌，这里暂时跳过
            result = file_manager.delete_file(file_path, confirmation_token=None)
            return result
            
        elif command_type == CommandType.LIST_DIRECTORY:
            directory_path = file_path or '.'
            result = file_manager.list_directory(directory_path)
            return result
            
        elif command_type == CommandType.MODIFY_FILE:
            if not file_path:
                return {'success': False, 'error': '未指定文件路径'}
            if content is None:
                return {'success': False, 'error': '未指定修改内容'}
            result = file_manager.write_file(file_path, content)
            return result
            
        else:
            return {'success': False, 'error': f'Not Supported的操作类型: {command_type}'}
            
    except Exception as e:
        logger.error(f"处理文件操作时发生Error: {str(e)}")
        return {'success': False, 'error': f'文件操作Failed: {str(e)}'}

# AI提供商Configuration
AI_PROVIDERS = {
    'openrouter': {
        'base_url': 'https://openrouter.ai/api/v1',
        'models': {
            'openai/gpt-5-chat': 'openai/gpt-5-chat',
            'anthropic/claude-sonnet-4': 'anthropic/claude-sonnet-4',
            'google/gemini-2.5-pro-preview': 'google/gemini-2.5-pro-preview',
            'deepseek/deepseek-chat-v3.1:free': 'deepseek/deepseek-chat-v3.1:free',
            'deepseek/deepseek-r1-0528:free': 'deepseek/deepseek-r1-0528:free'
        }
    }
}

def get_api_settings():
    """获取APISettings"""
    try:
        from utils.encryption import decrypt_api_key
        
        settings = Setting.query.all()
        settings_dict = {}
        
        for setting in settings:
            value = setting.value
            
            # 解密加密的值
            if setting.is_encrypted and value:
                try:
                    value = decrypt_api_key(value)
                except Exception as e:
                    logger.error(f"解密Settings {setting.key} Failed: {str(e)}")
                    continue
            
            # 根据Settings类型转换值
            if setting.setting_type == 'boolean':
                settings_dict[setting.key] = value.lower() == 'true'
            elif setting.setting_type == 'integer':
                settings_dict[setting.key] = int(value)
            elif setting.setting_type == 'float':
                settings_dict[setting.key] = float(value)
            else:
                settings_dict[setting.key] = value
        
        return settings_dict
    except Exception as e:
        logger.error(f"获取APISettingsFailed: {str(e)}")
        return {}

def get_provider_for_model(model):
    """根据模型获取对应的提供商"""
    for provider, config in AI_PROVIDERS.items():
        if model in config['models']:
            return provider
    return None

def make_ai_request(provider, api_key, model, messages, max_tokens=1000, temperature=0.7):
    """向AI提供商发送请求"""
    if provider not in AI_PROVIDERS:
        raise ValueError(f'Not Supported的AI提供商: {provider}')
    
    config = AI_PROVIDERS[provider]
    actual_model = config['models'].get(model, model)
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    # OpenRouter需要额外的头部
    if provider == 'openrouter':
        headers['HTTP-Referer'] = 'http://localhost:5173'  # Vite默认端口
        headers['X-Title'] = 'AI Notebook'
    
    data = {
        'model': actual_model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature
    }
    
    response = requests.post(
        f"{config['base_url']}/chat/completions",
        headers=headers,
        json=data,
        timeout=30
    )
    
    if response.status_code != 200:
        raise Exception(f'API请求Failed: {response.status_code} - {response.text}')
    
    return response.json()

@ai_bp.route('/api/ai/test-connection', methods=['POST'])
def test_ai_connection():
    """测试AI API连接"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        api_key = data.get('api_key')
        model = data.get('model')
        
        if not provider or not api_key or not model:
            return jsonify({'error': '提供商、API密钥和模型不能为空'}), 400
        
        if provider not in AI_PROVIDERS:
            return jsonify({'error': f'Not Supported的AI提供商: {provider}'}), 400
        
        if model not in AI_PROVIDERS[provider]['models']:
            return jsonify({'error': f'提供商 {provider} Not Supported模型 {model}'}), 400
        
        try:
            # 发送测试请求
            test_messages = [
                {"role": "user", "content": "Hello, this is a test message."}
            ]
            
            response = make_ai_request(
                provider=provider,
                api_key=api_key,
                model=model,
                messages=test_messages,
                max_tokens=10
            )
            
            return jsonify({
                'success': True,
                'message': f'{provider} API连接Success',
                'model': model,
                'response': response['choices'][0]['message']['content'].strip()
            }), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'{provider} API连接Failed: {str(e)}'
            }), 400
            
    except Exception as e:
        return jsonify({'error': f'测试连接时发生Error: {str(e)}'}), 500

@ai_bp.route('/api/ai/chat', methods=['POST'])
@rate_limit('ai_request')
@security_check(['message'])
@timeout_decorator(timeout_seconds=45, operation_type='ai_processing')  # AI处理Timeout45秒
def ai_chat():
    """AI聊天对话"""
    try:
        data = g.validated_data
        
        if not data or 'message' not in data:
            return jsonify({'error': '消息内容不能为空'}), 400
        
        user_message = data['message']
        context = data.get('context', [])
        model = data.get('model', 'gpt-5-chat')
        max_tokens = data.get('max_tokens', 1000)
        temperature = data.get('temperature', 0.7)
        
        # 获取模型对应的提供商
        provider = get_provider_for_model(model)
        if not provider:
            return jsonify({'error': f'Not Supported的模型: {model}'}), 400
        
        # 获取APISettings
        settings = get_api_settings()
        
        # 尝试多种格式获取API密钥和连接状态
        api_key = (
            settings.get(f'{provider}.api_key') or 
            settings.get(f'apiProviders.{provider}.apiKey') or
            settings.get(f'{provider}_api_key')
        )
        
        is_connected = (
            settings.get(f'{provider}.connected') or 
            settings.get(f'apiProviders.{provider}.isConnected') or
            settings.get(f'{provider}_connected', False)
        )
        
        if not api_key or not is_connected:
            # 如果没有配置API密钥，返回友好提示而不是错误
            return jsonify({
                'response': '🤖 AI功能暂未配置\n\n要使用AI聊天功能，请：\n1. 在设置页面配置OpenRouter API密钥\n2. 或者在Vercel环境变量中设置相关配置\n\n在此之前，您可以正常使用笔记、待办事项等其他功能。',
                'success': True,
                'needs_api_setup': True
            }), 200
        
        # 构建消息历史
        messages = [
            {
                "role": "system",
                "content": "你是一个智能助手，专门帮助用户管理笔记和待办事项。你具有文件操作能力，可以读取、创建、修改、Delete文件和列出目录内容。当用户请求文件操作时，你会自动执行相应的操作并提供结果。请用简洁、友好的语言回答用户的问题。"
            }
        ]
        
        # 添加上下文消息
        for msg in context[-10:]:  # 只保留最近10条消息
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })
        
        # 解析用户指令
        parsed_command = command_parser.parse_command(user_message)
        
        # 检查是否为应用操作指令（笔记、待办事项、Settings）
        app_operation_types = [
            CommandType.CREATE_NOTE, CommandType.EDIT_NOTE, CommandType.DELETE_NOTE, 
            CommandType.SEARCH_NOTE, CommandType.LIST_NOTES,
            CommandType.CREATE_TODO, CommandType.COMPLETE_TODO, CommandType.DELETE_TODO, 
            CommandType.LIST_TODOS, CommandType.GENERATE_TODOS,
            CommandType.CHANGE_THEME, CommandType.CHANGE_LANGUAGE, 
            CommandType.VIEW_SETTINGS, CommandType.UPDATE_SETTINGS
        ]
        
        if parsed_command.command_type in app_operation_types:
            # 处理应用操作
            app_operation_result = handle_app_operation(parsed_command)
            
            if app_operation_result['success']:
                # 如果应用操作Success，将结果添加到消息中让AI回应
                enhanced_message = f"{user_message}\n\n[操作结果]: {app_operation_result.get('message', '操作Success')}"
                
                if app_operation_result.get('data'):
                    enhanced_message += f"\n\n[操作数据]: {json.dumps(app_operation_result['data'], ensure_ascii=False, indent=2)}"
                
                messages.append({
                    "role": "user",
                    "content": enhanced_message
                })
            else:
                # 如果应用操作Failed，让AI解释Error
                error_message = f"{user_message}\n\n[操作Error]: {app_operation_result.get('error', '操作Failed')}"
                messages.append({
                    "role": "user",
                    "content": error_message
                })
        
        # 检查是否为文件操作指令
        elif command_parser.is_file_operation(user_message):
            # 检查文件操作权限
            file_operations_enabled = settings.get('ai_file_operations_enabled', 'false')
            if file_operations_enabled.lower() != 'true':
                # 文件操作功能被禁用，返回提示Info
                permission_message = f"{user_message}\n\n[权限提示]: 抱歉，AI文件操作功能当前已被禁用。我只能帮助您进行页面操作，如创建笔记、管理待办事项等。如需启用文件操作功能，请在Settings中开启相关权限。"
                messages.append({
                    "role": "user",
                    "content": permission_message
                })
            else:
                # 文件操作功能已启用，正常处理
                parsed_file_command = command_parser.parse_instruction(user_message)
                
                # 处理文件操作
                file_operation_result = handle_file_operation(parsed_file_command)
                
                if file_operation_result['success']:
                    # 如果文件操作Success，将结果添加到消息中让AI回应
                    operation_summary = command_parser.get_operation_summary(parsed_file_command)
                    enhanced_message = f"{user_message}\n\n[文件操作结果]: {operation_summary} - {file_operation_result.get('message', '操作Success')}"
                    
                    if file_operation_result.get('content'):
                        enhanced_message += f"\n\n[文件内容]:\n{file_operation_result['content']}"
                    
                    messages.append({
                        "role": "user",
                        "content": enhanced_message
                    })
                else:
                    # 如果文件操作Failed，让AI解释Error
                    error_message = f"{user_message}\n\n[文件操作Error]: {file_operation_result.get('error', '操作Failed')}"
                    messages.append({
                        "role": "user",
                        "content": error_message
                    })
        
        # 检查是否需要网络搜索
        elif detect_search_intent(user_message):
            # 处理网络搜索
            search_result = handle_web_search(user_message, settings)
            
            if search_result['success']:
                # 如果搜索Success，将搜索结果添加到消息中让AI回应
                enhanced_message = f"{user_message}\n\n[网络搜索结果]: {search_result['data']['formatted_text']}"
                messages.append({
                    "role": "user",
                    "content": enhanced_message
                })
            else:
                # 如果搜索Failed，让AI解释Error或提供替代方案
                error_message = f"{user_message}\n\n[搜索提示]: {search_result.get('error', '搜索Failed')}"
                messages.append({
                    "role": "user",
                    "content": error_message
                })
        else:
            # 添加当前用户消息
            messages.append({
                "role": "user",
                "content": user_message
            })
        
        # 调用AI API
        print(f"DEBUG: 准备调用AI API - provider: {provider}, model: {model}")
        print(f"DEBUG: 消息数量: {len(messages)}")
        
        response = make_ai_request(
            provider=provider,
            api_key=api_key,
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        print(f"DEBUG: AI API响应: {response}")
        
        if not response or 'choices' not in response or not response['choices']:
            print(f"ERROR: AI API响应格式Error: {response}")
            return jsonify({'error': 'AI API响应格式Error'}), 500
        
        ai_response = response['choices'][0]['message']['content'].strip()
        print(f"DEBUG: AI响应内容: '{ai_response}'")
        
        if not ai_response:
            print(f"WARNING: AI响应为空")
            ai_response = "抱歉，我暂时无法回答您的问题，请稍后再试。"
        
        return jsonify({
            'response': ai_response,
            'success': True,
            'provider': provider,
            'model': model,
            'usage': response.get('usage', {})
        }), 200
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'网络请求Failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'AI聊天时发生Error: {str(e)}'}), 500

@ai_bp.route('/api/ai/analyze-text', methods=['POST'])
@rate_limit('ai_request')
@security_check(['text'])
@timeout_decorator(timeout_seconds=30, operation_type='ai_processing')  # AI处理Timeout30秒
def analyze_text():
    """AI文本分析"""
    try:
        data = g.validated_data
        
        if not data or 'text' not in data:
            return jsonify({'error': '文本内容不能为空'}), 400
        
        text = data['text']
        analysis_type = data.get('type', 'summary')  # summary, keywords, sentiment, structure
        
        # 使用默认模型进行文本分析
        model = 'gpt-5-chat'
        provider = get_provider_for_model(model)
        print(f"DEBUG: 模型提供商: {provider}")
        
        if not provider:
            print(f"ERROR: Not Supported的模型: {model}")
            return jsonify({'error': f'Not Supported的模型: {model}'}), 400
        
        # 获取API设置
        settings = get_api_settings()
        api_key = settings.get(f'{provider}.api_key')
        is_connected = settings.get(f'{provider}.connected', False)
        
        if not api_key or not is_connected:
            return jsonify({
                'error': '🤖 AI文本分析功能暂未配置\n\n请在设置页面配置OpenRouter API密钥后使用此功能。',
                'needs_api_setup': True
            }), 200
        
        # 根据分析类型构建提示
        prompts = {
            'summary': f"请为以下文本生成一个简洁的摘要（不超过100字）：\n\n{text}",
            'keywords': f"请从以下文本中提取5-10个关键词，用逗号分隔：\n\n{text}",
            'sentiment': f"请分析以下文本的情感倾向（积极/消极/中性），并简要说明原因：\n\n{text}",
            'structure': f"请分析以下文本的结构，提供大纲或要点：\n\n{text}"
        }
        
        prompt = prompts.get(analysis_type, prompts['summary'])
        
        # 调用AI API
        response = make_ai_request(
            provider=provider,
            api_key=api_key,
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的文本分析助手，请根据用户要求分析文本内容。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        analysis_result = response['choices'][0]['message']['content'].strip()
        
        return jsonify({
            'analysis_type': analysis_type,
            'result': analysis_result,
            'original_text_length': len(text),
            'provider': provider,
            'model': model
        }), 200
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'网络请求Failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'文本分析时发生Error: {str(e)}'}), 500

@ai_bp.route('/api/ai/generate-todos', methods=['POST'])
def generate_todos_from_text():
    """从文本生成待办事项"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': '文本内容不能为空'}), 400
        
        text = data['text']
        
        # 使用默认模型进行待办事项生成
        model = 'gpt-5-chat'
        provider = get_provider_for_model(model)
        
        if not provider:
            return jsonify({'error': f'Not Supported的模型: {model}'}), 400
        
        # 获取APISettings
        settings = get_api_settings()
        
        # 尝试多种格式获取API密钥和连接状态
        api_key = (
            settings.get(f'{provider}.api_key') or 
            settings.get(f'apiProviders.{provider}.apiKey') or
            settings.get(f'{provider}_api_key')
        )
        
        is_connected = (
            settings.get(f'{provider}.connected') or 
            settings.get(f'apiProviders.{provider}.isConnected') or
            settings.get(f'{provider}_connected', False)
        )
        
        if not api_key or not is_connected:
            return jsonify({'error': f'{provider} API未Configuration或未连接'}), 400
        
        prompt = f"""请从以下文本中提取可执行的任务和待办事项，并以JSON格式返回。
每个待办事项应包含以下字段：
- title: 任务标题（简洁明确）
- description: 任务描述（可选）
- priority: 优先级（high/medium/low）
- category: 分类（如：工作、学习、生活等）

文本内容：
{text}

请返回JSON格式的待办事项列表："""
        
        # 调用AI API
        response = make_ai_request(
            provider=provider,
            api_key=api_key,
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "你是一个任务管理助手，擅长从文本中识别和提取可执行的任务。请严格按照JSON格式返回结果。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=800,
            temperature=0.3
        )
        
        ai_response = response['choices'][0]['message']['content'].strip()
        
        # 尝试解析JSON响应
        try:
            # 提取JSON部分（如果AI返回了额外的文本）
            start_idx = ai_response.find('[')
            end_idx = ai_response.rfind(']') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = ai_response[start_idx:end_idx]
                todos_data = json.loads(json_str)
            else:
                # 如果没有找到JSON数组，尝试解析整个响应
                todos_data = json.loads(ai_response)
            
            return jsonify({
                'todos': todos_data,
                'count': len(todos_data)
            }), 200
            
        except json.JSONDecodeError:
            # 如果JSON解析Failed，返回原始文本
            return jsonify({
                'error': 'AI返回的格式无法解析',
                'raw_response': ai_response
            }), 400
        
    except openai.error.AuthenticationError:
        return jsonify({'error': 'AI API密钥Invalid'}), 401
    except openai.error.RateLimitError:
        return jsonify({'error': 'AI API请求频率超限，请稍后再试'}), 429
    except openai.error.APIError as e:
        return jsonify({'error': f'AI APIError: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'生成待办事项时发生Error: {str(e)}'}), 500

@ai_bp.route('/api/ai/improve-note', methods=['POST'])
def improve_note():
    """AI改进笔记内容"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({'error': '笔记内容不能为空'}), 400
        
        content = data['content']
        improvement_type = data.get('type', 'general')  # general, grammar, structure, expand
        
        if not openai.api_key:
            return jsonify({'error': 'AI API密钥未Configuration'}), 400
        
        # 根据改进类型构建提示
        prompts = {
            'general': f"请改进以下笔记内容，使其更加清晰、有条理：\n\n{content}",
            'grammar': f"请检查并修正以下笔记中的语法和拼写Error：\n\n{content}",
            'structure': f"请重新组织以下笔记的结构，使其更有逻辑性：\n\n{content}",
            'expand': f"请扩展以下笔记内容，添加更多细节和说明：\n\n{content}"
        }
        
        prompt = prompts.get(improvement_type, prompts['general'])
        
        # 调用OpenAI API
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的写作助手，擅长改进和优化文本内容。请保持原文的核心意思，同时提升表达质量。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=1000,
            temperature=0.5,
            timeout=30
        )
        
        improved_content = response.choices[0].message.content.strip()
        
        return jsonify({
            'original_content': content,
            'improved_content': improved_content,
            'improvement_type': improvement_type
        }), 200
        
    except openai.error.AuthenticationError:
        return jsonify({'error': 'AI API密钥Invalid'}), 401
    except openai.error.RateLimitError:
        return jsonify({'error': 'AI API请求频率超限，请稍后再试'}), 429
    except openai.error.APIError as e:
        return jsonify({'error': f'AI APIError: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'改进笔记时发生Error: {str(e)}'}), 500

@ai_bp.route('/api/ai/smart-search', methods=['POST'])
def smart_search():
    """AI智能搜索"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': '搜索查询不能为空'}), 400
        
        query = data['query']
        search_type = data.get('type', 'all')  # notes, todos, all
        
        results = {'notes': [], 'todos': []}
        
        # 搜索笔记
        if search_type in ['notes', 'all']:
            notes = Note.query.filter(
                db.or_(
                    Note.title.contains(query),
                    Note.content.contains(query)
                )
            ).limit(10).all()
            results['notes'] = [note.to_dict() for note in notes]
        
        # 搜索待办事项
        if search_type in ['todos', 'all']:
            todos = Todo.query.filter(
                db.or_(
                    Todo.title.contains(query),
                    Todo.description.contains(query)
                )
            ).limit(10).all()
            results['todos'] = [todo.to_dict() for todo in todos]
        
        # 如果启用了AI增强搜索
        if data.get('ai_enhanced', False) and openai.api_key:
            try:
                # 使用AI分析搜索意图并提供建议
                prompt = f"""用户搜索查询："{query}"
                
基于这个查询，请分析用户可能在寻找什么类型的内容，并提供3-5个相关的搜索建议。
请以JSON格式返回：
{{
    "intent": "搜索意图分析",
    "suggestions": ["建议1", "建议2", "建议3"]
}}"""
                
                ai_response = openai.ChatCompletion.create(
                    model='gpt-3.5-turbo',
                    messages=[
                        {
                            "role": "system",
                            "content": "你是一个搜索助手，擅长分析用户搜索意图并提供相关建议。"
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=300,
                    temperature=0.3,
                    timeout=15
                )
                
                ai_analysis = ai_response.choices[0].message.content.strip()
                
                try:
                    analysis_data = json.loads(ai_analysis)
                    results['ai_analysis'] = analysis_data
                except json.JSONDecodeError:
                    results['ai_analysis'] = {'raw_response': ai_analysis}
                    
            except Exception as ai_error:
                # AI增强搜索Failed时不影响基础搜索结果
                results['ai_error'] = str(ai_error)
        
        return jsonify({
            'query': query,
            'results': results,
            'total_found': len(results['notes']) + len(results['todos'])
        }), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '搜索时发生数据库Error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'智能搜索时发生Error: {str(e)}'}), 500

# ==================== 话题管理 API ====================

@ai_bp.route('/api/topics', methods=['GET'])
def get_topics():
    """获取所有话题"""
    try:
        from models import Topic
        topics = Topic.query.order_by(Topic.updated_at.desc()).all()
        return jsonify({
            'success': True,
            'topics': [topic.to_dict() for topic in topics]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取话题Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/topics', methods=['POST'])
def create_topic():
    """创建新话题"""
    try:
        print(f"DEBUG: Started创建话题")
        from models import Topic
        data = request.get_json()
        print(f"DEBUG: 接收到的数据: {data}")
        
        if not data or 'id' not in data or 'title' not in data:
            print(f"ERROR: 话题ID或标题为空")
            return jsonify({
                'success': False,
                'error': '话题ID和标题不能为空'
            }), 400
        
        # 检查话题ID是否Already Exists
        existing_topic = Topic.query.filter_by(id=data['id']).first()
        if existing_topic:
            print(f"ERROR: 话题ID {data['id']} Already Exists")
            return jsonify({
                'success': False,
                'error': '话题IDAlready Exists'
            }), 400
        
        print(f"DEBUG: 创建话题对象 - ID: {data['id']}, 标题: {data['title']}")
        topic = Topic(
            id=data['id'],
            title=data['title'],
            description=data.get('description', ''),
            last_message=data.get('lastMessage', '')
        )
        
        db.session.add(topic)
        db.session.commit()
        print(f"DEBUG: 话题创建Success - ID: {data['id']}")
        
        return jsonify({
            'success': True,
            'message': '话题创建Success',
            'topic': topic.to_dict()
        }), 201
        
    except Exception as e:
        print(f"ERROR: 创建话题Failed: {str(e)}")
        print(f"ERROR: 异常类型: {type(e)}")
        import traceback
        print(f"ERROR: 完整ErrorInfo: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'创建话题Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/topics/<topic_id>', methods=['GET'])
def get_topic(topic_id):
    """获取指定话题及其消息"""
    try:
        from models import Topic
        topic = Topic.query.get_or_404(topic_id)
        return jsonify({
            'topic': topic.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': f'获取话题Failed: {str(e)}'}), 500

@ai_bp.route('/api/topics/<topic_id>', methods=['PUT'])
def update_topic(topic_id):
    """更新话题Info"""
    try:
        print(f"DEBUG: 更新话题 {topic_id}")
        from models import Topic
        
        # 检查话题是否存在
        topic = Topic.query.filter_by(id=topic_id).first()
        data = request.get_json()
        print(f"DEBUG: 接收到的数据: {data}")
        
        if not topic:
            print(f"DEBUG: 话题 {topic_id} 不存在，创建新话题")
            # 如果话题不存在，创建新话题
            topic = Topic(
                id=topic_id,
                title=data.get('title', '新对话'),
                description=data.get('description', ''),
                last_message=data.get('lastMessage', '')
            )
            db.session.add(topic)
        else:
            # 更新现有话题
            if 'title' in data:
                topic.title = data['title']
            if 'description' in data:
                topic.description = data['description']
            if 'lastMessage' in data:
                topic.last_message = data['lastMessage']
        
        topic.updated_at = TimeUtils.now_local().replace(tzinfo=None)
        db.session.commit()
        print(f"DEBUG: 话题 {topic_id} 更新Success")
        
        return jsonify({
            'success': True,
            'message': '话题更新Success',
            'topic': topic.to_dict()
        }), 200
        
    except Exception as e:
        print(f"ERROR: 更新话题Failed: {str(e)}")
        print(f"ERROR: 异常类型: {type(e)}")
        import traceback
        print(f"ERROR: 完整ErrorInfo: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'更新话题Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/topics/<topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    """Delete话题及其所有消息"""
    try:
        print(f"DEBUG: Delete话题 {topic_id}")
        from models import Topic
        
        # 使用filter_by查询话题
        topic = Topic.query.filter_by(id=topic_id).first()
        if not topic:
            print(f"DEBUG: 话题 {topic_id} 不存在")
            return jsonify({
                'success': False,
                'error': f'话题 {topic_id} 不存在'
            }), 404
        
        print(f"DEBUG: 找到话题，准备Delete: {topic.title}")
        db.session.delete(topic)
        db.session.commit()
        print(f"DEBUG: 话题 {topic_id} DeleteSuccess")
        
        return jsonify({
            'success': True,
            'message': '话题DeleteSuccess'
        }), 200
        
    except Exception as e:
        print(f"ERROR: Delete话题Failed: {str(e)}")
        print(f"ERROR: 异常类型: {type(e)}")
        import traceback
        print(f"ERROR: 完整ErrorInfo: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Delete话题Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/topics/<topic_id>/messages', methods=['POST'])
def add_message_to_topic(topic_id):
    """向话题添加消息"""
    try:
        from models import Topic, Message
        topic = Topic.query.get_or_404(topic_id)
        data = request.get_json()
        
        if not data or 'role' not in data or 'content' not in data:
            return jsonify({'error': '消息角色和内容不能为空'}), 400
        
        message = Message(
            topic_id=topic_id,
            role=data['role'],
            content=data['content']
        )
        
        # 更新话题的最后消息和更新时间
        topic.last_message = data['content']
        topic.updated_at = TimeUtils.now_local().replace(tzinfo=None)
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'message': '消息添加Success',
            'messageData': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'添加消息Failed: {str(e)}'}), 500

@ai_bp.route('/api/topics/generate-name', methods=['POST'])
def generate_topic_name():
    """根据第一条消息生成话题名称"""
    try:
        print(f"DEBUG: Started生成话题名称")
        data = request.get_json()
        
        if not data or 'message' not in data:
            print(f"ERROR: 消息内容为空")
            return jsonify({'error': '消息内容不能为空'}), 400
        
        message = data['message']
        print(f"DEBUG: 用户消息: {message[:100]}...")
        
        # 获取Settings中的默认模型
        settings = get_api_settings()
        model = settings.get('default_llm', 'gpt-5-chat')
        print(f"DEBUG: 使用模型: {model}")
        
        provider = get_provider_for_model(model)
        
        if not provider:
            return jsonify({'error': f'Not Supported的模型: {model}'}), 400
        
        # 获取APISettings
        settings = get_api_settings()
        
        # 尝试多种格式获取API密钥和连接状态
        api_key = (
            settings.get(f'{provider}.api_key') or 
            settings.get(f'apiProviders.{provider}.apiKey') or
            settings.get(f'{provider}_api_key')
        )
        
        is_connected = (
            settings.get(f'{provider}.connected') or 
            settings.get(f'apiProviders.{provider}.isConnected') or
            settings.get(f'{provider}_connected', False)
        )
        
        if not api_key or not is_connected:
            return jsonify({'error': f'{provider} API未Configuration或未连接'}), 400
        
        prompt = f"""请为以下对话生成一个简洁的话题名称（不超过20个字符）：

用户消息：{message}

要求：
1. 名称要简洁明了，能概括对话Theme
2. 不超过20个字符
3. 只返回话题名称，不要其他内容"""
        
        # 调用AI API
        print(f"DEBUG: 准备调用AI API生成话题名称")
        response = make_ai_request(
            provider=provider,
            api_key=api_key,
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "你是一个对话话题命名助手，擅长为对话生成简洁明了的标题。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=50,
            temperature=0.3
        )
        
        print(f"DEBUG: 话题命名API响应: {response}")
        
        if not response or 'choices' not in response or not response['choices']:
            print(f"ERROR: 话题命名API响应格式Error: {response}")
            return jsonify({'error': '话题命名API响应格式Error'}), 500
        
        topic_name = response['choices'][0]['message']['content'].strip()
        print(f"DEBUG: 生成的话题名称: '{topic_name}'")
        
        # 确保话题名称不超过20个字符
        if len(topic_name) > 20:
            topic_name = topic_name[:20]
        
        return jsonify({
            'success': True,
            'topicName': topic_name
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'生成话题名称Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/ai/models', methods=['GET'])
def get_available_models():
    """获取可用的AI模型列表"""
    try:
        models = []
        settings = get_api_settings()
        
        for provider, config in AI_PROVIDERS.items():
            # 检查提供商是否已连接
            is_connected = (
                settings.get(f'{provider}.connected') or 
                settings.get(f'apiProviders.{provider}.isConnected') or
                settings.get(f'{provider}_connected', False)
            )
            
            if is_connected:
                for model_key, model_value in config['models'].items():
                    models.append({
                        'id': model_key,
                        'name': model_key,
                        'provider': provider,
                        'actual_model': model_value
                    })
        
        return jsonify({
            'success': True,
            'models': models
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取模型列表Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/ai/models/current', methods=['GET'])
def get_current_model():
    """获取当前选择的模型"""
    try:
        settings = get_api_settings()
        current_model = settings.get('default_llm', 'gpt-5-chat')
        
        return jsonify({
            'success': True,
            'current_model': current_model
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取当前模型Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/ai/models/current', methods=['POST'])
def set_current_model():
    """Settings当前模型"""
    try:
        data = request.get_json()
        if not data or 'model_id' not in data:
            return jsonify({'error': '缺少必需字段: model_id'}), 400
        
        model_id = data['model_id']
        
        # 验证模型是否存在
        model_exists = False
        for provider, config in AI_PROVIDERS.items():
            if model_id in config['models']:
                model_exists = True
                break
        
        if not model_exists:
            return jsonify({'error': f'Not Supported的模型: {model_id}'}), 400
        
        # 更新Settings
        setting = Setting.query.filter_by(key='default_llm').first()
        if setting:
            setting.value = model_id
        else:
            setting = Setting(key='default_llm', value=model_id)
            db.session.add(setting)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'已Settings当前模型为: {model_id}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Settings当前模型Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/ai/plan-project', methods=['POST'])
def plan_project():
    """AI项目规划"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': '请求数据不能为空'}), 400
        
        project_name = data.get('name', '')
        project_description = data.get('description', '')
        
        if not project_name:
            return jsonify({'error': '项目名称不能为空'}), 400
        
        # 获取APISettings
        settings = get_api_settings()
        
        # 获取当前模型
        current_model = settings.get('default_llm', 'anthropic/claude-3-sonnet')
        
        # 获取提供商和API密钥
        provider = get_provider_for_model(current_model)
        if not provider:
            return jsonify({'error': f'Not Supported的模型: {current_model}'}), 400
        
        api_key = get_api_key_for_provider(provider, settings)
        if not api_key:
            return jsonify({'error': f'请先Configuration{provider}的API密钥'}), 400
        
        # 构建AI提示词
        prompt = f"""你是一个项目规划专家。根据用户提供的项目Info，生成一个详细的项目规划。

项目名称：{project_name}
项目描述：{project_description}

请返回一个JSON格式的响应，包含以下内容：
1. tasks: 任务列表，每个任务包含title和description
2. milestones: 里程碑列表
3. recommendations: 建议列表

任务列表格式示例：
{{
  "tasks": [
    {{"title": "需求分析", "description": "分析项目需求和目标"}},
    {{"title": "技术选型", "description": "选择合适的技术栈和工具"}}
  ],
  "milestones": [
    {{"name": "项目启动", "description": "Completed项目初始化"}}
  ],
  "recommendations": [
    "建议使用敏捷开发方法",
    "定期进行代码审查"
  ]
}}

请确保返回有效的JSON格式。"""
        
        messages = [
            {"role": "user", "content": prompt}
        ]
        
        # 调用AI API
        response = make_ai_request(provider, api_key, current_model, messages)
        ai_content = response['choices'][0]['message']['content']
        
        # 解析AI响应
        try:
            # 提取JSON部分
            if '```json' in ai_content:
                json_start = ai_content.find('{', ai_content.find('```json'))
                json_end = ai_content.rfind('}') + 1
                json_text = ai_content[json_start:json_end]
            elif ai_content.strip().startswith('{'):
                json_text = ai_content.strip()
            else:
                json_start = ai_content.find('{')
                json_end = ai_content.rfind('}') + 1
                json_text = ai_content[json_start:json_end]
            
            planning_data = json.loads(json_text)
            
            return jsonify({
                'success': True,
                'data': planning_data
            })
            
        except (json.JSONDecodeError, ValueError) as e:
            # 如果解析Failed，返回原始文本
            return jsonify({
                'success': True,
                'data': {
                    'tasks': [],
                    'milestones': [],
                    'recommendations': [ai_content]
                }
            })
        
    except Exception as e:
        logger.error(f"AI项目规划Failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'AI项目规划Failed: {str(e)}'
        }), 500

@ai_bp.route('/api/ai/test', methods=['GET'])
def test_ai_connection_status():
    """测试AI连接"""
    try:
        settings = get_api_settings()
        
        # 检查是否有任何已连接的提供商
        connected_providers = []
        for provider in AI_PROVIDERS.keys():
            is_connected = (
                settings.get(f'{provider}.connected') or 
                settings.get(f'apiProviders.{provider}.isConnected') or
                settings.get(f'{provider}_connected', False)
            )
            if is_connected:
                connected_providers.append(provider)
        
        if connected_providers:
            return jsonify({
                'success': True,
                'message': 'AI连接正常',
                'connected_providers': connected_providers
            })
        else:
            return jsonify({
                'success': False,
                'message': '没有已连接的AI提供商'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'测试AI连接Failed: {str(e)}'
        }), 500