import { ref, computed } from 'vue'

// 简化的主题状态管理
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('cyber-theme')
  return savedTheme || 'dark' // 默认深色主题
}

const currentTheme = ref(getInitialTheme())

// 动态加载主题CSS文件
const loadThemeCSS = (theme) => {
  // 移除之前的主题CSS
  const existingThemeLink = document.querySelector('link[data-theme-css]')
  if (existingThemeLink) {
    existingThemeLink.remove()
  }
  
  // 移除之前的涟漪CSS
  const existingRippleLink = document.querySelector('link[data-ripple-css]')
  if (existingRippleLink) {
    existingRippleLink.remove()
  }
  
  // 创建新的主题CSS链接
  const themeLink = document.createElement('link')
  themeLink.rel = 'stylesheet'
  themeLink.href = `/theme-${theme}.css`
  themeLink.setAttribute('data-theme-css', theme)
  document.head.appendChild(themeLink)
  
  // 创建新的涟漪CSS链接
  const rippleLink = document.createElement('link')
  rippleLink.rel = 'stylesheet'
  rippleLink.href = `/ripple-${theme}.css`
  rippleLink.setAttribute('data-ripple-css', theme)
  document.head.appendChild(rippleLink)
  
  console.log(`[THEME] Loaded CSS files: theme-${theme}.css and ripple-${theme}.css`)
}

// 简化的主题应用函数 - 动态加载CSS文件
const applyTheme = (theme) => {
  // 加载对应的CSS文件
  loadThemeCSS(theme)
  
  // 设置data-theme属性（保留用于其他可能的用途）
  document.documentElement.setAttribute('data-theme', theme)
  
  console.log(`[THEME] Applied theme: ${theme}`)
}



// 立即应用初始主题
applyTheme(currentTheme.value)

// 简化的主题切换函数
export function useTheme() {
  // 简单的主题切换 - 只在light和dark之间切换
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    
    // 立即保存和应用
    currentTheme.value = newTheme
    localStorage.setItem('cyber-theme', newTheme)
    applyTheme(newTheme)
    
    console.log(`[THEME] Toggled to: ${newTheme}`)
  }

  // 设置特定主题
  const setTheme = (theme) => {
    if (theme === 'light' || theme === 'dark') {
      currentTheme.value = theme
      localStorage.setItem('cyber-theme', theme)
      applyTheme(theme)
      console.log(`[THEME] Set to: ${theme}`)
    }
  }

  // 计算属性
  const isDarkMode = computed(() => currentTheme.value === 'dark')
  const themeClass = computed(() => currentTheme.value === 'dark' ? 'theme-dark' : 'theme-light')

  return {
    isDarkMode,
    actualTheme: currentTheme,
    currentTheme,
    themeClass,
    toggleTheme,
    setTheme
  }
}

// 导出响应式主题状态
export { currentTheme }