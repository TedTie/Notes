from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import uuid
from urllib.parse import parse_qs
import cgi
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """处理文件上传请求"""
        try:
            # 设置CORS头
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # 解析multipart/form-data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.wfile.write(json.dumps({
                    'error': 'Content-Type must be multipart/form-data'
                }).encode())
                return
            
            # 获取boundary
            boundary = None
            for part in content_type.split(';'):
                if 'boundary=' in part:
                    boundary = part.split('boundary=')[1].strip()
                    break
            
            if not boundary:
                self.wfile.write(json.dumps({
                    'error': 'No boundary found in Content-Type'
                }).encode())
                return
            
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.wfile.write(json.dumps({
                    'error': 'No content provided'
                }).encode())
                return
            
            post_data = self.rfile.read(content_length)
            
            # 解析multipart数据
            try:
                # 创建临时文件来模拟文件上传
                env = os.environ.copy()
                env['REQUEST_METHOD'] = 'POST'
                env['CONTENT_TYPE'] = content_type
                env['CONTENT_LENGTH'] = str(content_length)
                
                # 使用cgi模块解析
                fp = io.BytesIO(post_data)
                form = cgi.FieldStorage(
                    fp=fp,
                    environ=env,
                    keep_blank_values=True
                )
                
                # 获取上传的文件
                if 'file' not in form:
                    self.wfile.write(json.dumps({
                        'error': 'No file provided'
                    }).encode())
                    return
                
                file_item = form['file']
                if not file_item.filename:
                    self.wfile.write(json.dumps({
                        'error': 'No filename provided'
                    }).encode())
                    return
                
                # 验证文件类型
                allowed_types = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                    'video/mp4', 'video/webm', 'video/quicktime'
                ]
                
                file_data = file_item.file.read()
                file_size = len(file_data)
                
                # 验证文件大小 (50MB)
                max_size = 50 * 1024 * 1024
                if file_size > max_size:
                    self.wfile.write(json.dumps({
                        'error': f'File size too large: {file_size} bytes > {max_size} bytes'
                    }).encode())
                    return
                
                # 生成唯一文件名
                file_extension = os.path.splitext(file_item.filename)[1]
                unique_filename = f"background_{uuid.uuid4().hex[:8]}{file_extension}"
                
                # 在Vercel环境中，我们需要返回一个临时URL
                # 由于Vercel无服务器环境的限制，我们使用base64编码返回文件数据
                import base64
                file_base64 = base64.b64encode(file_data).decode('utf-8')
                
                # 构造数据URL
                mime_type = 'image/jpeg'  # 默认类型
                if file_extension.lower() in ['.png']:
                    mime_type = 'image/png'
                elif file_extension.lower() in ['.gif']:
                    mime_type = 'image/gif'
                elif file_extension.lower() in ['.webp']:
                    mime_type = 'image/webp'
                elif file_extension.lower() in ['.mp4']:
                    mime_type = 'video/mp4'
                elif file_extension.lower() in ['.webm']:
                    mime_type = 'video/webm'
                
                data_url = f"data:{mime_type};base64,{file_base64}"
                
                # 返回成功响应
                response_data = {
                    'success': True,
                    'url': data_url,
                    'filename': unique_filename,
                    'size': file_size,
                    'type': mime_type,
                    'message': 'File uploaded successfully (as data URL)'
                }
                
                self.wfile.write(json.dumps(response_data).encode())
                
            except Exception as parse_error:
                self.wfile.write(json.dumps({
                    'error': f'Failed to parse multipart data: {str(parse_error)}'
                }).encode())
                return
                
        except Exception as e:
            # 发送错误响应
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'error': f'Upload failed: {str(e)}'
            }).encode())
    
    def do_OPTIONS(self):
        """处理预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()