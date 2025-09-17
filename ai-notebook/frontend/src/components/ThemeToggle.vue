<template>
  <div class="theme-toggle-container">
    <button 
      @click="handleToggle" 
      class="theme-toggle-btn"
      :class="{ 'dark-mode': isDarkMode, 'toggling': isToggling }"
      :disabled="isToggling"
      :title="isDarkMode ? '切换到白天模式' : '切换到夜晚模式'"
    >
      <div class="toggle-track">
        <div class="toggle-thumb" :class="{ 'active': isDarkMode }">
          <div class="icon-container">
            <!-- 太阳图标 -->
            <svg 
              v-if="!isDarkMode" 
              class="icon sun-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            
            <!-- 月亮图标 -->
            <svg 
              v-else 
              class="icon moon-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 背景粒子效果 -->
      <div class="particles">
        <div class="particle" v-for="i in 6" :key="i" :style="getParticleStyle(i)"></div>
      </div>
    </button>
  </div>
</template>

<script>
import { useTheme } from '../composables/useTheme'
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'ThemeToggle',
  setup() {
    const { isDarkMode, toggleTheme, themeColors } = useTheme()
    
    // 添加切换状态跟踪
    const isToggling = ref(false)
    
    // 增强的主题切换函数
    const handleToggle = async () => {
      if (isToggling.value) return
      
      isToggling.value = true
      console.log('[ThemeToggle] Starting theme toggle, current:', isDarkMode.value)
      
      try {
        await toggleTheme()
        
        // 等待DOM更新
        await nextTick()
        
        // 验证主题是否正确应用
        const root = document.documentElement
        const expectedClass = isDarkMode.value ? 'theme-dark' : 'theme-light'
        const hasCorrectClass = root.classList.contains(expectedClass)
        
        console.log('[ThemeToggle] Theme toggle completed:', {
          isDarkMode: isDarkMode.value,
          expectedClass,
          hasCorrectClass,
          actualClasses: Array.from(root.classList)
        })
        
        if (!hasCorrectClass) {
          console.warn('[ThemeToggle] Theme class mismatch, forcing update...')
          // 强制重新应用主题
          root.classList.remove('theme-light', 'theme-dark')
          root.classList.add(expectedClass)
          root.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
        }
      } catch (error) {
        console.error('[ThemeToggle] Theme toggle failed:', error)
      } finally {
        setTimeout(() => {
          isToggling.value = false
        }, 300)
      }
    }
    
    // 监听主题变化，确保UI同步
    watch(isDarkMode, (newValue) => {
      console.log('[ThemeToggle] Theme state changed:', newValue)
    }, { immediate: true })
    
    const getParticleStyle = (index) => {
      const angle = (index * 60) * Math.PI / 180
      const radius = 25
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      return {
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--delay': `${index * 0.1}s`
      }
    }
    
    return {
      isDarkMode,
      toggleTheme,
      themeColors,
      getParticleStyle,
      handleToggle,
      isToggling
    }
  }
}
</script>

<style scoped>
.theme-toggle-container {
  @apply flex items-center justify-center;
}

.theme-toggle-btn {
  @apply relative w-10 h-10 rounded-lg cursor-pointer overflow-hidden;
  background: var(--theme-card-gradient);
  border: 2px solid var(--theme-border);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 2px 6px var(--theme-glow-shadow),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transform: perspective(400px) rotateX(0deg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle-btn:hover {
  transform: perspective(400px) rotateX(-5deg) translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.3),
    0 4px 12px var(--theme-glow-shadow),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

.theme-toggle-btn.toggling {
  transform: perspective(400px) rotateX(10deg) scale(0.95);
  opacity: 0.8;
  pointer-events: none;
}

.theme-toggle-btn:disabled {
  cursor: not-allowed;
}

.toggle-track {
  @apply relative w-full h-full rounded-lg;
  background: linear-gradient(135deg, var(--theme-surface), var(--theme-bg));
}

.toggle-thumb {
  @apply absolute inset-1 rounded-lg transition-all duration-300 ease-out;
  background: linear-gradient(145deg, var(--theme-primary), var(--theme-secondary));
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 1px 4px var(--theme-glow-shadow),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.toggle-thumb.active {
  background: linear-gradient(145deg, var(--theme-secondary), var(--theme-primary));
}

.icon-container {
  @apply w-full h-full flex items-center justify-center;
}

.icon {
  @apply w-4 h-4;
  color: white;
  filter: drop-shadow(0 0 4px currentColor);
  transition: all 0.3s ease;
}

.sun-icon {
  animation: rotate 8s linear infinite;
}

.moon-icon {
  animation: pulse 2s ease-in-out infinite;
}

.particles {
  @apply absolute inset-0 pointer-events-none;
}

.particle {
  @apply absolute w-1 h-1 rounded-full opacity-60;
  background: var(--theme-glow);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate(var(--x), var(--y));
  animation: particle-float 3s ease-in-out infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 4px currentColor;
}

.theme-label {
  @apply text-center;
}

.theme-text {
  @apply text-xs font-medium;
  color: var(--theme-text);
  text-shadow: 0 0 8px var(--theme-glow);
  opacity: 0.8;
}

/* 动画 */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes particle-float {
  0%, 100% { 
    transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1);
    opacity: 0.6;
  }
  50% { 
    transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1.2);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-toggle-btn {
    @apply w-16 h-8;
  }
  
  .toggle-thumb {
    @apply w-5 h-5;
  }
  
  .toggle-thumb.active {
    transform: translateX(32px) perspective(200px) rotateY(180deg);
  }
  
  .icon {
    @apply w-3 h-3;
  }
}
</style>