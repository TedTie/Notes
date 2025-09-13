from flask import Blueprint, request, jsonify
from models import db, Project, Task
from utils.ai_client import OpenRouterClient
import json

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/projects', methods=['GET'])
def get_projects():
    """获取所有项目列表"""
    try:
        projects = Project.query.order_by(Project.created_at.desc()).all()
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        print(f"[ERROR] get_projects exception: {str(e)}")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/projects', methods=['POST'])
def create_project():
    """创建新项目"""
    try:
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')
        use_ai_planning = data.get('use_ai_planning', False)
        
        if not name:
            return jsonify({'error': '项目名称不能为空'}), 400
        
        # 创建项目
        project = Project(name=name, description=description)
        db.session.add(project)
        db.session.flush()  # 获取项目ID
        
        # 如果启用AI规划，生成初始任务
        if use_ai_planning:
            try:
                # 获取OpenRouter API密钥
                from models import Setting
                api_key_setting = Setting.query.filter_by(key='openrouter_api_key').first()
                if api_key_setting and api_key_setting.value:
                    client = OpenRouterClient(api_key_setting.value)
                    
                    # AI项目规划提示词
                    prompt = f"""你是一个项目规划专家。根据用户提供的项目名称，分解成一个JSON数组的任务。每个任务对象包含'title'和'description'。
                    
项目名称：{name}
描述：{description}

请返回一个JSON数组，包含5-8个具体的任务，每个任务都应该是可执行的步骤。
格式示例：
[
  {{"title": "需求分析", "description": "分析项目需求和目标"}},
  {{"title": "技术选型", "description": "选择合适的技术栈和工具"}}
]"""
                    
                    ai_response = client.chat_completion([
                        {"role": "user", "content": prompt}
                    ])
                    
                    # 解析AI响应
                    try:
                        # 提取JSON部分
                        response_text = ai_response.strip()
                        if '```json' in response_text:
                            json_start = response_text.find('[', response_text.find('```json'))
                            json_end = response_text.rfind(']') + 1
                            json_text = response_text[json_start:json_end]
                        elif response_text.startswith('['):
                            json_text = response_text
                        else:
                            json_start = response_text.find('[')
                            json_end = response_text.rfind(']') + 1
                            json_text = response_text[json_start:json_end]
                        
                        tasks_data = json.loads(json_text)
                        
                        # 创建任务
                        for task_data in tasks_data:
                            if isinstance(task_data, dict) and 'title' in task_data:
                                task = Task(
                                    project_id=project.id,
                                    title=task_data['title'],
                                    description=task_data.get('description', ''),
                                    status='todo'
                                )
                                db.session.add(task)
                    except (json.JSONDecodeError, KeyError) as e:
                        # AI响应解析Failed，创建默认任务
                        default_tasks = [
                            {'title': '项目启动', 'description': '初始化项目环境和Configuration'},
                            {'title': '需求分析', 'description': '分析和整理项目需求'},
                            {'title': '设计阶段', 'description': 'Completed项目设计和架构'},
                            {'title': '开发实现', 'description': '编码实现核心功能'},
                            {'title': '测试验证', 'description': '测试功能和Repair问题'},
                            {'title': '项目交付', 'description': 'Completed项目并交付成果'}
                        ]
                        for task_data in default_tasks:
                            task = Task(
                                project_id=project.id,
                                title=task_data['title'],
                                description=task_data['description'],
                                status='todo'
                            )
                            db.session.add(task)
            except Exception as ai_error:
                # AI调用Failed，不影响项目创建
                print(f"AI规划Failed: {ai_error}")
        
        db.session.commit()
        return jsonify(project.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/projects/<int:project_id>/ai-planning', methods=['POST'])
def ai_project_planning(project_id):
    """AI项目规划端点"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        planning_type = data.get('type', 'breakdown')  # breakdown, estimate, risks
        
        # 获取OpenRouter API密钥
        from models import Setting
        from utils.encryption import EncryptionManager
        
        # 首先尝试获取加密的API密钥
        api_key_setting = Setting.query.filter_by(key='apiProviders.openrouter.apiKey', is_encrypted=True).first()
        
        if api_key_setting and api_key_setting.value:
            # 解密API密钥
            encryption_manager = EncryptionManager()
            decrypted_api_key = encryption_manager.decrypt(api_key_setting.value)
        else:
            # 如果没有找到加密的密钥，尝试未加密的
            api_key_setting = Setting.query.filter_by(key='openrouter_api_key').first()
            if not api_key_setting or not api_key_setting.value:
                return jsonify({'error': '请先ConfigurationOpenRouter API密钥'}), 400
            decrypted_api_key = api_key_setting.value
        
        client = OpenRouterClient(decrypted_api_key)
        
        if planning_type == 'breakdown':
            # 项目任务分解
            prompt = f"""你是一个项目规划专家。根据用户提供的项目Info，分解成一个JSON数组的任务。每个任务对象包含'title'和'description'。
                    
项目名称：{project.name}
描述：{project.description}

请返回一个JSON数组，包含5-8个具体的任务，每个任务都应该是可执行的步骤。
格式示例：
[
  {{"title": "需求分析", "description": "分析项目需求和目标"}},
  {{"title": "技术选型", "description": "选择合适的技术栈和工具"}}
]"""
            
        elif planning_type == 'estimate':
            # 项目时间预估
            prompt = f"""你是一个项目管理专家。根据项目Info，预估项目Completed时间和资源需求。

项目名称：{project.name}
描述：{project.description}

请分析并返回JSON格式的预估Info：
{{
  "estimated_days": 数字,
  "team_size": 数字,
  "complexity": "简单/中等/复杂",
  "milestones": ["里程碑1", "里程碑2"]
}}"""
            
        elif planning_type == 'risks':
            # 项目风险分析
            prompt = f"""你是一个风险管理专家。分析项目可能遇到的风险和挑战。

项目名称：{project.name}
描述：{project.description}

请返回JSON格式的风险分析：
{{
  "risks": ["风险1", "风险2"],
  "mitigation": ["应对措施1", "应对措施2"],
  "priority": "低/中/高"
}}"""
        else:
            return jsonify({'error': 'Not Supported的规划类型'}), 400
        
        ai_response = client.chat_completion([
            {"role": "user", "content": prompt}
        ])
        
        # 解析AI响应
        try:
            response_text = ai_response.content.strip()
            if '```json' in response_text:
                json_start = response_text.find('[', response_text.find('```json'))
                if json_start == -1:
                    json_start = response_text.find('{', response_text.find('```json'))
                json_end = max(response_text.rfind(']'), response_text.rfind('}')) + 1
                json_text = response_text[json_start:json_end]
            elif response_text.startswith('[') or response_text.startswith('{'):
                json_text = response_text
            else:
                json_start = max(response_text.find('['), response_text.find('{'))
                json_end = max(response_text.rfind(']'), response_text.rfind('}')) + 1
                json_text = response_text[json_start:json_end]
            
            result = json.loads(json_text)
            return jsonify({'result': result})
            
        except (json.JSONDecodeError, ValueError) as e:
            # 如果JSON解析Failed，返回原始文本
            return jsonify({'result': {'text': ai_response.content}})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """获取特定项目详情"""
    try:
        project = Project.query.get_or_404(project_id)
        return jsonify(project.to_dict())
    except Exception as e:
        print(f"[ERROR] get_project exception: {str(e)}")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """更新项目Info"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        if 'name' in data:
            project.name = data['name']
        if 'description' in data:
            project.description = data['description']
        
        db.session.commit()
        return jsonify(project.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete项目"""
    try:
        project = Project.query.get_or_404(project_id)
        
        # Delete项目相关的所有任务
        Task.query.filter_by(project_id=project_id).delete()
        
        # Delete项目
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': '项目DeleteSuccess'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/projects/<int:project_id>/tasks', methods=['GET'])
def get_project_tasks(project_id):
    """获取项目的所有任务"""
    try:
        project = Project.query.get_or_404(project_id)
        tasks = Task.query.filter_by(project_id=project_id).order_by(Task.created_at.desc()).all()
        return jsonify([task.to_dict() for task in tasks])
    except Exception as e:
        print(f"[ERROR] get_project_tasks exception: {str(e)}")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/tasks', methods=['POST'])
def create_task():
    """创建新任务"""
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        title = data.get('title')
        description = data.get('description', '')
        status = data.get('status', 'todo')
        
        if not project_id or not title:
            return jsonify({'error': '项目ID和任务标题不能为空'}), 400
        
        # 验证项目是否存在
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': '项目不存在'}), 404
        
        task = Task(
            project_id=project_id,
            title=title,
            description=description,
            status=status
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """更新任务"""
    try:
        task = Task.query.get_or_404(task_id)
        data = request.get_json()
        
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'status' in data:
            task.status = data['status']
        
        db.session.commit()
        return jsonify(task.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete任务"""
    try:
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': '任务DeleteSuccess'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/api/tasks/<int:task_id>/enhance', methods=['POST'])
def enhance_task(task_id):
    """AI增强任务功能"""
    try:
        task = Task.query.get_or_404(task_id)
        data = request.get_json()
        action = data.get('action', 'breakdown')
        
        # 获取OpenRouter API密钥
        from models import Setting
        from utils.encryption import EncryptionManager
        
        # 首先尝试获取加密的API密钥
        api_key_setting = Setting.query.filter_by(key='apiProviders.openrouter.apiKey', is_encrypted=True).first()
        
        if api_key_setting and api_key_setting.value:
            # 解密API密钥
            encryption_manager = EncryptionManager()
            decrypted_api_key = encryption_manager.decrypt(api_key_setting.value)
        else:
            # 如果没有找到加密的密钥，尝试未加密的
            api_key_setting = Setting.query.filter_by(key='openrouter_api_key').first()
            if not api_key_setting or not api_key_setting.value:
                return jsonify({'error': '请先ConfigurationOpenRouter API密钥'}), 400
            decrypted_api_key = api_key_setting.value  # 直接使用未加密的值
        
        print(f"[DEBUG] Decrypted API Key found: {decrypted_api_key[:10]}...")
        client = OpenRouterClient(decrypted_api_key)
        print(f"[DEBUG] Client created with API key: {client.api_key[:10] if client.api_key else 'None'}...")
        
        if action == 'breakdown':
            prompt = f"""你是一个任务管理专家。请将以下任务分解为更小的、可执行的子任务。

任务标题：{task.title}
任务描述：{task.description}

请返回一个JSON数组，包含3-5个子任务，每个子任务包含title和description。
格式示例：
[
  {{"title": "子任务1", "description": "具体描述"}},
  {{"title": "子任务2", "description": "具体描述"}}
]"""
        elif action == 'estimate':
            prompt = f"""你是一个项目管理专家。请预估以下任务的Completed时间和难度。

任务标题：{task.title}
任务描述：{task.description}

请返回JSON格式的预估Info：
{{
  "estimated_hours": 数字,
  "difficulty": "简单/中等/困难",
  "prerequisites": ["前置条件1", "前置条件2"]
}}"""
        else:
            return jsonify({'error': 'Not Supported的增强类型'}), 400
        
        ai_response = client.chat_completion([
            {"role": "user", "content": prompt}
        ])
        
        # 解析AI响应
        try:
            response_text = ai_response.content.strip()
            if '```json' in response_text:
                json_start = response_text.find('[', response_text.find('```json'))
                if json_start == -1:
                    json_start = response_text.find('{', response_text.find('```json'))
                json_end = max(response_text.rfind(']'), response_text.rfind('}')) + 1
                json_text = response_text[json_start:json_end]
            elif response_text.startswith('[') or response_text.startswith('{'):
                json_text = response_text
            else:
                json_start = max(response_text.find('['), response_text.find('{'))
                json_end = max(response_text.rfind(']'), response_text.rfind('}')) + 1
                json_text = response_text[json_start:json_end]
            
            result = json.loads(json_text)
            return jsonify({'result': result})
            
        except (json.JSONDecodeError, ValueError) as e:
            # 如果JSON解析Failed，返回原始文本
            return jsonify({'result': {'text': ai_response.content}})
        
    except Exception as e:
        print(f"[ERROR] enhance_task exception: {str(e)}")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500