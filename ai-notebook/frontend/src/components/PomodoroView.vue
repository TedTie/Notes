<template>
  <div class="pomodoro-view" :class="{ 'page-loaded': pageLoaded }">
    <!-- 番茄时钟主界面 -->
    <div class="futuristic-card mb-8">
      <div class="futuristic-header mb-6">
        <h2 class="futuristic-title-medium">番茄时钟</h2>
        <div class="futuristic-subtitle">专注工作，高效休息</div>
      </div>
      
      <!-- 计时器显示区域 -->
      <div class="timer-container mb-8">
        <TimerDisplay 
          :time-left="timeLeft"
          :total-time="totalTime"
          :is-running="isRunning"
          :session-type="currentSessionType"
        />
        
        <!-- 会话类型显示 -->
        <div class="session-info text-center mt-6">
          <div class="session-type-badge">
            <span class="session-icon" v-html="getSessionIcon()"></span>
            <span class="session-label">{{ getSessionLabel() }}</span>
          </div>
          <div class="cycle-info mt-2">
            <span class="futuristic-subtitle">第 {{ currentCycle }} / {{ cyclesBeforeLongBreak }} 个工作周期</span>
          </div>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="controls-container">
        <div class="flex justify-center space-x-4">
          <button 
            @click="toggleTimer"
            :class="[
              'futuristic-btn-primary px-8 py-3 text-lg font-semibold',
              isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            ]"
          >
            <div class="flex items-center space-x-2">
              <span v-html="isRunning ? `<svg class='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z'/></svg>` : `<svg class='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M8 5v14l11-7z'/></svg>`"></span>
              <span>{{ isRunning ? '暂停' : '开始' }}</span>
            </div>
          </button>
          
          <button 
            @click="resetTimer"
            class="futuristic-btn-secondary px-6 py-3"
            :disabled="isRunning"
          >
            <div class="flex items-center space-x-2">
              <span><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></span>
              <span>重置</span>
            </div>
          </button>
          
          <button 
            @click="skipSession"
            class="futuristic-btn-secondary px-6 py-3"
          >
            <div class="flex items-center space-x-2">
              <span><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></span>
              <span>跳过</span>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 关联任务选择 -->
    <div class="futuristic-card mb-8" v-if="currentSessionType === 'work'">
      <div class="futuristic-header mb-4">
        <h3 class="futuristic-title-small">关联任务</h3>
        <div class="futuristic-subtitle">选择要专注完成的任务</div>
      </div>
      
      <div class="task-selection">
        <div class="mb-4">
          <select 
            v-model="selectedTaskId"
            class="futuristic-input w-full"
          >
            <option value="">不关联任务</option>
            <option 
              v-for="task in incompleteTasks"
              :key="task.id"
              :value="task.id"
            >
              {{ task.content }}
            </option>
          </select>
        </div>
        
        <div v-if="selectedTask" class="selected-task-info">
          <div class="futuristic-card bg-gradient-to-br from-cyber-primary/10 to-transparent p-4">
            <div class="flex items-center space-x-3">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <div>
                <div class="futuristic-title-small">{{ selectedTask.content }}</div>
                <div class="futuristic-subtitle text-sm">{{ selectedTask.description || '暂无描述' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 统计信息 -->
    <div class="futuristic-card">
      <div class="futuristic-header mb-6">
        <h3 class="futuristic-title-small">专注统计</h3>
        <div class="futuristic-subtitle">今日和本周的专注数据</div>
      </div>
      
      <div class="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="stat-card">
          <div class="stat-icon"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg></div>
          <div class="stat-value">{{ todayStats.completedSessions }}</div>
          <div class="stat-label">今日完成</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></div>
          <div class="stat-value">{{ todayStats.totalMinutes }}</div>
          <div class="stat-label">今日专注(分钟)</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg></div>
          <div class="stat-value">{{ weekStats.completedSessions }}</div>
          <div class="stat-label">本周完成</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg></div>
          <div class="stat-value">{{ weekStats.totalMinutes }}</div>
          <div class="stat-label">本周专注(分钟)</div>
        </div>
      </div>
    </div>
    
    <!-- 完成会话对话框 -->
    <div v-if="showCompletionDialog" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="futuristic-card max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="text-6xl mb-4" v-html="getCompletionIcon()"></div>
          <h3 class="futuristic-title-medium mb-2">{{ getCompletionTitle() }}</h3>
          <p class="futuristic-subtitle">{{ getCompletionMessage() }}</p>
        </div>
        
        <div class="flex justify-center space-x-4">
          <button 
            @click="startNextSession"
            class="futuristic-btn-primary px-6 py-2"
          >
            开始{{ getNextSessionLabel() }}
          </button>
          
          <button 
            @click="closeCompletionDialog"
            class="futuristic-btn-secondary px-6 py-2"
          >
            稍后开始
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import TimerDisplay from './TimerDisplay.vue'
import settingsService from '../services/settingsService'
import todosService from '../services/todosService'
import pomodoroService from '../services/pomodoroService'

// 定义props
const props = defineProps<{
  selectedTask?: any
}>()

// 响应式数据
const pageLoaded = ref(false)
const timeLeft = ref(0) // 剩余时间（秒）
const totalTime = ref(0) // 总时间（秒）
const isRunning = ref(false)
const currentSessionType = ref<'work' | 'short_break' | 'long_break'>('work')
const currentCycle = ref(1)
const selectedTaskId = ref('')
const showCompletionDialog = ref(false)
const incompleteTasks = ref([])
const todayStats = ref({ completedSessions: 0, totalMinutes: 0 })
const weekStats = ref({ completedSessions: 0, totalMinutes: 0 })

// 设置
const workDuration = ref(25) // 分钟
const shortBreakDuration = ref(5) // 分钟
const longBreakDuration = ref(15) // 分钟
const cyclesBeforeLongBreak = ref(4)

// 计时器
let timerInterval: number | null = null

// 计算属性
const selectedTask = computed(() => {
  return incompleteTasks.value.find(task => task.id === selectedTaskId.value)
})

// 方法
const loadSettings = async () => {
  await settingsService.loadSettings()
  workDuration.value = parseInt(settingsService.getSetting('pomodoro_work_duration') || '25')
  shortBreakDuration.value = parseInt(settingsService.getSetting('pomodoro_short_break_duration') || '5')
  longBreakDuration.value = parseInt(settingsService.getSetting('pomodoro_long_break_duration') || '15')
  cyclesBeforeLongBreak.value = parseInt(settingsService.getSetting('pomodoro_cycles_before_long_break') || '4')
  
  // 初始化工作时间
  resetTimer()
}

const loadTasks = async () => {
  try {
    const tasks = await todosService.getTodos()
    incompleteTasks.value = tasks.filter(task => !task.completed)
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

const loadStats = async () => {
  try {
    const [todayData, weekData] = await Promise.all([
      pomodoroService.getTodayStats(),
      pomodoroService.getWeekStats()
    ])
    todayStats.value = todayData
    weekStats.value = weekData
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const startTimer = () => {
  if (timeLeft.value <= 0) {
    resetTimer()
  }
  
  isRunning.value = true
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      completeSession()
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetTimer = () => {
  pauseTimer()
  
  switch (currentSessionType.value) {
    case 'work':
      timeLeft.value = workDuration.value * 60
      totalTime.value = workDuration.value * 60
      break
    case 'short_break':
      timeLeft.value = shortBreakDuration.value * 60
      totalTime.value = shortBreakDuration.value * 60
      break
    case 'long_break':
      timeLeft.value = longBreakDuration.value * 60
      totalTime.value = longBreakDuration.value * 60
      break
  }
}

const skipSession = () => {
  completeSession()
}

const completeSession = async () => {
  pauseTimer()
  
  // 记录完成的会话
  try {
    const duration = totalTime.value - timeLeft.value
    const sessionData = pomodoroService.formatSessionData(
      duration,
      currentSessionType.value,
      currentSessionType.value === 'work' ? selectedTaskId.value || null : null
    )
    
    await pomodoroService.recordSession(sessionData)
    console.log('会话记录成功')
    loadStats() // 重新加载统计数据
  } catch (error) {
    console.error('记录会话失败:', error)
  }
  
  // 播放完成音效（如果启用）
  if (settingsService.getSetting('pomodoro_sounds') === 'true') {
    playCompletionSound()
  }
  
  // 显示桌面通知（如果启用）
  if (settingsService.getSetting('pomodoro_notifications') === 'true') {
    showDesktopNotification()
  }
  
  // 显示完成对话框
  showCompletionDialog.value = true
}

const startNextSession = () => {
  // 切换到下一个会话类型
  if (currentSessionType.value === 'work') {
    if (currentCycle.value >= cyclesBeforeLongBreak.value) {
      currentSessionType.value = 'long_break'
      currentCycle.value = 1
    } else {
      currentSessionType.value = 'short_break'
      currentCycle.value++
    }
  } else {
    currentSessionType.value = 'work'
  }
  
  resetTimer()
  closeCompletionDialog()
  startTimer()
}

const closeCompletionDialog = () => {
  showCompletionDialog.value = false
}

const playCompletionSound = () => {
  try {
    // 创建音频上下文播放提示音
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // 根据会话类型播放不同音调
    if (currentSessionType.value === 'work') {
      // 工作完成 - 高音调
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2)
    } else {
      // 休息完成 - 低音调
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.2)
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.warn('音效播放失败:', error)
  }
}

const showDesktopNotification = () => {
  try {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持桌面通知')
      return
    }
    
    const title = '番茄时钟'
    const body = getCompletionMessage()
    const icon = '/favicon.ico'
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon,
        tag: 'pomodoro-timer', // 防止重复通知
        requireInteraction: false,
        silent: false
      })
      
      // 3秒后自动关闭通知
      setTimeout(() => {
        notification.close()
      }, 3000)
      
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          const notification = new Notification(title, {
            body,
            icon,
            tag: 'pomodoro-timer',
            requireInteraction: false,
            silent: false
          })
          
          setTimeout(() => {
            notification.close()
          }, 3000)
        }
      })
    }
  } catch (error) {
    console.warn('桌面通知显示失败:', error)
  }
}

