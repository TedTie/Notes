"""
数据库Configuration模块
提供数据库连接池Configuration和连接管理
"""
import os
import time
from contextlib import contextmanager
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from models import db
import logging

logger = logging.getLogger(__name__)

class DatabaseConfig:
    """数据库Configuration类"""
    
    # 连接池Configuration
    SQLITE_POOL_SIZE = int(os.getenv('SQLITE_POOL_SIZE', '5'))
    SQLITE_MAX_OVERFLOW = int(os.getenv('SQLITE_MAX_OVERFLOW', '10'))
    SQLITE_POOL_TIMEOUT = int(os.getenv('SQLITE_POOL_TIMEOUT', '30'))
    SQLITE_POOL_RECYCLE = int(os.getenv('SQLITE_POOL_RECYCLE', '3600'))
    
    # 连接重试Configuration
    MAX_RETRIES = int(os.getenv('DB_MAX_RETRIES', '3'))
    RETRY_DELAY = int(os.getenv('DB_RETRY_DELAY', '1'))
    
    # 查询TimeoutConfiguration（秒）
    QUERY_TIMEOUT = int(os.getenv('DB_QUERY_TIMEOUT', '30'))
    
    @staticmethod
    def get_database_uri():
        """获取数据库连接字符串"""
        return os.getenv('DATABASE_URL', 'sqlite:///database.db')
    
    @staticmethod
    def get_sqlite_config():
        """获取SQLiteConfiguration"""
        return {
            'SQLALCHEMY_DATABASE_URI': DatabaseConfig.get_database_uri(),
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SQLALCHEMY_RECORD_QUERIES': os.getenv('FLASK_ENV') == 'development',
            
            # SQLite使用StaticPool而不是默认的NullPool，支持连接池Configuration
            'SQLALCHEMY_ENGINE_OPTIONS': {
                'poolclass': StaticPool,
                'pool_pre_ping': True,  # 连接前检查连接是否有效
                'pool_recycle': DatabaseConfig.SQLITE_POOL_RECYCLE,
                
                # SQLite特定Configuration
                'connect_args': {
                    'check_same_thread': False,
                    'timeout': 20.0,  # 连接Timeout时间
                }
            },
            
            # JSONConfiguration
            'JSON_AS_ASCII': False,
            
            # 其他Configuration
            'SQLALCHEMY_ECHO': os.getenv('FLASK_ENV') == 'development' and os.getenv('DB_ECHO') == 'true'
        }
    
    @staticmethod
    def get_postgres_config():
        """获取PostgreSQLConfiguration（生产环境推荐）"""
        return {
            'SQLALCHEMY_DATABASE_URI': DatabaseConfig.get_database_uri(),
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SQLALCHEMY_RECORD_QUERIES': True,
            
            # 连接池Configuration
            'SQLALCHEMY_ENGINE_OPTIONS': {
                'pool_size': int(os.getenv('POSTGRES_POOL_SIZE', '20')),
                'pool_recycle': int(os.getenv('POSTGRES_POOL_RECYCLE', '3600')),
                'pool_pre_ping': True,
                'max_overflow': int(os.getenv('POSTGRES_MAX_OVERFLOW', '30')),
                'pool_timeout': int(os.getenv('POSTGRES_POOL_TIMEOUT', '30')),
                'pool_class': StaticPool,  # 使用静态池避免连接泄漏
                
                # PostgreSQL特定Configuration
                'connect_args': {
                    'connect_timeout': 10,
                    'application_name': 'ai-notebook-app',
                    'options': '-c statement_timeout=30000'  # 30秒查询Timeout
                }
            },
            
            'JSON_AS_ASCII': False,
        }

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_instance):
        self.db = db_instance
        self.connection_retries = 0
        # 延迟Settings连接监听器，直到应用上下文可用
        self._listeners_setup = False
    
    def setup_connection_listeners(self):
        """Settings数据库连接监听器"""
        if self._listeners_setup:
            return
            
        try:
            @event.listens_for(self.db.engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                """SettingsSQLite优化参数"""
                if 'sqlite' in str(self.db.engine.url):
                    cursor = dbapi_connection.cursor()
                    cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging
                    cursor.execute("PRAGMA synchronous=NORMAL")  # 平衡安全性和性能
                    cursor.execute("PRAGMA cache_size=-10000")  # 10MB缓存
                    cursor.execute("PRAGMA temp_store=MEMORY")  # 临时表存储在内存
                    cursor.execute("PRAGMA mmap_size=300000000")  # 300MB内存映射
                    cursor.close()
            
            @event.listens_for(self.db.engine, "checkout")
            def ping_connection(dbapi_connection, connection_record, connection_proxy):
                """连接检出时进行健康检查"""
                try:
                    if 'sqlite' in str(self.db.engine.url):
                        dbapi_connection.execute("SELECT 1").fetchone()
                    else:
                        dbapi_connection.execute("SELECT 1")
                except Exception as e:
                    logger.warning(f"Database connection ping failed: {e}")
                    raise
            
            self._listeners_setup = True
            logger.info("Database connection listeners setup successfully")
        except Exception as e:
            logger.warning(f"Failed to setup connection listeners: {e}")
    
    @contextmanager
    def get_connection(self, timeout=None):
        """获取数据库连接的上下文管理器"""
        connection = None
        try:
            connection = self.db.engine.connect()
            if timeout:
                if 'sqlite' in str(self.db.engine.url):
                    connection.execute(f"PRAGMA busy_timeout={timeout * 1000}")
                elif 'postgresql' in str(self.db.engine.url):
                    connection.execute(f"SET statement_timeout = '{timeout}s'")
            
            yield connection
            
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            if connection:
                connection.close()
            raise
        finally:
            if connection:
                connection.close()
    
    def execute_with_retry(self, func, *args, **kwargs):
        """执行数据库操作，Failed时重试"""
        for attempt in range(DatabaseConfig.MAX_RETRIES):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Database operation failed (attempt {attempt + 1}): {e}")
                
                if attempt < DatabaseConfig.MAX_RETRIES - 1:
                    time.sleep(DatabaseConfig.RETRY_DELAY * (2 ** attempt))  # 指数退避
                else:
                    logger.error(f"Database operation failed after {DatabaseConfig.MAX_RETRIES} attempts")
                    raise
    
    def health_check(self):
        """数据库健康检查"""
        try:
            # 确保监听器已Settings
            self.setup_connection_listeners()
            
            with self.get_connection() as conn:
                if 'sqlite' in str(self.db.engine.url):
                    result = conn.execute("SELECT 1").fetchone()
                else:
                    result = conn.execute("SELECT 1").fetchone()
                
                return result is not None
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    def get_connection_stats(self):
        """获取连接池统计Info"""
        try:
            if hasattr(self.db.engine.pool, 'size'):
                return {
                    'pool_size': self.db.engine.pool.size(),
                    'checked_in': self.db.engine.pool.checkedin(),
                    'checked_out': self.db.engine.pool.checkedout(),
                    'overflow': getattr(self.db.engine.pool, '_overflow', 0)
                }
        except Exception as e:
            logger.error(f"Failed to get connection stats: {e}")
        
        return {}
    
    def optimize_for_testing(self):
        """为测试环境优化Configuration"""
        if 'sqlite' in str(self.db.engine.url):
            with self.get_connection() as conn:
                conn.execute("PRAGMA journal_mode=MEMORY")  # 内存模式，速度更快
                conn.execute("PRAGMA synchronous=OFF")     # 关闭Sync，速度更快
                conn.execute("PRAGMA temp_store=MEMORY")   # 临时存储在内存

def init_database(app):
    """初始化数据库Configuration"""
    # 根据数据库类型选择合适的Configuration
    database_uri = DatabaseConfig.get_database_uri()
    
    if 'postgresql' in database_uri:
        config = DatabaseConfig.get_postgres_config()
    else:
        config = DatabaseConfig.get_sqlite_config()
    
    # 应用Configuration
    for key, value in config.items():
        app.config[key] = value
    
    # 初始化数据库
    db.init_app(app)
    
    # 创建数据库管理器
    db_manager = DatabaseManager(db)
    
    # 存储到应用上下文
    app.db_manager = db_manager
    
    return db_manager