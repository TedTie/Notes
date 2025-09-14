class SettingsService {
  constructor() {
    this.settings = {
      theme: 'dark',
      language: 'zh-CN',
      autoSave: true,
      autoSaveInterval: 30,
      fontSize: 14,
      fontFamily: 'Orbitron',
      apiProviders: {
        openrouter: {
          name: 'OpenRouter',
          apiKey: '',
          isConnected: false,
          models: ['GPT-5', 'Claude Sonnet 4', 'Gemini Pro Preview 2.5', 'Deepseek V3.1', 'Deepseek R1'],
          selectedModel: 'GPT-5'
        }
      },
      currentProvider: 'openrouter',
      enableNotifications: true,
      enableSounds: true,
      dataExport: false
    };
    this.listeners = new Set();
    this.isInitialized = false;
    this.abortControllers = {};
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.isInitialized = true;
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.settings));
  }

  async loadSettings() {
    try {
      // 使用 Supabase 服务
      const { settingsService: supabaseSettingsService } = await import('./supabaseService.js');
      const data = await supabaseSettingsService.getAllSettings();
      const { success, error } = { success: true, data, error: null };
      
      if (success && data) {
        // 只使用后端返回的数据，不使用默认设置覆盖
        if (data && Object.keys(data).length > 0) {
          this.settings = { ...this.settings, ...data };
        }
        this.notifyListeners();
        return this.settings;
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
    return this.settings;
  }

  /**
   * 回退加载设置（用于API包装器不可用的情况）
   * 已迁移到Supabase，不再使用API端点
   */
  async fallbackLoadSettings() {
    // TODO: 完全迁移到Supabase后可以移除此方法
    console.log('fallbackLoadSettings已弃用，使用Supabase服务');
    return { 
      success: false, 
      error: 'API端点已弃用，请使用Supabase服务' 
    };
  }

  async saveSettings(newSettings = null) {
    try {
      const settingsToSave = newSettings || this.settings;
      
      // 使用 Supabase 服务
      const { settingsService: supabaseSettingsService } = await import('./supabaseService.js');
      const data = await supabaseSettingsService.updateSettings(settingsToSave);
      const { success, error } = { success: true, data, error: null };
      
      if (success && data) {
        if (newSettings) {
          this.settings = { ...this.settings, ...newSettings };
        }
        this.notifyListeners();
        this.applySettings();
        return { success: true, message: '设置保存成功' };
      } else {
        return { success: false, error: error || '保存失败' };
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 回退保存设置（用于API包装器不可用的情况）
   * 已迁移到Supabase，不再使用API端点
   */
  async fallbackSaveSettings(settingsToSave) {
    // TODO: 完全迁移到Supabase后可以移除此方法
    console.log('fallbackSaveSettings已弃用，使用Supabase服务');
    return { 
      success: false, 
      error: 'API端点已弃用，请使用Supabase服务' 
    };
  }

  async updateSetting(key, value) {
    // 在演示模式下，直接更新本地设置
    if (demoModeService.isDemo()) {
      setNestedValue(this.settings, key, value);
      this.notifyListeners();
      this.applySettings();
      return { success: true, message: '设置更新成功（演示模式）' };
    }

    // 取消之前的请求
    if (this.abortControllers[key]) {
      this.abortControllers[key].abort();
    }
    
    // 创建新的AbortController
    this.abortControllers[key] = new AbortController();
    
    try {
      // TODO: 使用Supabase服务更新设置
      // 暂时注释掉API调用，使用本地更新
      // const response = await fetch(`/api/settings/${key}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ value }),
      //   signal: this.abortControllers[key].signal
      // });
      console.log('TODO: 实现Supabase设置服务更新单个设置');
      
      // 暂时使用本地更新
      setNestedValue(this.settings, key, value);
      this.notifyListeners();
      this.applySettings();
      return { success: true, message: '设置更新成功（本地模式）' };
    } catch (error) {
      // 忽略被取消的请求错误
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }
      console.error('更新设置失败:', error);
      
      // 在演示模式下，即使API调用失败也要更新本地设置
      if (demoModeService.isDemo()) {
        setNestedValue(this.settings, key, value);
        this.notifyListeners();
        this.applySettings();
        return { success: true, message: '设置更新成功（演示模式）' };
      }
      
      return { success: false, error: error.message };
    } finally {
      // 清理AbortController
      delete this.abortControllers[key];
    }
  }

  getSetting(key) {
    return getNestedValue(this.settings, key);
  }

  setSetting(key, value, statusCallback = null, notifyImmediately = true) {
    setNestedValue(this.settings, key, value);
    
    // 只在需要时立即通知监听器
    if (notifyImmediately) {
      this.notifyListeners();
    }
    
    this.applySettings();
    
    // 通知开始保存状态
    if (statusCallback) {
      statusCallback('saving');
    }
    
    // 将更新加入待处理队列
    this.pendingUpdates[key] = { value, statusCallback };
    this.debouncedBatchUpdate();
  }

  // 待处理的更新队列
  pendingUpdates = {};

  // 防抖批量更新方法
  debouncedBatchUpdate = this.debounce(async () => {
    const updates = { ...this.pendingUpdates };
    this.pendingUpdates = {};
    
    if (Object.keys(updates).length === 0) return;
    
    const statusCallbacks = [];
    const updatePromises = [];
    
    // 验证更新数据并分批处理
    Object.keys(updates).forEach(key => {
      const updateData = updates[key];
      const value = updateData.value || updateData; // 兼容旧格式
      const statusCallback = updateData.statusCallback;
      
      // 验证设置值
      if (!this.validateSettingValue(key, value)) {
        console.error(`Invalid setting value for ${key}:`, value);
        if (statusCallback) {
          statusCallback('error');
        }
        return;
      }
      
      if (statusCallback) {
        statusCallbacks.push(statusCallback);
      }
      
      updatePromises.push(this.updateSetting(key, value));
    });
    
    if (updatePromises.length === 0) return;
    
    try {
      // 使用 Promise.allSettled 而不是 Promise.all，确保所有请求都完成
      const results = await Promise.allSettled(updatePromises);
      
      // 检查是否有失败的更新
      const hasErrors = results.some(result => 
        result.status === 'rejected' || 
        (result.value && !result.value.success)
      );
      
      // 通知所有状态回调
      statusCallbacks.forEach(callback => {
        callback(hasErrors ? 'error' : 'saved');
      });
      
      if (!hasErrors) {
        // 延迟通知监听器，确保手动切换标记已清除
        setTimeout(() => {
          this.notifyListeners();
        }, 150);
      }
    } catch (error) {
      console.error('批量更新失败:', error);
      statusCallbacks.forEach(callback => callback('error'));
    }
  }, 300);

  // 设置值验证方法
  validateSettingValue(key, value) {
    const validators = {
      'theme': (v) => ['dark', 'light', 'auto'].includes(v),
      'language': (v) => ['zh-CN', 'en-US'].includes(v),
      'autoSaveInterval': (v) => typeof v === 'number' && v >= 10 && v <= 300,
      'fontSize': (v) => typeof v === 'number' && v >= 12 && v <= 20,
      'fontFamily': (v) => typeof v === 'string' && v.length > 0,
      'current_background_light': (v) => typeof v === 'string',
      'current_background_dark': (v) => typeof v === 'string',
      'pomodoro_work_duration': (v) => typeof v === 'number' && v >= 1 && v <= 60,
      'pomodoro_short_break_duration': (v) => typeof v === 'number' && v >= 1 && v <= 30,
      'pomodoro_long_break_duration': (v) => typeof v === 'number' && v >= 1 && v <= 60,
      'enable_auto_save': (v) => typeof v === 'boolean',
      'enable_notifications': (v) => typeof v === 'boolean',
      'enable_sound': (v) => typeof v === 'boolean'
    };
    
    const validator = validators[key];
    if (validator) {
      return validator(value);
    }
    return true; // 默认通过验证
  }

  // 防抖工具函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  applySettings() {
    // 应用主题设置
    if (this.settings.theme) {
      document.documentElement.setAttribute('data-theme', this.settings.theme);
      document.documentElement.style.setProperty('--theme', this.settings.theme);
      
      // 同步到主题系统
      window.dispatchEvent(new CustomEvent('theme-change', { 
        detail: { theme: this.settings.theme } 
      }));
    }

    // 应用字体设置
    if (this.settings.fontFamily) {
      document.documentElement.style.setProperty('--font-family', this.settings.fontFamily);
      document.body.style.setProperty('font-family', this.settings.fontFamily, 'important');
    }

    // 应用字体大小设置
    if (this.settings.fontSize) {
      document.documentElement.style.setProperty('--font-size', `${this.settings.fontSize}px`);
      document.body.style.setProperty('font-size', `${this.settings.fontSize}px`, 'important');
    }

    // 应用语言设置
    if (this.settings.language) {
      document.documentElement.setAttribute('lang', this.settings.language);
      document.documentElement.setAttribute('data-language', this.settings.language);
      
      // 同步到语言服务
      if (languageService) {
        languageService.setLanguage(this.settings.language);
      } else {
        // 动态加载语言服务
        import('../services/languageService.js').then(module => {
          module.default.setLanguage(this.settings.language);
        }).catch(err => {
          console.warn('Failed to load language service:', err);
        });
      }
    }

    // 应用通知设置
    if (this.settings.enableNotifications !== undefined) {
      document.documentElement.setAttribute('data-notifications', this.settings.enableNotifications);
    }

    // 应用声音设置
    if (this.settings.enableSounds !== undefined) {
      document.documentElement.setAttribute('data-sounds', this.settings.enableSounds);
    }

    // 触发全局设置变更事件
    window.dispatchEvent(new CustomEvent('settings-changed', { 
      detail: { settings: this.settings } 
    }));
  }

  getCurrentProvider() {
    return this.settings.currentProvider;
  }

  getApiKey(provider) {
    return this.settings.apiProviders[provider]?.apiKey || '';
  }

  getSelectedModel(provider) {
    return this.settings.apiProviders[provider]?.selectedModel || '';
  }
}

// Helper functions for nested object access
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj, path, defaultValue = null) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
}