// 获取会话相关信息的方法
const getSessionIcon = () => {
  switch (currentSessionType.value) {
    case 'work': return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
    case 'short_break': return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.5 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12.5c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM18 19H6V5h12v14z"/><path d="M6.5 17.5h11v-1h-11v1zm0-2.5h11v-1h-11v1zm0-2.5h11v-1h-11v1z"/></svg>`
    case 'long_break': return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    default: return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
  }
}

const getSessionLabel = () => {
  switch (currentSessionType.value) {
    case 'work': return '专注工作'
    case 'short_break': return '短休息'
    case 'long_break': return '长休息'
    default: return '专注工作'
  }
}

const getCompletionIcon = () => {
  switch (currentSessionType.value) {
    case 'work': return `<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    case 'short_break': return `<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    case 'long_break': return `<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 10.5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm15 0c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm-4.5 0c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm-5 0c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm-5 0c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5z"/></svg>`
    default: return `<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  }
}

const getCompletionTitle = () => {
  switch (currentSessionType.value) {
    case 'work': return '专注完成！'
    case 'short_break': return '休息结束！'
    case 'long_break': return '长休息结束！'
    default: return '完成！'
  }
}

const getCompletionMessage = () => {
  switch (currentSessionType.value) {
    case 'work': return '恭喜你完成了一个专注时段，是时候休息一下了！'
    case 'short_break': return '短暂的休息让你重新充满活力，继续加油！'
    case 'long_break': return '充分的休息后，你已经准备好迎接新的挑战！'
    default: return '做得很好！'
  }
}

const getNextSessionLabel = () => {
  if (currentSessionType.value === 'work') {
    return currentCycle.value >= cyclesBeforeLongBreak.value ? '长休息' : '短休息'
  } else {
    return '专注工作'
  }
}

// 生命周期
onMounted(async () => {
  await loadSettings()
  await loadTasks()
  await loadStats()
  
  // 处理传入的任务，自动选择任务
  if (props.selectedTask?.id) {
    selectedTaskId.value = props.selectedTask.id
  }
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  
  // 触发页面加载动画
  setTimeout(() => {
    pageLoaded.value = true
  }, 100)
})

// 监听props变化
watch(() => props.selectedTask, (newTask) => {
  if (newTask?.id) {
    selectedTaskId.value = newTask.id
  }
}, { immediate: true })

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

// 监听设置变化
watch(() => settingsService.settings, () => {
  loadSettings()
}, { deep: true })
</script>

<style scoped>
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px 20px;
  overflow: visible;
}

.session-type-badge {
  display: inline-flex;
  align-items: center;
  space-x: 0.5rem;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 2rem;
  padding: 0.75rem 1.5rem;
  backdrop-filter: blur(10px);
}

.session-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.session-label {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.controls-container {
  margin-top: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.05), rgba(255, 0, 255, 0.05));
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 255, 0.15);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--theme-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.task-selection {
  margin-top: 1rem;
}

.selected-task-info {
  margin-top: 1rem;
}

/* 页面动画 */
.pomodoro-view {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.pomodoro-view.page-loaded {
  opacity: 1;
  transform: translateY(0);
}

/* 卡片动画 */
.futuristic-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.futuristic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 245, 255, 0.15);
}

/* 按钮动画增强 */
.futuristic-btn-primary, .futuristic-btn-secondary {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.futuristic-btn-primary:hover, .futuristic-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 245, 255, 0.3);
}

.futuristic-btn-primary:active, .futuristic-btn-secondary:active {
  transform: translateY(0);
  transition: transform 0.1s;
}

/* 会话类型徽章动画 */
.session-type-badge {
  transition: all 0.3s ease;
  animation: badge-pulse 3s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 统计卡片动画 */
.stat-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 245, 255, 0.2);
}

/* 任务选择动画 */
.task-selection select {
  transition: all 0.3s ease;
}

.task-selection select:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .controls-container .flex {
    flex-direction: column;
    space-y: 1rem;
  }
  
  .controls-container .space-x-4 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 0;
    margin-top: 1rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>