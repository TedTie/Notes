<template>
  <div class="timer-display">
    <!-- 环形进度条 -->
    <div class="timer-circle-container">
      <svg class="timer-circle" :class="{ 'running': isRunning }" :width="size" :height="size" viewBox="0 0 400 400">
        <!-- 背景圆环 -->
        <circle
          cx="200"
          cy="200"
          :r="radius"
          fill="none"
          :stroke="backgroundStroke"
          :stroke-width="strokeWidth"
          class="timer-background"
        />
        
        <!-- 进度圆环 -->
        <circle
          cx="200"
          cy="200"
          :r="radius"
          fill="none"
          :stroke="progressStroke"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          class="timer-progress"
          :class="{ 'timer-running': isRunning, 'timer-warning': isWarning }"
          stroke-linecap="round"
          transform="rotate(-90 200 200)"
        />
        
        <!-- 发光效果和渐变定义 -->
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
          
          <!-- 工作时间渐变 -->
          <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00f5ff" />
            <stop offset="100%" stop-color="#ff00ff" />
          </linearGradient>
          
          <!-- 短休息渐变 -->
          <linearGradient id="shortBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#a855f7" />
          </linearGradient>
          
          <!-- 长休息渐变 -->
          <linearGradient id="longBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>
          
          <!-- 警告状态渐变 -->
          <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff6b6b" />
            <stop offset="100%" stop-color="#ff8e8e" />
          </linearGradient>
        </defs>
      </svg>
      
      <!-- 中心时间显示 -->
      <div class="timer-center">
        <div class="timer-time" :class="{ 'warning': isWarning }">
          <span class="minutes">{{ formattedMinutes }}</span>
          <span class="separator">:</span>
          <span class="seconds">{{ formattedSeconds }}</span>
        </div>
        
        <div class="timer-label">
          {{ sessionTypeLabel }}
        </div>
        
        <!-- 脉冲动画指示器 -->
        <div v-if="isRunning" class="pulse-indicator">
          <div class="pulse-dot"></div>
        </div>
      </div>
    </div>
    
    <!-- 进度百分比 -->
    <div class="progress-info">
      <div class="progress-percentage">
        {{ Math.round(progressPercentage) }}%
      </div>
      <div class="progress-label">
        已完成
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  timeLeft: number // 剩余时间（秒）
  totalTime: number // 总时间（秒）
  isRunning: boolean
  sessionType: 'work' | 'short_break' | 'long_break'
}

const props = defineProps<Props>()

// 圆环参数
const size = 400
const strokeWidth = 12
const radius = 180 // 在400x400的viewBox中，中心在(200,200)，半径180确保圆环完全可见
const circumference = 2 * Math.PI * radius

// 计算属性
const progressPercentage = computed(() => {
  if (props.totalTime === 0) return 0
  return ((props.totalTime - props.timeLeft) / props.totalTime) * 100
})

const strokeDashoffset = computed(() => {
  const progress = progressPercentage.value / 100
  return circumference * (1 - progress)
})

const formattedMinutes = computed(() => {
  return Math.floor(props.timeLeft / 60).toString().padStart(2, '0')
})

const formattedSeconds = computed(() => {
  return (props.timeLeft % 60).toString().padStart(2, '0')
})

const sessionTypeLabel = computed(() => {
  switch (props.sessionType) {
    case 'work': return '专注工作'
    case 'short_break': return '短休息'
    case 'long_break': return '长休息'
    default: return '专注工作'
  }
})

const isWarning = computed(() => {
  const remainingPercentage = (props.timeLeft / props.totalTime) * 100
  return remainingPercentage <= 20 && remainingPercentage > 0
})

// 颜色配置
const backgroundStroke = computed(() => {
  return 'rgba(255, 255, 255, 0.1)'
})

const progressStroke = computed(() => {
  if (isWarning.value) {
    return 'url(#warningGradient)'
  }
  
  switch (props.sessionType) {
    case 'work':
      return 'url(#workGradient)'
    case 'short_break':
      return 'url(#shortBreakGradient)'
    case 'long_break':
      return 'url(#longBreakGradient)'
    default:
      return 'url(#workGradient)'
  }
})

