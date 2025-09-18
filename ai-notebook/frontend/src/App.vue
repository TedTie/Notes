<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import DynamicBackground from './components/DynamicBackground.vue'
import TopNavigation from './components/TopNavigation.vue'
import NoteEditor from './components/NoteEditor.vue'
import TodoList from './components/TodoList.vue'
import ProjectView from './components/ProjectView.vue'
import Settings from './components/Settings.vue'
import FloatingAIAssistant from './components/FloatingAIAssistant.vue'
import AIAssistantPage from './components/AIAssistantPage.vue'
import PomodoroView from './components/PomodoroView.vue'
// import TestComponent from './components/TestComponent.vue'
// import SimpleAITest from './components/SimpleAITest.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import TracingBeam from './components/TracingBeam.vue'

import StaticBackground from './components/StaticBackground.vue'
import PreloadManager from './components/PreloadManager.vue'
import SimpleLoading from './components/SimpleLoading.vue'
import SplashScreen from './components/SplashScreen.vue'
import BackgroundRippleEffect from './components/BackgroundRippleEffect.vue'
import settingsService from './services/settingsService'
import languageService from './services/languageService'
import { useTheme } from './composables/useTheme'
import { settingsService as supabaseSettingsService, fileService } from './services/supabaseService'
import { PERFORMANCE_CONFIG } from './config/performance.js'
import apiStatusService from './services/apiStatusService'
// 主题初始化已在main.ts中处理
// 移除了API_CONFIG相关代码

const currentView = ref('notes')
const isLoading = ref(false)
const showSimpleLoading = ref(false)
const showSplashScreen = ref(true)
const selectedTask = ref(null)

const currentTheme = computed(() => settingsService.settings.theme || 'dark')
const { actualTheme, isDarkMode } = useTheme()

// 强制重新渲染的响应式变量
const forceUpdateKey = ref(0)
const forceUpdate = () => {
  forceUpdateKey.value++
}

