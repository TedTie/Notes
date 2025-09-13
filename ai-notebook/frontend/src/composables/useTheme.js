import { ref, computed, watch, onMounted } from 'vue'
import settingsService from '../services/settingsService'

// 主题状态
const currentTheme = ref('dark')

// 从全局设置服务获取主题设置
const loadThemeFromSettings = () => {
  const globalTheme = settingsService.getSetting('theme')
  if (globalTheme) {
    currentTheme.value = globalTheme
  } else {
    // 从localStorage获取保存的主题设置
    const savedTheme = localStorage.getItem('cyber-theme')
    if (savedTheme) {
      currentTheme.value = savedTheme
    } else {
      // 默认根据系统主题设置
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? 'dark' : 'light'
    }
  }
}

loadThemeFromSettings()

// 主题切换函数
export function useTheme() {
  // 切换主题
  const toggleTheme = () => {
    const themes = ['dark', 'light', 'auto']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    currentTheme.value = themes[nextIndex]
  }

  // 设置特定主题
  const setTheme = (theme) => {
    currentTheme.value = theme
  }

  // 实际显示的主题（考虑auto模式）
  const actualTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return currentTheme.value
  })

  // 是否为暗色模式
  const isDarkMode = computed(() => actualTheme.value === 'dark')

  // 当前主题名称
  const currentThemeName = computed(() => currentTheme.value)

  // 主题CSS类
  const themeClass = computed(() => actualTheme.value === 'dark' ? 'theme-dark' : 'theme-light')

  // 主题颜色配置
  const themeColors = computed(() => {
    if (isDarkMode.value) {
      return {
        primary: '#bb86fc',
        secondary: '#9c27b0',
        accent: '#e1bee7',
        bg: '#0a0a0f',
        surface: '#1a1a2e',
        text: '#e1bee7',
        border: '#bb86fc',
        glow: '#bb86fc',
        gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #2d1b69 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(187, 134, 252, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%)',
        glowShadow: '0 0 20px rgba(187, 134, 252, 0.3)',
        particleColor1: 'rgba(187, 134, 252, 0.3)',
        particleColor2: 'rgba(156, 39, 176, 0.2)',
        particleColor3: 'rgba(225, 190, 231, 0.1)'
      }
    } else {
      return {
        primary: '#00e5ff',
        secondary: '#00bcd4',
        accent: '#4dd0e1',
        bg: '#f0f8ff',
        surface: '#e1f5fe',
        text: '#003d40',
        border: '#4dd0e1',
        glow: '#00e5ff',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(0, 188, 212, 0.05) 100%)',
        glowShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
        particleColor1: 'rgba(0, 229, 255, 0.3)',
        particleColor2: 'rgba(0, 188, 212, 0.2)',
        particleColor3: 'rgba(77, 208, 225, 0.1)'
      }
    }
  })

  // 监听主题变化，保存到localStorage和全局设置
  watch(currentTheme, (newValue) => {
    localStorage.setItem('cyber-theme', newValue)
    
    // 同步到全局设置
    settingsService.setSetting('theme', newValue)
    
    // 更新document的主题类
    document.documentElement.classList.remove('theme-light', 'theme-dark')
    document.documentElement.classList.add(actualTheme.value === 'dark' ? 'theme-dark' : 'theme-light')
    
    // 更新CSS自定义属性
    const colors = themeColors.value
    const root = document.documentElement
    
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-secondary', colors.secondary)
    root.style.setProperty('--theme-accent', colors.accent)
    root.style.setProperty('--theme-bg', colors.bg)
    root.style.setProperty('--theme-surface', colors.surface)
    root.style.setProperty('--theme-text', colors.text)
    root.style.setProperty('--theme-border', colors.border)
    root.style.setProperty('--theme-glow', colors.glow)
    root.style.setProperty('--theme-gradient', colors.gradient)
    root.style.setProperty('--theme-card-gradient', colors.cardGradient)
    root.style.setProperty('--theme-glow-shadow', colors.glowShadow)
    root.style.setProperty('--theme-particle-1', colors.particleColor1)
    root.style.setProperty('--theme-particle-2', colors.particleColor2)
    root.style.setProperty('--theme-particle-3', colors.particleColor3)
  }, { immediate: true })

  // 监听全局设置变更事件
  onMounted(() => {
    const handleSettingsChange = (event) => {
      if (event.detail?.settings?.theme) {
        const newTheme = event.detail.settings.theme
        if (newTheme !== currentTheme.value) {
          currentTheme.value = newTheme
        }
      }
    }

    const handleThemeChange = (event) => {
      if (event.detail?.theme) {
        const newTheme = event.detail.theme
        if (newTheme !== currentTheme.value) {
          currentTheme.value = newTheme
        }
      }
    }

    window.addEventListener('settings-changed', handleSettingsChange)
    window.addEventListener('theme-change', handleThemeChange)

    // 监听全局设置服务变更
    const removeListener = settingsService.addListener((newSettings) => {
      if (newSettings.theme && newSettings.theme !== currentTheme.value) {
        currentTheme.value = newSettings.theme
      }
    })

    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange)
      window.removeEventListener('theme-change', handleThemeChange)
      removeListener()
    }
  })

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('cyber-theme')) {
      isDarkMode.value = e.matches
    }
  })

  return {
    isDarkMode,
    actualTheme,
    currentTheme: currentThemeName,
    themeClass,
    themeColors,
    toggleTheme,
    setTheme
  }
}

// 导出响应式主题状态供全局使用
export { currentTheme }