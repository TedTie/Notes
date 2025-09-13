#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件操作API路由
提供AI文件操作的RESTful接口
"""

from flask import Blueprint, request, jsonify, g
from utils.file_operations import file_manager
from utils.rate_limiter import rate_limit, security_check
from utils.file_security import file_operation_security_check, file_security
from utils.log_filter import create_secure_logger
import json

# 创建蓝图
file_ops_bp = Blueprint('file_operations', __name__)

# 创建安全日志记录器
logger = create_secure_logger(__name__)

@file_ops_bp.route('/api/ai/file/read', methods=['POST'])
@rate_limit('file_operation')
@file_operation_security_check('read')
def read_file():
    """读取文件内容"""
    try:
        data = g.validated_file_data
        
        file_path = data.get('file_path')
        encoding = data.get('encoding', 'utf-8')
        
        if not file_path:
            return jsonify({'error': '文件路径不能为空'}), 400
        
        # 调用文件管理器读取文件
        result = file_manager.read_file(file_path, encoding)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"读取文件时发生Error: {str(e)}")
        return jsonify({'error': f'读取文件时发生Error: {str(e)}'}), 500

@file_ops_bp.route('/api/ai/file/write', methods=['POST'])
@rate_limit('file_operation')
@file_operation_security_check('write')
def write_file():
    """写入文件内容"""
    try:
        data = g.validated_file_data
        
        file_path = data.get('file_path')
        content = data.get('content')
        encoding = data.get('encoding', 'utf-8')
        create_backup = data.get('create_backup', True)
        
        if not file_path:
            return jsonify({'error': '文件路径不能为空'}), 400
        
        if content is None:
            return jsonify({'error': '文件内容不能为空'}), 400
        
        # 调用文件管理器写入文件
        result = file_manager.write_file(file_path, content, encoding, create_backup)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"写入文件时发生Error: {str(e)}")
        return jsonify({'error': f'写入文件时发生Error: {str(e)}'}), 500

@file_ops_bp.route('/api/ai/file/create', methods=['POST'])
@rate_limit('file_operation')
@file_operation_security_check('create')
def create_file():
    """创建新文件"""
    try:
        data = g.validated_file_data
        
        file_path = data.get('file_path')
        content = data.get('content', '')
        encoding = data.get('encoding', 'utf-8')
        overwrite = data.get('overwrite', False)
        
        if not file_path:
            return jsonify({'error': '文件路径不能为空'}), 400
        
        # 调用文件管理器创建文件
        result = file_manager.create_file(file_path, content, encoding, overwrite)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"创建文件时发生Error: {str(e)}")
        return jsonify({'error': f'创建文件时发生Error: {str(e)}'}), 500

@file_ops_bp.route('/api/ai/file/list', methods=['POST'])
@rate_limit('file_operation')
@file_operation_security_check('list')
def list_directory():
    """列出目录内容"""
    try:
        data = g.validated_file_data
        
        directory_path = data.get('directory_path', '.')
        include_hidden = data.get('include_hidden', False)
        file_types = data.get('file_types', None)
        
        # 调用文件管理器列出目录
        result = file_manager.list_directory(directory_path, include_hidden, file_types)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"列出目录时发生Error: {str(e)}")
        return jsonify({'error': f'列出目录时发生Error: {str(e)}'}), 500

@file_ops_bp.route('/api/ai/file/delete', methods=['POST'])
@rate_limit('file_operation')
@file_operation_security_check('delete')
def delete_file():
    """Delete文件"""
    try:
        data = g.validated_file_data
        
        file_path = data.get('file_path')
        confirmation_token = data.get('confirmation_token')
        
        if not file_path:
            return jsonify({'error': '文件路径不能为空'}), 400
        
        # TODO: 验证确认令牌
        # if not confirmation_token:
        #     return jsonify({'error': 'Delete操作需要确认令牌'}), 400
        
        # 调用文件管理器Delete文件
        result = file_manager.delete_file(file_path, confirmation_token)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Delete文件时发生Error: {str(e)}")
        return jsonify({'error': f'Delete文件时发生Error: {str(e)}'}), 500

@file_ops_bp.route('/api/ai/file/operations-log', methods=['GET'])
@rate_limit('file_operation')
def get_operations_log():
    """获取文件操作日志"""
    try:
        # 获取操作日志
        log = file_manager.get_operation_log()
        
        return jsonify({
            'success': True,
            'operations': log,
            'total': len(log)
        }), 200
        
    except Exception as e:
        logger.error(f"获取操作日志时发生Error: {str(e)}")
        return jsonify({'error': f'获取操作日志时发生Error: {str(e)}'}), 500

@file_ops_bp.route('/api/ai/file/batch-operation', methods=['POST'])
@rate_limit('file_operation')
@file_operation_security_check('batch')
def batch_file_operation():
    """批量文件操作"""
    try:
        data = g.validated_data
        
        operations = data.get('operations', [])
        
        if not operations:
            return jsonify({'error': '操作列表不能为空'}), 400
        
        if len(operations) > file_manager.config.MAX_BATCH_FILES:
            return jsonify({
                'error': f'批量操作文件数量超过限制: {len(operations)}, 最大允许: {file_manager.config.MAX_BATCH_FILES}'
            }), 400
        
        results = []
        
        for i, operation in enumerate(operations):
            op_type = operation.get('type')
            file_path = operation.get('file_path')
            
            if not op_type or not file_path:
                results.append({
                    'index': i,
                    'success': False,
                    'error': '操作类型和文件路径不能为空'
                })
                continue
            
            try:
                if op_type == 'read':
                    encoding = operation.get('encoding', 'utf-8')
                    result = file_manager.read_file(file_path, encoding)
                elif op_type == 'write':
                    content = operation.get('content', '')
                    encoding = operation.get('encoding', 'utf-8')
                    create_backup = operation.get('create_backup', True)
                    result = file_manager.write_file(file_path, content, encoding, create_backup)
                elif op_type == 'create':
                    content = operation.get('content', '')
                    encoding = operation.get('encoding', 'utf-8')
                    overwrite = operation.get('overwrite', False)
                    result = file_manager.create_file(file_path, content, encoding, overwrite)
                elif op_type == 'delete':
                    confirmation_token = operation.get('confirmation_token')
                    result = file_manager.delete_file(file_path, confirmation_token)
                else:
                    result = {
                        'success': False,
                        'error': f'Not Supported的操作类型: {op_type}'
                    }
                
                result['index'] = i
                results.append(result)
                
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'error': str(e),
                    'file_path': file_path
                })
        
        # 统计结果
        successful = sum(1 for r in results if r.get('success', False))
        failed = len(results) - successful
        
        return jsonify({
            'success': True,
            'results': results,
            'summary': {
                'total': len(results),
                'successful': successful,
                'failed': failed
            }
        }), 200
        
    except Exception as e:
        logger.error(f"批量文件操作时发生Error: {str(e)}")
        return jsonify({'error': f'批量文件操作时发生Error: {str(e)}'}), 500