// 设置通知系统
const setupNotificationSystem = () => {
  const notificationContainer = document.getElementById('settings-notifications')
  if (notificationContainer) {
    const handleNotification = (event: CustomEvent) => {
      const { message, type } = event.detail
      showNotification(message, type)
    }



    const showNotification = (message: string, type = 'info') => {
      const notification = document.createElement('div')
      notification.className = `settings-notification settings-notification-${type}`
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-message">${message}</span>
          <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `
      
      notificationContainer.appendChild(notification)
      
      // 自动移除通知
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 5000) // 演示模式通知显示更长时间
    }

    window.addEventListener('setting-notification', handleNotification)
    
    return () => {
      window.removeEventListener('setting-notification', handleNotification)
    }
  }
}

// 移动端检测函数（基于屏幕比例优化）
const detectMobileDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth <= 768 || window.screen.width <= 768
  const isPortrait = window.innerHeight > window.innerWidth
  
  // 基于屏幕宽高比的判断
  const screenWidth = window.innerWidth || window.screen.width
  const screenHeight = window.innerHeight || window.screen.height
  const aspectRatio = screenWidth / screenHeight
  
  // 电脑端常见比例: 4:3 (1.33), 16:9 (1.78), 16:10 (1.6)
  // 手机端常见比例: 19:9 (2.11), 20:9 (2.22), 21:9 (2.33), 18:9 (2.0)
  const isMobileAspectRatio = aspectRatio < 1.0 || // 竖屏模式
                                  (aspectRatio > 2.0 && screenWidth <= 1024) || // 超宽但屏幕小
                                  (aspectRatio >= 1.8 && aspectRatio <= 2.4 && screenWidth <= 768) // 手机横屏
      
      // 综合判断移动设备 - 更严格的判断条件
      const isMobile = isMobileUA || 
                       (isTouchDevice && isSmallScreen) || 
                       (isSmallScreen && isPortrait) ||
                       isMobileAspectRatio
  
  if (isMobile) {
    document.documentElement.classList.add('force-mobile')
    document.body.classList.add('mobile-device')
  } else {
    document.documentElement.classList.remove('force-mobile')
    document.body.classList.remove('mobile-device')
  }
  
  return isMobile
}

onMounted(async () => {
  try {
    // 立即执行移动端检测
    detectMobileDevice()
    
    // 监听窗口大小变化
    window.addEventListener('resize', detectMobileDevice)
    window.addEventListener('orientationchange', () => {
      setTimeout(detectMobileDevice, 100)
    })
    
    // 初始化设置服务
    await settingsService.loadSettings()

    // 初始化API状态监控服务
    console.log('[APP] Initializing API status monitoring...')
    await apiStatusService.checkSupabaseConnection()
    apiStatusService.startPeriodicCheck(5) // 每5分钟检查一次
    console.log('[APP] API status monitoring initialized')
    
    // 加载并应用当前背景设置
    await loadCurrentBackground()
    
    // Listen for settings changes to apply globally
    settingsService.addListener(() => {
      // Settings updated globally
    })
    
    // 监听背景应用事件
    const handleApplyBackground = (event: CustomEvent) => {
      const { file } = event.detail
      applyBackground(file)
    }
    
    // 监听背景清除事件
    const handleClearBackground = () => {
      clearBackground()
    }
    
    window.addEventListener('apply-background', handleApplyBackground)
    window.addEventListener('clear-background', handleClearBackground)
    
    // 主题切换现在完全依赖CSS，不需要复杂的事件监听
    
    // 设置通知系统
    const cleanupNotifications = setupNotificationSystem()
    
    // 监听语言变化
    const handleLanguageChange = (lang: string) => {
      // 更新响应式语言状态
      currentLanguage.value = lang
    }
    
    const removeLanguageListener = languageService.addListener(handleLanguageChange)
    
    // 应用初始化完成后隐藏加载页面
    setTimeout(() => {
      isLoading.value = false
    }, 2000)
    
    // 存储清理函数以便在onUnmounted中使用
    window.appCleanupFunctions = {
      cleanupNotifications,
      removeLanguageListener,
      handleApplyBackground,
      handleClearBackground
    }
    
    // 暴露SimpleLoading控制函数到全局
    window.showSimpleLoading = showSimpleLoadingPage
    window.hideSimpleLoading = hideSimpleLoadingPage
  } catch (error) {
    console.error('应用初始化失败:', error)
    isLoading.value = false
  }
})

// 加载浅色主题背景设置 - 使用Supabase服务
const loadBackgroundLight = async () => {
  try {
    console.log(`[APP] ===== Loading LIGHT theme background ===== (timestamp: ${Date.now()})`)
    console.log(`[APP] Current isDarkMode.value:`, isDarkMode.value)
    console.log(`[APP] Current actualTheme.value:`, actualTheme.value)
    
    const backgroundSetting = await supabaseSettingsService.getSetting('background_light')
    console.log(`[APP] Light theme background response:`, backgroundSetting)
    
    if (backgroundSetting) {
      console.log(`[APP] Found background setting for light theme:`, backgroundSetting)
      // 获取背景文件信息
      const files = await fileService.getBackgroundsList()
      console.log(`[APP] All background files:`, files)
      // 确保URL是完整的
      const filesWithFullUrl = files.map(file => ({
        ...file,
        url: file.url && typeof file.url === 'string' && file.url.startsWith('http') ? file.url : `${file.url || ''}`
      }))
      const currentFile = filesWithFullUrl.find(file => file.id === backgroundSetting || file.name === backgroundSetting || file.path === backgroundSetting)
      console.log(`[APP] Found light theme background file:`, currentFile)
      if (currentFile) {
        console.log(`[APP] Applying light theme background:`, currentFile.url)
        applyBackground(currentFile)
        console.log(`[APP] Light theme background applied successfully`)
      } else {
        console.log(`[APP] Light theme background file not found in files list, clearing background`)
        clearBackground()
      }
    } else {
      console.log(`[APP] No background setting found for light theme, clearing background`)
      clearBackground()
    }
  } catch (error) {
    console.error('加载浅色主题背景设置失败:', error)
    clearBackground()
  }
}

// 加载深色主题背景设置 - 使用Supabase服务
const loadBackgroundDark = async () => {
  try {
    console.log(`[APP] ===== Loading DARK theme background ===== (timestamp: ${Date.now()})`)
    console.log(`[APP] Current isDarkMode.value:`, isDarkMode.value)
    console.log(`[APP] Current actualTheme.value:`, actualTheme.value)
    
    const backgroundSetting = await supabaseSettingsService.getSetting('background_dark')
    console.log(`[APP] Dark theme background response:`, backgroundSetting)
    
    if (backgroundSetting) {
      console.log(`[APP] Found background setting for dark theme:`, backgroundSetting)
      // 获取背景文件信息
      const files = await fileService.getBackgroundsList()
      console.log(`[APP] All background files:`, files)
      // 确保URL是完整的
      const filesWithFullUrl = files.map(file => ({
        ...file,
        url: file.url && typeof file.url === 'string' && file.url.startsWith('http') ? file.url : `${file.url || ''}`
      }))
      const currentFile = filesWithFullUrl.find(file => file.id === backgroundSetting || file.name === backgroundSetting || file.path === backgroundSetting)
      console.log(`[APP] Found dark theme background file:`, currentFile)
      if (currentFile) {
        console.log(`[APP] Applying dark theme background:`, currentFile.url)
        applyBackground(currentFile)
        console.log(`[APP] Dark theme background applied successfully`)
      } else {
        console.log(`[APP] Dark theme background file not found in files list, clearing background`)
        clearBackground()
      }
    } else {
      console.log(`[APP] No background setting found for dark theme, clearing background`)
      clearBackground()
    }
  } catch (error) {
    console.error('加载深色主题背景设置失败:', error)
    clearBackground()
  }
}

// 增强的背景加载函数 - 使用Supabase服务
const loadCurrentBackground = async () => {
  try {
    // 确保使用最新的主题状态
    const currentTheme = isDarkMode.value ? 'dark' : 'light'
    console.log(`[APP] Loading current background for theme: ${currentTheme}`)
    
    // 使用Supabase获取背景设置 - 修复设置键不一致问题
    const backgroundSetting = await supabaseSettingsService.getSetting(`current_background_${currentTheme}`)
    console.log(`[APP] Background setting for ${currentTheme} theme:`, backgroundSetting)
    
    if (backgroundSetting) {
      // 获取背景文件列表
      console.log(`[APP] Calling fileService.getBackgroundsList()...`)
      const files = await fileService.getBackgroundsList()
      console.log(`[APP] Raw files from fileService:`, files)
      console.log(`[APP] Looking for backgroundSetting:`, backgroundSetting)
      
      const filesWithFullUrl = files.map(file => ({
        ...file,
        url: file.url && typeof file.url === 'string' && file.url.startsWith('http') ? file.url : `${file.url || ''}`
      }))
      console.log(`[APP] Files with full URL:`, filesWithFullUrl)
      
      // 详细的查找过程
      console.log(`[APP] Searching for file with:`);
      console.log(`[APP] - ID: ${backgroundSetting}`);
      filesWithFullUrl.forEach((file, index) => {
        console.log(`[APP] File ${index}:`, {
          id: file.id,
          name: file.name,
          path: file.path,
          idMatch: file.id === backgroundSetting,
          nameMatch: file.name === backgroundSetting,
          pathMatch: file.path === backgroundSetting
        });
      });
      
      const currentFile = filesWithFullUrl.find(file => file.id === backgroundSetting || file.name === backgroundSetting || file.path === backgroundSetting)
      
      if (currentFile) {
        console.log(`[APP] Found matching file:`, currentFile)
        console.log(`[APP] Applying background: ${currentFile.url}`)
        applyBackground(currentFile)
      } else {
        console.warn(`[APP] Background file not found: ${backgroundSetting}`)
        console.warn(`[APP] Available files:`, filesWithFullUrl.map(f => ({ id: f.id, name: f.name, path: f.path })))
        clearBackground()
      }
    } else {
      console.log(`[APP] No background set for ${currentTheme} theme`)
      clearBackground()
    }
  } catch (error) {
    console.error('[APP] Error loading current background:', error)
    clearBackground()
  }
}

// 修复主题切换监听逻辑 - 监听 isDarkMode 而不是 actualTheme
watch(isDarkMode, async (newIsDark, oldIsDark) => {
  // 避免初始化时的无效触发
  if (oldIsDark === undefined) {
    return
  }
  
  console.log('[APP] isDarkMode changed from', oldIsDark, 'to', newIsDark)
  
  // 强制重新渲染以确保主题变更立即生效
  forceUpdate()
  
  // 使用防抖机制避免频繁切换
  if (window.themeSwitchTimeout) {
    clearTimeout(window.themeSwitchTimeout)
  }
  
  window.themeSwitchTimeout = setTimeout(async () => {
    try {
      console.log(`[APP] Loading background for ${newIsDark ? 'DARK' : 'LIGHT'} theme`)
      await loadCurrentBackground()
    } catch (error) {
      console.error('[APP] Error loading theme background:', error)
      // 出错时清除背景而不是保持原样
      clearBackground()
    }
  }, 50) // 50ms 防抖延迟，提升响应速度
})

// 调试：监控actualTheme的值
watch(() => actualTheme.value, (newValue) => {
  console.log('[APP] actualTheme value changed to:', newValue)
}, { immediate: true })

// 当前用户背景
const currentUserBackground = ref(null)

// 应用背景
const applyBackground = (file: any) => {
  console.log(`[APP] applyBackground called with file:`, file)
  console.log(`[APP] Current theme: ${isDarkMode.value ? 'dark' : 'light'}`)
  if (file && file.type) {
    if ((file.type && file.type.startsWith('image/')) || file.type === 'image') {
      console.log(`[APP] Setting image background:`, file.url)
      currentUserBackground.value = file.url
    } else if ((file.type && file.type.startsWith('video/')) || file.type === 'video') {
      console.log(`[APP] Setting video background:`, file.url)
      currentUserBackground.value = file.url
    } else {
      console.log(`[APP] Unknown file type, clearing background:`, file.type)
      currentUserBackground.value = null
    }
  } else if (file && file.url) {
    // 如果没有type信息但有URL，尝试从URL推断类型
    console.log(`[APP] No type info, inferring from URL:`, file.url)
    const url = file.url.toLowerCase()
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
      console.log(`[APP] Inferred image type, setting background:`, file.url)
      currentUserBackground.value = file.url
    } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      console.log(`[APP] Inferred video type, setting background:`, file.url)
      currentUserBackground.value = file.url
    } else {
      console.log(`[APP] Cannot infer type from URL, clearing background`)
      currentUserBackground.value = null
    }
  } else {
    console.log(`[APP] No valid file provided, clearing background`)
    currentUserBackground.value = null
  }
  console.log(`[APP] currentUserBackground.value set to:`, currentUserBackground.value)
}

// 清除背景
const clearBackground = () => {
  console.log(`[APP] clearBackground called - Current theme: ${isDarkMode.value ? 'dark' : 'light'}`)
  console.log(`[APP] Previous background:`, currentUserBackground.value)
  currentUserBackground.value = null
  console.log(`[APP] Background cleared, currentUserBackground.value:`, currentUserBackground.value)
}

// 组件卸载时清理
onUnmounted(() => {
  // 停止API状态监控
  console.log('[APP] Stopping API status monitoring...')
  apiStatusService.stopPeriodicCheck()

  if (window.appCleanupFunctions) {
    const { cleanupNotifications, removeLanguageListener, handleApplyBackground, handleClearBackground } = window.appCleanupFunctions
    if (cleanupNotifications) cleanupNotifications()
    if (removeLanguageListener) removeLanguageListener()
    if (handleApplyBackground) window.removeEventListener('apply-background', handleApplyBackground)
    if (handleClearBackground) window.removeEventListener('clear-background', handleClearBackground)
    delete window.appCleanupFunctions
  }
})

const setView = (view: string) => {
  currentView.value = view
}

const setCurrentView = (view: string) => {
  currentView.value = view
}

const handleStartPomodoro = (taskInfo: any) => {
  selectedTask.value = taskInfo
}

// 预加载完成处理
const handlePreloadComplete = () => {
  console.log('预加载完成，应用准备就绪')
  
  // 延迟隐藏加载屏幕，确保平滑过渡
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}

// 预加载错误处理
const handlePreloadError = (error: Error) => {
  console.error('预加载失败:', error)
  
  // 即使预加载失败，也要显示应用界面
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

// 启动页面完成处理
const handleSplashComplete = () => {
  console.log('启动页面完成，进入主应用')
  showSplashScreen.value = false
}

// 简单加载完成处理
const handleSimpleLoadingComplete = () => {
  console.log('简单加载完成')
  showSimpleLoading.value = false
}

// 显示简单加载
const showSimpleLoadingPage = () => {
  showSimpleLoading.value = true
}

// 隐藏简单加载
const hideSimpleLoadingPage = () => {
  showSimpleLoading.value = false
}

// 响应式语言状态
const currentLanguage = ref(languageService.getLanguage())

// 移除了hideDemoBanner方法



// 在script setup中，所有变量都会自动暴露给模板

const getPageTitle = computed(() => {
  // 依赖 currentLanguage 来触发响应式更新
  currentLanguage.value
  switch (currentView.value) {
    case 'notes': return languageService.t('notes')
    case 'todos': return languageService.t('todos')
    case 'projects': return '项目管理'
    case 'ai': return languageService.t('ai_assistant')
    case 'audio': return languageService.t('audio_analysis')
    case 'settings': return languageService.t('settings')
    default: return languageService.t('ai_assistant')
  }
})

const getPageDescription = computed(() => {
  // 依赖 currentLanguage 来触发响应式更新
  const lang = currentLanguage.value
  if (lang === 'zh-CN') {
    switch (currentView.value) {
      case 'notes': return '智能编辑，AI增强的笔记体验'
      case 'todos': return '高效管理，智能提醒的任务系统'
      case 'projects': return 'AI增强的项目管理，看板式任务协作'
      case 'ai': return '智能对话，多模型AI助手'
      case 'pomodoro': return '专注工作，高效休息的番茄时钟'
      case 'settings': return '个性化配置，打造专属工作空间'
      default: return '全能AI助手，随时为您服务'
    }
  } else {
    switch (currentView.value) {
      case 'notes': return 'Smart editing with AI-enhanced note experience'
      case 'todos': return 'Efficient management with intelligent reminder system'
      case 'projects': return 'AI-enhanced project management with Kanban-style collaboration'
      case 'ai': return 'Intelligent conversation with multi-model AI assistant'
      case 'pomodoro': return 'Focus work and efficient rest with Pomodoro Timer'
      case 'settings': return 'Personalized configuration for your workspace'
      default: return 'All-in-one AI assistant, ready to serve you'
    }
  }
})
</script>

<template>
  <!-- 启动页面 -->
  <SplashScreen 
    v-if="showSplashScreen"
    :visible="showSplashScreen"
    :duration="3000"
    @complete="handleSplashComplete"
  />
  
  <!-- 简单加载页面 -->
  <SimpleLoading 
    v-if="showSimpleLoading"
    :visible="showSimpleLoading"
    text="加载中..."
    @loaded="handleSimpleLoadingComplete"
  />
  
  <!-- 预加载管理器 -->
  <PreloadManager 
    v-if="isLoading" 
    @loaded="handlePreloadComplete"
    @error="handlePreloadError"
    :auto-hide="true"
    :min-display-time="1000"
  />

  <!-- 主应用界面 -->
  <div v-else class="min-h-screen relative" :data-theme="currentTheme" :key="forceUpdateKey">
    <!-- 设置通知系统 -->
    <div class="settings-notification-container" id="settings-notifications"></div>
    
    <!-- 静态背景层 (z-index: 1) -->
    <StaticBackground v-if="!currentUserBackground" />
    
    <!-- 用户自定义背景层 (z-index: 1) -->
    <div 
      v-if="currentUserBackground" 
      class="fixed inset-0 pointer-events-none"
      :style="{
        backgroundImage: `url(${currentUserBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.9,
        zIndex: 1
      }"
    ></div>
    
    <!-- 动态效果层 (z-index: 3) -->
    <DynamicBackground />
    
    <!-- 背景涟漪效果层 (z-index: 4) -->
    <BackgroundRippleEffect 
      :cell-size="40" 
      :interactive="true" 
    />
    

    

     
     <!-- 顶部导航和主题切换 -->
     <div class="fixed top-0 right-0 z-50 p-4 mobile-nav-container">
      <div class="flex items-center space-x-3">
        <!-- 主题切换按钮 -->
        <ThemeToggle />
        <!-- 顶部导航 -->
        <TopNavigation 
          :current-view="currentView"
          @set-view="setView"
        />
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <main class="relative z-20 min-h-screen main-content" :key="forceUpdateKey" style="pointer-events: none;">
      <TracingBeam style="pointer-events: none;">
        <!-- 内容容器 -->
        <div class="container mx-auto px-6 py-8 content-container" style="pointer-events: auto;">
          <!-- 页面标题 -->
          <div class="mb-8 text-left page-header">
            <h1 class="futuristic-title-large mb-2 page-title">
              {{ getPageTitle }}
            </h1>
            <p class="futuristic-subtitle page-description">
              {{ getPageDescription }}
            </p>
          </div>
          
          <!-- 内容区域 -->
          <div class="max-w-7xl mx-auto content-wrapper" style="pointer-events: none;">
            <Transition name="page" mode="out-in">
              <div :key="`${currentView}-${forceUpdateKey}`" class="min-h-[600px]" style="pointer-events: auto;">
                <NoteEditor v-if="currentView === 'notes'" />
                <TodoList v-else-if="currentView === 'todos'" @set-view="setCurrentView" @start-pomodoro="handleStartPomodoro" />
                <ProjectView v-else-if="currentView === 'projects'" />
                <AIAssistantPage v-else-if="currentView === 'ai'" />
                <PomodoroView v-else-if="currentView === 'pomodoro'" :selected-task="selectedTask" />
                <Settings v-else-if="currentView === 'settings'" />
                <div v-else class="flex items-center justify-center min-h-[400px]">
                  <div class="futuristic-card text-center p-12 max-w-md">
                  <svg class="w-24 h-24 mb-4 text-cyber-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
                  <h2 class="futuristic-title mb-4">AI智能助手</h2>
                  <p class="futuristic-subtitle mb-6">强大的AI功能即将上线</p>
                  <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--theme-surface);">
                    <div class="h-full rounded-full animate-pulse" style="width: 85%; background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));"></div>
                  </div>
                  <p class="text-sm mt-2 futuristic-subtitle">开发进度 85%</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      </TracingBeam>
    </main>
    
    <!-- 全局AI助手 -->
    <FloatingAIAssistant />
  </div>
</template>

<style scoped>
/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 故障效果动画 */
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

.glitch-text:hover {
  animation: glitch 0.3s;
}
.settings-notification-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 15000;
  padding: 1rem;
  pointer-events: none;
}

.settings-notification {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  animation: slideInRight 0.3s ease-out;
  min-width: 300px;
}

.notification-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #e1bee7;
  font-size: 0.875rem;
}

.notification-message {
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: #e1bee7;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.notification-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.settings-notification-success {
  border-color: rgba(0, 255, 0, 0.3);
  background: linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 255, 255, 0.1));
}