// Global settings service instance
const settingsService = new SettingsService();

// 集成语言服务
let languageService = null;

// 延迟加载语言服务以避免循环依赖
try {
  languageService = require('../services/languageService').default;
} catch (e) {
  console.warn('LanguageService not available yet');
}

// 设置变更通知工具
export const settingsNotifier = {
  // 显示设置变更通知
  showNotification(message, type = 'info') {
    const event = new CustomEvent('setting-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  },
  
  // 显示设置保存成功通知
  showSaveSuccess() {
    this.showNotification('设置已保存并应用到全局', 'success');
  },
  
  // 显示设置保存失败通知
  showSaveError(error) {
    this.showNotification(`设置保存失败: ${error}`, 'error');
  },
  
  // 显示设置变更通知
  showSettingChanged(key, value) {
    const settingNames = {
      'theme': '主题',
      'language': '语言',
      'fontSize': '字体大小',
      'fontFamily': '字体族',
      'autoSave': '自动保存',
      'enableNotifications': '通知',
      'enableSounds': '声音'
    };
    
    const settingName = settingNames[key] || key;
    this.showNotification(`${settingName} 已更新`, 'info');
  }
};

// 增强settingsService以支持通知
const originalApplySettings = settingsService.applySettings.bind(settingsService);
settingsService.applySettings = function() {
  originalApplySettings();
  // 移除自动显示保存成功通知，避免过度通知
  // settingsNotifier.showSaveSuccess();
};

// 增强setSetting方法以支持变更通知
const originalSetSetting = settingsService.setSetting.bind(settingsService);
settingsService.setSetting = function(key, value, statusCallback = null, notifyImmediately = true) {
  const result = originalSetSetting(key, value, statusCallback, notifyImmediately);
  // 只在立即通知时显示变更通知，避免重复通知
  if (notifyImmediately) {
    settingsNotifier.showSettingChanged(key, value);
  }
  return result;
};

export default settingsService;