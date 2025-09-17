<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import settingsService from '../services/settingsService'
import languageService from '../services/languageService'
import { useTheme } from '../composables/useTheme'
import TimeUtils from '../utils/timeUtils'
import { fileService } from '../services/supabaseService'
import fileUploadService from '../services/fileUploadService'

interface ApiProvider {
  name: string
  apiKey: string
  isConnected: boolean
  models: string[]
  selectedModel: string
}

interface Settings {
  theme: 'dark' | 'light' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  autoSaveInterval: number
  fontSize: number
  fontFamily: string
  apiProviders: {
    openrouter: ApiProvider
  }
  currentProvider: 'openrouter'
  enableNotifications: boolean
  enableSounds: boolean
  dataExport: boolean
  aiFileOperationsEnabled: boolean
  aiWebSearchEnabled: boolean
  aiSearchEngine: 'duckduckgo' | 'serper'
  serperApiKey: string
}

const settings = ref<Settings>({
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
      models: ['GPT-5 Chat', 'Claude Sonnet 4', 'Deepseek V3', 'Deepseek R1', 'Gemini'],
      selectedModel: 'GPT-5 Chat'
    }
  },
  currentProvider: 'openrouter',
  enableNotifications: true,
  enableSounds: true,
  dataExport: false,
  aiFileOperationsEnabled: false,
  aiWebSearchEnabled: false,
  aiSearchEngine: 'duckduckgo',
  serperApiKey: ''
})

const isLoading = ref(false)
const showApiKey = ref(false)
const showSerperApiKey = ref(false)
const activeTab = ref('general')
const currentLanguage = ref(languageService.getLanguage())

// 自动保存状态管理
const autoSaveStatus = ref('idle') // 'idle', 'saving', 'saved', 'error'
const lastSaveTime = ref(null)
const saveConfirmation = ref(false)

// 存储原始设置状态用于重置选项功能
const originalSettings = ref({})
const savedSettings = ref({})

// 背景管理相关
const backgroundFiles = ref([])
const selectedBackground = ref(null)
const fileInput = ref(null)
const isUploading = ref(false)
// 主题管理
const { currentTheme: currentThemeName, isDarkMode } = useTheme()

// 根据当前主题初始化背景标签页
const activeBackgroundTab = ref(isDarkMode.value ? 'dark' : 'light')

// 监听主题变化，同步背景标签页并加载对应背景 - 修复竞态条件
watch(isDarkMode, async (newValue) => {
  const newTheme = newValue ? 'dark' : 'light'
  console.log(`[SETTINGS] Theme changed to ${newTheme}`)
  
  // 延迟加载背景，确保主题状态完全更新
  setTimeout(async () => {
    activeBackgroundTab.value = newTheme
    console.log(`[SETTINGS] Background tab synchronized to ${newTheme}, loading background...`)
    await loadCurrentBackground()
  }, 50) // 50ms 延迟确保状态同步
})

// 监听主题标签页切换，重新加载对应主题的背景设置
watch(activeBackgroundTab, async (newTab, oldTab) => {
  if (newTab !== oldTab) {
    console.log(`[SETTINGS] Background tab changed from ${oldTab} to ${newTab}`)
    await loadCurrentBackground()
  }
})

// 根据主题筛选背景文件
const filteredBackgroundFiles = computed(() => {
  console.log('filteredBackgroundFiles computed:')
  console.log('activeBackgroundTab.value:', activeBackgroundTab.value)
  console.log('backgroundFiles.value:', backgroundFiles.value)
  
  const filtered = backgroundFiles.value.filter(file => {
    console.log(`File ${file.name}: theme=${file.theme}, matches=${!file.theme || file.theme === activeBackgroundTab.value}`)
    // 如果文件没有主题标记，则在两个主题中都显示
    if (!file.theme) return true
    return file.theme === activeBackgroundTab.value
  })
  
  console.log('filtered result:', filtered)
  return filtered
})

const tabs = computed(() => {
  // Depend on currentLanguage to trigger reactivity
  currentLanguage.value
  return [
    { 
      id: 'general', 
      label: languageService.t('general_settings'), 
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>` 
    },
    { 
      id: 'appearance', 
      label: languageService.t('appearance_settings'), 
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path></svg>` 
    },
    { 
      id: 'pomodoro', 
      label: languageService.t('pomodoro_settings'), 
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` 
    },
    { 
      id: 'ai', 
      label: languageService.t('ai_settings'), 
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>` 
    },
    { 
      id: 'data', 
      label: languageService.t('data_management'), 
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>` 
    },
    { 
      id: 'about', 
      label: languageService.t('about'), 
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` 
    }
  ]
})

// 动态标签
const labels = computed(() => {
  // Depend on currentLanguage to trigger reactivity
  currentLanguage.value
  return {
    generalSettings: languageService.t('general_settings'),
    appearanceSettings: languageService.t('appearance_settings'),
    aiSettings: languageService.t('ai_settings'),
    dataManagement: languageService.t('data_management'),
    resetSettings: languageService.t('reset_settings')
  }
})

const themes = computed(() => {
  // Depend on currentLanguage to trigger reactivity
  currentLanguage.value
  return [
    { value: 'dark', label: languageService.t('dark_theme'), description: languageService.t('dark_theme_cyber') },
    { value: 'light', label: languageService.t('light_theme'), description: languageService.t('light_theme_clean') },
    { value: 'auto', label: languageService.t('auto_theme'), description: languageService.t('auto_theme_system') }
  ]
})

const languages = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' }
]

const fontFamilies = computed(() => {
  // Depend on currentLanguage to trigger reactivity
  currentLanguage.value
  return [
    { value: 'Orbitron', label: languageService.t('orbitron_font_cyber') },
    { value: 'Fira Code', label: languageService.t('fira_code_programming') },
    { value: 'system-ui', label: languageService.t('system_font_default') }
  ]
})

const availableProviders = computed(() => {
  // Depend on currentLanguage to trigger reactivity
  currentLanguage.value
  return [
    { 
      key: 'openrouter', 
      name: 'OpenRouter', 
      description: languageService.t('openrouter_provider_desc'),
      models: ['GPT-5 Chat', 'Claude Sonnet 4', 'Deepseek V3', 'Deepseek R1', 'Gemini']
    }
  ]
})

const loadSettings = async () => {
  isLoading.value = true
  try {
    const data = await settingsService.loadSettings()
    if (data) {
      // 确保apiProviders结构完整
      if (!data.apiProviders) {
        data.apiProviders = {}
      }
      
      // 确保每个provider都有完整的结构
      const defaultProviders = {
        openrouter: {
          name: 'OpenRouter',
          apiKey: '',
          isConnected: false,
          models: ['GPT-5 Chat', 'Claude Sonnet 4', 'Deepseek V3', 'Deepseek R1', 'Gemini'],
          selectedModel: 'GPT-5 Chat'
        }
      }
      
      // 合并默认配置和加载的配置
      Object.keys(defaultProviders).forEach(key => {
        if (!data.apiProviders[key]) {
          data.apiProviders[key] = defaultProviders[key]
        } else {
          // 确保所有必需的属性都存在
          data.apiProviders[key] = { ...defaultProviders[key], ...data.apiProviders[key] }
        }
      })
      
      Object.assign(settings.value, data)
      // 保存原始设置状态，用于重置选项功能
      originalSettings.value = JSON.parse(JSON.stringify(data))
      savedSettings.value = JSON.parse(JSON.stringify(data))
    }
  } catch (error) {
    console.error(languageService.t('loading_failed'), error)
  } finally {
    isLoading.value = false
  }
}

// 手动保存函数已移除，现在使用自动保存

// 重置选项 - 恢复到保存后的状态
const resetToOriginal = async () => {
  console.log('resetToOriginal called')
  console.log('originalSettings:', originalSettings.value)
  console.log('current settings before reset:', settings.value)
  
  if (Object.keys(originalSettings.value).length > 0) {
    // 设置重置标记
    isResetting = true
    
    try {
      // 立即重置到原始状态，不触发保存
      const original = JSON.parse(JSON.stringify(originalSettings.value))
      console.log('original to restore:', original)
      
      // 保存当前主题设置，重置时不改变主题
      const currentTheme = settings.value.theme
      
      // 逐个属性赋值，确保Vue响应式系统正确更新，但排除主题设置
      Object.keys(original).forEach(key => {
        // 跳过主题设置，保持用户当前选择的主题
        if (key === 'theme') {
          return
        }
        
        if (typeof original[key] === 'object' && original[key] !== null && !Array.isArray(original[key])) {
          // 对于嵌套对象，递归赋值
          Object.assign(settings.value[key], original[key])
        } else {
          // 对于基本类型，直接赋值
          settings.value[key] = original[key]
        }
      })
      
      // 确保主题设置保持不变
      settings.value.theme = currentTheme
      
      console.log('settings after reset:', settings.value)
      
      // 等待Vue更新DOM
      await nextTick()
      
      // 立即应用到全局，但不保存到后端，同时保持当前主题
      const settingsToApply = { ...original }
      delete settingsToApply.theme // 移除主题设置，保持当前主题
      settingsService.settings = { ...settingsService.settings, ...settingsToApply }
      settingsService.applySettings()
      
      showNotification(languageService.t('reset_to_original_success'), 'success')
    } finally {
      // 重置完成后清除标记
      setTimeout(() => {
        isResetting = false
        console.log('isResetting flag cleared')
      }, 100)
    }
  } else {
    console.log('No original settings to restore')
    showNotification(languageService.t('no_original_settings'), 'warning')
  }
}

