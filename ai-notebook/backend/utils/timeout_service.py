"""
Timeout服务模块
提供统一的Timeout管理和长时间运行操作的控制
"""

import asyncio
import signal
import threading
import time
from contextlib import contextmanager
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class TimeoutManager:
    """Timeout管理器"""
    
    def __init__(self):
        self.active_timeouts = {}
        self.default_timeout = 30  # 默认30秒
        self.long_operation_timeout = 300  # 长时间操作5分钟
        self.upload_timeout = 120  # 文件上传2分钟
        
    def set_timeout(self, operation_id, timeout_seconds):
        """Settings操作的Timeout时间"""
        self.active_timeouts[operation_id] = {
            'start_time': time.time(),
            'timeout': timeout_seconds,
            'status': 'active'
        }
        
    def check_timeout(self, operation_id):
        """检查操作是否Timeout"""
        if operation_id not in self.active_timeouts:
            return False
            
        operation = self.active_timeouts[operation_id]
        if operation['status'] != 'active':
            return False
            
        elapsed = time.time() - operation['start_time']
        return elapsed > operation['timeout']
        
    def cancel_timeout(self, operation_id):
        """取消Timeout检查"""
        if operation_id in self.active_timeouts:
            self.active_timeouts[operation_id]['status'] = 'cancelled'
            
    def cleanup_timeout(self, operation_id):
        """清理Timeout记录"""
        if operation_id in self.active_timeouts:
            del self.active_timeouts[operation_id]
            
    def get_remaining_time(self, operation_id):
        """获取剩余时间"""
        if operation_id not in self.active_timeouts:
            return 0
            
        operation = self.active_timeouts[operation_id]
        if operation['status'] != 'active':
            return 0
            
        elapsed = time.time() - operation['start_time']
        remaining = operation['timeout'] - elapsed
        return max(0, remaining)

class AsyncTimeoutManager:
    """异步Timeout管理器"""
    
    def __init__(self):
        self.timeout_manager = TimeoutManager()
        
    async def run_with_timeout(self, coro, timeout_seconds, operation_id=None):
        """运行协程并SettingsTimeout"""
        if not operation_id:
            operation_id = f"async_{id(coro)}"
            
        self.timeout_manager.set_timeout(operation_id, timeout_seconds)
        
        try:
            return await asyncio.wait_for(coro, timeout=timeout_seconds)
        except asyncio.TimeoutError:
            logger.warning(f"Operation {operation_id} timed out after {timeout_seconds} seconds")
            raise TimeoutError(f"操作Timeout：{operation_id}")
        finally:
            self.timeout_manager.cleanup_timeout(operation_id)

class SyncTimeoutManager:
    """SyncTimeout管理器（用于线程）"""
    
    def __init__(self):
        self.timeout_manager = TimeoutManager()
        
    @contextmanager
    def timeout_context(self, timeout_seconds, operation_id=None):
        """Timeout上下文管理器"""
        if not operation_id:
            operation_id = f"sync_{threading.current_thread().ident}"
            
        self.timeout_manager.set_timeout(operation_id, timeout_seconds)
        
        def timeout_handler(signum, frame):
            raise TimeoutError(f"操作Timeout：{operation_id}")
            
        # Settings信号处理器（仅Unix系统）
        if hasattr(signal, 'SIGALRM'):
            old_handler = signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout_seconds)
            
        try:
            yield
        finally:
            if hasattr(signal, 'SIGALRM'):
                signal.alarm(0)  # 取消定时器
                signal.signal(signal.SIGALRM, old_handler)
            self.timeout_manager.cleanup_timeout(operation_id)

