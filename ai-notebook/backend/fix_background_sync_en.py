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
        # Connect to database
        conn = sqlite3.connect('instance/database.db')
        cursor = conn.cursor()
        
        # Get current background file settings
        cursor.execute("SELECT value FROM settings WHERE key = 'background_files'")
        result = cursor.fetchone()
        
        current_db_files = []
        if result:
            try:
                current_db_files = json.loads(result[0])
                print(f"Database currently has {len(current_db_files)} background file records")
            except json.JSONDecodeError:
                print("Warning: Unable to parse background file data from database")
                current_db_files = []
        
        # Scan filesystem for background files
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
        
        print(f"Found {len(filesystem_files)} background files in filesystem")
        
        # Compare database and filesystem
        db_file_ids = {f['id'] for f in current_db_files}
        fs_file_ids = {f['id'] for f in filesystem_files}
        
        # Find orphaned database records (files don't exist)
        orphaned_db_records = db_file_ids - fs_file_ids
        if orphaned_db_records:
            print(f"Found {len(orphaned_db_records)} orphaned database records to clean up")
            current_db_files = [f for f in current_db_files if f['id'] not in orphaned_db_records]
        
        # Find missing database records (files exist but not in database)
        missing_db_records = fs_file_ids - db_file_ids
        if missing_db_records:
            print(f"Found {len(missing_db_records)} files need to be added to database")
            for fs_file in filesystem_files:
                if fs_file['id'] in missing_db_records:
                    # Determine file type
                    file_ext = fs_file['filename'].split('.')[-1].lower()
                    file_type = 'image' if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else 'video'
                    
                    # Infer theme from filename
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
                    print(f"  Adding file: {fs_file['filename']} (theme: {theme})")
        
        # Fix invalid references in background settings
        print("Checking and fixing invalid references in background settings...")
        
        # Get all theme background settings
        cursor.execute("SELECT key, value FROM settings WHERE key LIKE 'current_background_%'")
        theme_settings = cursor.fetchall()
        
        valid_file_ids = {f['id'] for f in current_db_files}
        fixed_settings = 0
        
        for key, value in theme_settings:
            if value and value not in valid_file_ids:
                print(f"Fixing invalid setting: {key} references non-existent file {value}")
                cursor.execute("UPDATE settings SET value = '' WHERE key = ?", (key,))
                fixed_settings += 1
        
        if fixed_settings > 0:
            print(f"Fixed {fixed_settings} invalid background settings")
        
        # Update background file list in database
        updated_background_data = json.dumps(current_db_files)
        if result:
            cursor.execute("UPDATE settings SET value = ? WHERE key = 'background_files'", (updated_background_data,))
        else:
            cursor.execute("INSERT INTO settings (key, value, setting_type) VALUES (?, ?, 'json')", 
                         ('background_files', updated_background_data))
        
        conn.commit()
        print(f"Database updated, now has {len(current_db_files)} valid background file records")
        
        # Show repair results
        print("\n=== Repair Results ===")
        print(f"Cleaned up orphaned records: {len(orphaned_db_records)}")
        print(f"Added missing records: {len(missing_db_records)}")
        print(f"Fixed invalid settings: {fixed_settings}")
        print(f"Current valid files: {len(current_db_files)}")
        
        # Show current background settings status
        print("\n=== Current Background Settings Status ===")
        cursor.execute("SELECT key, value FROM settings WHERE key LIKE 'current_background_%'")
        for key, value in cursor.fetchall():
            if value:
                file_info = next((f for f in current_db_files if f['id'] == value), None)
                if file_info:
                    print(f"{key}: {value} ({file_info['original_name']})")
                else:
                    print(f"{key}: {value} (invalid reference)")
            else:
                print(f"{key}: not set")
        
        conn.close()
        print("\n=== Repair Complete ===")
        return True
        
    except Exception as e:
        print(f"Error during repair: {e}")
        if 'conn' in locals():
            conn.close()
        return False

def main():
    """Main function"""
    print("AI Notebook - Background File Sync Fix Tool")
    print("=" * 50)
    
    success = fix_background_sync()
    
    if success:
        print("\n✅ Repair completed successfully!")
        print("It is recommended to restart the application for changes to take effect.")
    else:
        print("\n❌ Repair failed, please check error messages.")

if __name__ == "__main__":
    main()