const gradientStart = computed(() => {
  if (isWarning.value) return '#ff6b6b'
  
  switch (props.sessionType) {
    case 'work': return '#00f5ff'
    case 'short_break': return '#7c3aed'
    case 'long_break': return '#10b981'
    default: return '#00f5ff'
  }
})

const gradientEnd = computed(() => {
  if (isWarning.value) return '#ff8e8e'
  
  switch (props.sessionType) {
    case 'work': return '#ff00ff'
    case 'short_break': return '#a855f7'
    case 'long_break': return '#34d399'
    default: return '#ff00ff'
  }
})
</script>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-circle-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 20px;
  overflow: visible;
}

.timer-circle {
  transform: rotate(-90deg);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.timer-circle.running {
  animation: gentle-rotate 60s linear infinite;
}

@keyframes gentle-rotate {
  from { transform: rotate(-90deg); }
  to { transform: rotate(270deg); }
}

.timer-background {
  opacity: 0.3;
}

.timer-progress {
  transition: stroke-dashoffset 1s ease, stroke 0.3s ease;
  filter: url(#glow);
}

.timer-running {
  animation: pulse-glow 2s ease-in-out infinite, breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.timer-warning {
  animation: warning-pulse 1s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: url(#glow) drop-shadow(0 0 5px currentColor);
  }
  50% {
    filter: url(#glow) drop-shadow(0 0 15px currentColor);
  }
}

@keyframes warning-pulse {
  0%, 100% {
    filter: url(#glow) drop-shadow(0 0 10px #ff6b6b);
  }
  50% {
    filter: url(#glow) drop-shadow(0 0 20px #ff6b6b);
  }
}

.timer-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
}

.timer-time {
  font-size: 4.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: var(--theme-text-primary);
  text-shadow: 0 0 15px rgba(0, 245, 255, 0.7);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.timer-time.warning {
  color: #ff6b6b;
  text-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
  animation: time-warning-pulse 1s ease-in-out infinite;
}

@keyframes time-warning-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.minutes, .seconds {
  display: inline-block;
  min-width: 2ch;
}

.separator {
  margin: 0 0.25rem;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.timer-label {
  font-size: 1.25rem;
  color: var(--theme-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.pulse-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 50%;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.7;
  }
}

.progress-info {
  text-align: center;
}

.progress-percentage {
  font-size: 2rem;
  font-weight: bold;
  color: var(--theme-primary);
  margin-bottom: 0.25rem;
}

.progress-label {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timer-time {
    font-size: 3.5rem;
  }
  
  .timer-circle-container {
    margin-bottom: 1.5rem;
  }
  
  .timer-circle {
    width: 360px;
    height: 360px;
  }
}

@media (max-width: 480px) {
  .timer-time {
    font-size: 2rem;
  }
  
  .timer-circle-container {
    margin-bottom: 1rem;
  }
  
  .timer-circle {
    width: 320px;
    height: 320px;
  }
  
  .progress-percentage {
    font-size: 1.5rem;
  }
  
  .timer-label {
    font-size: 1rem;
  }
}

/* 渐变定义 */
.timer-circle {
  --work-gradient-start: #00f5ff;
  --work-gradient-end: #ff00ff;
  --short-break-gradient-start: #7c3aed;
  --short-break-gradient-end: #a855f7;
  --long-break-gradient-start: #10b981;
  --long-break-gradient-end: #34d399;
  --warning-gradient-start: #ff6b6b;
  --warning-gradient-end: #ff8e8e;
}
</style>

<style>
/* 全局渐变定义 */
#workGradient {
  --gradient-start: #00f5ff;
  --gradient-end: #ff00ff;
}

#shortBreakGradient {
  --gradient-start: #7c3aed;
  --gradient-end: #a855f7;
}

#longBreakGradient {
  --gradient-start: #10b981;
  --gradient-end: #34d399;
}

#warningGradient {
  --gradient-start: #ff6b6b;
  --gradient-end: #ff8e8e;
}
</style>