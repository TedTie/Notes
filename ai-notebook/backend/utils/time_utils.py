from datetime import datetime, timezone
import pytz

class TimeUtils:
    """
    统一的时间处理工具类
    解决前后端时间不一致的问题
    """
    
    @staticmethod
    def get_local_timezone():
        """获取本地时区"""
        try:
            # 尝试获取系统本地时区
            import time
            return pytz.timezone(time.tzname[0])
        except:
            # 如果Failed，使用中国时区作为默认
            return pytz.timezone('Asia/Shanghai')
    
    @staticmethod
    def now_local():
        """获取当前本地时间"""
        local_tz = TimeUtils.get_local_timezone()
        return datetime.now(local_tz)
    
    @staticmethod
    def now_utc():
        """获取当前UTC时间"""
        return datetime.now(timezone.utc)
    
    @staticmethod
    def to_local_time(utc_datetime):
        """将UTC时间转换为本地时间"""
        if utc_datetime is None:
            return None
        
        if utc_datetime.tzinfo is None:
            # 如果没有时区Info，假设是UTC时间
            utc_datetime = utc_datetime.replace(tzinfo=timezone.utc)
        
        local_tz = TimeUtils.get_local_timezone()
        return utc_datetime.astimezone(local_tz)
    
    @staticmethod
    def to_utc_time(local_datetime):
        """将本地时间转换为UTC时间"""
        if local_datetime is None:
            return None
        
        if local_datetime.tzinfo is None:
            # 如果没有时区Info，假设是本地时间
            local_tz = TimeUtils.get_local_timezone()
            local_datetime = local_tz.localize(local_datetime)
        
        return local_datetime.astimezone(timezone.utc)
    
    @staticmethod
    def format_for_frontend(dt):
        """格式化时间供前端使用（ISO格式，包含时区Info）"""
        if dt is None:
            return None
        
        # 确保时间有时区Info
        if dt.tzinfo is None:
            # 假设是本地时间
            local_tz = TimeUtils.get_local_timezone()
            dt = local_tz.localize(dt)
        
        return dt.isoformat()
    
    @staticmethod
    def parse_from_frontend(iso_string):
        """解析前端传来的ISO时间字符串"""
        if not iso_string:
            return None
        
        try:
            # 尝试解析ISO格式的时间字符串
            if iso_string.endswith('Z'):
                # UTC时间
                return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
            else:
                # 包含时区Info的时间
                return datetime.fromisoformat(iso_string)
        except ValueError:
            # 如果解析Failed，返回None
            return None
    
    @staticmethod
    def get_display_time(dt):
        """获取用于显示的本地时间"""
        if dt is None:
            return None
        
        # 转换为本地时间
        local_time = TimeUtils.to_local_time(dt)
        return local_time.replace(tzinfo=None)  # 移除时区Info，便于数据库存储