// 恢复出厂设置 - 恢复到默认值 - 使用Supabase服务
const resetToFactory = async () => {
  if (!confirm(languageService.t('confirm_factory_reset'))) return
  
  isResetting = true
  updateAutoSaveStatus('saving')
  
  try {
    // 使用Supabase服务恢复出厂设置
    await settingsService.factoryReset()
    
    // 保存当前主题设置
    const currentTheme = settings.value.theme
    
    // 重新加载设置
    await loadSettings()
    
    // 恢复主题设置，保持用户当前选择的主题
    settings.value.theme = currentTheme
    await settingsService.updateSetting('theme', currentTheme)
    
    // 清空原始设置记录
    originalSettings.value = {}
    showNotification(languageService.t('factory_reset_success'), 'success')
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error(languageService.t('factory_reset_failed'), error)
    showNotification(languageService.t('factory_reset_failed'), 'error')
    updateAutoSaveStatus('error')
  } finally {
    // 延迟清除重置标记
    setTimeout(() => {
      isResetting = false
    }, 200)
  }
}

// 添加标记以防止重置时触发保存
let isResetting = false
// 添加标记以防止初始化时触发保存
let isInitializing = true

// Watch for settings changes and auto-save them
watch(settings, async (newSettings, oldSettings) => {
  if (isResetting || isInitializing) return
  
  // 记录原始设置状态，用于重置功能
  if (Object.keys(originalSettings.value).length === 0 && oldSettings) {
    originalSettings.value = JSON.parse(JSON.stringify(oldSettings))
    console.log('Original settings recorded:', originalSettings.value)
  }
  
  // 启用自动保存功能
  try {
    updateAutoSaveStatus('saving')
    const result = await settingsService.saveSettings(newSettings)
    if (result.success) {
      updateAutoSaveStatus('saved')
      savedSettings.value = JSON.parse(JSON.stringify(newSettings))
    } else {
      updateAutoSaveStatus('error')
    }
  } catch (error) {
    console.error('Auto-save failed:', error)
    updateAutoSaveStatus('error')
  }
}, { deep: true })

// 单独监听语言变化，确保实时切换
watch(() => settings.value.language, (newLanguage, oldLanguage) => {
  if (isResetting || isInitializing) return
  
  // 记录原始语言设置
  if (!originalSettings.value.language && oldLanguage) {
    originalSettings.value.language = oldLanguage
  }
  
  if (newLanguage !== languageService.getLanguage()) {
    languageService.setLanguage(newLanguage)
    // 语言变化需要立即保存
    settingsService.setSetting('language', newLanguage, updateAutoSaveStatus)
  }
})

// Watch for API provider changes
watch(() => settings.value.apiProviders, (newProviders, oldProviders) => {
  if (isResetting || isInitializing) return
  
  // 记录原始API提供商设置
  if (!originalSettings.value.apiProviders && oldProviders) {
    originalSettings.value.apiProviders = JSON.parse(JSON.stringify(oldProviders))
  }
  
  // API提供商变化需要立即保存和应用
  settingsService.setSetting('apiProviders.openrouter', newProviders.openrouter, updateAutoSaveStatus)
  
  // 立即更新全局设置
  settingsService.settings.apiProviders = { ...newProviders }
  settingsService.applySettings()
}, { deep: true })

// Watch for current provider changes
watch(() => settings.value.currentProvider, (newProvider, oldProvider) => {
  if (isResetting || isInitializing) return
  
  // 记录原始当前提供商设置
  if (!originalSettings.value.currentProvider && oldProvider) {
    originalSettings.value.currentProvider = oldProvider
  }
  
  // 当前提供商变化需要立即保存和应用
  settingsService.setSetting('currentProvider', newProvider, updateAutoSaveStatus)
  
  // 立即更新全局设置
  settingsService.settings.currentProvider = newProvider
  settingsService.applySettings()
})

// 添加标记以防止手动切换时的循环触发
let isManualToggle = false

