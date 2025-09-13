import sqlite3
import os

# 检查所有可能的数据库文件
db_files = [
    'ai_notebook.db', 
    'database.db',
    'instance/app.db',
    'instance/database.db', 
    'instance/notebook.db'
]

for db_file in db_files:
    if os.path.exists(db_file):
        print(f'\n=== Checking {db_file} ===')
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # 查看所有表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print('Tables:')
        for t in tables:
            print(f'  {t[0]}')
        
        # 查看settings表的结构和数据（注意表名是settings不是setting）
        if ('settings',) in tables:
            print('\nSettings table structure:')
            cursor.execute("PRAGMA table_info(settings);")
            columns = cursor.fetchall()
            for col in columns:
                print(f'  {col[1]} ({col[2]})')
            
            print('\nOpenRouter related settings:')
            cursor.execute("SELECT key, value, is_encrypted FROM settings WHERE key LIKE '%openrouter%';")
            results = cursor.fetchall()
            for r in results:
                print(f'  {r[0]}: {r[1][:50]}... (encrypted: {r[2]})')
        
        # 也检查setting表（单数形式）
        if ('setting',) in tables:
            print('\nSetting table structure:')
            cursor.execute("PRAGMA table_info(setting);")
            columns = cursor.fetchall()
            for col in columns:
                print(f'  {col[1]} ({col[2]})')
            
            print('\nOpenRouter related settings:')
            cursor.execute("SELECT key, value, is_encrypted FROM setting WHERE key LIKE '%openrouter%';")
            results = cursor.fetchall()
            for r in results:
                print(f'  {r[0]}: {r[1][:50]}... (encrypted: {r[2]})')
        
        conn.close()
    else:
        print(f'{db_file} does not exist')