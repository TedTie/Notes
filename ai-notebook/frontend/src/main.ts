import { createApp } from 'vue'
import './style.css'
import './assets/mobile-nav.css'
import App from './App.vue'
import { initMobileDetection } from './utils/mobileDetection.js'
import { initializeTheme } from './utils/themeInitializer.js'

// 在应用启动前初始化移动端检测
initMobileDetection()

// 在应用启动前初始化主题
initializeTheme()

createApp(App).mount('#app')
