# Vercel部署入口文件 - 完整版本
import sys
import os

# 添加后端目录到Python路径
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

try:
    # 导入完整的Flask应用
    from app import create_app
    
    # 创建应用实例
    app = create_app()
    
    # 确保应用在Vercel环境中正确配置
    app.config['ENV'] = 'production'
    app.config['DEBUG'] = False
    
except ImportError as e:
    # 如果导入失败，创建一个简单的错误应用
    from flask import Flask, jsonify
    from flask_cors import CORS
    
    app = Flask(__name__)
    CORS(app, origins=['*'])
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'error',
            'message': f'Failed to import main app: {str(e)}',
            'timestamp': '2025-01-14T00:00:00Z'
        }), 500
    
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def catch_all(path):
        return jsonify({
            'error': 'Main application failed to load',
            'message': f'Import error: {str(e)}'
        }), 500

# Vercel需要这个变量
app = app

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)