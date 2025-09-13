#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI文件操作工具模块
提供安全的文件读取、写入、创建等操作
"""

import os
import json
import shutil
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from utils.log_filter import create_secure_logger

# 创建安全日志记录器
logger = create_secure_logger(__name__)

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent
AI_NOTEBOOK_ROOT = PROJECT_ROOT / 'ai-notebook'

# 安全Configuration
class FileOperationConfig:
    # 允许的文件扩展名
    ALLOWED_EXTENSIONS = {
        '.txt', '.md', '.json', '.csv', '.log',
        '.py', '.js', '.html', '.css', '.vue', '.ts',
        '.env', '.config', '.ini', '.yaml', '.yml',
        '.rtf'
    }
    
    # 禁止访问的目录
    FORBIDDEN_DIRS = {
        'node_modules', '__pycache__', '.git', '.vscode',
        'venv', 'env', 'instance', 'uploads'
    }
    
    # 禁止访问的文件
    FORBIDDEN_FILES = {
        '.env', 'database.db', 'ai_notebook.db'
    }
    
    # 文件大小限制 (字节)
    MAX_READ_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_WRITE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # 批量操作限制
    MAX_BATCH_FILES = 20

class FileOperationError(Exception):
    """文件操作异常"""
    pass

class SecurityError(FileOperationError):
    """安全相关异常"""
    pass

class FileOperationManager:
    """文件操作管理器"""
    
    def __init__(self):
        self.config = FileOperationConfig()
        self.operation_log = []
    
    def _normalize_path(self, file_path: str) -> Path:
        """规范化文件路径"""
        try:
            # 转换为Path对象
            path = Path(file_path)
            
            # 如果是绝对路径，检查是否在项目目录内
            if path.is_absolute():
                try:
                    # 尝试获取相对于项目根目录的路径
                    relative_path = path.relative_to(PROJECT_ROOT)
                    path = PROJECT_ROOT / relative_path
                except ValueError:
                    raise SecurityError(f"路径不在允许的项目目录内: {file_path}")
            else:
                # 相对路径，相对于ai-notebook目录
                path = AI_NOTEBOOK_ROOT / path
            
            # 解析路径，移除 .. 等
            path = path.resolve()
            
            # 再次检查是否在项目目录内
            try:
                path.relative_to(PROJECT_ROOT)
            except ValueError:
                raise SecurityError(f"路径不在允许的项目目录内: {file_path}")
            
            return path
            
        except Exception as e:
            logger.error(f"路径规范化Failed: {file_path}, Error: {e}")
            raise SecurityError(f"Invalid的文件路径: {file_path}")
    
    def _check_file_security(self, file_path: Path) -> None:
        """检查文件安全性"""
        # 检查文件扩展名
        if file_path.suffix.lower() not in self.config.ALLOWED_EXTENSIONS:
            raise SecurityError(f"Not Supported的文件类型: {file_path.suffix}")
        
        # 检查是否在禁止目录中
        for part in file_path.parts:
            if part in self.config.FORBIDDEN_DIRS:
                raise SecurityError(f"禁止访问目录: {part}")
        
        # 检查是否是禁止文件
        if file_path.name in self.config.FORBIDDEN_FILES:
            raise SecurityError(f"禁止访问文件: {file_path.name}")
    
    def _log_operation(self, operation: str, file_path: str, success: bool, error: str = None):
        """记录操作日志"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'file_path': file_path,
            'success': success,
            'error': error
        }
        self.operation_log.append(log_entry)
        
        if success:
            logger.info(f"文件操作Success: {operation} - {file_path}")
        else:
            logger.error(f"文件操作Failed: {operation} - {file_path}, Error: {error}")
    
    def read_file(self, file_path: str, encoding: str = 'utf-8') -> Dict:
        """读取文件内容"""
        try:
            # 规范化和安全检查
            normalized_path = self._normalize_path(file_path)
            self._check_file_security(normalized_path)
            
            # 检查文件是否存在
            if not normalized_path.exists():
                raise FileOperationError(f"文件不存在: {file_path}")
            
            # 检查文件大小
            file_size = normalized_path.stat().st_size
            if file_size > self.config.MAX_READ_SIZE:
                raise FileOperationError(f"文件过大: {file_size} bytes, 最大允许: {self.config.MAX_READ_SIZE} bytes")
            
            # 读取文件内容
            with open(normalized_path, 'r', encoding=encoding) as f:
                content = f.read()
            
            self._log_operation('read', file_path, True)
            
            return {
                'success': True,
                'content': content,
                'file_path': str(normalized_path.relative_to(PROJECT_ROOT)),
                'size': file_size,
                'encoding': encoding
            }
            
        except Exception as e:
            error_msg = str(e)
            self._log_operation('read', file_path, False, error_msg)
            return {
                'success': False,
                'error': error_msg,
                'file_path': file_path
            }
    
    def write_file(self, file_path: str, content: str, encoding: str = 'utf-8', create_backup: bool = True) -> Dict:
        """写入文件内容"""
        try:
            # 规范化和安全检查
            normalized_path = self._normalize_path(file_path)
            self._check_file_security(normalized_path)
            
            # 检查内容大小
            content_size = len(content.encode(encoding))
            if content_size > self.config.MAX_WRITE_SIZE:
                raise FileOperationError(f"内容过大: {content_size} bytes, 最大允许: {self.config.MAX_WRITE_SIZE} bytes")
            
            # 创建备份
            backup_path = None
            if create_backup and normalized_path.exists():
                backup_path = normalized_path.with_suffix(f"{normalized_path.suffix}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}")
                shutil.copy2(normalized_path, backup_path)
            
            # 确保目录存在
            normalized_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            with open(normalized_path, 'w', encoding=encoding) as f:
                f.write(content)
            
            self._log_operation('write', file_path, True)
            
            return {
                'success': True,
                'file_path': str(normalized_path.relative_to(PROJECT_ROOT)),
                'size': content_size,
                'encoding': encoding,
                'backup_path': str(backup_path.relative_to(PROJECT_ROOT)) if backup_path else None
            }
            
        except Exception as e:
            error_msg = str(e)
            self._log_operation('write', file_path, False, error_msg)
            return {
                'success': False,
                'error': error_msg,
                'file_path': file_path
            }
    
    def create_file(self, file_path: str, content: str = '', encoding: str = 'utf-8', overwrite: bool = False) -> Dict:
        """创建新文件"""
        try:
            # 规范化和安全检查
            normalized_path = self._normalize_path(file_path)
            self._check_file_security(normalized_path)
            
            # 检查文件是否Already Exists
            if normalized_path.exists() and not overwrite:
                raise FileOperationError(f"文件Already Exists: {file_path}")
            
            # 检查内容大小
            content_size = len(content.encode(encoding))
            if content_size > self.config.MAX_WRITE_SIZE:
                raise FileOperationError(f"内容过大: {content_size} bytes, 最大允许: {self.config.MAX_WRITE_SIZE} bytes")
            
            # 确保目录存在
            normalized_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 创建文件
            with open(normalized_path, 'w', encoding=encoding) as f:
                f.write(content)
            
            self._log_operation('create', file_path, True)
            
            return {
                'success': True,
                'file_path': str(normalized_path.relative_to(PROJECT_ROOT)),
                'size': content_size,
                'encoding': encoding,
                'created': True
            }
            
        except Exception as e:
            error_msg = str(e)
            self._log_operation('create', file_path, False, error_msg)
            return {
                'success': False,
                'error': error_msg,
                'file_path': file_path
            }
    
    def list_directory(self, directory_path: str, include_hidden: bool = False, file_types: List[str] = None) -> Dict:
        """列出目录内容"""
        try:
            # 规范化路径
            normalized_path = self._normalize_path(directory_path)
            
            # 检查是否是目录
            if not normalized_path.exists():
                raise FileOperationError(f"目录不存在: {directory_path}")
            
            if not normalized_path.is_dir():
                raise FileOperationError(f"路径不是目录: {directory_path}")
            
            # 获取文件列表
            files = []
            directories = []
            
            for item in normalized_path.iterdir():
                # 跳过隐藏文件
                if not include_hidden and item.name.startswith('.'):
                    continue
                
                # 跳过禁止目录
                if item.name in self.config.FORBIDDEN_DIRS:
                    continue
                
                if item.is_file():
                    # 检查文件类型
                    if file_types and item.suffix.lower() not in [f'.{ft}' for ft in file_types]:
                        continue
                    
                    # 跳过禁止文件
                    if item.name in self.config.FORBIDDEN_FILES:
                        continue
                    
                    try:
                        stat = item.stat()
                        files.append({
                            'name': item.name,
                            'path': str(item.relative_to(PROJECT_ROOT)),
                            'size': stat.st_size,
                            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            'extension': item.suffix.lower()
                        })
                    except Exception:
                        continue
                        
                elif item.is_dir():
                    directories.append({
                        'name': item.name,
                        'path': str(item.relative_to(PROJECT_ROOT)),
                        'type': 'directory'
                    })
            
            self._log_operation('list', directory_path, True)
            
            return {
                'success': True,
                'directory_path': str(normalized_path.relative_to(PROJECT_ROOT)),
                'files': files,
                'directories': directories,
                'total_files': len(files),
                'total_directories': len(directories)
            }
            
        except Exception as e:
            error_msg = str(e)
            self._log_operation('list', directory_path, False, error_msg)
            return {
                'success': False,
                'error': error_msg,
                'directory_path': directory_path
            }
    
    def delete_file(self, file_path: str, confirmation_token: str = None) -> Dict:
        """Delete文件（需要确认）"""
        try:
            # 规范化和安全检查
            normalized_path = self._normalize_path(file_path)
            self._check_file_security(normalized_path)
            
            # 检查文件是否存在
            if not normalized_path.exists():
                raise FileOperationError(f"文件不存在: {file_path}")
            
            # 这里应该验证confirmation_token，暂时跳过
            # TODO: 实现确认令牌验证机制
            
            # 创建备份
            backup_path = normalized_path.with_suffix(f"{normalized_path.suffix}.deleted.{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            shutil.move(normalized_path, backup_path)
            
            self._log_operation('delete', file_path, True)
            
            return {
                'success': True,
                'file_path': str(normalized_path.relative_to(PROJECT_ROOT)),
                'backup_path': str(backup_path.relative_to(PROJECT_ROOT)),
                'deleted': True
            }
            
        except Exception as e:
            error_msg = str(e)
            self._log_operation('delete', file_path, False, error_msg)
            return {
                'success': False,
                'error': error_msg,
                'file_path': file_path
            }
    
    def get_operation_log(self) -> List[Dict]:
        """获取操作日志"""
        return self.operation_log.copy()

# 全局文件操作管理器实例
file_manager = FileOperationManager()