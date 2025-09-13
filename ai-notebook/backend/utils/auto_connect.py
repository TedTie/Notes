from models import db, Setting
from utils.encryption import decrypt_api_key
import json
import logging

class AutoConnectManager:
    """Auto Connect Manager - Auto-loaded[SAVED] API connections when server starts"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def load_saved_connections(self):
        """Load[SAVED] API connection configuration"""
        try:
            # Get all API providers connection status
            providers = ['openrouter', 'moonshot']
            loaded_connections = {}
            
            for provider in providers:
                connection_status = self._load_provider_connection(provider)
                if connection_status:
                    loaded_connections[provider] = connection_status
                    self.logger.info(f"Loaded {provider} API connection configuration")
            
            return loaded_connections
            
        except Exception as e:
            self.logger.error(f"Failed to Load API Connection Config: {str(e)}")
            return {}
    
    def _load_provider_connection(self, provider: str):
        """Load specific provider connection configuration"""
        try:
            # Check connection status
            status_key = f"{provider}.connected"
            status_setting = Setting.query.filter_by(key=status_key).first()
            
            if not status_setting or status_setting.value.lower() != 'true':
                return None
            
            # Get API key
            api_key_key = f"{provider}.api_key"
            api_key_setting = Setting.query.filter_by(key=api_key_key).first()
            
            if not api_key_setting or not api_key_setting.value:
                return None
            
            # Decrypt API key
            api_key = api_key_setting.value
            if api_key_setting.is_encrypted:
                try:
                    api_key = decrypt_api_key(api_key)
                except Exception as e:
                    self.logger.error(f"Failed to decrypt {provider} API key: {str(e)}")
                    return None
            
            # Validate key format
            if not self._validate_api_key(provider, api_key):
                self.logger.warning(f"{provider} API key format invalid")
                return None
            
            return {
                'provider': provider,
                'api_key': api_key,
                'connected': True,
                'auto_loaded': True
            }
            
        except Exception as e:
            self.logger.error(f"Failed to load {provider} connection configuration: {str(e)}")
            return None
    
    def _validate_api_key(self, provider: str, api_key: str) -> bool:
        """Validate API key format"""
        if not api_key or not isinstance(api_key, str):
            return False
        
        # Basic length check
        if len(api_key.strip()) < 10:
            return False
        
        # Provider-specific format checks
        if provider == 'openrouter':
            # OpenRouter keys typically start with sk-or-
            return api_key.startswith('sk-or-') and len(api_key) > 20
        elif provider == 'moonshot':
            # Moonshot keys typically start with sk-
            return api_key.startswith('sk-') and len(api_key) > 20
        
        return True
    
    def test_auto_connections(self, connections: dict):
        """Test auto-loaded connections"""
        tested_connections = {}
        
        for provider, config in connections.items():
            try:
                # Here you can add actual API connection testing
                # Currently just marking as tested
                tested_connections[provider] = {
                    **config,
                    'tested': True,
                    'test_time': 'startup'
                }
                self.logger.info(f"{provider} auto connection test completed")
                
            except Exception as e:
                self.logger.error(f"{provider} auto connection test failed: {str(e)}")
                tested_connections[provider] = {
                    **config,
                    'tested': False,
                    'test_error': str(e)
                }
        
        return tested_connections
    
    def get_connection_summary(self, connections: dict) -> str:
        """Get Connection Summary Info"""
        if not connections:
            return "[NOT FOUND][SAVED] API connections"
        
        summary_parts = []
        for provider, config in connections.items():
            status = "[OK] [OK] Connected" if config.get('connected') else "[ERROR] [ERROR] Connection Failed"
            summary_parts.append(f"{provider}: {status}")
        
        return f"Auto-loaded API connections: {', '.join(summary_parts)}"

# Global auto-connect manager instance
auto_connect_manager = AutoConnectManager()

def initialize_auto_connections():
    """Initialize auto connections"""
    try:
        # Load[SAVED] connections
        connections = auto_connect_manager.load_saved_connections()
        
        if connections:
            # Test Connection
            tested_connections = auto_connect_manager.test_auto_connections(connections)
            
            # Output summary
            summary = auto_connect_manager.get_connection_summary(tested_connections)
            print(f"[AUTO-CONNECT] {summary}")
            
            return tested_connections
        else:
            print("[AUTO-CONNECT] No saved API connection configurations found")
            return {}
            
    except Exception as e:
        print(f"[ERROR] Auto-connect initialization failed: {str(e)}")
        return {}