def timeout_decorator(timeout_seconds=None, operation_type=None):
    """Timeout装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 根据操作类型确定Timeout时间
            if timeout_seconds is None:
                if operation_type == 'upload':
                    timeout = 120  # 2分钟
                elif operation_type == 'ai_processing':
                    timeout = 60   # 1分钟
                elif operation_type == 'database':
                    timeout = 30   # 30秒
                else:
                    timeout = 30   # 默认30秒
            else:
                timeout = timeout_seconds
                
            operation_id = f"{func.__name__}_{id(func)}"
            
            try:
                with SyncTimeoutManager().timeout_context(timeout, operation_id):
                    return func(*args, **kwargs)
            except TimeoutError as e:
                logger.error(f"Function {func.__name__} timed out: {e}")
                raise
                
        return wrapper
    return decorator

def async_timeout_decorator(timeout_seconds=None, operation_type=None):
    """异步Timeout装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 根据操作类型确定Timeout时间
            if timeout_seconds is None:
                if operation_type == 'upload':
                    timeout = 120  # 2分钟
                elif operation_type == 'ai_processing':
                    timeout = 60   # 1分钟
                elif operation_type == 'database':
                    timeout = 30   # 30秒
                else:
                    timeout = 30   # 默认30秒
            else:
                timeout = timeout_seconds
                
            operation_id = f"{func.__name__}_{id(func)}"
            
            try:
                manager = AsyncTimeoutManager()
                return await manager.run_with_timeout(
                    func(*args, **kwargs),
                    timeout,
                    operation_id
                )
            except TimeoutError as e:
                logger.error(f"Async function {func.__name__} timed out: {e}")
                raise
                
        return wrapper
    return decorator

class OperationProgressTracker:
    """操作进度跟踪器"""
    
    def __init__(self, operation_id, total_steps=1):
        self.operation_id = operation_id
        self.total_steps = total_steps
        self.current_step = 0
        self.start_time = time.time()
        self.status = 'running'
        self.error = None
        
    def update_progress(self, current_step=None, message=None):
        """更新进度"""
        if current_step is not None:
            self.current_step = current_step
        else:
            self.current_step += 1
            
        progress = (self.current_step / self.total_steps) * 100
        elapsed = time.time() - self.start_time
        
        logger.info(f"Operation {self.operation_id}: Step {self.current_step}/{self.total_steps} ({progress:.1f}%) - {message or 'In progress'} - Elapsed: {elapsed:.1f}s")
        
        return {
            'operation_id': self.operation_id,
            'progress': progress,
            'current_step': self.current_step,
            'total_steps': self.total_steps,
            'message': message,
            'elapsed_time': elapsed
        }
        
    def complete(self, message='Completed'):
        """Completed操作"""
        self.status = 'completed'
        elapsed = time.time() - self.start_time
        
        logger.info(f"Operation {self.operation_id}: {message} - Total time: {elapsed:.1f}s")
        
        return {
            'operation_id': self.operation_id,
            'status': self.status,
            'total_time': elapsed,
            'message': message
        }
        
    def fail(self, error):
        """操作Failed"""
        self.status = 'failed'
        self.error = str(error)
        elapsed = time.time() - self.start_time
        
        logger.error(f"Operation {self.operation_id}: Failed after {elapsed:.1f}s - Error: {error}")
        
        return {
            'operation_id': self.operation_id,
            'status': self.status,
            'error': self.error,
            'total_time': elapsed
        }

# 创建全局Timeout管理器实例
timeout_manager = TimeoutManager()
async_timeout_manager = AsyncTimeoutManager()

# 便捷函数
@timeout_decorator(timeout_seconds=60, operation_type='ai_processing')
def process_ai_request(prompt, model):
    """处理AI请求（带Timeout）"""
    # 这里放置实际的AI处理逻辑
    pass

@async_timeout_decorator(timeout_seconds=120, operation_type='upload')
async def upload_file_async(file_path, upload_url):
    """异步上传文件（带Timeout）"""
    # 这里放置实际的文件上传逻辑
    pass

@timeout_decorator(timeout_seconds=30, operation_type='database')
def execute_database_query(query, params):
    """执行数据库查询（带Timeout）"""
    # 这里放置实际的数据库查询逻辑
    pass

# 导出
__all__ = [
    'TimeoutManager',
    'AsyncTimeoutManager', 
    'SyncTimeoutManager',
    'timeout_decorator',
    'async_timeout_decorator',
    'OperationProgressTracker',
    'timeout_manager',
    'async_timeout_manager'
]