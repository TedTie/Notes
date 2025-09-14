# Vercel部署入口文件 - 简化版本
from flask import Flask, jsonify
from flask_cors import CORS
import os

# 创建Flask应用
app = Flask(__name__)

# 配置CORS
CORS(app, origins=['*'])

# 健康检查端点
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'AI Notebook API is running',
        'timestamp': '2025-01-14T00:00:00Z'
    })

# 基本的notes端点
@app.route('/api/notes', methods=['GET', 'POST'])
def handle_notes():
    from flask import request
    
    if request.method == 'GET':
        return jsonify({
            'notes': [],
            'message': 'Notes endpoint is working'
        })
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        return jsonify({
            'message': 'Note created successfully',
            'note': {
                'id': 1,
                'title': data.get('title', 'Untitled'),
                'content': data.get('content', ''),
                'created_at': '2025-01-14T00:00:00Z'
            }
        }), 201

# 基本的settings端点
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify({
        'settings': {},
        'message': 'Settings endpoint is working'
    })

# Vercel需要这个变量
app = app

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)