// 开关按钮处理函数 - 简化并确保正确触发
const toggleAutoSave = async () => {
  const newValue = !settings.value.autoSave
  settings.value.autoSave = newValue
  
  try {
    await settingsService.updateSetting('autoSave', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update autoSave:', error)
    // 恢复原始值
    settings.value.autoSave = !newValue
    updateAutoSaveStatus('error')
  }
}

const toggleNotifications = async () => {
  const newValue = !settings.value.enableNotifications
  settings.value.enableNotifications = newValue
  
  try {
    await settingsService.updateSetting('enableNotifications', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update enableNotifications:', error)
    // 恢复原始值
    settings.value.enableNotifications = !newValue
    updateAutoSaveStatus('error')
  }
}

const toggleSounds = async () => {
  const newValue = !settings.value.enableSounds
  settings.value.enableSounds = newValue
  
  try {
    await settingsService.updateSetting('enableSounds', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update enableSounds:', error)
    // 恢复原始值
    settings.value.enableSounds = !newValue
    updateAutoSaveStatus('error')
  }
}

// 移除了移动端侧边栏相关的函数

const toggleFileOperations = async () => {
  const newValue = !settings.value.aiFileOperationsEnabled
  settings.value.aiFileOperationsEnabled = newValue
  
  try {
    await settingsService.updateSetting('aiFileOperationsEnabled', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update aiFileOperationsEnabled:', error)
    // 恢复原始值
    settings.value.aiFileOperationsEnabled = !newValue
    updateAutoSaveStatus('error')
  }
}

const toggleWebSearch = async () => {
  const newValue = !settings.value.aiWebSearchEnabled
  settings.value.aiWebSearchEnabled = newValue
  
  try {
    await settingsService.updateSetting('aiWebSearchEnabled', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update aiWebSearchEnabled:', error)
    // 恢复原始值
    settings.value.aiWebSearchEnabled = !newValue
    updateAutoSaveStatus('error')
  }
}

const togglePomodoroNotifications = async () => {
  const newValue = !settings.value.pomodoroNotificationsEnabled
  settings.value.pomodoroNotificationsEnabled = newValue
  
  try {
    await settingsService.updateSetting('pomodoroNotificationsEnabled', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update pomodoroNotificationsEnabled:', error)
    // 恢复原始值
    settings.value.pomodoroNotificationsEnabled = !newValue
    updateAutoSaveStatus('error')
  }
}

const togglePomodoroSounds = async () => {
  const newValue = !settings.value.pomodoroSoundsEnabled
  settings.value.pomodoroSoundsEnabled = newValue
  
  try {
    await settingsService.updateSetting('pomodoroSoundsEnabled', newValue)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update pomodoroSoundsEnabled:', error)
    // 恢复原始值
    settings.value.pomodoroSoundsEnabled = !newValue
    updateAutoSaveStatus('error')
  }
}

const updateSearchEngine = async (engine: 'duckduckgo' | 'serper') => {
  settings.value.aiSearchEngine = engine
  
  try {
    await settingsService.updateSetting('aiSearchEngine', engine)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update aiSearchEngine:', error)
    updateAutoSaveStatus('error')
  }
}

const updateSerperApiKey = async () => {
  try {
    await settingsService.updateSetting('serperApiKey', settings.value.serperApiKey)
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update serperApiKey:', error)
    updateAutoSaveStatus('error')
  }
}

// 主题切换方法 - 独立于重置功能
const changeTheme = async (themeValue: 'dark' | 'light' | 'auto') => {
  // 设置手动切换标记，防止触发自动保存
  isManualToggle = true
  
  try {
    // 直接更新设置
    settings.value.theme = themeValue
    
    // 通过settingsService直接更新主题，这会触发useTheme的更新
    await settingsService.updateSetting('theme', themeValue)
    
    // 显示成功通知
    const themeLabel = themes.value.find(t => t.value === themeValue)?.label || themeValue
    showNotification(`${languageService.t('theme_changed_to', '主题已切换为')} ${themeLabel}`, 'success')
    
    updateAutoSaveStatus('saved')
  } catch (error) {
    console.error('Failed to update theme:', error)
    updateAutoSaveStatus('error')
    showNotification(languageService.t('theme_change_failed', '主题切换失败'), 'error')
  } finally {
    // 清除手动切换标记
    setTimeout(() => {
      isManualToggle = false
    }, 100)
  }
}

const openHelpDocs = () => {
  window.open('https://github.com/your-repo/ai-notebook/blob/main/README.md', '_blank')
}

const openGitHub = () => {
  window.open('https://github.com/your-repo/ai-notebook', '_blank')
}

const exportData = async () => {
  try {
    const data = await supabaseService.notes.exportNotes()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-notebook-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showNotification(languageService.t('data_export_success'), 'success')
  } catch (error) {
    console.error(languageService.t('data_export_failed'), error)
    showNotification(languageService.t('data_export_failed'), 'error')
  }
}

const clearData = async () => {
  if (!confirm(languageService.t('confirm_clear_data'))) return
  
  try {
    await supabaseService.notes.clearAllNotes()
    await supabaseService.projects.clearAllProjects()
    await supabaseService.tasks.clearAllTasks()
    showNotification(languageService.t('data_clear_success'), 'success')
  } catch (error) {
    console.error(languageService.t('data_clear_failed'), error)
    showNotification(languageService.t('data_clear_failed'), 'error')
  }
}

const testApiConnection = async (providerKey: 'openrouter') => {
  const provider = settings.value.apiProviders[providerKey]
  
  if (!provider.apiKey) {
    showNotification(languageService.t('api_key_required_first'), 'error')
    return
  }
  
  try {
    // TODO: 实现Supabase AI连接测试功能
    // 暂时标记为已连接，实际需要实现AI服务测试
    provider.isConnected = true
    showNotification(`${provider.name} ${languageService.t('api_connection_success')}`, 'success')
    console.log('AI connection test needs to be implemented with Supabase')
  } catch (error) {
    console.error(languageService.t('api_test_failed'), error)
    provider.isConnected = false
    showNotification(`${provider.name} ${languageService.t('connection_failed')}`, 'error')
  }
}

const disconnectApi = (providerKey: 'openrouter') => {
  const provider = settings.value.apiProviders[providerKey]
  provider.isConnected = false
  provider.apiKey = ''
  showNotification(`${provider.name} ${languageService.t('api_disconnection_success')}`, 'success')
  // 自动保存会处理设置更新
}

const showNotification = (message: string, type: 'success' | 'error') => {
  // 使用全局事件系统显示通知
  const event = new CustomEvent('setting-notification', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
  
  // 同时控制台输出用于调试
  console.log(`${type}: ${message}`)
}

// 格式化保存时间
const formatSaveTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) { // 小于1分钟
    return languageService.t('just_now')
  } else if (diff < 3600000) { // 小于1小时
    const minutes = Math.floor(diff / 60000)
    return languageService.t('minutes_ago').replace('{0}', minutes.toString())
  } else {
    const hours = Math.floor(diff / 3600000)
    return languageService.t('hours_ago').replace('{0}', hours.toString())
  }
}

// 更新自动保存状态
const updateAutoSaveStatus = (status: 'idle' | 'saving' | 'saved' | 'error') => {
  autoSaveStatus.value = status
  
  if (status === 'saved') {
    lastSaveTime.value = Date.now()
    saveConfirmation.value = true
    
    // 显示确认动画后恢复
    setTimeout(() => {
      saveConfirmation.value = false
    }, 1000)
  }
}

// 背景管理方法
const triggerFileUpload = () => {
  console.log('[FRONTEND] triggerFileUpload called')
  console.log('[FRONTEND] fileInput.value:', fileInput.value)
  fileInput.value?.click()
  console.log('[FRONTEND] File input clicked')
}

const handleFileUpload = async (event: Event) => {
  console.log('[FRONTEND] File upload triggered')
  const target = event.target as HTMLInputElement
  const files = target.files
  
  console.log('[FRONTEND] Files selected:', files?.length || 0)
  if (!files || files.length === 0) {
    console.log('[FRONTEND] No files selected')
    return
  }
  
  // 防止重复上传
  if (isUploading.value) {
    console.log('[FRONTEND] Upload already in progress')
    return
  }
  
  isUploading.value = true
  console.log('[FRONTEND] Starting upload process')
  
  // 创建取消令牌，用于中断上传
  const controller = new AbortController()
  const uploadTimeout = setTimeout(() => {
    controller.abort()
    showNotification('上传超时，请检查网络连接', 'error')
  }, 300000) // 5分钟超时
  
  try {
    for (const file of files) {
      console.log(`[FRONTEND] Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)
      
      // 验证文件类型
      if (!file.type || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
        console.log(`[FRONTEND] File type not supported: ${file.type}`)
        showNotification(`文件 ${file.name} 格式不支持`, 'error')
        continue
      }
      
      // 验证文件大小 (50MB)
      if (file.size > 50 * 1024 * 1024) {
        console.log(`[FRONTEND] File too large: ${file.size} bytes`)
        showNotification(`文件 ${file.name} 过大，请选择小于50MB的文件`, 'error')
        continue
      }
      
      console.log(`[FRONTEND] Uploading to Supabase Storage for theme: ${activeBackgroundTab.value}`)
      
      // 使用 Supabase Storage 上传文件
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${activeBackgroundTab.value}.${fileExt}`
      const filePath = `backgrounds/${fileName}`
      
      console.log('[FRONTEND] Uploading file...')
      const result = await fileService.uploadBackground(file)
      
      console.log('[FRONTEND] Upload successful:', result)
      const themeText = activeBackgroundTab.value === 'light' ? '浅色主题' : '深色主题'
      showNotification(`文件 ${file.name} 已上传到${themeText}背景`, 'success')
      
      // 将文件信息保存到本地存储或状态管理中
      const backgroundInfo = {
        id: Date.now().toString(),
        name: file.name,
        url: result.url,
        path: result.path,
        theme: activeBackgroundTab.value,
        type: file.type && file.type.startsWith('image/') ? 'image' : 'video',
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
      
      // 这里可以添加将背景信息保存到数据库的逻辑
      console.log('[FRONTEND] Background info:', backgroundInfo)
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    
    // 更详细的错误处理
    if (error.name === 'AbortError') {
      showNotification('上传已取消或超时', 'warning')
    } else if (error.message.includes('Failed to fetch')) {
      showNotification('网络连接失败，请检查网络设置', 'error')
    } else if (error.message.includes('status')) {
      showNotification(`服务器错误: ${error.message}`, 'error')
    } else {
      showNotification(languageService.t('file_upload_failed', '文件上传失败'), 'error')
    }
  } finally {
    // 清理超时器
    clearTimeout(uploadTimeout)
    
    isUploading.value = false
    // 清空文件输入
    if (target) target.value = ''
    // 重新加载背景文件列表
    try {
      await loadBackgroundFiles()
    } catch (loadError) {
      console.error('重新加载背景文件列表失败:', loadError)
    }
    // 确保用户能看到刚上传的文件（如果当前不在对应的主题标签页）
    // 这里不自动切换标签页，而是通过通知消息提醒用户
  }
}

const previewBackground = async (file: any, targetTheme?: string) => {
  // 防止重复点击和竞态条件
  if (selectedBackground.value === file.id) {
    console.log('[SETTINGS] 背景已选中，跳过重复操作')
    return
  }
  
  selectedBackground.value = file.id
  
  // 确定目标主题：使用实际当前主题，而不是UI标签页
  const currentActualTheme = isDarkMode.value ? 'dark' : 'light'
  const themeToSave = targetTheme || currentActualTheme
  
  console.log(`[SETTINGS] ===== 开始选择背景 =====`)
  console.log(`[SETTINGS] 背景ID: ${file.id}`)
  console.log(`[SETTINGS] 目标主题: ${themeToSave}`)
  console.log(`[SETTINGS] 当前主题标签页: ${activeBackgroundTab.value}`)
  console.log(`[SETTINGS] 当前系统主题: ${currentActualTheme}`)
  
  // 直接应用背景预览，不检查主题匹配
  applyBackground(file)
  
  // 自动保存背景设置（按指定主题保存）- 添加取消令牌
  const controller = new AbortController()
  const saveTimeout = setTimeout(() => {
    controller.abort()
    showNotification('背景设置保存超时', 'warning')
  }, 10000) // 10秒超时
  
  try {
    const requestData = {
      backgroundId: file.id,
      theme: themeToSave // 使用指定的主题
    }
    console.log(`[SETTINGS] 准备发送保存请求:`, requestData)
    
    // 使用Supabase服务保存背景设置
    await settingsService.updateSetting(`background_${themeToSave}`, requestData.backgroundId)
    
    clearTimeout(saveTimeout)
    
    console.log(`[SETTINGS] 背景设置已保存到Supabase`)
    showNotification(`${themeToSave}主题背景设置已保存`, 'success')
  } catch (error) {
    clearTimeout(saveTimeout)
    
    if (error.name === 'AbortError') {
      console.error('[SETTINGS] 背景设置保存超时:', error)
      showNotification('背景设置保存超时', 'warning')
    } else {
      console.error('[SETTINGS] 自动保存背景设置失败:', error)
      showNotification('背景设置保存失败', 'error')
    }
    // 失败时恢复到默认背景
    selectDefaultBackground(themeToSave)
  }
  
  console.log(`[SETTINGS] ===== 背景选择完成 =====`)
}

const selectDefaultBackground = async (targetTheme?: string) => {
  selectedBackground.value = null
  // 预览默认背景（清除当前背景）
  window.dispatchEvent(new CustomEvent('clear-background'))
  
  // 确定目标主题：如果指定了targetTheme则使用，否则使用当前活跃标签页
  const themeToSave = targetTheme || activeBackgroundTab.value
  
  console.log(`[SETTINGS] 选择默认背景，目标主题: ${themeToSave}`)
  
  // 使用Supabase服务保存默认背景设置
  try {
    await settingsService.updateSetting(`background_${themeToSave}`, null)
    showNotification(`${themeToSave}主题已恢复默认背景`, 'success')
  } catch (error) {
    console.error('自动保存默认背景设置失败:', error)
  }
}

const deleteBackground = async (fileId: string) => {
  // 防止重复删除
  if (isUploading.value) {
    console.log('[DELETE] 删除操作已在进行中')
    return
  }
  
  // 用户确认
  if (!confirm(`确定要删除这个背景文件吗？此操作不可恢复。`)) {
    return
  }
  
  isUploading.value = true // 使用相同的加载状态
  
  const controller = new AbortController()
  const deleteTimeout = setTimeout(() => {
    controller.abort()
    showNotification('删除操作超时', 'warning')
  }, 30000) // 30秒超时
  
  try {
    // 使用Supabase服务删除背景文件
    await fileService.deleteBackground(fileId)
    
    clearTimeout(deleteTimeout)
    
    console.log('[DELETE] 删除成功:', fileId)
    
    // 重新加载背景文件列表以确保数据同步
    try {
      await loadBackgroundFiles()
    } catch (loadError) {
      console.error('重新加载背景文件列表失败:', loadError)
    }
    
    // 检查是否删除的是当前选中的背景
    if (selectedBackground.value === fileId) {
      // 自动切换到默认背景
      await selectDefaultBackground(activeBackgroundTab.value)
    }
    
    // 检查是否删除的是当前主题的背景设置
    try {
      const currentBgSetting = await settingsService.getSetting(`background_${activeBackgroundTab.value}`)
      if (currentBgSetting === fileId) {
        // 删除的是当前主题的背景，自动切换到默认背景
        await selectDefaultBackground(activeBackgroundTab.value)
      }
    } catch (checkError) {
      console.error('检查当前背景设置失败:', checkError)
    }
    
    showNotification(languageService.t('background_delete_success', '背景文件删除成功'), 'success')
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[DELETE] 删除操作超时:', error)
      showNotification('删除操作超时', 'warning')
    } else {
      console.error('删除背景文件失败:', error)
      showNotification(languageService.t('background_delete_failed', '删除背景文件失败'), 'error')
    }
  } finally {
    clearTimeout(deleteTimeout)
    isUploading.value = false
  }
}


const loadBackgroundFiles = async () => {
  try {
    console.log('[FRONTEND] 加载背景文件列表...')
    const files = await fileUploadService.getBackgrounds()
    
    // 确保URL是完整的
    backgroundFiles.value = files.map(file => ({
      ...file,
      url: file.url && typeof file.url === 'string' && file.url.startsWith('http') ? file.url : `${file.url || ''}`
    }))
    
    console.log('[FRONTEND] 背景文件加载完成:', backgroundFiles.value.length, '个文件')
  } catch (error) {
    console.error('加载背景文件失败:', error)
    backgroundFiles.value = []
  }
}

const loadCurrentBackground = async () => {
  try {
    // 使用当前实际主题而不是标签页主题
    const currentTheme = isDarkMode.value ? 'dark' : 'light'
    const backgroundSetting = await settingsService.getSetting(`background_${currentTheme}`)
    console.log(`[SETTINGS] 当前${currentTheme}主题背景设置:`, backgroundSetting)
    if (backgroundSetting) {
      selectedBackground.value = backgroundSetting
      // 应用当前背景
      const currentFile = backgroundFiles.value.find(file => file.id === backgroundSetting || file.name === backgroundSetting)
      if (currentFile) {
        // 直接应用背景，不检查主题匹配性
        applyBackground(currentFile)
      }
    } else {
      // 没有设置背景，清除当前背景
      window.dispatchEvent(new CustomEvent('clear-background'))
    }
  } catch (error) {
    console.error('加载当前背景设置失败:', error)
  }
}

const applyBackground = (file) => {
  // 通过自定义事件通知App.vue应用背景
  const event = new CustomEvent('apply-background', {
    detail: { file }
  })
  window.dispatchEvent(event)
}

onMounted(async () => {
  await loadSettings()
  // 先加载背景文件列表
  await loadBackgroundFiles()
  // 然后加载并应用当前背景设置
  await loadCurrentBackground()
  
  // 初始化完成，允许触发保存操作
  setTimeout(() => {
    isInitializing = false
  }, 100)
  
  // Add listener for global settings updates
  const removeSettingsListener = settingsService.addListener((newSettings) => {
    // 只在非初始化、非重置、非手动切换状态且设置确实发生变化时更新
    if (!isInitializing && !isResetting && !isManualToggle) {
      // 检查设置是否真的发生了变化，避免不必要的更新
      const hasChanges = Object.keys(newSettings).some(key => {
        return JSON.stringify(settings.value[key]) !== JSON.stringify(newSettings[key])
      })
      
      if (hasChanges) {
        console.log('Updating settings from service:', newSettings)
        // 设置一个临时标记，防止触发watch监听器
        const wasManualToggle = isManualToggle
        isManualToggle = true
        Object.assign(settings.value, newSettings)
        // 恢复原始状态
        setTimeout(() => {
          isManualToggle = wasManualToggle
        }, 50)
      }
    }
  })
  
  // Add listener for language changes to force reactivity
  const removeLanguageListener = languageService.addListener((newLanguage) => {
    // Update reactive language state to trigger re-computation
    currentLanguage.value = newLanguage
  })
  
  // Store cleanup functions for onUnmounted
  window.settingsCleanupFunctions = {
    removeSettingsListener,
    removeLanguageListener
  }
})

// Cleanup listeners on unmount
onUnmounted(() => {
  console.log('Settings component unmounting, cleaning up listeners')
  if (window.settingsCleanupFunctions) {
    window.settingsCleanupFunctions.removeSettingsListener()
    window.settingsCleanupFunctions.removeLanguageListener()
    delete window.settingsCleanupFunctions
  }
})
</script>

<template>
  <div class="h-full flex">
    <!-- 侧边栏标签 -->
    <div class="w-64 border-r border-cyber-primary/30 bg-gradient-to-b from-cyber-primary/5 to-transparent">
      <div class="p-6">
        <div class="futuristic-header mb-8">
          <h2 class="futuristic-title-medium">{{ languageService.t('system_settings') }}</h2>
          <div class="futuristic-subtitle">{{ languageService.t('configure_ai_notebook') }}</div>
        </div>
        
        <!-- 桌面端导航按钮 -->
        <nav class="space-y-2 hidden md:block">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center space-x-3',
              activeTab === tab.id
                ? 'futuristic-btn-active'
                : 'futuristic-btn-secondary hover:scale-105'
            ]"
          >
            <div class="futuristic-icon-container" v-html="tab.icon"></div>
            <span class="futuristic-subtitle">{{ tab.label }}</span>
          </button>
        </nav>
        
        <!-- 移动端下拉选择器 -->
        <div class="md:hidden">
          <label class="block futuristic-subtitle mb-2">{{ languageService.t('settings_category') || '设置类别' }}</label>
          <div class="relative mb-4">
            <select 
              v-model="activeTab" 
              class="futuristic-input w-full appearance-none pr-10"
            >
              <option 
                v-for="tab in tabs" 
                :key="tab.id" 
                :value="tab.id"
              >
                {{ tab.label }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="w-5 h-5 text-cyber-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="flex-1 overflow-y-auto cyber-scrollbar">
      <div class="p-8">
        <!-- 通用设置 -->
        <div v-if="activeTab === 'general'" class="space-y-8">
          <div class="futuristic-card bg-gradient-to-br from-blue-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('language_region') }}</h3>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('interface_language') }}</label>
                <select v-model="settings.language" class="futuristic-input w-full">
                  <option v-for="lang in languages" :key="lang.value" :value="lang.value">
                    {{ lang.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="futuristic-card bg-gradient-to-br from-green-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('auto_save') }}</h3>
              </div>
            </div>
            <div class="space-y-6">
              <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="toggleAutoSave">
                <div class="relative">
                  <input 
                    type="checkbox" 
                    class="sr-only"
                    :checked="settings.autoSave"
                    readonly
                  >
                  <div :class="[
                    'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                    settings.autoSave ? 'bg-green-500/20 border-green-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                  ]">
                    <div :class="[
                      'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                      settings.autoSave ? 'translate-x-6 from-green-400 to-emerald-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                    ]"></div>
                  </div>
                </div>
                <span class="futuristic-title group-hover:text-green-400 transition-colors">{{ languageService.t('enable_auto_save') }}</span>
              </label>
              
              <div v-if="settings.autoSave" class="futuristic-card bg-cyber-dark/30">
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('auto_save_interval_seconds') }}</label>
                <input 
                  v-model.number="settings.autoSaveInterval" 
                  type="number" 
                  min="10" 
                  max="300" 
                  class="futuristic-input w-40"
                >
              </div>
            </div>
          </div>
          
          <div class="futuristic-card bg-gradient-to-br from-purple-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1a3 3 0 006 0V4h3.5c.276 0 .526.111.707.293l2.5 2.5c.182.181.293.431.293.707V10a3 3 0 01-3 3v1a3 3 0 01-3 3H9a3 3 0 01-3-3v-1a3 3 0 01-3-3V7.5c0-.276.111-.526.293-.707l2.5-2.5z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('notification_settings') }}</h3>
              </div>
            </div>
            <div class="space-y-6">
              <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="toggleNotifications">
                <div class="relative">
                  <input 
                    type="checkbox" 
                    class="sr-only"
                    :checked="settings.enableNotifications"
                    readonly
                  >
                  <div :class="[
                    'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                    settings.enableNotifications ? 'bg-purple-500/20 border-purple-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                  ]">
                    <div :class="[
                      'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                      settings.enableNotifications ? 'translate-x-6 from-purple-400 to-pink-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                    ]"></div>
                  </div>
                </div>
                <span class="futuristic-title group-hover:text-purple-400 transition-colors">{{ languageService.t('enable_desktop_notifications') }}</span>
              </label>
              
              <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="toggleSounds">
                <div class="relative">
                  <input 
                    type="checkbox" 
                    class="sr-only"
                    :checked="settings.enableSounds"
                    readonly
                  >
                  <div :class="[
                    'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                    settings.enableSounds ? 'bg-purple-500/20 border-purple-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                  ]">
                    <div :class="[
                      'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                      settings.enableSounds ? 'translate-x-6 from-purple-400 to-pink-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                    ]"></div>
                  </div>
                </div>
                <span class="futuristic-title group-hover:text-purple-400 transition-colors">{{ languageService.t('enable_sound_effects') }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- 外观设置 -->
        <div v-else-if="activeTab === 'appearance'" class="space-y-8">
          <!-- 主题选择器 -->
          <div class="futuristic-card bg-gradient-to-br from-pink-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('theme_settings', '主题设置') }}</h3>
              </div>
            </div>
            
            <!-- 当前主题显示 -->
            <div class="p-4 rounded-xl border-2 border-pink-400/50 bg-gradient-to-br from-pink-500/10 to-purple-500/10 shadow-lg shadow-pink-500/10 mb-6">
              <div class="text-center">
                <div class="futuristic-icon-container mb-3 mx-auto">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="currentThemeName === 'dark'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 118.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    <path v-else-if="currentThemeName === 'light'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <div class="futuristic-title text-sm mb-1">{{ languageService.t('current_theme', '当前主题') }}</div>
                <div class="futuristic-subtitle text-xs">{{ themes.find(t => t.value === currentThemeName)?.label || languageService.t('dark_theme') }}</div>
              </div>
            </div>
            
            <!-- 主题选择器 -->
            <div class="space-y-4">
              <div 
                v-for="theme in themes" 
                :key="theme.value"
                class="relative cursor-pointer group"
                @click="changeTheme(theme.value)"
              >
                <div :class="[
                  'p-4 rounded-xl border-2 transition-all duration-300',
                  settings.theme === theme.value 
                    ? 'border-pink-400 bg-gradient-to-br from-pink-500/20 to-purple-500/20 shadow-lg shadow-pink-500/25' 
                    : 'border-pink-400/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5 hover:border-pink-400/60 hover:shadow-md hover:shadow-pink-500/10'
                ]">
                  <div class="flex items-center space-x-4">
                    <!-- 主题图标 -->
                    <div class="futuristic-icon-container flex-shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="theme.value === 'dark'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 118.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                        <path v-else-if="theme.value === 'light'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                    </div>
                    
                    <!-- 主题信息 -->
                    <div class="flex-1">
                      <div class="futuristic-title text-sm mb-1">{{ theme.label }}</div>
                      <div class="futuristic-subtitle text-xs">{{ theme.description }}</div>
                    </div>
                    
                    <!-- 选中状态指示器 -->
                    <div v-if="settings.theme === theme.value" class="flex-shrink-0">
                      <div class="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 背景管理 -->
          <div class="futuristic-card bg-gradient-to-br from-cyan-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">背景管理</h3>
              </div>
            </div>
            
            <!-- 上传区域 -->
            <div class="mb-8">
              <div class="border-2 border-dashed border-cyan-400/30 rounded-xl p-8 text-center hover:border-cyan-400/60 transition-colors cursor-pointer" @click="triggerFileUpload">
                <div class="futuristic-icon-container mb-4 mx-auto">
                  <svg class="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div class="futuristic-title mb-2">
                  上传{{ activeBackgroundTab === 'light' ? '浅色主题' : '深色主题' }}背景文件
                </div>
                <div class="futuristic-subtitle mb-4">支持图片、视频和GIF文件</div>
                <div class="text-sm text-cyan-400/70">
                  点击选择文件或拖拽文件到此处<br>
                  <span class="text-xs opacity-75">文件将被分类到{{ activeBackgroundTab === 'light' ? '浅色主题' : '深色主题' }}背景中</span>
                </div>
                <input 
                  ref="fileInput" 
                  type="file" 
                  accept="image/*,video/*,.gif" 
                  multiple 
                  class="hidden" 
                  @change="handleFileUpload"
                >
              </div>
            </div>
            
            <!-- 主题分类标签页 -->
            <div class="mb-6">
              <div class="flex space-x-1 p-1 bg-cyber-dark/20 rounded-lg">
                <button 
                  @click="activeBackgroundTab = 'light'"
                  :class="[
                    'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    activeBackgroundTab === 'light' 
                      ? 'bg-gradient-to-r from-cyan-400/20 to-blue-400/20 text-cyan-300 shadow-lg shadow-cyan-400/25' 
                      : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-400/10'
                  ]"
                >
                  <div class="flex items-center justify-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    <span>浅色主题背景</span>
                  </div>
                </button>
                <button 
                  @click="activeBackgroundTab = 'dark'"
                  :class="[
                    'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    activeBackgroundTab === 'dark' 
                      ? 'bg-gradient-to-r from-purple-400/20 to-pink-400/20 text-purple-300 shadow-lg shadow-purple-400/25' 
                      : 'text-purple-400/70 hover:text-purple-300 hover:bg-purple-400/10'
                  ]"
                >
                  <div class="flex items-center justify-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                    <span>深色主题背景</span>
                  </div>
                </button>
              </div>
            </div>
            
            <!-- 背景列表 -->
            <div>
              <h4 class="futuristic-title mb-4">
                {{ activeBackgroundTab === 'light' ? '浅色主题背景选择' : '深色主题背景选择' }}
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- 默认背景选项 -->
                <div 
                  class="relative group cursor-pointer"
                  @click="selectDefaultBackground(activeBackgroundTab)"
                >
                  <div :class="[
                    'aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center',
                    selectedBackground === null ? 'border-cyan-400 shadow-lg shadow-cyan-400/25' : 'border-cyber-primary/30 hover:border-cyan-400/60'
                  ]">
                    <div class="text-center text-white">
                      <svg class="w-8 h-8 mx-auto mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                      </svg>
                      <div class="text-xs font-medium">默认背景</div>
                    </div>
                  </div>
                  <div class="mt-2 text-center">
                    <div class="futuristic-subtitle text-xs">系统默认</div>
                  </div>
                </div>
                
                <!-- 已上传的背景 -->
                <div 
                  v-for="file in filteredBackgroundFiles" 
                  :key="file.id" 
                  class="relative group cursor-pointer"
                  @click="previewBackground(file, activeBackgroundTab)"
                >
                  <div :class="[
                    'aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300',
                    selectedBackground === file.id ? 'border-cyan-400 shadow-lg shadow-cyan-400/25' : 'border-cyber-primary/30 hover:border-cyan-400/60'
                  ]">
                    <img 
                      v-if="file.type.startsWith('image')" 
                      :src="file.url" 
                      :alt="file.name" 
                      class="w-full h-full object-cover"
                    >
                    <video 
                      v-else-if="file.type.startsWith('video')" 
                      :src="file.url" 
                      class="w-full h-full object-cover" 
                      muted
                    ></video>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div class="text-white text-sm font-medium">预览</div>
                    </div>
                  </div>
                  <div class="mt-2 text-center">
                    <div class="futuristic-subtitle text-xs truncate">{{ file.name }}</div>
                  </div>
                  <!-- 删除按钮 -->
                  <button 
                    @click.stop="deleteBackground(file.id)" 
                    class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </div>
              

            </div>
          </div>
          
          <div class="futuristic-card bg-gradient-to-br from-orange-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('font_settings') }}</h3>
              </div>
            </div>
            <div class="space-y-6">
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('font_family') }}</label>
                <select v-model="settings.fontFamily" class="futuristic-input w-full">
                  <option v-for="font in fontFamilies" :key="font.value" :value="font.value">
                    {{ font.label }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('font_size_px', { size: settings.fontSize }) }}</label>
                <div class="relative">
                  <input 
                    v-model.number="settings.fontSize" 
                    type="range" 
                    min="12" 
                    max="20" 
                    step="1" 
                    class="w-full h-2 bg-cyber-dark/50 rounded-lg appearance-none cursor-pointer slider"
                  >
                  <div class="flex justify-between text-xs futuristic-subtitle mt-2">
                    <span>12px</span>
                    <span>16px</span>
                    <span>20px</span>
                  </div>
                </div>
              </div>
              
              <!-- 网络搜索功能设置 -->
              <div class="futuristic-card bg-cyber-dark/30">
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 mt-1">
                    <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="toggleWebSearch">
                      <div class="relative">
                        <input 
                          type="checkbox" 
                          class="sr-only"
                          :checked="settings.aiWebSearchEnabled"
                          readonly
                        >
                        <div :class="[
                          'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                          settings.aiWebSearchEnabled ? 'bg-cyan-500/20 border-cyan-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                        ]">
                          <div :class="[
                            'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                            settings.aiWebSearchEnabled ? 'translate-x-6 from-cyan-400 to-blue-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                          ]"></div>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div class="flex-1">
                    <div class="futuristic-title text-sm mb-2">启用AI网络搜索功能</div>
                    <div class="futuristic-subtitle text-xs leading-relaxed">
                      开启后，AI助手将能够自动检测搜索意图并执行网络搜索，获取最新信息。
                      <span class="text-cyan-400">支持实时信息查询，如新闻、天气、股价等。</span>
                      关闭后，AI助手将仅使用训练数据回答问题。
                    </div>
                  </div>
                </div>
                
                <!-- 搜索引擎配置 -->
                <div v-if="settings.aiWebSearchEnabled" class="mt-6 pt-6 border-t border-cyber-primary/20">
                  <div class="space-y-4">
                    <div>
                      <label class="block futuristic-subtitle mb-3">搜索引擎</label>
                      <select v-model="settings.aiSearchEngine" class="futuristic-input w-full">
                        <option value="duckduckgo">DuckDuckGo (免费)</option>
                        <option value="serper">Google via Serper (需要API密钥)</option>
                      </select>
                    </div>
                    
                    <!-- Serper API密钥配置 -->
                    <div v-if="settings.aiSearchEngine === 'serper'">
                      <label class="block futuristic-subtitle mb-3">Serper API密钥</label>
                      <div class="relative">
                        <input 
                          v-model="settings.serperApiKey" 
                          :type="showSerperKey ? 'text' : 'password'" 
                          placeholder="输入Serper API密钥" 
                          class="futuristic-input w-full pr-12"
                        >
                        <button 
                          @click="showSerperKey = !showSerperKey" 
                          class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-cyber-primary/20 transition-colors"
                        >
                          <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path v-if="showSerperKey" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                      </div>
                      <div class="mt-2 text-xs futuristic-subtitle">
                        获取API密钥: <a href="https://serper.dev" target="_blank" class="text-cyan-400 hover:text-cyan-300">https://serper.dev</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 番茄时钟设置 -->
        <div v-else-if="activeTab === 'pomodoro'" class="space-y-8">
          <div class="futuristic-card bg-gradient-to-br from-red-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('pomodoro_timer_settings') }}</h3>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('work_duration_minutes') }}</label>
                <input 
                  v-model.number="settings.pomodoroWorkDuration" 
                  type="number" 
                  min="1" 
                  max="60" 
                  class="futuristic-input w-full"
                >
                <div class="mt-2 text-xs futuristic-subtitle">{{ languageService.t('recommended_25_minutes') }}</div>
              </div>
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('short_break_duration_minutes') }}</label>
                <input 
                  v-model.number="settings.pomodoroShortBreak" 
                  type="number" 
                  min="1" 
                  max="30" 
                  class="futuristic-input w-full"
                >
                <div class="mt-2 text-xs futuristic-subtitle">{{ languageService.t('recommended_5_minutes') }}</div>
              </div>
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('long_break_duration_minutes') }}</label>
                <input 
                  v-model.number="settings.pomodoroLongBreak" 
                  type="number" 
                  min="1" 
                  max="60" 
                  class="futuristic-input w-full"
                >
                <div class="mt-2 text-xs futuristic-subtitle">{{ languageService.t('recommended_15_minutes') }}</div>
              </div>
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('long_break_interval') }}</label>
                <input 
                  v-model.number="settings.pomodoroLongBreakInterval" 
                  type="number" 
                  min="2" 
                  max="10" 
                  class="futuristic-input w-full"
                >
                <div class="mt-2 text-xs futuristic-subtitle">{{ languageService.t('work_sessions_before_long_break') }}</div>
              </div>
            </div>
          </div>
          
          <div class="futuristic-card bg-gradient-to-br from-orange-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('notification_settings') }}</h3>
              </div>
            </div>
            <div class="space-y-6">
              <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="togglePomodoroNotifications">
                <div class="relative">
                  <input 
                    type="checkbox" 
                    class="sr-only"
                    :checked="settings.pomodoroNotificationsEnabled"
                    readonly
                  >
                  <div :class="[
                    'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                    settings.pomodoroNotificationsEnabled ? 'bg-orange-500/20 border-orange-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                  ]">
                    <div :class="[
                      'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                      settings.pomodoroNotificationsEnabled ? 'translate-x-6 from-orange-400 to-red-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                    ]"></div>
                  </div>
                </div>
                <span class="futuristic-title group-hover:text-orange-400 transition-colors">{{ languageService.t('enable_desktop_notifications') }}</span>
              </label>
              
              <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="togglePomodoroSounds">
                <div class="relative">
                  <input 
                    type="checkbox" 
                    class="sr-only"
                    :checked="settings.pomodoroSoundsEnabled"
                    readonly
                  >
                  <div :class="[
                    'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                    settings.pomodoroSoundsEnabled ? 'bg-orange-500/20 border-orange-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                  ]">
                    <div :class="[
                      'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                      settings.pomodoroSoundsEnabled ? 'translate-x-6 from-orange-400 to-red-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                    ]"></div>
                  </div>
                </div>
                <span class="futuristic-title group-hover:text-orange-400 transition-colors">{{ languageService.t('enable_sound_notifications') }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- AI设置 -->
        <div v-else-if="activeTab === 'ai'" class="space-y-8">
          <!-- AI提供商配置 -->
          <div v-for="provider in availableProviders" :key="provider.key" class="futuristic-card bg-gradient-to-br from-cyan-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="futuristic-icon-container">
                    <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="futuristic-title-small">{{ provider.name }}</h3>
                    <p class="futuristic-subtitle text-sm">{{ provider.description }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <div v-if="settings.apiProviders[provider.key]?.isConnected" class="flex items-center space-x-2 text-green-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-sm font-medium">{{ languageService.t('connected') }}</span>
                  </div>
                  <div v-else class="flex items-center space-x-2 text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-sm font-medium">{{ languageService.t('disconnected') }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="space-y-6">
              <!-- API密钥输入 -->
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('api_key') }}</label>
                <div class="relative">
                  <input 
                    v-model="settings.apiProviders[provider.key].apiKey" 
                    :type="showApiKey ? 'text' : 'password'" 
                    :placeholder="languageService.t('enter_api_key_placeholder', { provider: provider.name })" 
                    class="futuristic-input w-full pr-12"
                  >
                  <button 
                    @click="showApiKey = !showApiKey" 
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-cyber-primary/20 transition-colors"
                  >
                    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="showApiKey" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- 模型选择 -->
              <div>
                <label class="block futuristic-subtitle mb-3">{{ languageService.t('ai_model') }}</label>
                <select v-model="settings.apiProviders[provider.key].selectedModel" class="futuristic-input w-full">
                  <option v-for="model in provider.models" :key="model" :value="model">
                    {{ model }}
                  </option>
                </select>
              </div>
              
              <!-- 操作按钮 -->
              <div class="flex items-center space-x-4">
                <button 
                  v-if="!settings.apiProviders[provider.key]?.isConnected"
                  @click="testApiConnection(provider.key)" 
                  :disabled="!settings.apiProviders[provider.key]?.apiKey" 
                  class="futuristic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  <span>{{ languageService.t('connect_api') }}</span>
                </button>
                
                <button 
                  v-else
                  @click="disconnectApi(provider.key)" 
                  class="futuristic-btn-danger flex items-center space-x-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>{{ languageService.t('disconnect_api') }}</span>
                </button>
                
                <button 
                  v-if="settings.apiProviders[provider.key]?.isConnected"
                  @click="settings.currentProvider = provider.key" 
                  :class="[
                    'futuristic-btn flex items-center space-x-2',
                    settings.currentProvider === provider.key ? 'futuristic-btn-active' : 'border border-cyber-primary/40 hover:border-cyan-400/60'
                  ]"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{{ settings.currentProvider === provider.key ? languageService.t('currently_using') : languageService.t('set_as_default') }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 当前活跃提供商显示 -->
          <div class="futuristic-card bg-gradient-to-br from-purple-500/10 to-transparent">
            <div class="futuristic-header mb-4">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('current_active_ai') }}</h3>
              </div>
            </div>
            <div class="flex items-center space-x-4 p-4 bg-cyber-dark/30 rounded-xl">
              <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <div class="futuristic-title">{{ settings.apiProviders[settings.currentProvider].name }}</div>
                <div class="futuristic-subtitle">{{ languageService.t('model_colon', { model: settings.apiProviders[settings.currentProvider].selectedModel }) }}</div>
              </div>
            </div>
          </div>
          
          <!-- AI权限设置 -->
          <div class="futuristic-card bg-gradient-to-br from-orange-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">AI权限设置</h3>
              </div>
            </div>
            <div class="space-y-6">
              <div class="futuristic-card bg-cyber-dark/30">
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 mt-1">
                    <label class="flex items-center space-x-4 cursor-pointer group" @click.prevent="toggleFileOperations">
                      <div class="relative">
                        <input 
                          type="checkbox" 
                          class="sr-only"
                          :checked="settings.aiFileOperationsEnabled"
                          readonly
                        >
                        <div :class="[
                          'w-12 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer',
                          settings.aiFileOperationsEnabled ? 'bg-orange-500/20 border-orange-400' : 'bg-cyber-primary/20 border-cyber-primary/40'
                        ]">
                          <div :class="[
                            'w-4 h-4 rounded-full bg-gradient-to-r transition-all duration-300 mt-0.5 pointer-events-none',
                            settings.aiFileOperationsEnabled ? 'translate-x-6 from-orange-400 to-red-400' : 'translate-x-0.5 from-cyber-primary to-blue-400'
                          ]"></div>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div class="flex-1">
                    <div class="futuristic-title text-sm mb-2">启用AI文件操作功能</div>
                    <div class="futuristic-subtitle text-xs leading-relaxed">
                      开启后，AI助手将能够执行文件操作指令，如读取、创建、修改和删除文件。
                      <span class="text-orange-400">注意：此功能具有一定风险，请谨慎使用。</span>
                      关闭后，AI助手将仅限于页面操作，如创建笔记和待办事项。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 数据管理 -->
        <div v-else-if="activeTab === 'data'" class="space-y-8">
          <div class="futuristic-card bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small">{{ languageService.t('data_export') }}</h3>
              </div>
            </div>
            <div class="space-y-6">
              <div class="futuristic-card bg-cyber-dark/30">
                <p class="futuristic-subtitle mb-4">
                  {{ languageService.t('export_all_data_info') }}
                </p>
                <div class="flex items-center space-x-4">
                  <button @click="exportData" class="futuristic-btn-primary flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>{{ languageService.t('export_data_btn') }}</span>
                  </button>
                  <div class="futuristic-subtitle">
                    {{ languageService.t('last_export_never') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="futuristic-card bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h3 class="futuristic-title-small text-red-400">{{ languageService.t('danger_zone') }}</h3>
              </div>
            </div>
            <div class="space-y-6">
              <div class="futuristic-card bg-red-900/20 border border-red-500/30">
                <div class="flex items-start space-x-4">
                  <div class="futuristic-icon-container bg-red-500/20">
                    <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="futuristic-title text-red-400 mb-2">{{ languageService.t('clear_all_data_btn') }}</h4>
                    <p class="futuristic-subtitle mb-4">
                      {{ languageService.t('clear_all_data_warning') }}
                    </p>
                    <button 
                      @click="clearData" 
                      class="futuristic-btn-danger flex items-center space-x-2"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      <span>{{ languageService.t('clear_all_data_btn') }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
         
         <!-- 关于 -->
         <div v-if="activeTab === 'about'" class="space-y-8">
           <div class="futuristic-card bg-gradient-to-br from-indigo-500/10 to-transparent text-center">
             <div class="futuristic-icon-container mx-auto mb-6 w-20 h-20">
               <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
               </svg>
             </div>
             <h3 class="futuristic-title-small mb-4">{{ languageService.t('ai_smart_notebook') }}</h3>
             <div class="futuristic-subtitle mb-6">{{ languageService.t('version') }} 1.0.0</div>
             <p class="futuristic-subtitle mb-8 max-w-2xl mx-auto">
               {{ languageService.t('app_description_full') }}
             </p>
             
             <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div class="futuristic-card bg-cyber-dark/30">
                 <div class="futuristic-icon-container mb-3">
                   <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                   </svg>
                 </div>
                 <div class="futuristic-title mb-2">{{ languageService.t('developer') }}</div>
                 <div class="futuristic-subtitle">AI Assistant</div>
               </div>
               <div class="futuristic-card bg-cyber-dark/30">
                 <div class="futuristic-icon-container mb-3">
                   <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                   </svg>
                 </div>
                 <div class="futuristic-title mb-2">{{ languageService.t('tech_stack') }}</div>
                 <div class="futuristic-subtitle">Vue.js + Flask</div>
               </div>
               <div class="futuristic-card bg-cyber-dark/30">
                 <div class="futuristic-icon-container mb-3">
                   <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                   </svg>
                 </div>
                 <div class="futuristic-title mb-2">{{ languageService.t('license') }}</div>
                 <div class="futuristic-subtitle">MIT License</div>
               </div>
             </div>
             
             <div class="flex justify-center space-x-4">
               <button 
                 @click="openHelpDocs"
                 class="futuristic-btn-secondary flex items-center space-x-2"
               >
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                 </svg>
                 <span>{{ languageService.t('help_docs') }}</span>
               </button>
               <button 
                 @click="openGitHub"
                 class="futuristic-btn-secondary flex items-center space-x-2"
               >
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                 </svg>
                 <span>{{ languageService.t('github_repo') }}</span>
               </button>
             </div>
           </div>
         </div>
         
         <!-- 自动保存状态和操作区域 -->
        <div class="border-t border-cyber-primary/30 bg-gradient-to-r from-cyber-primary/5 to-transparent p-8 mt-8">
          <!-- 自动保存状态指示器 -->
          <div class="flex items-center justify-center mb-6">
            <!-- 保存中状态 -->
            <div v-if="autoSaveStatus === 'saving'" class="flex items-center space-x-3 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div class="relative">
                <svg class="w-5 h-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <span class="text-blue-400 text-sm font-medium">{{ languageService.t('auto_saving') }}</span>
            </div>
            
            <!-- 已保存状态 -->
            <div v-else-if="autoSaveStatus === 'saved'" class="flex items-center space-x-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 transition-all duration-300" :class="{ 'scale-105': saveConfirmation }">
              <div class="relative">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div v-if="saveConfirmation" class="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span class="text-green-400 text-sm font-medium">
                {{ languageService.t('auto_saved') }}
                <span v-if="lastSaveTime" class="text-green-300/70 ml-1">
                  {{ formatSaveTime(lastSaveTime) }}
                </span>
              </span>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="autoSaveStatus === 'error'" class="flex items-center space-x-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <div class="relative">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <span class="text-red-400 text-sm font-medium">{{ languageService.t('auto_save_error') }}</span>
            </div>
            
            <!-- 默认状态 -->
            <div v-else class="flex items-center space-x-3 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div class="relative">
                <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <div class="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <span class="text-cyan-400 text-sm font-medium">{{ languageService.t('auto_save_enabled') }}</span>
            </div>
          </div>
          
          <!-- 操作按钮区域 -->
          <div class="flex justify-center items-center space-x-4">
            <!-- 重置按钮组 -->
            <div class="flex space-x-3">
              <button 
                @click="resetToOriginal" 
                class="futuristic-btn-secondary flex items-center space-x-2"
                :disabled="!originalSettings || Object.keys(originalSettings).length === 0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                </svg>
                <span>{{ languageService.t('reset_options') }}</span>
              </button>
              
              <button 
                @click="resetToFactory" 
                class="futuristic-btn-danger flex items-center space-x-2"
                :disabled="autoSaveStatus === 'saving'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>{{ autoSaveStatus === 'saving' ? languageService.t('resetting') : languageService.t('factory_reset') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面动画 */
.settings-view {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片动画 */
.futuristic-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.futuristic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 245, 255, 0.15);
}

/* 设置项动画 */
.setting-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.setting-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.setting-item:hover::before {
  left: 100%;
}

.setting-item:hover {
  background: rgba(0, 245, 255, 0.05);
  border-radius: 8px;
  padding: 0.5rem;
  margin: -0.5rem;
}

/* 按钮动画增强 */
.futuristic-btn-primary, .futuristic-btn-secondary, .futuristic-btn-danger {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.futuristic-btn-primary:hover, .futuristic-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 245, 255, 0.3);
}

.futuristic-btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
}

