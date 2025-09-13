from flask import Blueprint, request, jsonify
from models import db, Note
from datetime import datetime
from utils.time_utils import TimeUtils

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/api/notes', methods=['GET'])
def get_notes():
    """获取所有笔记列表"""
    try:
        notes = Note.query.order_by(Note.updated_at.desc()).all()
        return jsonify({'notes': [note.to_dict() for note in notes]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/api/notes/import', methods=['POST'])
def import_notes():
    """导入笔记数据"""
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
        
        # 如果是完整导出数据，提取notes部分
        if isinstance(data, dict) and 'notes' in data:
            notes_data = data['notes']
        elif isinstance(data, list):
            notes_data = data
        else:
            return jsonify({'error': '文件格式不正确'}), 400
        
        # 导入笔记
        for note_data in notes_data:
            if 'title' in note_data and 'content' in note_data:
                note = Note(
                    title=note_data['title'],
                    content=note_data['content']
                )
                db.session.add(note)
                imported_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Success导入 {imported_count} 条笔记',
            'imported_count': imported_count
        }), 200
        
    except json.JSONDecodeError:
        return jsonify({'error': 'JSON文件格式Error'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'导入Failed: {str(e)}'}), 500

@notes_bp.route('/api/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    """获取单篇笔记详情"""
    try:
        note = Note.query.get_or_404(note_id)
        return jsonify(note.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/api/notes', methods=['POST'])
def create_note():
    """创建新笔记"""
    try:
        data = request.get_json()
        note = Note(
            title=data.get('title', '新笔记'),
            content=data.get('content', '')
        )
        db.session.add(note)
        db.session.commit()
        
        # 确保返回的数据包含所有必要字段
        note_dict = note.to_dict()
        return jsonify({
            'message': '笔记创建Success',
            'note': note_dict
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """更新笔记"""
    try:
        note = Note.query.get_or_404(note_id)
        data = request.get_json()
        
        note.title = data.get('title', note.title)
        note.content = data.get('content', note.content)
        note.updated_at = TimeUtils.now_local().replace(tzinfo=None)
        
        db.session.commit()
        return jsonify({
            'message': '笔记更新Success',
            'note': note.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """Delete笔记"""
    try:
        note = Note.query.get_or_404(note_id)
        db.session.delete(note)
        db.session.commit()
        return jsonify({'message': '笔记DeleteSuccess'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500