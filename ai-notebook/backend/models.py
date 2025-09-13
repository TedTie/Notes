from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from utils.time_utils import TimeUtils

db = SQLAlchemy()

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None), onupdate=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    # 关联的待办事项
    todos = db.relationship('Todo', backref='note', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Todo(db.Model):
    __tablename__ = 'todos'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20), default='medium')
    category = db.Column(db.String(50), default='默认')
    due_date = db.Column(db.DateTime, nullable=True)
    source_note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'completed': self.is_completed,
            'priority': self.priority,
            'category': self.category,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'source_note_id': self.source_note_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Setting(db.Model):
    __tablename__ = 'settings'
    
    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=True)
    setting_type = db.Column(db.String(20), default='string')  # string, boolean, integer, float, json, encrypted
    is_encrypted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None), onupdate=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value,
            'setting_type': self.setting_type,
            'is_encrypted': self.is_encrypted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Topic(db.Model):
    __tablename__ = 'topics'
    
    id = db.Column(db.String(50), primary_key=True)  # 使用字符串ID以支持前端生成的ID
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    last_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None), onupdate=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    # 关联的消息
    messages = db.relationship('Message', backref='topic', lazy=True, cascade='all, delete-orphan', order_by='Message.timestamp')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'lastMessage': self.last_message,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'messages': [message.to_dict() for message in self.messages]
        }

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.String(50), db.ForeignKey('topics.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    def to_dict(self):
        return {
            'id': self.id,
            'topicId': self.topic_id,
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None), onupdate=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    # 关联的任务
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'task_count': len(self.tasks) if self.tasks else 0
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='todo')  # 'todo', 'in_progress', 'done'
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high'
    created_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None), onupdate=lambda: TimeUtils.now_local().replace(tzinfo=None))
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PomodoroSession(db.Model):
    __tablename__ = 'pomodoro_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    completed_at = db.Column(db.DateTime, default=lambda: TimeUtils.now_local().replace(tzinfo=None))
    duration_minutes = db.Column(db.Integer, nullable=False)
    associated_task_id = db.Column(db.Integer, db.ForeignKey('todos.id'), nullable=True)
    session_type = db.Column(db.String(20), default='work')  # 'work', 'short_break', 'long_break'
    
    # 关联到Todo表
    associated_task = db.relationship('Todo', backref='pomodoro_sessions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_minutes': self.duration_minutes,
            'associated_task_id': self.associated_task_id,
            'session_type': self.session_type,
            'associated_task': self.associated_task.to_dict() if self.associated_task else None
        }