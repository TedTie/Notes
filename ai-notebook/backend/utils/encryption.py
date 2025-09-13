from cryptography.fernet import Fernet
import os
import base64
from hashlib import sha256

class EncryptionManager:
    """加密管理器 - 用于API密钥的安全存储"""
    
    def __init__(self):
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
    
    def _get_or_create_key(self):
        """获取或创建加密密钥"""
        # 从环境变量获取主密钥
        master_key = os.getenv('ENCRYPTION_MASTER_KEY')
        if not master_key:
            # 如果没有Settings环境变量，使用默认值（生产环境中应该Settings）
            master_key = 'default-master-key-change-in-production'
        
        # 使用主密钥生成Fernet密钥
        key_material = sha256(master_key.encode()).digest()
        return base64.urlsafe_b64encode(key_material)
    
    def encrypt(self, plaintext: str) -> str:
        """加密字符串"""
        if not plaintext:
            return plaintext
        
        try:
            encrypted_bytes = self.cipher.encrypt(plaintext.encode())
            return base64.urlsafe_b64encode(encrypted_bytes).decode()
        except Exception as e:
            raise Exception(f"加密Failed: {str(e)}")
    
    def decrypt(self, encrypted_text: str) -> str:
        """解密字符串"""
        if not encrypted_text:
            return encrypted_text
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_text.encode())
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except Exception as e:
            raise Exception(f"解密Failed: {str(e)}")
    
    def is_encrypted(self, text: str) -> bool:
        """检查文本是否已加密"""
        try:
            # 尝试解密，如果Success说明是加密的
            self.decrypt(text)
            return True
        except:
            return False

# 全局加密管理器实例
encryption_manager = EncryptionManager()

def encrypt_api_key(api_key: str) -> str:
    """加密API密钥"""
    return encryption_manager.encrypt(api_key)

def decrypt_api_key(encrypted_key: str) -> str:
    """解密API密钥"""
    return encryption_manager.decrypt(encrypted_key)

def is_api_key_encrypted(key: str) -> bool:
    """检查API密钥是否已加密"""
    return encryption_manager.is_encrypted(key)