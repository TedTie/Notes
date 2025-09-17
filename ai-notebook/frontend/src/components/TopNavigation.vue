<template>
  <!-- 导航菜单 -->
  <div class="navigation-container">
    <!-- 桌面端导航 -->
    <div class="desktop-nav flex items-center space-x-2 bg-black/20 backdrop-blur-md rounded-xl p-2">
      <button
        v-for="item in menuItems"
        :key="item.id"
        @click="selectMenuItem(item.id)"
        :class="[
          'relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 group',
          currentView === item.id 
            ? 'futuristic-btn-active scale-110' 
            : 'futuristic-btn-secondary hover:scale-105'
        ]"
        :title="item.label + ' (' + item.shortcut + ')'"
      >
        <!-- 图标 -->
        <div class="text-lg group-hover:scale-110 transition-transform duration-300" v-html="item.icon">
        </div>
        
        <!-- 活跃状态指示器 -->
        <div 
          v-if="currentView === item.id"
          class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-pulse" 
          style="background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));"
        ></div>
      </button>
    </div>

    <!-- 移动端导航 -->
    <div class="mobile-nav">
      <!-- 汉堡菜单按钮 -->
      <button
        @click="toggleMobileMenu"
        class="hamburger-btn flex items-center justify-center w-12 h-12 rounded-lg bg-black/20 backdrop-blur-md transition-all duration-300"
        :class="{ 'active': isMobileMenuOpen }"
      >
        <div class="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <!-- 当前页面指示器 -->
      <div class="current-page-indicator flex items-center space-x-2 bg-black/20 backdrop-blur-md rounded-xl px-3 py-2">
        <div class="text-lg" v-html="currentMenuItem?.icon"></div>
        <span class="text-sm font-medium text-white/80">{{ currentMenuItem?.label }}</span>
      </div>
    </div>

    <!-- 移动端菜单面板 -->
    <Transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="mobile-menu-panel">
        <div class="mobile-menu-overlay" @click="closeMobileMenu"></div>
        <div class="mobile-menu-content">
          <div class="mobile-menu-header">
            <h3 class="text-lg font-semibold text-white">导航菜单</h3>
            <button @click="closeMobileMenu" class="close-btn">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="mobile-menu-items">
            <button
              v-for="item in menuItems"
              :key="item.id"
              @click="selectMenuItemMobile(item.id)"
              :class="[
                'mobile-menu-item',
                currentView === item.id ? 'active' : ''
              ]"
            >
              <div class="menu-item-icon" v-html="item.icon"></div>
              <div class="menu-item-content">
                <span class="menu-item-label">{{ item.label }}</span>
                <span class="menu-item-shortcut">{{ item.shortcut }}</span>
              </div>
              <div v-if="currentView === item.id" class="menu-item-indicator"></div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
interface MenuItem {
  id: string
  label: string
  icon: string
  shortcut: string
}

interface Props {
  currentView: string
}

interface Emits {
  (e: 'set-view', view: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

import languageService from '../services/languageService'

// 移动端菜单状态
const isMobileMenuOpen = ref(false)

// 强制移动端检测 - 增强版（基于屏幕比例）
const forceMobileDetection = () => {
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
  
  // 强制应用移动端样式
  if (isMobile) {
    document.documentElement.classList.add('force-mobile')
    document.body.classList.add('mobile-device')
    // 添加meta标签确保正确的viewport
    let viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    }
  } else {
    document.documentElement.classList.remove('force-mobile')
    document.body.classList.remove('mobile-device')
  }
  
  // 调试信息（仅在开发环境）
  if (import.meta.env.DEV) {
    console.log('Mobile Detection:', {
      userAgent: isMobileUA,
      touchDevice: isTouchDevice,
      smallScreen: isSmallScreen,
      portrait: isPortrait,
      finalResult: isMobile,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    })
  }
}

onMounted(() => {
  forceMobileDetection()
  window.addEventListener('resize', forceMobileDetection)
})

// 切换移动端菜单
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// 移动端菜单项选择
const selectMenuItemMobile = (viewId: string) => {
  selectMenuItem(viewId)
  closeMobileMenu()
}

const menuItems = computed(() => [
  { 
    id: 'notes', 
    label: languageService.t('notes'), 
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`, 
    shortcut: 'Ctrl+1' 
  },
  { 
    id: 'todos', 
    label: languageService.t('todos'), 
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`, 
    shortcut: 'Ctrl+2' 
  },
  { 
    id: 'projects', 
    label: '项目管理', 
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`, 
    shortcut: 'Ctrl+3' 
  },
  { 
    id: 'ai', 
    label: languageService.t('ai_assistant'), 
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`, 
    shortcut: 'Ctrl+4' 
  },
  { 
    id: 'pomodoro', 
    label: '番茄时钟', 
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`, 
    shortcut: 'Ctrl+5' 
  },
  { 
    id: 'settings', 
    label: languageService.t('settings'), 
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`, 
    shortcut: 'Ctrl+6' 
  }
])

// 当前菜单项
const currentMenuItem = computed(() => {
  return menuItems.value.find(item => item.id === props.currentView)
})

const selectMenuItem = (viewId: string) => {
  emit('set-view', viewId)
}
</script>

<style scoped>
/* 导航容器 */
.navigation-container {
  position: relative;
}

/* 桌面端导航 */
.desktop-nav {
  display: flex;
}

/* 移动端导航 */
.mobile-nav {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* 汉堡菜单按钮 */
.hamburger-btn {
  position: relative;
  z-index: 1001;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 20px;
  height: 16px;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 1px;
  transition: all 0.3s ease;
  transform-origin: center;
}

/* 汉堡菜单动画 */
.hamburger-btn.active .hamburger-icon span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-btn.active .hamburger-icon span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-btn.active .hamburger-icon span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* 当前页面指示器 */
.current-page-indicator {
  flex: 1;
  max-width: 200px;
}

/* 移动端菜单面板 */
.mobile-menu-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-top: 80px;
}

.mobile-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--theme-bg) 50%, transparent);
  backdrop-filter: blur(4px);
}

