import logging
import re
from typing import Any

class APIKeyFilter(logging.Filter):
    """API密钥过滤器 - 防止敏感Info出现在日志中"""
    
    def __init__(self):
        super().__init__()
        # 定义需要过滤的敏感Info模式
        self.sensitive_patterns = [
            # API密钥模式
            r'sk-[a-zA-Z0-9]{20,}',  # OpenAI/OpenRouter风格密钥
            r'sk-or-[a-zA-Z0-9-]{20,}',  # OpenRouter特定密钥
            r'Bearer\s+[a-zA-Z0-9-_]{20,}',  # Bearer token
            # 通用密钥模式
            r'api[_-]?key["\']?\s*[:=]\s*["\']?[a-zA-Z0-9-_]{10,}',
            r'secret["\']?\s*[:=]\s*["\']?[a-zA-Z0-9-_]{10,}',
            r'token["\']?\s*[:=]\s*["\']?[a-zA-Z0-9-_]{10,}',
            # 密码模式
            r'password["\']?\s*[:=]\s*["\']?[^\s"\',]{6,}',
            # 加密数据模式（base64编码的长字符串）
            r'[A-Za-z0-9+/]{40,}={0,2}'
        ]
        
        # 编译正则表达式以提高性能
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.sensitive_patterns]
    
    def filter(self, record: logging.LogRecord) -> bool:
        """过滤日志记录"""
        try:
            # 过滤消息内容
            if hasattr(record, 'msg') and record.msg:
                record.msg = self._sanitize_text(str(record.msg))
            
            # 过滤参数
            if hasattr(record, 'args') and record.args:
                record.args = tuple(self._sanitize_arg(arg) for arg in record.args)
            
            return True
            
        except Exception:
            # 如果过滤过程出错，仍然允许日志记录
            return True
    
    def _sanitize_text(self, text: str) -> str:
        """清理文本中的敏感Info"""
        sanitized = text
        
        for pattern in self.compiled_patterns:
            sanitized = pattern.sub(self._get_replacement, sanitized)
        
        return sanitized
    
    def _sanitize_arg(self, arg: Any) -> Any:
        """清理参数中的敏感Info"""
        if isinstance(arg, str):
            return self._sanitize_text(arg)
        elif isinstance(arg, dict):
            return self._sanitize_dict(arg)
        elif isinstance(arg, (list, tuple)):
            return type(arg)(self._sanitize_arg(item) for item in arg)
        else:
            return arg
    
    def _sanitize_dict(self, data: dict) -> dict:
        """清理字典中的敏感Info"""
        sanitized = {}
        
        for key, value in data.items():
            # 检查键名是否包含敏感Info
            if self._is_sensitive_key(key):
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = self._sanitize_arg(value)
        
        return sanitized
    
    def _is_sensitive_key(self, key: str) -> bool:
        """检查键名是否为敏感字段"""
        sensitive_keys = [
            'api_key', 'apikey', 'key', 'secret', 'token', 'password',
            'authorization', 'auth', 'credential', 'private_key'
        ]
        
        key_lower = key.lower()
        return any(sensitive in key_lower for sensitive in sensitive_keys)
    
    def _get_replacement(self, match) -> str:
        """获取替换文本"""
        matched_text = match.group(0)
        
        # 根据匹配的内容类型返回不同的替换文本
        if 'sk-' in matched_text:
            return "sk-***[API_KEY_REDACTED]***"
        elif 'Bearer' in matched_text:
            return "Bearer ***[TOKEN_REDACTED]***"
        elif any(keyword in matched_text.lower() for keyword in ['api', 'key', 'secret', 'token']):
            return "***[SENSITIVE_DATA_REDACTED]***"
        else:
            return "***[REDACTED]***"

def setup_secure_logging():
    """Settings安全日志Configuration"""
    # 获取根日志记录器
    root_logger = logging.getLogger()
    
    # 添加API密钥过滤器到所有处理器
    api_key_filter = APIKeyFilter()
    
    for handler in root_logger.handlers:
        handler.addFilter(api_key_filter)
    
    # 为Flask应用日志添加过滤器
    flask_logger = logging.getLogger('werkzeug')
    for handler in flask_logger.handlers:
        handler.addFilter(api_key_filter)
    
    print("[SECURE] API key logging filter protection enabled")

def create_secure_logger(name: str) -> logging.Logger:
    """创建带有安全过滤器的日志记录器"""
    logger = logging.getLogger(name)
    
    # 添加API密钥过滤器
    api_key_filter = APIKeyFilter()
    logger.addFilter(api_key_filter)
    
    return logger