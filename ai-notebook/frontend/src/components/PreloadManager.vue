<template>
  <div v-if="showLoader" class="preload-overlay">
    <div class="preload-content">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PERFORMANCE_CONFIG } from '@/config/performance.js'

const props = defineProps({
  autoHide: {
    type: Boolean,
    default: true
  },
  minDisplayTime: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['loaded', 'error'])

const showLoader = ref(true)
const loadingText = ref('正在加载...')
const progress = ref(0)

const loadingSteps = [
  { text: '初始化应用...', weight: 20 },
  { text: '加载用户设置...', weight: 30 },
  { text: '获取待办事项...', weight: 25 },
  { text: '加载统计数据...', weight: 25 }
]

let currentProgress = 0

const updateProgress = (stepIndex) => {
  if (stepIndex < loadingSteps.length) {
    loadingText.value = loadingSteps[stepIndex].text
    currentProgress += loadingSteps[stepIndex].weight
    progress.value = Math.min(currentProgress, 100)
  }
}

const preloadData = async () => {
  const startTime = Date.now()
  
  try {
    // 步骤1: 初始化应用
    updateProgress(0)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 步骤2: 预加载设置服务
    updateProgress(1)
    const { default: settingsService } = await import('../services/settingsService.js')
    await settingsService.loadSettings()
    
    // 步骤3: 预加载待办事项服务
    updateProgress(2)
    const { default: todosService } = await import('../services/todosService.js')
    await todosService.getAllTodos()
    
    // 步骤4: 预加载番茄时钟统计
    updateProgress(3)
    const { default: pomodoroService } = await import('../services/pomodoroService.js')
    await Promise.all([
      pomodoroService.getTodayStats(),
      pomodoroService.getWeekStats()
    ])
    
    // 确保最小显示时间
    const elapsedTime = Date.now() - startTime
    const remainingTime = Math.max(0, props.minDisplayTime - elapsedTime)
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    
    progress.value = 100
    emit('loaded')
    
    if (props.autoHide) {
      setTimeout(() => {
        showLoader.value = false
      }, 300)
    }
    
  } catch (error) {
    console.error('预加载失败:', error)
    loadingText.value = '加载失败，请刷新页面重试'
    emit('error', error)
    
    // 即使失败也要隐藏加载器
    if (props.autoHide) {
      setTimeout(() => {
        showLoader.value = false
      }, 2000)
    }
  }
}

const hide = () => {
  showLoader.value = false
}

defineExpose({
  hide,
  showLoader
})

onMounted(() => {
  if (PERFORMANCE_CONFIG.vercel.enablePreload) {
    preloadData()
  } else {
    // 如果禁用预加载，直接隐藏
    setTimeout(() => {
      showLoader.value = false
      emit('loaded')
    }, 100)
  }
})
</script>

<style scoped>
.preload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.3s ease;
}

.preload-content {
  text-align: center;
  color: white;
  max-width: 300px;
  padding: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
  min-height: 1.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preload-content {
    padding: 1.5rem;
    max-width: 250px;
  }
  
  .loading-text {
    font-size: 1rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
  }
}
</style>