// 主题初始化工具
// 确保主题在应用启动时正确应用到DOM

import { useTheme } from '../composables/useTheme'
import settingsService from '../services/settingsService'

/**
 * 强制初始化主题到DOM
 * 解决Vercel部署时主题切换不生效的问题
 */
export function initializeTheme() {
  console.log('[THEME_INIT] Starting theme initialization...')
  
  // 获取当前主题设置
  const savedTheme = localStorage.getItem('cyber-theme')
  const globalTheme = settingsService.getSetting('theme')
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  
  // 确定最终主题
  let finalTheme = globalTheme || savedTheme || systemTheme
  
  console.log('[THEME_INIT] Theme sources:', {
    savedTheme,
    globalTheme,
    systemTheme,
    finalTheme
  })
  
  // 如果是auto模式，解析为具体主题
  if (finalTheme === 'auto') {
    finalTheme = systemTheme
  }
  
  console.log('[THEME_INIT] Resolved theme:', finalTheme)
  
  // 强制应用主题到DOM
  applyThemeToDOM(finalTheme)
  
  // 更新localStorage确保一致性
  if (!savedTheme || savedTheme !== finalTheme) {
    localStorage.setItem('cyber-theme', finalTheme)
    console.log('[THEME_INIT] Updated localStorage theme to:', finalTheme)
  }
  
  // 同步到全局设置
  if (!globalTheme || globalTheme !== finalTheme) {
    settingsService.setSetting('theme', finalTheme)
    console.log('[THEME_INIT] Updated global settings theme to:', finalTheme)
  }
  
  console.log('[THEME_INIT] Theme initialization completed')
}

/**
 * 直接应用主题到DOM
 * @param {string} theme - 主题名称 ('dark' | 'light')
 */
export function applyThemeToDOM(theme) {
  console.log('[THEME_INIT] Applying theme to DOM:', theme)
  
  const root = document.documentElement
  
  // 移除所有主题类
  root.classList.remove('theme-light', 'theme-dark')
  
  // 添加新主题类
  const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light'
  root.classList.add(themeClass)
  
  // 设置data-theme属性
  root.setAttribute('data-theme', theme)
  
  console.log('[THEME_INIT] Applied classes:', {
    removed: ['theme-light', 'theme-dark'],
    added: themeClass,
    dataTheme: theme
  })
  
  // 应用主题颜色变量
  applyThemeColors(theme)
  
  // 触发自定义事件通知其他组件
  window.dispatchEvent(new CustomEvent('theme-applied', {
    detail: { theme }
  }))
}

/**
 * 应用主题颜色变量
 * @param {string} theme - 主题名称
 */
function applyThemeColors(theme) {
  const root = document.documentElement
  
  const colors = theme === 'dark' ? {
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
  } : {
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
  
  // 应用CSS自定义属性
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--theme-${cssVar}`, value)
  })
  
  console.log('[THEME_INIT] Applied theme colors for:', theme)
}

/**
 * 监听系统主题变化
 */
export function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleSystemThemeChange = (e) => {
    const currentTheme = localStorage.getItem('cyber-theme')
    
    // 只有在auto模式或没有设置时才响应系统主题变化
    if (!currentTheme || currentTheme === 'auto') {
      const newTheme = e.matches ? 'dark' : 'light'
      console.log('[THEME_INIT] System theme changed to:', newTheme)
      applyThemeToDOM(newTheme)
    }
  }
  
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  
  return () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }
}

/**
 * 验证主题是否正确应用
 */
export function validateThemeApplication() {
  const root = document.documentElement
  const hasThemeClass = root.classList.contains('theme-dark') || root.classList.contains('theme-light')
  const hasDataTheme = root.hasAttribute('data-theme')
  const hasCSSVars = getComputedStyle(root).getPropertyValue('--theme-primary')
  
  console.log('[THEME_INIT] Theme validation:', {
    hasThemeClass,
    hasDataTheme,
    hasCSSVars: !!hasCSSVars,
    classList: Array.from(root.classList),
    dataTheme: root.getAttribute('data-theme'),
    primaryColor: hasCSSVars
  })
  
  return hasThemeClass && hasDataTheme && hasCSSVars
}