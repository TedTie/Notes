import { ref } from 'vue'

// 简化的主题初始化
export function initializeTheme() {
  // 获取初始主题
  const savedTheme = localStorage.getItem('cyber-theme')
  const initialTheme = savedTheme || 'dark'
  
  console.log(`[THEME INIT] Initializing with theme: ${initialTheme}`)
  
  // 应用主题
  applyThemeToDOM(initialTheme)
  
  return initialTheme
}

// 动态加载主题CSS文件
function loadThemeCSS(theme) {
  // 移除之前的主题CSS
  const existingThemeLink = document.querySelector('link[data-theme-css]')
  if (existingThemeLink) {
    existingThemeLink.remove()
  }
  
  // 创建新的主题CSS链接 - 修复路径问题
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  // 使用相对路径，适应生产环境
  link.href = `./src/styles/theme-${theme}.css`
  link.setAttribute('data-theme-css', theme)
  
  // 添加到head中
  document.head.appendChild(link)
  
  console.log(`[THEME INIT] Loaded CSS file: theme-${theme}.css`)
}

// 简化的主题应用到DOM
function applyThemeToDOM(theme) {
  // 加载对应的CSS文件
  loadThemeCSS(theme)
  
  // 设置data-theme属性（保留用于其他可能的用途）
  document.documentElement.setAttribute('data-theme', theme)
  
  console.log(`[THEME INIT] Applied theme: ${theme} to DOM`)
}