<template>
  <div v-if="showLoader" class="preload-overlay">
    <div class="preload-content">
      <!-- 科技背景网格 -->
      <div class="tech-grid">
        <div class="grid-lines"></div>
        <div class="grid-dots"></div>
      </div>
      
      <!-- 数字雨效果 -->
      <div class="digital-rain">
        <div 
          v-for="i in 15" 
          :key="i" 
          class="rain-column"
          :style="{ left: (i * 6.67) + '%', animationDelay: (i * 0.1) + 's' }"
        >
          <span v-for="j in 20" :key="j" class="rain-char">{{ Math.floor(Math.random() * 2) }}</span>
        </div>
      </div>
      
      <!-- 主要加载器 -->
      <div class="main-loader">
        <!-- 全息AI核心 -->
        <div class="hologram-core">
          <div class="core-ring" v-for="i in 3" :key="i" :style="{ animationDelay: (i * 0.5) + 's' }"></div>
          <div class="core-center">
            <div class="neural-network">
              <div class="node" v-for="i in 6" :key="i" :style="{ transform: `rotate(${i * 60}deg) translateY(-25px)` }">
                <div class="connection"></div>
              </div>
              <div class="center-node"></div>
            </div>
          </div>
        </div>
        
        <!-- 科技品牌 -->
        <div class="tech-brand">
          <h1 class="brand-title">
            <span class="letter" v-for="(letter, index) in 'AI NOTEBOOK'.split('')" :key="index" :style="{ animationDelay: (index * 0.1) + 's' }">
              {{ letter === ' ' ? '&nbsp;' : letter }}
            </span>
          </h1>
          <div class="brand-subtitle">智能笔记系统</div>
        </div>
        
        <!-- 六边形进度 -->
         <div class="hex-progress">
           <svg width="120" height="120" viewBox="0 0 120 120">
             <defs>
               <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stop-color="#8a2be2" />
                 <stop offset="50%" stop-color="#9370db" />
                 <stop offset="100%" stop-color="#00bfff" />
               </linearGradient>
             </defs>
             <!-- 背景六边形 -->
             <polygon 
               points="60,8 103,30 103,72 60,94 17,72 17,30" 
               class="hex-bg"
             />
             <!-- 进度六边形 -->
             <polygon 
               points="60,8 103,30 103,72 60,94 17,72 17,30" 
               class="hex-progress-bar"
               :style="{
                 strokeDasharray: '258',
                 strokeDashoffset: 258 - (progress / 100) * 258
               }"
             />
             <!-- 内部电路 -->
             <g class="circuit-pattern">
               <line x1="60" y1="30" x2="60" y2="72" class="circuit-line" />
               <line x1="38" y1="51" x2="82" y2="51" class="circuit-line" />
               <circle cx="60" cy="51" r="6" class="circuit-node" />
               <circle cx="60" cy="38" r="2" class="circuit-dot" />
               <circle cx="60" cy="64" r="2" class="circuit-dot" />
               <circle cx="47" cy="51" r="2" class="circuit-dot" />
               <circle cx="73" cy="51" r="2" class="circuit-dot" />
             </g>
           </svg>
          <div class="progress-display">
            <div class="progress-number">{{ Math.round(progress) }}</div>
            <div class="progress-unit">%</div>
          </div>
        </div>
      </div>
      
      <!-- 状态信息 -->
      <div class="status-panel">
        <div class="status-line">
          <span class="status-label">[系统状态]</span>
          <span class="status-value">{{ loadingText }}</span>
        </div>
        <div class="status-line">
          <span class="status-label">[进度]</span>
          <span class="status-value">{{ Math.round(progress) }}/100</span>
        </div>
        <div class="status-line">
          <span class="status-label">[模式]</span>
          <span class="status-value">智能加载中</span>
          <div class="loading-indicator">
            <span class="dot" v-for="i in 3" :key="i" :style="{ animationDelay: (i * 0.2) + 's' }"></span>
          </div>
        </div>
      </div>
      
      <!-- 粒子效果 -->
      <div class="particle-system">
        <div 
          v-for="i in 30" 
          :key="i" 
          class="particle"
          :style="{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
            animationDuration: (2 + Math.random() * 3) + 's'
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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

// 进度环周长计算
const circumference = computed(() => 2 * Math.PI * 54)

// 浮动元素样式生成
const getFloatingStyle = (index) => {
  const angle = (index * 45) % 360
  const radius = 150 + (index % 3) * 50
  const x = Math.cos(angle * Math.PI / 180) * radius
  const y = Math.sin(angle * Math.PI / 180) * radius
  const delay = index * 0.5
  const duration = 3 + (index % 3)
  
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

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
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.5s ease-out;
  overflow: hidden;
}

.preload-content {
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
}

/* 科技背景网格 */
.tech-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  z-index: 1;
}

.grid-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

.grid-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle, rgba(0, 255, 255, 0.2) 1px, transparent 1px);
  background-size: 25px 25px;
  animation: gridMove 15s linear infinite reverse;
}

/* 数字雨效果 */
.digital-rain {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.rain-column {
  position: absolute;
  top: -100%;
  width: 20px;
  height: 200%;
  animation: rainFall 3s linear infinite;
  opacity: 0.6;
}

.rain-char {
  display: block;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.2;
  text-shadow: 0 0 5px #00ff41;
  animation: charFlicker 0.5s ease-in-out infinite alternate;
}

/* 主要加载器 */
.main-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 3;
  padding-top: 8vh;
  max-width: 90vw;
  margin: 0 auto;
}

/* 全息AI核心 */
.hologram-core {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 1rem;
}

.core-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(138, 43, 226, 0.6);
  border-radius: 50%;
  animation: coreRotate 4s linear infinite;
}

