import time
import hashlib
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify, g
from typing import Dict, Tuple, Optional
import threading

class RateLimiter:
    """API访问频率限制器"""
    
    def __init__(self):
        self.requests = defaultdict(deque)  # IP -> 请求时间队列
        self.api_requests = defaultdict(deque)  # API密钥 -> 请求时间队列
        self.lock = threading.Lock()
        
        # 默认限制Configuration
        self.default_limits = {
            'per_minute': 60,    # 每分钟60次请求
            'per_hour': 1000,    # 每小时1000次请求
            'per_day': 10000     # 每天10000次请求
        }
        
        # API特定限制
        self.api_limits = {
            'ai_request': {
                'per_minute': 20,   # AI请求更严格限制
                'per_hour': 200,
                'per_day': 1000
            },
            'settings': {
                'per_minute': 30,
                'per_hour': 300,
                'per_day': 2000
            }
        }
    
    def _get_client_id(self) -> str:
        """获取客户端标识"""
        # 优先使用API密钥作为标识
        api_key = request.headers.get('Authorization', '')
        if api_key.startswith('Bearer '):
            # 对API密钥进行哈希处理，避免直接存储
            return hashlib.sha256(api_key.encode()).hexdigest()[:16]
        
        # 使用IP地址作为标识
        return request.remote_addr or 'unknown'
    
    def _clean_old_requests(self, request_queue: deque, window_seconds: int):
        """清理过期的请求记录"""
        current_time = time.time()
        while request_queue and request_queue[0] < current_time - window_seconds:
            request_queue.popleft()
    
    def _check_limit(self, client_id: str, endpoint: str, limit_type: str, 
                    window_seconds: int, max_requests: int) -> Tuple[bool, int]:
        """检查是否超过限制"""
        with self.lock:
            request_queue = self.requests[f"{client_id}:{endpoint}:{limit_type}"]
            
            # 清理过期请求
            self._clean_old_requests(request_queue, window_seconds)
            
            # 检查当前请求数
            current_requests = len(request_queue)
            
            if current_requests >= max_requests:
                return False, max_requests - current_requests
            
            # 记录当前请求
            request_queue.append(time.time())
            return True, max_requests - current_requests - 1
    
    def check_rate_limit(self, endpoint: str = 'default') -> Tuple[bool, Dict]:
        """检查访问频率限制"""
        client_id = self._get_client_id()
        
        # 获取适用的限制Configuration
        limits = self.api_limits.get(endpoint, self.default_limits)
        
        # 检查各个时间窗口的限制
        checks = [
            ('per_minute', 60, limits['per_minute']),
            ('per_hour', 3600, limits['per_hour']),
            ('per_day', 86400, limits['per_day'])
        ]
        
        rate_info = {}
        
        for limit_type, window_seconds, max_requests in checks:
            allowed, remaining = self._check_limit(
                client_id, endpoint, limit_type, window_seconds, max_requests
            )
            
            rate_info[limit_type] = {
                'limit': max_requests,
                'remaining': remaining,
                'reset_time': int(time.time() + window_seconds)
            }
            
            if not allowed:
                return False, rate_info
        
        return True, rate_info
    
    def get_rate_limit_headers(self, rate_info: Dict) -> Dict[str, str]:
        """生成速率限制响应头"""
        headers = {}
        
        for limit_type, info in rate_info.items():
            prefix = f'X-RateLimit-{limit_type.replace("_", "-").title()}'
            headers[f'{prefix}-Limit'] = str(info['limit'])
            headers[f'{prefix}-Remaining'] = str(info['remaining'])
            headers[f'{prefix}-Reset'] = str(info['reset_time'])
        
        return headers

# 全局速率限制器实例
rate_limiter = RateLimiter()

