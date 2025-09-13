from flask import Blueprint, request, jsonify
from models import db, Todo
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from utils.time_utils import TimeUtils

todos_bp = Blueprint('todos', __name__)

@todos_bp.route('/api/todos', methods=['GET'])
def get_todos():
    """获取所有待办事项"""
    try:
        # 获取查询参数
        status = request.args.get('status')  # pending, completed, all
        category = request.args.get('category')
        sort_by = request.args.get('sort', 'created_at')  # created_at, due_date, priority
        order = request.args.get('order', 'desc')  # asc, desc
        
        query = Todo.query
        
        # 按状态过滤
        if status and status != 'all':
            if status == 'pending':
                query = query.filter(Todo.is_completed == False)
            elif status == 'completed':
                query = query.filter(Todo.is_completed == True)
        
        # 按分类过滤
        if category:
            query = query.filter(Todo.category == category)
        
        # 排序
        if sort_by == 'due_date':
            if order == 'asc':
                query = query.order_by(Todo.due_date.asc())
            else:
                query = query.order_by(Todo.due_date.desc())
        elif sort_by == 'priority':
            # 优先级排序：high > medium > low
            priority_order = {'high': 3, 'medium': 2, 'low': 1}
            if order == 'asc':
                query = query.order_by(Todo.priority.asc())
            else:
                query = query.order_by(Todo.priority.desc())
        else:  # created_at
            if order == 'asc':
                query = query.order_by(Todo.created_at.asc())
            else:
                query = query.order_by(Todo.created_at.desc())
        
        todos = query.all()
        return jsonify({'todos': [todo.to_dict() for todo in todos]}), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '获取待办事项Failed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/import', methods=['POST'])
def import_todos():
    """导入待办事项数据"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if not file.filename.endswith('.json'):
            return jsonify({'error': '只支持JSON格式文件'}), 400
        
        import json
        
        # 读取文件内容
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        
        imported_count = 0
        
        # 如果是完整导出数据，提取todos部分
        if isinstance(data, dict) and 'todos' in data:
            todos_data = data['todos']
        elif isinstance(data, list):
            todos_data = data
        else:
            return jsonify({'error': '文件格式不正确'}), 400
        
        # 导入待办事项
        for todo_data in todos_data:
            if 'title' in todo_data:
                # 处理截止日期
                due_date = None
                if 'due_date' in todo_data and todo_data['due_date']:
                    try:
                        due_date = datetime.fromisoformat(todo_data['due_date'].replace('Z', '+00:00'))
                    except ValueError:
                        pass  # 忽略Invalid的日期格式
                
                todo = Todo(
                    title=todo_data['title'],
                    description=todo_data.get('description', ''),
                    priority=todo_data.get('priority', 'medium'),
                    category=todo_data.get('category', '默认'),
                    due_date=due_date,
                    is_completed=todo_data.get('completed', todo_data.get('is_completed', False))
                )
                db.session.add(todo)
                imported_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Success导入 {imported_count} 条待办事项',
            'imported_count': imported_count
        }), 200
        
    except json.JSONDecodeError:
        return jsonify({'error': 'JSON文件格式Error'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'导入Failed: {str(e)}'}), 500

@todos_bp.route('/api/todos', methods=['POST'])
def create_todo():
    """创建新的待办事项"""
    try:
        data = request.get_json()
        
        if not data or 'title' not in data:
            return jsonify({'error': '标题不能为空'}), 400
        
        # 处理截止日期
        due_date = None
        if 'due_date' in data and data['due_date']:
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': '截止日期格式Invalid'}), 400
        
        new_todo = Todo(
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            category=data.get('category', '默认'),
            due_date=due_date,
            is_completed=data.get('completed', data.get('is_completed', False))
        )
        
        db.session.add(new_todo)
        db.session.commit()
        
        return jsonify(new_todo.to_dict()), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '创建待办事项Failed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    """获取单个待办事项"""
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({'error': '待办事项不存在'}), 404
        
        return jsonify(todo.to_dict()), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '获取待办事项Failed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """更新待办事项"""
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({'error': '待办事项不存在'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请求数据为空'}), 400
        
        # 更新字段
        if 'title' in data:
            todo.title = data['title']
        if 'description' in data:
            todo.description = data['description']
        if 'priority' in data:
            todo.priority = data['priority']
        if 'category' in data:
            todo.category = data['category']
        if 'completed' in data:
            todo.is_completed = data['completed']
            if data['completed']:
                todo.completed_at = TimeUtils.now_local().replace(tzinfo=None)
            else:
                todo.completed_at = None
        
        # 处理截止日期
        if 'due_date' in data:
            if data['due_date']:
                try:
                    todo.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({'error': '截止日期格式Invalid'}), 400
            else:
                todo.due_date = None
        
        todo.updated_at = TimeUtils.now_local().replace(tzinfo=None)
        db.session.commit()
        
        return jsonify(todo.to_dict()), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '更新待办事项Failed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Delete待办事项"""
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({'error': '待办事项不存在'}), 404
        
        db.session.delete(todo)
        db.session.commit()
        
        return jsonify({'message': '待办事项DeleteSuccess'}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Delete待办事项Failed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/<int:todo_id>/toggle', methods=['PATCH'])
def toggle_todo(todo_id):
    """切换待办事项Completed状态"""
    try:
        todo = Todo.query.get(todo_id)
        
        if not todo:
            return jsonify({'error': '待办事项不存在'}), 404
        
        todo.is_completed = not todo.is_completed
        if todo.is_completed:
            todo.completed_at = TimeUtils.now_local().replace(tzinfo=None)
        else:
            todo.completed_at = None
        
        todo.updated_at = TimeUtils.now_local().replace(tzinfo=None)
        db.session.commit()
        
        return jsonify(todo.to_dict()), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': '切换状态Failed', 'details': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/stats', methods=['GET'])
def get_todo_stats():
    """获取待办事项统计Info"""
    try:
        total = Todo.query.count()
        completed = Todo.query.filter(Todo.is_completed == True).count()
        pending = total - completed
        
        # 按优先级统计
        high_priority = Todo.query.filter(Todo.priority == 'high', Todo.is_completed == False).count()
        medium_priority = Todo.query.filter(Todo.priority == 'medium', Todo.is_completed == False).count()
        low_priority = Todo.query.filter(Todo.priority == 'low', Todo.is_completed == False).count()
        
        # 按分类统计
        categories = db.session.query(Todo.category, db.func.count(Todo.id)).group_by(Todo.category).all()
        category_stats = {category: count for category, count in categories}
        
        # 逾期任务
        overdue = Todo.query.filter(
            Todo.due_date < TimeUtils.now_local().replace(tzinfo=None),
            Todo.is_completed == False
        ).count()
        
        stats = {
            'total': total,
            'completed': completed,
            'pending': pending,
            'completion_rate': round((completed / total * 100) if total > 0 else 0, 1),
            'priority_stats': {
                'high': high_priority,
                'medium': medium_priority,
                'low': low_priority
            },
            'category_stats': category_stats,
            'overdue': overdue
        }
        
        return jsonify(stats), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '获取统计InfoFailed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500

@todos_bp.route('/api/todos/categories', methods=['GET'])
def get_categories():
    """获取所有分类"""
    try:
        categories = db.session.query(Todo.category).distinct().all()
        category_list = [category[0] for category in categories if category[0]]
        
        return jsonify(category_list), 200
        
    except SQLAlchemyError as e:
        return jsonify({'error': '获取分类Failed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': '服务器内部Error', 'details': str(e)}), 500