.futuristic-btn-primary:active, .futuristic-btn-secondary:active, .futuristic-btn-danger:active {
  transform: translateY(0);
  transition: transform 0.1s;
}

/* 开关动画 */
.toggle-switch {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch:hover {
  transform: scale(1.05);
}

/* 选择框动画 */
select {
  transition: all 0.3s ease;
}

select:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.3);
}

/* 输入框动画 */
input[type="text"], input[type="password"], textarea {
  transition: all 0.3s ease;
}

input[type="text"]:focus, input[type="password"]:focus, textarea:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.3);
}

/* 自定义滑块样式 */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: rgba(0, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  transition: all 0.3s ease;
}

input[type="range"]:hover {
  background: rgba(0, 255, 255, 0.5);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px #00ffff;
  transition: all 0.3s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 15px #00ffff;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px #00ffff;
  transition: all 0.3s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 15px #00ffff;
}

/* 状态指示器动画 */
.status-indicator {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 保存状态动画 */
.save-status {
  transition: all 0.3s ease;
}

.save-status.saving {
  animation: saving-pulse 1s ease-in-out infinite;
}

@keyframes saving-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.save-status.saved {
  animation: saved-flash 0.5s ease;
}

@keyframes saved-flash {
  0% {
    background-color: rgba(16, 185, 129, 0.3);
  }
  100% {
    background-color: transparent;
  }
}

/* 错误状态动画 */
.error-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* 移动端响应式设计 */
@media (max-width: 1024px) {
  .h-full.flex {
    flex-direction: column;
  }
  
  .w-72 {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(187, 134, 252, 0.3);
  }
  
  .w-72 .p-6 {
    padding: 1rem;
  }
  
  .w-72 nav {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .w-72 nav button {
    flex-shrink: 0;
    min-width: 120px;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 768px) {
  /* 主容器调整 */
  .h-full.flex {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }
  
  /* 侧边栏调整 */
  .w-64 {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(187, 134, 252, 0.3);
  }
  
  .w-64 .p-6 {
    padding: 1rem;
  }
  
  .futuristic-header {
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .futuristic-title-medium {
    font-size: 1.25rem;
  }
  
  /* 下拉选择器调整 */
  .w-64 select {
    font-size: 0.875rem;
    padding: 0.75rem 2.5rem 0.75rem 0.75rem;
  }
  
  .w-64 .futuristic-card {
    padding: 0.75rem;
  }
  
  .w-64 .futuristic-icon-container {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .w-64 .futuristic-icon-container svg {
    width: 1rem;
    height: 1rem;
  }
  
  /* 主内容区域调整 */
  .flex-1 {
    padding: 1rem;
  }
  
  /* 卡片布局调整 */
  .futuristic-card {
    margin-bottom: 1.5rem;
    padding: 1rem;
  }
  
  .futuristic-header {
    margin-bottom: 1rem;
  }
  
  .futuristic-title-small {
    font-size: 1rem;
  }
  
  /* 表单控件调整 */
  .futuristic-input {
    padding: 0.75rem;
    font-size: 1rem;
  }
  
  select.futuristic-input {
    padding: 0.75rem;
    background-size: 1rem;
  }
  
  /* 按钮调整 */
  .futuristic-btn-primary,
  .futuristic-btn-secondary,
  .futuristic-btn-danger {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    width: 100%;
    justify-content: center;
  }
  
  .flex.items-center.space-x-4 {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .flex.items-center.space-x-4 > * {
    margin-left: 0;
    margin-right: 0;
  }
  
  /* 网格布局调整 */
  .grid.grid-cols-2.md\:grid-cols-3.lg\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  /* 开关控件调整 */
  .toggle-switch {
    transform: scale(1.1);
  }
  
  /* 滑块调整 */
  input[type="range"] {
    height: 6px;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    width: 20px;
    height: 20px;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
  }
  
  /* 背景文件网格调整 */
  .grid.grid-cols-2.md\:grid-cols-3.lg\:grid-cols-4.gap-4 {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  /* 主题标签页调整 */
  .flex.space-x-1.p-1 {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .flex.space-x-1.p-1 button {
    width: 100%;
    text-align: center;
  }
  
  /* 上传区域调整 */
  .border-2.border-dashed {
    padding: 2rem 1rem;
  }
  
  .futuristic-icon-container {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .futuristic-icon-container svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  /* 响应式动画调整 */
  .futuristic-card:hover {
    transform: none;
  }
  
  .setting-item:hover {
    transform: none;
  }
  
  .futuristic-btn-primary:hover, 
  .futuristic-btn-secondary:hover, 
  .futuristic-btn-danger:hover {
    transform: none;
  }
  
  .toggle-switch:hover {
    transform: scale(1.1);
  }
  
  select:focus,
  input[type="text"]:focus, 
  input[type="password"]:focus, 
  textarea:focus {
    transform: none;
  }
}

@media (max-width: 480px) {
  /* 超小屏幕优化 */
  .flex-1 {
    padding: 0.75rem;
  }
  
  .futuristic-card {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .futuristic-title-medium {
    font-size: 1.125rem;
  }
  
  .futuristic-title-small {
    font-size: 0.875rem;
  }
  
  .w-72 nav button {
    min-width: 80px;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .grid.grid-cols-2.md\:grid-cols-3.lg\:grid-cols-4 {
    grid-template-columns: 1fr;
  }
  
  .border-2.border-dashed {
    padding: 1.5rem 0.75rem;
  }
  
  .futuristic-input {
    padding: 0.625rem;
    font-size: 0.875rem;
  }
  
  .futuristic-btn-primary,
  .futuristic-btn-secondary,
  .futuristic-btn-danger {
    padding: 0.625rem 1rem;
    font-size: 0.75rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .futuristic-btn-primary,
  .futuristic-btn-secondary,
  .futuristic-btn-danger {
    min-height: 44px;
  }
  
  .toggle-switch {
    min-height: 44px;
    min-width: 44px;
  }
  
  .futuristic-input {
    min-height: 44px;
  }
  
  select.futuristic-input {
    min-height: 44px;
  }
  
  input[type="range"] {
    height: 8px;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
  }
}
</style>