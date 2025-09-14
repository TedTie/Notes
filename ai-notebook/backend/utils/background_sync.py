#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background files sync tool
Ensures consistency between database records and filesystem
"""

import os
import json
import sqlite3
from datetime import datetime
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

# 延迟导入，避免循环导入
def get_db_and_setting():
    """Get database and Setting model"""
    from models import db, Setting
    return db, Setting

class BackgroundSyncManager:
    """Background files sync manager"""
    
    def __init__(self, upload_folder='uploads/backgrounds'):
        self.upload_folder = upload_folder
        # 检查是否在Vercel环境中（只读文件系统）
        try:
            os.makedirs(upload_folder, exist_ok=True)
        except OSError as e:
            # 在Vercel等serverless环境中，文件系统是只读的
            print(f"[SYNC] Warning: Cannot create upload directory in serverless environment: {e}")
            # 在serverless环境中，我们不需要本地文件存储
    
    def get_background_files_from_db(self):
        """Get background files list from database"""
        try:
            db, Setting = get_db_and_setting()
            backgrounds_setting = Setting.query.filter_by(key='background_files').first()
            if backgrounds_setting and backgrounds_setting.value:
                return json.loads(backgrounds_setting.value)
            return []
        except Exception as e:
            print(f"[SYNC] Failed to get background files list from database: {e}")
            return []
    
    def get_background_files_from_filesystem(self):
        """Get background files list from filesystem"""
        try:
            if not os.path.exists(self.upload_folder):
                return []
            
            files = []
            for filename in os.listdir(self.upload_folder):
                if (filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.mov')) 
                    and not filename.endswith('_thumb.png')):
                    file_id = filename.split('.')[0]
                    file_path = os.path.join(self.upload_folder, filename)
                    files.append({
                        'id': file_id,
                        'filename': filename,
                        'path': file_path,
                        'size': os.path.getsize(file_path)
                    })
            return files
        except Exception as e:
            print(f"[SYNC] Failed to get background files list from filesystem: {e}")
            return []
    
    def sync_database_with_filesystem(self):
        """Enhanced sync between database and filesystem"""
        print("[SYNC] Starting enhanced sync between database and filesystem...")
        
        try:
            # 获取数据库和文件系统中的文件
            db_files = self.get_background_files_from_db()
            fs_files = self.get_background_files_from_filesystem()
            
            db_file_ids = {f['id'] for f in db_files}
            fs_file_ids = {f['id'] for f in fs_files}
            
            print(f"[SYNC] Database has {len(db_files)} records")
            print(f"[SYNC] Filesystem has {len(fs_files)} files")
            
            # Find database records that need to be deleted (files don't exist)
            orphaned_records = db_file_ids - fs_file_ids
            if orphaned_records:
                print(f"[SYNC] Found {len(orphaned_records)} orphaned database records")
                db_files = [f for f in db_files if f['id'] not in orphaned_records]
            
            # Find file records that need to be added (not in database)
            missing_records = fs_file_ids - db_file_ids
            if missing_records:
                print(f"[SYNC] Found {len(missing_records)} missing database records")
                for fs_file in fs_files:
                    if fs_file['id'] in missing_records:
                        # 创建新的数据库记录
                        file_ext = fs_file['filename'].split('.')[-1].lower()
                        file_type = 'image' if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else 'video'
                        
                        # Try to infer theme from filename
                        theme = 'light'  # Default theme
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
                        db_files.append(new_record)
            
            # 更新数据库
            self.save_background_files_to_db(db_files)
            
            # Cleanup invalid background settings
            valid_file_ids = {bg['id'] for bg in db_files}
            self.cleanup_invalid_background_settings(valid_file_ids)
            
            print(f"[SYNC] Sync completed, database now has {len(db_files)} valid records")
            return True
            
        except Exception as e:
            print(f"[SYNC] Sync failed: {e}")
            return False
    
    def save_background_files_to_db(self, background_files):
        """Save background files list to database"""
        try:
            db, Setting = get_db_and_setting()
            backgrounds_setting = Setting.query.filter_by(key='background_files').first()
            if backgrounds_setting:
                backgrounds_setting.value = json.dumps(background_files)
            else:
                backgrounds_setting = Setting(key='background_files', value=json.dumps(background_files))
                db.session.add(backgrounds_setting)
            
            db.session.commit()
            print(f"[SYNC] Database update successful")
            
        except Exception as e:
            db.session.rollback()
            print(f"[SYNC] Database update failed: {e}")
            raise
    
    def cleanup_invalid_background_settings(self, valid_file_ids):
        """Cleanup invalid background settings"""
        try:
            db, Setting = get_db_and_setting()
            # Check light theme background settings
            light_bg_setting = Setting.query.filter_by(key='current_background_light').first()
            if light_bg_setting and light_bg_setting.value and light_bg_setting.value not in valid_file_ids:
                print(f"[SYNC] Cleanup invalid light theme background settings: {light_bg_setting.value}")
                light_bg_setting.value = ''
            
            # Check dark theme background settings
            dark_bg_setting = Setting.query.filter_by(key='current_background_dark').first()
            if dark_bg_setting and dark_bg_setting.value and dark_bg_setting.value not in valid_file_ids:
                print(f"[SYNC] Cleanup invalid dark theme background settings: {dark_bg_setting.value}")
                dark_bg_setting.value = ''
            
            # Cleanup old background settings
            old_bg_setting = Setting.query.filter_by(key='current_background').first()
            if old_bg_setting and old_bg_setting.value and old_bg_setting.value not in valid_file_ids:
                print(f"[SYNC] Delete invalid old background settings: {old_bg_setting.value}")
                db.session.delete(old_bg_setting)
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            print(f"[SYNC] Background settings cleanup failed: {e}")
    
    def add_background_file(self, file_info):
        """Add background file record (called during upload)"""
        try:
            background_files = self.get_background_files_from_db()
            background_files.append(file_info)
            self.save_background_files_to_db(background_files)
            print(f"[SYNC] Add background file record: {file_info['id']}")
            return True
        except Exception as e:
            print(f"[SYNC] Failed to add background file record: {e}")
            return False
    
    def remove_background_file(self, file_id):
        """Delete background file record and physical file (called during deletion)"""
        try:
            background_files = self.get_background_files_from_db()
            
            # 找到要Delete的文件
            file_to_delete = None
            for bg in background_files:
                if bg['id'] == file_id:
                    file_to_delete = bg
                    break
            
            if not file_to_delete:
                print(f"[SYNC] File record does not exist: {file_id}")
                return False
            
            # Delete物理文件
            try:
                if os.path.exists(file_to_delete['file_path']):
                    os.remove(file_to_delete['file_path'])
                    print(f"[SYNC] Delete physical file: {file_to_delete['file_path']}")
                
                # Delete缩略图
                if file_to_delete.get('thumbnail_url'):
                    thumbnail_filename = file_to_delete['thumbnail_url'].split('/')[-1]
                    thumbnail_path = os.path.join(self.upload_folder, thumbnail_filename)
                    if os.path.exists(thumbnail_path):
                        os.remove(thumbnail_path)
                        print(f"[SYNC] Delete thumbnail: {thumbnail_path}")
            except Exception as e:
                print(f"[SYNC] Failed to delete physical file: {e}")
            
            # 从数据库记录中移除
            background_files = [bg for bg in background_files if bg['id'] != file_id]
            self.save_background_files_to_db(background_files)
            
            # 清理相关的BackgroundSettings
            self.cleanup_invalid_background_settings({bg['id'] for bg in background_files})
            
            print(f"[SYNC] Delete background file record: {file_id}")
            return True
            
        except Exception as e:
            print(f"[SYNC] Failed to delete background file record: {e}")
            return False
    
    def validate_consistency(self):
        """Validate consistency between database and filesystem"""
        db_files = self.get_background_files_from_db()
        fs_files = self.get_background_files_from_filesystem()
        
        db_file_ids = {f['id'] for f in db_files}
        fs_file_ids = {f['id'] for f in fs_files}
        
        orphaned_records = db_file_ids - fs_file_ids
        missing_records = fs_file_ids - db_file_ids
        
        is_consistent = len(orphaned_records) == 0 and len(missing_records) == 0
        
        return {
            'is_consistent': is_consistent,
            'db_count': len(db_files),
            'fs_count': len(fs_files),
            'orphaned_records': list(orphaned_records),
            'missing_records': list(missing_records)
        }

# Create global sync manager instance
sync_manager = BackgroundSyncManager()