from flask import Blueprint, request, jsonify
from models import db, PomodoroSession, Todo
from datetime import datetime, timedelta
from utils.time_utils import TimeUtils
from sqlalchemy import func

pomodoro_bp = Blueprint('pomodoro', __name__)

@pomodoro_bp.route('/api/pomodoro/sessions', methods=['POST'])
def create_pomodoro_session():
    """记录一次Completed的番茄钟会话"""
    try:
        data = request.get_json()
        
        # 验证必需字段
        if 'duration' not in data:
            return jsonify({'error': '缺少duration字段'}), 400
        
        duration = data.get('duration')
        task_id = data.get('task_id')
        session_type = data.get('session_type', 'work')
        
        # 验证task_id是否存在（如果提供了的话）
        if task_id:
            task = Todo.query.get(task_id)
            if not task:
                return jsonify({'error': '指定的任务不存在'}), 404
        
        # 创建新的番茄钟会话记录
        session = PomodoroSession(
            duration_minutes=duration,
            associated_task_id=task_id,
            session_type=session_type,
            completed_at=TimeUtils.now_local().replace(tzinfo=None)
        )
        
        db.session.add(session)
        db.session.commit()
        
        # 计算今日Completed的工作番茄钟数量
        today_start = TimeUtils.now_local().replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        today_end = today_start + timedelta(days=1)
        
        today_count = PomodoroSession.query.filter(
            PomodoroSession.completed_at >= today_start,
            PomodoroSession.completed_at < today_end,
            PomodoroSession.session_type == 'work'
        ).count()
        
        return jsonify({
            'message': '番茄钟会话记录Success',
            'session_id': session.id,
            'today_count': today_count
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'创建番茄钟会话Failed: {str(e)}'}), 500

@pomodoro_bp.route('/api/pomodoro/stats', methods=['GET'])
def get_pomodoro_stats():
    """获取番茄钟统计数据"""
    try:
        period = request.args.get('period', 'today')
        
        if period == 'today':
            # 今日统计
            today_start = TimeUtils.now_local().replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
            today_end = today_start + timedelta(days=1)
            
            # 今日Completed的工作番茄钟数量
            work_sessions = PomodoroSession.query.filter(
                PomodoroSession.completed_at >= today_start,
                PomodoroSession.completed_at < today_end,
                PomodoroSession.session_type == 'work'
            ).count()
            
            # 今日总专注时间（分钟）
            total_minutes = db.session.query(func.sum(PomodoroSession.duration_minutes)).filter(
                PomodoroSession.completed_at >= today_start,
                PomodoroSession.completed_at < today_end,
                PomodoroSession.session_type == 'work'
            ).scalar() or 0
            
            return jsonify({
                'period': 'today',
                'completed_count': work_sessions,
                'total_minutes': total_minutes,
                'total_hours': round(total_minutes / 60, 1)
            })
            
        elif period == 'week':
            # 本周统计
            now = TimeUtils.now_local().replace(tzinfo=None)
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            week_end = week_start + timedelta(days=7)
            
            work_sessions = PomodoroSession.query.filter(
                PomodoroSession.completed_at >= week_start,
                PomodoroSession.completed_at < week_end,
                PomodoroSession.session_type == 'work'
            ).count()
            
            total_minutes = db.session.query(func.sum(PomodoroSession.duration_minutes)).filter(
                PomodoroSession.completed_at >= week_start,
                PomodoroSession.completed_at < week_end,
                PomodoroSession.session_type == 'work'
            ).scalar() or 0
            
            return jsonify({
                'period': 'week',
                'completed_count': work_sessions,
                'total_minutes': total_minutes,
                'total_hours': round(total_minutes / 60, 1)
            })
            
        else:
            return jsonify({'error': 'Not Supported的时间周期'}), 400
            
    except Exception as e:
        return jsonify({'error': f'获取统计数据Failed: {str(e)}'}), 500

@pomodoro_bp.route('/api/pomodoro/sessions', methods=['GET'])
def get_pomodoro_sessions():
    """获取番茄钟会话历史记录"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        task_id = request.args.get('task_id', type=int)
        
        query = PomodoroSession.query
        
        # 如果指定了任务ID，则只返回该任务的会话
        if task_id:
            query = query.filter(PomodoroSession.associated_task_id == task_id)
        
        # 按Completed时间倒序排列
        query = query.order_by(PomodoroSession.completed_at.desc())
        
        # 分页
        sessions = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'sessions': [session.to_dict() for session in sessions.items],
            'total': sessions.total,
            'pages': sessions.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': f'获取会话历史Failed: {str(e)}'}), 500