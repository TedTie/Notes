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

# 背景文件端点
@app.route('/api/backgrounds', methods=['GET'])
def get_backgrounds():
    return jsonify({
        'backgrounds': [],
        'message': 'Backgrounds endpoint is working'
    })

@app.route('/api/backgrounds/upload', methods=['POST'])
def upload_background():
    from flask import request
    return jsonify({
        'message': 'Background upload endpoint (mock)',
        'error': 'File upload not implemented in simplified version'
    }), 501

@app.route('/api/backgrounds/<int:bg_id>', methods=['DELETE'])
def delete_background(bg_id):
    return jsonify({
        'message': f'Background {bg_id} delete endpoint (mock)',
        'error': 'Delete not implemented in simplified version'
    }), 501

# AI相关端点
@app.route('/api/ai/models', methods=['GET'])
def get_ai_models():
    return jsonify({
        'models': [],
        'message': 'AI models endpoint (mock)'
    })

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    return jsonify({
        'message': 'AI chat endpoint (mock)',
        'error': 'AI chat not implemented in simplified version'
    }), 501

# 番茄钟端点
@app.route('/api/pomodoro/stats', methods=['GET'])
def get_pomodoro_stats():
    return jsonify({
        'stats': {},
        'message': 'Pomodoro stats endpoint (mock)'
    })

# Vercel需要这个变量
app = app

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)