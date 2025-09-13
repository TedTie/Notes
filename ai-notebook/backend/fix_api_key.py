import sqlite3
from utils.encryption import EncryptionManager

# 连接到正确的数据库
conn = sqlite3.connect('instance/database.db')
cursor = conn.cursor()

# 查看openrouter_api_key的当前状态
cursor.execute("SELECT key, value, is_encrypted FROM settings WHERE key = 'openrouter_api_key';")
result = cursor.fetchone()

if result:
    key, value, is_encrypted = result
    print(f"Key: {key}")
    print(f"Value: {value[:50]}...")
    print(f"Is encrypted: {is_encrypted}")
    
    # 如果没有加密，尝试解密会Failed
    if not is_encrypted:
        print("\n问题发现：API密钥未加密，但代码尝试解密它！")
        print("解决方案：使用未加密的值或者检查其他加密的API密钥")
        
        # 检查是否有其他加密的openrouter密钥
        cursor.execute("SELECT key, value, is_encrypted FROM settings WHERE key LIKE '%openrouter%' AND is_encrypted = 1;")
        encrypted_keys = cursor.fetchall()
        
        if encrypted_keys:
            print("\n找到加密的OpenRouter密钥：")
            for k, v, e in encrypted_keys:
                print(f"  {k}: {v[:50]}... (encrypted: {e})")
                
                # 尝试解密第一个找到的密钥
                if 'api' in k.lower() and 'key' in k.lower():
                    try:
                        encryption_manager = EncryptionManager()
                        decrypted = encryption_manager.decrypt(v)
                        print(f"  解密Success: {decrypted[:10]}...")
                        print(f"  建议使用这个密钥: {k}")
                        break
                    except Exception as e:
                        print(f"  解密Failed: {e}")
        else:
            print("\n没有找到加密的OpenRouter密钥")
            print("当前的openrouter_api_key值可能就是明文密钥")
            print(f"明文密钥: {value}")
else:
    print("Not Foundopenrouter_api_keySettings")

conn.close()