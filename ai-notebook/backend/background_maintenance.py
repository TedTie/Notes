#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background文件维护脚本
在应用启动时自动检查和SyncBackground文件
"""

import os
import sys
from flask import Flask

# 添加当前目录到路径
sys.path.append(os.path.dirname(__file__))

def create_app():
    """创建Flask应用实例"""
    app = Flask(__name__)
    
    # 确保instance目录存在（在非serverless环境中）
    instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
    try:
        os.makedirs(instance_dir, exist_ok=True)
    except OSError as e:
        # 在Vercel等serverless环境中，文件系统是只读的
        print(f"[MAINTENANCE] Warning: Cannot create instance directory in serverless environment: {e}")
    
    # Configuration数据库
    db_path = os.path.join(instance_dir, 'database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    print(f"数据库路径: {db_path}")
    print(f"数据库文件存在: {os.path.exists(db_path)}")
    
    # 初始化数据库
    from models import db
    db.init_app(app)
    
    return app

def run_background_maintenance():
    """运行Background文件维护"""
    print("=== Background文件维护脚本 ===")
    
    # 创建应用上下文
    app = create_app()
    
    with app.app_context():
        try:
            # 导入Sync管理器
            from utils.background_sync import sync_manager
            
            print("\n1. 验证数据库与文件系统一致性...")
            validation_result = sync_manager.validate_consistency()
            
            print(f"数据库记录数: {validation_result['db_count']}")
            print(f"文件系统文件数: {validation_result['fs_count']}")
            print(f"一致性状态: {'一致' if validation_result['is_consistent'] else '不一致'}")
            
            if validation_result['orphaned_records']:
                print(f"孤立记录: {validation_result['orphaned_records']}")
            
            if validation_result['missing_records']:
                print(f"缺失记录: {validation_result['missing_records']}")
            
            # 如果不一致，执行Sync
            if not validation_result['is_consistent']:
                print("\n2. 检测到不一致，执行Sync...")
                sync_success = sync_manager.sync_database_with_filesystem()
                
                if sync_success:
                    print("SyncSuccess！")
                    
                    # 再次验证
                    print("\n3. Sync后验证...")
                    final_validation = sync_manager.validate_consistency()
                    print(f"最终一致性状态: {'一致' if final_validation['is_consistent'] else '不一致'}")
                    print(f"最终数据库记录数: {final_validation['db_count']}")
                    print(f"最终文件系统文件数: {final_validation['fs_count']}")
                else:
                    print("SyncFailed！")
                    return False
            else:
                print("\n数据库与文件系统已保持一致，无需Sync。")
            
            print("\n=== 维护Completed ===")
            return True
            
        except Exception as e:
            print(f"维护过程中发生Error: {e}")
            return False

def main():
    """主函数"""
    success = run_background_maintenance()
    if success:
        print("Background文件维护SuccessCompleted")
        sys.exit(0)
    else:
        print("Background文件维护Failed")
        sys.exit(1)

if __name__ == "__main__":
    main()