.mobile-menu-content {
  position: relative;
  width: 280px;
  max-width: 90vw;
  height: calc(100vh - 80px);
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-surface) 95%, transparent), color-mix(in srgb, var(--theme-bg) 95%, transparent));
  backdrop-filter: blur(20px);
  border: 1px solid color-mix(in srgb, var(--theme-border) 20%, transparent);
  border-radius: 16px 0 0 16px;
  overflow: hidden;
  box-shadow: -4px 0 20px color-mix(in srgb, var(--theme-bg) 30%, transparent);
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--theme-border) 20%, transparent);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
  color: var(--theme-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: color-mix(in srgb, var(--theme-primary) 20%, transparent);
  transform: scale(1.05);
}

.mobile-menu-items {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: none;
  background: rgba(187, 134, 252, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 60px;
}

.mobile-menu-item:hover {
  background: rgba(187, 134, 252, 0.1);
  transform: translateX(4px);
}

.mobile-menu-item.active {
  background: linear-gradient(135deg, rgba(187, 134, 252, 0.2), rgba(156, 39, 176, 0.1));
  border: 1px solid rgba(187, 134, 252, 0.3);
}

.menu-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(187, 134, 252, 0.1);
  color: var(--theme-primary);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.mobile-menu-item.active .menu-item-icon {
  background: var(--theme-primary);
  color: var(--theme-bg);
}

.menu-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.menu-item-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--theme-text);
}

.menu-item-shortcut {
  font-size: 0.75rem;
  color: var(--theme-text);
  opacity: 0.6;
  font-family: 'JetBrains Mono', monospace;
}

.menu-item-indicator {
  position: absolute;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-primary);
  animation: pulse 2s infinite;
}

/* 移动端菜单动画 */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from {
  opacity: 0;
}

.mobile-menu-enter-from .mobile-menu-content {
  transform: translateX(100%);
}

.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-leave-to .mobile-menu-content {
  transform: translateX(100%);
}

/* 默认显示设置 */
.desktop-nav {
  display: flex;
}

.mobile-nav {
  display: none;
}

/* 响应式设计 - 增强移动端检测 */
@media (max-width: 768px), (hover: none) and (pointer: coarse), (max-device-width: 768px) {
  .desktop-nav {
    display: none !important;
  }
  
  .mobile-nav {
    display: flex !important;
  }
}

/* 强制移动端布局 - 针对所有可能的移动设备 */
@media screen and (max-width: 1024px) and (orientation: portrait),
       screen and (max-width: 1366px) and (orientation: landscape) and (max-height: 1024px),
       (hover: none) and (pointer: coarse) {
  .desktop-nav {
    display: none !important;
  }
  
  .mobile-nav {
    display: flex !important;
  }
}

/* JavaScript强制移动端检测 */
.force-mobile .desktop-nav {
  display: none !important;
}

.force-mobile .mobile-nav {
  display: flex !important;
}

@media (max-width: 480px) {
  .mobile-menu-content {
    width: 100vw;
    border-radius: 0;
  }
  
  .current-page-indicator {
    max-width: none;
    flex: 1;
  }
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .mobile-menu-item {
    min-height: 64px;
    padding: 1.25rem;
  }
  
  .hamburger-btn {
    width: 48px;
    height: 48px;
  }
  
  .close-btn {
    width: 40px;
    height: 40px;
  }
}
</style>