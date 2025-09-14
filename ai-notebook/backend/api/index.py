# Vercel部署入口文件 - 兼容版本
import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

# 添加后端目录到Python路径
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

# 创建Flask应用
app = Flask(__name__)

# 配置CORS
CORS(app, origins=['*'])

# 尝试导入完整应用的组件
try:
    # 尝试导入数据库模型
    from models import db, Note, Setting
    
    # 配置数据库（使用内存数据库作为fallback）
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///:memory:')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 初始化数据库
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    FULL_APP_AVAILABLE = True
    
except Exception as e:
    print(f"[VERCEL] Warning: Could not load full app components: {e}")
    FULL_APP_AVAILABLE = False

# 健康检查端点
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'AI Notebook API is running on Vercel',
        'timestamp': datetime.now().isoformat(),
        'full_app_available': FULL_APP_AVAILABLE,
        'version': '1.0.0'
    })

# 笔记端点
@app.route('/api/notes', methods=['GET', 'POST'])
def handle_notes():
    if FULL_APP_AVAILABLE:
        try:
            if request.method == 'GET':
                notes = Note.query.all()
                return jsonify({
                    'notes': [{
                        'id': note.id,
                        'title': note.title,
                        'content': note.content,
                        'created_at': note.created_at.isoformat() if note.created_at else None,
                        'updated_at': note.updated_at.isoformat() if note.updated_at else None
                    } for note in notes]
                })
            
            elif request.method == 'POST':
                data = request.get_json() or {}
                note = Note(
                    title=data.get('title', 'Untitled'),
                    content=data.get('content', ''),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(note)
                db.session.commit()
                
                return jsonify({
                    'message': 'Note created successfully',
                    'note': {
                        'id': note.id,
                        'title': note.title,
                        'content': note.content,
                        'created_at': note.created_at.isoformat(),
                        'updated_at': note.updated_at.isoformat()
                    }
                }), 201
                
        except Exception as e:
            return jsonify({
                'error': 'Database operation failed',
                'message': str(e)
            }), 500
    
    # Fallback for when full app is not available
    if request.method == 'GET':
        return jsonify({
            'notes': [],
            'message': 'Notes endpoint is working (fallback mode)'
        })
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        return jsonify({
            'message': 'Note created successfully (fallback mode)',
            'note': {
                'id': 1,
                'title': data.get('title', 'Untitled'),
                'content': data.get('content', ''),
                'created_at': datetime.now().isoformat()
            }
        }), 201

# 设置端点
@app.route('/api/settings', methods=['GET'])
def get_settings():
    if FULL_APP_AVAILABLE:
        try:
            settings = Setting.query.all()
            return jsonify({
                'settings': {setting.key: setting.value for setting in settings}
            })
        except Exception as e:
            return jsonify({
                'error': 'Database operation failed',
                'message': str(e)
            }), 500
    
    return jsonify({
        'settings': {
            'theme': 'dark',
            'default_llm': 'anthropic/claude-3-sonnet'
        },
        'message': 'Settings endpoint is working (fallback mode)'
    })

# 背景文件端点
@app.route('/api/backgrounds', methods=['GET'])
def get_backgrounds():
    return jsonify({
        'backgrounds': [],
        'message': 'Backgrounds endpoint is working'
    })

@app.route('/api/backgrounds/upload', methods=['POST'])
def upload_background():
    return jsonify({
        'message': 'Background upload not supported in Vercel environment',
        'error': 'File upload requires persistent storage'
    }), 501

@app.route('/api/backgrounds/<int:bg_id>', methods=['DELETE'])
def delete_background(bg_id):
    return jsonify({
        'message': f'Background {bg_id} delete not supported in Vercel environment',
        'error': 'File operations require persistent storage'
    }), 501

# AI相关端点
@app.route('/api/ai/models', methods=['GET'])
def get_ai_models():
    return jsonify({
        'models': [
            {'id': 'anthropic/claude-3-sonnet', 'name': 'Claude 3 Sonnet'},
            {'id': 'openai/gpt-4', 'name': 'GPT-4'}
        ],
        'message': 'AI models endpoint is working'
    })

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    return jsonify({
        'message': 'AI chat not fully supported in Vercel environment',
        'error': 'AI features require API keys and persistent connections'
    }), 501

# 番茄钟端点
@app.route('/api/pomodoro/stats', methods=['GET'])
def get_pomodoro_stats():
    return jsonify({
        'stats': {
            'total_sessions': 0,
            'total_focus_time': 0
        },
        'message': 'Pomodoro stats endpoint is working'
    })

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Vercel需要这个变量
app = app