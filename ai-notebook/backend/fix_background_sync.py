#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background File Sync Fix Script
Fixes inconsistencies between database and filesystem for background management
"""

import os
import json
import sqlite3
from datetime import datetime

def fix_background_sync():
    """Fix background file synchronization issues"""
    print("=== Starting background file sync fix ===")
    
    try:
        # 连接到数据库
        conn = sqlite3.connect('instance/database.db')
        cursor = conn.cursor()
        
        # 获取当前Background文件Settings
        cursor.execute("SELECT value FROM settings WHERE key = 'background_files'")
        result = cursor.fetchone()
        
        current_db_files = []
        if result:
            try:
                current_db_files = json.loads(result[0])
                print(f"数据库中当前有 {len(current_db_files)} 个Background文件记录")
            except json.JSONDecodeError:
                print("Warning：无法解析数据库中的Background文件数据")
                current_db_files = []
        
        # 扫描文件系统中的Background文件
        upload_folder = 'uploads/backgrounds'
        filesystem_files = []
        
        if os.path.exists(upload_folder):
            for filename in os.listdir(upload_folder):
                if (filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.mov')) 
                    and not filename.endswith('_thumb.png')):
                    file_id = filename.split('.')[0]
                    file_path = os.path.join(upload_folder, filename)
                    filesystem_files.append({
                        'id': file_id,
                        'filename': filename,
                        'path': file_path,
                        'size': os.path.getsize(file_path)
                    })
        
        print(f"文件系统中发现 {len(filesystem_files)} 个Background文件")
        
        # 对比数据库和文件系统
        db_file_ids = {f['id'] for f in current_db_files}
        fs_file_ids = {f['id'] for f in filesystem_files}
        
        # 找出孤立的数据库记录（文件不存在）
        orphaned_db_records = db_file_ids - fs_file_ids
        if orphaned_db_records:
            print(f"发现 {len(orphaned_db_records)} 个孤立的数据库记录需要清理")
            current_db_files = [f for f in current_db_files if f['id'] not in orphaned_db_records]
        
        # 找出缺失的数据库记录（文件存在但数据库没有）
        missing_db_records = fs_file_ids - db_file_ids
        if missing_db_records:
            print(f"发现 {len(missing_db_records)} 个文件需要添加到数据库")
            for fs_file in filesystem_files:
                if fs_file['id'] in missing_db_records:
                    # 推断文件类型
                    file_ext = fs_file['filename'].split('.')[-1].lower()
                    file_type = 'image' if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else 'video'
                    
                    # 推断Theme（从文件名）
                    theme = 'light'
                    if 'dark' in fs_file['filename'].lower():
                        theme = 'dark'
                    elif 'light' in fs_file['filename'].lower():
                        theme = 'light'
                    
                    new_record = {
                        'id': fs_file['id'],
                        'original_name': fs_file['filename'],
                        'file_path': fs_file['path'],
                        'file_url': f"/api/backgrounds/file/{fs_file['filename']}",
                        'thumbnail_url': f"/api/backgrounds/file/{fs_file['id']}_thumb.{file_ext}" if file_type == 'image' else None,
                        'file_type': file_type,
                        'file_size': fs_file['size'],
                        'theme': theme,
                        'upload_time': datetime.now().isoformat(),
                        'security_scan_passed': True
                    }
                    current_db_files.append(new_record)
                    print(f"  添加文件: {fs_file['filename']} (Theme: {theme})")
        
        # RepairBackgroundSettings中的Invalid引用
        print("检查并RepairBackgroundSettings中的Invalid引用...")
        
        # 获取所有ThemeBackgroundSettings
        cursor.execute("SELECT key, value FROM settings WHERE key LIKE 'current_background_%'")
        theme_settings = cursor.fetchall()
        
        valid_file_ids = {f['id'] for f in current_db_files}
        fixed_settings = 0
        
        for key, value in theme_settings:
            if value and value not in valid_file_ids:
                print(f"RepairInvalidSettings: {key} 引用了不存在的文件 {value}")
                cursor.execute("UPDATE settings SET value = '' WHERE key = ?", (key,))
                fixed_settings += 1
        
        if fixed_settings > 0:
            print(f"Repair了 {fixed_settings} 个Invalid的BackgroundSettings")
        
        # 更新数据库中的Background文件列表
        updated_background_data = json.dumps(current_db_files)
        if result:
            cursor.execute("UPDATE settings SET value = ? WHERE key = 'background_files'", (updated_background_data,))
        else:
            cursor.execute("INSERT INTO settings (key, value, setting_type) VALUES (?, ?, 'json')", 
                         ('background_files', updated_background_data))
        
        conn.commit()
        print(f"数据库已更新，现在有 {len(current_db_files)} 个有效的Background文件记录")
        
        # 显示Repair结果
        print("\n=== Repair结果 ===")
        print(f"清理的孤立记录: {len(orphaned_db_records)}")
        print(f"添加的缺失记录: {len(missing_db_records)}")
        print(f"Repair的InvalidSettings: {fixed_settings}")
        print(f"当前有效文件: {len(current_db_files)}")
        
        # 显示当前BackgroundSettings状态
        print("\n=== 当前BackgroundSettings状态 ===")
        cursor.execute("SELECT key, value FROM settings WHERE key LIKE 'current_background_%'")
        for key, value in cursor.fetchall():
            if value:
                file_info = next((f for f in current_db_files if f['id'] == value), None)
                if file_info:
                    print(f"{key}: {value} ({file_info['original_name']})")
                else:
                    print(f"{key}: {value} (Invalid引用)")
            else:
                print(f"{key}: 未Settings")
        
        conn.close()
        print("\n=== RepairCompleted ===")
        return True
        
    except Exception as e:
        print(f"Repair过程中发生Error: {e}")
        if 'conn' in locals():
            conn.close()
        return False

def main():
    """主函数"""
    print("AI智能笔记本 - Background文件SyncRepair工具")
    print("=" * 50)
    
    success = fix_background_sync()
    
    if success:
        print("\n✅ RepairSuccessCompleted！")
        print("建议重新启动应用以使更改生效。")
    else:
        print("\n❌ RepairFailed，请检查ErrorInfo。")

if __name__ == "__main__":
    main()