.core-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  border-color: rgba(75, 0, 130, 0.8);
  animation-duration: 3s;
  animation-direction: reverse;
}

.core-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  border-color: rgba(0, 191, 255, 1);
  animation-duration: 2s;
}

.core-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
}

.neural-network {
  position: relative;
  width: 100%;
  height: 100%;
}

.node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
}

.connection {
  width: 25px;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.8), transparent);
  animation: connectionPulse 2s ease-in-out infinite;
}

.center-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, #8a2be2, #4b0082);
  border-radius: 50%;
  box-shadow: 0 0 20px #8a2be2;
  animation: centerPulse 1.5s ease-in-out infinite;
}

/* 科技品牌 */
.tech-brand {
  margin-bottom: 1.5rem;
}

.brand-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: 0.5rem;
  font-family: 'Orbitron', 'Arial', sans-serif;
}

.letter {
  display: inline-block;
  background: linear-gradient(45deg, #8a2be2, #00bfff, #9370db);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
  animation: letterGlow 2s ease-in-out infinite, gradientShift 3s ease-in-out infinite;
}

.brand-subtitle {
  font-size: 1rem;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.8), rgba(0, 191, 255, 0.8));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Microsoft YaHei', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 六边形进度 */
.hex-progress {
  position: relative;
  width: 120px;
  height: 120px;
}

.hex-bg {
  fill: none;
  stroke: rgba(138, 43, 226, 0.3);
  stroke-width: 2;
}

.hex-progress-bar {
  fill: none;
  stroke: url(#hexGradient);
  stroke-width: 3;
  stroke-linecap: round;
  filter: drop-shadow(0 0 5px #8a2be2);
  transition: stroke-dashoffset 0.3s ease;
}

.circuit-pattern {
  opacity: 0.8;
}

.circuit-line {
  stroke: rgba(138, 43, 226, 0.6);
  stroke-width: 1;
  animation: circuitFlow 2s ease-in-out infinite;
}

.circuit-node {
  fill: none;
  stroke: #8a2be2;
  stroke-width: 2;
  animation: nodePulse 1.5s ease-in-out infinite;
}

.circuit-dot {
  fill: #9370db;
  animation: dotBlink 1s ease-in-out infinite;
}

.progress-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-number {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(45deg, #8a2be2, #00bfff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
  font-family: 'Orbitron', monospace;
}

.progress-unit {
  font-size: 0.7rem;
  color: rgba(138, 43, 226, 0.8);
  margin-top: -5px;
}

/* 状态面板 */
.status-panel {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 0, 40, 0.8);
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  max-width: 80vw;
}

.status-line {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.status-line:last-child {
  margin-bottom: 0;
}

.status-label {
  color: rgba(138, 43, 226, 0.9);
  margin-right: 1rem;
  min-width: 70px;
  font-size: 0.85rem;
}

.status-value {
  background: linear-gradient(90deg, #ffffff, #e6e6fa);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  flex: 1;
  font-size: 0.85rem;
}

.loading-indicator {
  display: flex;
  gap: 0.3rem;
  margin-left: 1rem;
}

.loading-indicator .dot {
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #8a2be2, #00bfff);
  border-radius: 50%;
  animation: indicatorBounce 1.4s ease-in-out infinite;
}

/* 粒子系统 */
.particle-system {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: linear-gradient(45deg, rgba(138, 43, 226, 0.8), rgba(0, 191, 255, 0.6));
  border-radius: 50%;
  animation: particleFloat 4s ease-in-out infinite;
  box-shadow: 0 0 4px rgba(138, 43, 226, 0.5);
}

/* 动画定义 */
@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

@keyframes rainFall {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes charFlicker {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

@keyframes coreRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes connectionPulse {
  0%, 100% { 
    opacity: 0.3;
    background: linear-gradient(90deg, rgba(138, 43, 226, 0.8), transparent);
  }
  50% { 
    opacity: 1;
    background: linear-gradient(90deg, rgba(0, 191, 255, 0.9), transparent);
  }
}

@keyframes centerPulse {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 20px #8a2be2;
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 30px #8a2be2, 0 0 40px rgba(0, 191, 255, 0.5);
  }
}

@keyframes letterGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(138, 43, 226, 0.5); }
  50% { text-shadow: 0 0 20px rgba(138, 43, 226, 0.8), 0 0 30px rgba(0, 191, 255, 0.6); }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes circuitFlow {
  0%, 100% { stroke: rgba(138, 43, 226, 0.3); }
  50% { stroke: rgba(138, 43, 226, 1); }
}

@keyframes nodePulse {
  0%, 100% { stroke: rgba(138, 43, 226, 0.5); }
  50% { stroke: #8a2be2; }
}

@keyframes dotBlink {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes indicatorBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(0);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .brand-title {
    font-size: 2rem;
  }
  
  .hologram-core {
    width: 100px;
    height: 100px;
  }
  
  .hex-progress {
    width: 120px;
    height: 120px;
  }
  
  .progress-number {
    font-size: 1.5rem;
  }
  
  .status-panel {
    padding: 0.8rem 1.5rem;
    font-size: 0.8rem;
  }
  
  .main-loader {
    gap: 2rem;
  }
}

@media (max-width: 480px) {
  .brand-title {
    font-size: 1.5rem;
  }
  
  .hologram-core {
    width: 80px;
    height: 80px;
  }
  
  .hex-progress {
    width: 100px;
    height: 100px;
  }
  
  .progress-number {
    font-size: 1.2rem;
  }
  
  .status-panel {
    padding: 0.6rem 1rem;
    font-size: 0.7rem;
  }
  
  .main-loader {
    gap: 1.5rem;
    padding-top: 5vh;
  }
  
  .rain-char {
    font-size: 12px;
  }
}
</style>