.settings-notification-error {
  border-color: rgba(255, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 0, 255, 0.1));
}

.settings-notification-info {
  border-color: rgba(0, 255, 255, 0.3);
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 主题变量 */
:root {
  --theme-primary: #bb86fc;
  --theme-secondary: #9c27b0;
  --theme-accent: #e1bee7;
  --theme-bg: #0a0a0f;
  --theme-surface: #1a1a2e;
  --theme-text: #e1bee7;
  --theme-border: #bb86fc;
  --theme-glow: #bb86fc;
}

[data-theme="light"] {
  --theme-primary: #00e5ff;
  --theme-secondary: #00bcd4;
  --theme-accent: #4dd0e1;
  --theme-bg: #f0f8ff;
  --theme-surface: #e1f5fe;
  --theme-text: #006064;
  --theme-border: #4dd0e1;
  --theme-glow: #00e5ff;
}

/* 移动端响应式设计 - 增强移动端检测 */
@media (max-width: 768px), (hover: none) and (pointer: coarse), (max-device-width: 768px) {
  .mobile-nav-container {
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }
  
  .mobile-nav-container .flex {
    justify-content: space-between;
    width: 100%;
  }
  
  .main-content {
    padding-top: 80px; /* 为固定导航留出空间 */
  }
  
  .content-container {
    padding: 1rem;
  }
  
  .page-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .page-title {
    font-size: 1.75rem !important;
    line-height: 1.2;
    margin-bottom: 0.5rem;
  }
  
  .page-description {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .content-wrapper {
    max-width: 100%;
  }
  
  /* 页面内容最小高度调整 */
  .content-wrapper > div > div {
    min-height: calc(100vh - 200px) !important;
  }
}

@media (max-width: 480px), (max-device-width: 480px) {
  .mobile-nav-container {
    padding: 0.75rem;
  }
  
  .main-content {
    padding-top: 70px;
  }
  
  .content-container {
    padding: 0.75rem;
  }
  
  .page-title {
    font-size: 1.5rem !important;
  }
  
  .page-description {
    font-size: 0.85rem;
  }
  
  /* 更紧凑的间距 */
  .page-header {
    margin-bottom: 1rem;
  }
}

/* 强制移动端布局 - 针对所有可能的移动设备 */
@media screen and (max-width: 1024px) and (orientation: portrait),
       screen and (max-width: 1366px) and (orientation: landscape) and (max-height: 1024px),
       (hover: none) and (pointer: coarse) {
  .mobile-nav-container {
    display: block !important;
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
  
  .main-content {
    padding-top: 80px !important;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .mobile-nav-container {
    padding: 1rem;
  }
  
  .main-content {
    padding-top: 85px;
  }
  
  /* 确保触摸目标足够大 */
  button, .clickable {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 移除了演示模式横幅样式 */
</style>
