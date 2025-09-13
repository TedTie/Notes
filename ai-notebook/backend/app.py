from flask import Flask, jsonify
from datetime import datetime
from flask_cors import CORS
from models import db, Note, Todo, ChatHistory, Setting, PomodoroSession, Project, Task
from routes.notes import notes_bp
from routes.settings import settings_bp
from routes.todos import todos_bp
from routes.ai import ai_bp
# from routes.audio import audio_bp  # 暂时注释掉，因为AudioFile模型不存在
from routes.backgrounds import backgrounds_bp
from routes.file_operations import file_ops_bp
from routes.pomodoro import pomodoro_bp
from routes.projects import projects_bp
from utils.auto_connect import initialize_auto_connections
from utils.log_filter import setup_secure_logging
from config.database_config import init_database, DatabaseManager
import os
import logging
from dotenv import load_dotenv

# Settings日志
logger = logging.getLogger(__name__)

# Load环境变量
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # 启用安全日志过滤
    setup_secure_logging()
    
    # 初始化数据库Configuration（使用增强的连接池管理）
    db_manager = init_database(app)
    
    # CORSConfiguration
    CORS(app, origins=['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'])  # Vue.js开发服务器
    
    # 注册蓝图
    app.register_blueprint(notes_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(todos_bp)
    app.register_blueprint(ai_bp)
    # app.register_blueprint(audio_bp)  # 暂时注释掉，因为AudioFile模型不存在
    app.register_blueprint(backgrounds_bp)
    app.register_blueprint(file_ops_bp)
    app.register_blueprint(pomodoro_bp)
    app.register_blueprint(projects_bp)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
        
        # 创建默认Settings
        default_settings = [
            ('theme', 'dark'),
            ('default_llm', 'anthropic/claude-3-sonnet'),
            ('enable_ai_assistant', 'true'),
            ('auto_save', 'true'),
            ('ai_file_operations_enabled', 'false'),  # 默认禁用AI文件操作功能
            ('pomodoro_work_duration', '25'),  # 工作时长（分钟）
            ('pomodoro_short_break_duration', '5'),  # 短休息时长（分钟）
            ('pomodoro_long_break_duration', '15'),  # 长休息时长（分钟）
            ('pomodoro_cycles_before_long_break', '4')  # 几个工作周期后进行长休息
        ]
        
        for key, value in default_settings:
            existing_setting = Setting.query.filter_by(key=key).first()
            if not existing_setting:
                setting = Setting(key=key, value=value)
                db.session.add(setting)
        
        try:
            db.session.commit()
            
            # 初始化自动连接
            initialize_auto_connections()
            
        except Exception as e:
            db.session.rollback()
            print(f"创建默认Settings时出错: {e}")
    
    # 健康检查端点 - 增强版，包含数据库连接状态
    @app.route('/api/health')
    def health_check():
        """健康检查端点 - 包含数据库连接状态"""
        try:
            # 检查数据库连接
            db_healthy = db_manager.health_check()
            connection_stats = db_manager.get_connection_stats()
            
            # 检查关键表是否可以访问
            try:
                note_count = Note.query.count()
            except Exception as e:
                note_count = 0
                logger.warning(f"Database query failed during health check: {e}")
            
            status = 'healthy' if db_healthy else 'degraded'
            
            return jsonify({
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'database': {
                    'connected': db_healthy,
                    'stats': connection_stats,
                    'note_count': note_count
                },
                'version': '1.0.0',
                'message': 'AI Notebook backend service running normally'
            })
            
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'message': 'Service health check failed'
            }), 503
    
    # Error处理
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("[STARTUP] AI Notebook backend service starting...")
    print("[STARTUP] Visit http://localhost:5000/api/health to check service status")
    print("[STARTUP] API documentation: http://localhost:5000/api/notes")
    app.run(debug=True, host='0.0.0.0', port=5000)