def rate_limit(endpoint: str = 'default'):
    """速率限制装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 检查速率限制
            allowed, rate_info = rate_limiter.check_rate_limit(endpoint)
            
            if not allowed:
                # 生成限制响应
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': '请求频率超过限制，请稍后再试',
                    'rate_limit_info': rate_info
                })
                response.status_code = 429
                
                # 添加速率限制头
                headers = rate_limiter.get_rate_limit_headers(rate_info)
                for key, value in headers.items():
                    response.headers[key] = value
                
                return response
            
            # 执行原函数
            result = f(*args, **kwargs)
            
            # 在响应中添加速率限制Info
            if hasattr(result, 'headers'):
                headers = rate_limiter.get_rate_limit_headers(rate_info)
                for key, value in headers.items():
                    result.headers[key] = value
            
            return result
        
        return decorated_function
    return decorator

class SecurityValidator:
    """API安全验证器"""
    
    @staticmethod
    def validate_api_key_format(api_key: str, provider: str) -> bool:
        """验证API密钥格式"""
        if not api_key or not isinstance(api_key, str):
            return False
        
        # 移除Bearer前缀
        if api_key.startswith('Bearer '):
            api_key = api_key[7:]
        
        # 根据提供商验证格式
        if provider == 'openrouter':
            return api_key.startswith('sk-or-') and len(api_key) >= 20
        elif provider == 'moonshot':
            return api_key.startswith('sk-') and len(api_key) >= 20
        elif provider == 'anthropic':
            return api_key.startswith('sk-ant-') and len(api_key) >= 20
        else:
            # 通用验证：至少20个字符，包含字母和数字
            return len(api_key) >= 20 and any(c.isalpha() for c in api_key) and any(c.isdigit() for c in api_key)
    
    @staticmethod
    def validate_request_payload(data: dict, required_fields: list) -> Tuple[bool, str]:
        """验证请求负载"""
        if not isinstance(data, dict):
            return False, "请求数据必须是JSON对象"
        
        # 检查必需字段
        for field in required_fields:
            if field not in data:
                return False, f"缺少必需字段: {field}"
            
            # 检查字段值不为空
            if data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
                return False, f"字段 {field} 不能为空"
        
        return True, ""
    
    @staticmethod
    def sanitize_input(text: str, max_length: int = 10000) -> str:
        """清理输入文本"""
        if not isinstance(text, str):
            return str(text)
        
        # 限制长度
        if len(text) > max_length:
            text = text[:max_length]
        
        # 移除潜在的恶意字符
        dangerous_chars = ['<script', '</script', 'javascript:', 'data:', 'vbscript:']
        text_lower = text.lower()
        
        for dangerous in dangerous_chars:
            if dangerous in text_lower:
                text = text.replace(dangerous, '[FILTERED]')
        
        return text.strip()
    
    @staticmethod
    def check_suspicious_activity(request_data: dict) -> Tuple[bool, str]:
        """检查可疑活动"""
        # 检查异常大的请求
        if len(str(request_data)) > 100000:  # 100KB
            return True, "请求数据过大"
        
        # 检查可疑的模型名称
        if 'model' in request_data:
            model = request_data['model']
            if not isinstance(model, str) or len(model) > 100:
                return True, "模型名称格式异常"
        
        # 检查消息内容
        if 'messages' in request_data:
            messages = request_data['messages']
            if not isinstance(messages, list) or len(messages) > 100:
                return True, "消息格式或数量异常"
        
        return False, ""

def security_check(required_fields: list = None):
    """安全检查装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # 获取请求数据
                if request.is_json:
                    data = request.get_json()
                else:
                    data = request.form.to_dict()
                
                # 验证必需字段
                if required_fields:
                    valid, error_msg = SecurityValidator.validate_request_payload(data, required_fields)
                    if not valid:
                        return jsonify({'error': error_msg}), 400
                
                # 检查可疑活动
                suspicious, reason = SecurityValidator.check_suspicious_activity(data)
                if suspicious:
                    return jsonify({
                        'error': 'Security violation detected',
                        'message': f'检测到安全违规: {reason}'
                    }), 403
                
                # 将验证后的数据存储到g对象中
                g.validated_data = data
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'error': 'Security check failed',
                    'message': '安全检查Failed'
                }), 500
        
        return decorated_function
    return decorator