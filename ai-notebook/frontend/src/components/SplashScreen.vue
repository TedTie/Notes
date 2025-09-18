<template>
  <div class="splash-screen" v-if="visible">
    <!-- 科技背景层 -->
    <div class="tech-background">
      <!-- 网格背景 -->
      <div class="grid-background"></div>
      <!-- 粒子系统 -->
      <div class="particles-container">
        <div 
          v-for="i in 50" 
          :key="i" 
          class="particle"
          :style="getParticleStyle(i)"
        ></div>
      </div>
      <!-- 数字雨效果 -->
      <div class="digital-rain">
        <div 
          v-for="i in 15" 
          :key="i" 
          class="rain-column"
          :style="getRainStyle(i)"
        >
          <span v-for="j in 20" :key="j" class="rain-char">{{ getRandomChar() }}</span>
        </div>
      </div>
    </div>
    
    <!-- 主内容 -->
    <div class="splash-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <!-- 全息投影效果 -->
          <div class="hologram-container">
            <div class="hologram-ring"></div>
            <div class="hologram-ring"></div>
            <div class="hologram-ring"></div>
            
            <!-- AI核心图标 -->
            <div class="ai-core">
              <svg viewBox="0 0 120 120" class="ai-svg">
                 <!-- 中央核心 -->
                 <circle cx="60" cy="60" r="20" fill="none" stroke="#8b5cf6" stroke-width="2" class="core-circle"/>
                 <circle cx="60" cy="60" r="15" fill="none" stroke="#6366f1" stroke-width="1" class="core-inner"/>
                 
                 <!-- 神经网络连接 -->
                 <g class="neural-network">
                   <line x1="60" y1="40" x2="60" y2="20" stroke="#8b5cf6" stroke-width="1" class="neural-line"/>
                   <line x1="60" y1="80" x2="60" y2="100" stroke="#8b5cf6" stroke-width="1" class="neural-line"/>
                   <line x1="40" y1="60" x2="20" y2="60" stroke="#8b5cf6" stroke-width="1" class="neural-line"/>
                   <line x1="80" y1="60" x2="100" y2="60" stroke="#8b5cf6" stroke-width="1" class="neural-line"/>
                   
                   <line x1="45" y1="45" x2="30" y2="30" stroke="#6366f1" stroke-width="1" class="neural-line"/>
                   <line x1="75" y1="45" x2="90" y2="30" stroke="#6366f1" stroke-width="1" class="neural-line"/>
                   <line x1="45" y1="75" x2="30" y2="90" stroke="#6366f1" stroke-width="1" class="neural-line"/>
                   <line x1="75" y1="75" x2="90" y2="90" stroke="#6366f1" stroke-width="1" class="neural-line"/>
                 </g>
                 
                 <!-- 节点 -->
                 <circle cx="60" cy="20" r="3" fill="#8b5cf6" class="node"/>
                 <circle cx="60" cy="100" r="3" fill="#8b5cf6" class="node"/>
                 <circle cx="20" cy="60" r="3" fill="#8b5cf6" class="node"/>
                 <circle cx="100" cy="60" r="3" fill="#8b5cf6" class="node"/>
                 
                 <circle cx="30" cy="30" r="2" fill="#6366f1" class="node"/>
                 <circle cx="90" cy="30" r="2" fill="#6366f1" class="node"/>
                 <circle cx="30" cy="90" r="2" fill="#6366f1" class="node"/>
                 <circle cx="90" cy="90" r="2" fill="#6366f1" class="node"/>
               </svg>
            </div>
          </div>
        </div>
        
        <!-- 应用标题 -->
        <h1 class="app-title">
          <span class="title-char" v-for="(char, index) in titleChars" :key="index" :style="{ animationDelay: index * 0.1 + 's' }">
            {{ char }}
          </span>
        </h1>
        <p class="app-subtitle glitch-text">INTELLIGENT LEARNING COMPANION</p>
      </div>
      
      <!-- 科技加载区域 -->
      <div class="loading-section">
        <!-- 六边形加载器 -->
        <div class="hex-loader">
          <div class="hex-spinner">
            <div class="hex" v-for="i in 6" :key="i"></div>
          </div>
        </div>
        
        <!-- 状态文字 -->
        <div class="status-container">
          <p class="loading-text terminal-text">{{ loadingText }}</p>
          <div class="cursor-blink">_</div>
        </div>
        
        <!-- 科技进度条 -->
        <div class="tech-progress-container">
          <div class="progress-label">SYSTEM INITIALIZATION</div>
          <div class="tech-progress-bar">
            <div class="progress-track"></div>
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            <div class="progress-glow" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-info">
            <span class="progress-percent">{{ Math.round(progress) }}%</span>
            <span class="progress-status">ONLINE</span>
          </div>
        </div>
      </div>
      
      <!-- 系统信息 -->
      <div class="system-info">
        <div class="info-line">
          <span class="info-label">VERSION:</span>
          <span class="info-value">AI-NB-1.0.0</span>
        </div>
        <div class="info-line">
          <span class="info-label">STATUS:</span>
          <span class="info-value status-online">ONLINE</span>
        </div>
      </div>
    </div>
    
    <!-- 扫描线效果 -->
    <div class="scan-lines"></div>
    
    <!-- 边框装饰 -->
    <div class="tech-borders">
      <div class="corner-tl"></div>
      <div class="corner-tr"></div>
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'

interface Props {
  visible?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  duration: 3000
})

const emit = defineEmits<{
  complete: []
}>()

const progress = ref(0)
const loadingText = ref('INITIALIZING SYSTEM...')

const loadingSteps = [
  { text: 'INITIALIZING SYSTEM...', duration: 800 },
  { text: 'LOADING AI MODULES...', duration: 600 },
  { text: 'CONNECTING NEURAL NETWORK...', duration: 700 },
  { text: 'SYSTEM READY!', duration: 400 }
]

let currentStep = 0
let progressInterval: number
let stepTimeout: number

// 标题字符分解
const titleChars = computed(() => {
  return 'AI 智能笔记本'.split('')
})

// 粒子系统
const getParticleStyle = (index: number) => {
  const x = Math.random() * 100
  const y = Math.random() * 100
  const size = Math.random() * 3 + 1
  const duration = Math.random() * 3 + 2
  const delay = Math.random() * 2
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

// 数字雨效果
const getRainStyle = (index: number) => {
  const left = (index * 6.67) + Math.random() * 3
  const duration = Math.random() * 3 + 2
  const delay = Math.random() * 2
  
  return {
    left: `${left}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

// 随机字符生成
const getRandomChar = () => {
  const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()'
  return chars[Math.floor(Math.random() * chars.length)]
}

const startLoading = () => {
  progress.value = 0
  currentStep = 0
  
  const totalDuration = props.duration
  const stepDuration = totalDuration / 100
  
  // 进度条动画
  progressInterval = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 1
    } else {
      clearInterval(progressInterval)
      setTimeout(() => {
        emit('complete')
      }, 300)
    }
  }, stepDuration)
  
  // 文字切换
  const nextStep = () => {
    if (currentStep < loadingSteps.length) {
      loadingText.value = loadingSteps[currentStep].text
      stepTimeout = setTimeout(() => {
        currentStep++
        nextStep()
      }, loadingSteps[currentStep].duration)
    }
  }
  
  nextStep()
}

onMounted(() => {
  if (props.visible) {
    startLoading()
  }
})

// 清理定时器
const cleanup = () => {
  if (progressInterval) clearInterval(progressInterval)
  if (stepTimeout) clearTimeout(stepTimeout)
}

// 组件卸载时清理
onUnmounted(cleanup)
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000010;
  font-family: 'Courier New', monospace;
}

/* 科技背景 */
.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #581c87 75%, #6b21a8 100%);
}

/* 网格背景 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

/* 粒子系统 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: #8b5cf6;
  border-radius: 50%;
  opacity: 0.6;
  animation: particleFloat 3s ease-in-out infinite;
  box-shadow: 0 0 6px #8b5cf6;
}

/* 数字雨效果 */
.digital-rain {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.3;
}

.rain-column {
  position: absolute;
  top: -100%;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #a855f7;
  animation: rainFall 4s linear infinite;
  text-shadow: 0 0 5px #a855f7;
}

.rain-char {
  display: block;
  line-height: 1.2;
  opacity: 0.8;
}

/* 主内容 */
.splash-content {
  position: relative;
  z-index: 10;
  text-align: center;
  color: #a78bfa;
  max-width: 600px;
  padding: 2rem;
}

/* Logo区域 */
.logo-section {
  margin-bottom: 4rem;
}

.logo-container {
  margin-bottom: 2rem;
}

/* 全息投影效果 */
.hologram-container {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hologram-ring {
  position: absolute;
  border: 2px solid #8b5cf6;
  border-radius: 50%;
  opacity: 0.6;
  animation: holoRing 3s ease-in-out infinite;
}

.hologram-ring:nth-child(1) {
  width: 120px;
  height: 120px;
  animation-delay: 0s;
}

.hologram-ring:nth-child(2) {
  width: 140px;
  height: 140px;
  animation-delay: 1s;
  border-color: #6366f1;
}

.hologram-ring:nth-child(3) {
  width: 160px;
  height: 160px;
  animation-delay: 2s;
  border-color: #3b82f6;
}

.ai-core {
  position: relative;
  z-index: 2;
}

.ai-svg {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 0 10px #8b5cf6);
}

.core-circle {
  animation: coreRotate 4s linear infinite;
}

.core-inner {
  animation: coreRotate 3s linear infinite reverse;
}

.neural-network {
  animation: neuralPulse 2s ease-in-out infinite;
}

.node {
  animation: nodePulse 1.5s ease-in-out infinite;
}

/* 标题 */
.app-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 1rem 0;
  text-shadow: 0 0 20px #8b5cf6;
  letter-spacing: 0.1em;
}

.title-char {
  display: inline-block;
  animation: titleGlow 2s ease-in-out infinite;
  color: #a78bfa;
}

.app-subtitle {
  font-size: 1.2rem;
  margin: 0;
  font-weight: 300;
  letter-spacing: 0.2em;
  color: #6366f1;
  text-shadow: 0 0 10px #6366f1;
}

.glitch-text {
  animation: glitch 3s ease-in-out infinite;
}

/* 加载区域 */
.loading-section {
  margin-bottom: 3rem;
}

/* 六边形加载器 */
.hex-loader {
  margin: 2rem auto;
  width: 100px;
  height: 100px;
  position: relative;
}

.hex-spinner {
  position: relative;
  width: 100%;
  height: 100%;
  animation: hexRotate 3s linear infinite;
}

.hex {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #8b5cf6;
  border-radius: 3px;
  box-shadow: 0 0 10px #8b5cf6;
  animation: hexPulse 1.5s ease-in-out infinite;
}

.hex:nth-child(1) { top: 0; left: 40px; animation-delay: 0s; }
.hex:nth-child(2) { top: 20px; left: 60px; animation-delay: 0.2s; }
.hex:nth-child(3) { top: 60px; left: 60px; animation-delay: 0.4s; }
.hex:nth-child(4) { top: 80px; left: 40px; animation-delay: 0.6s; }
.hex:nth-child(5) { top: 60px; left: 20px; animation-delay: 0.8s; }
.hex:nth-child(6) { top: 20px; left: 20px; animation-delay: 1s; }

/* 状态文字 */
.status-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.loading-text {
  font-size: 1.1rem;
  color: #a78bfa;
  text-shadow: 0 0 8px #a78bfa;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
}

.cursor-blink {
  color: #a78bfa;
  animation: blink 1s step-end infinite;
  font-size: 1.1rem;
}

.terminal-text {
  font-family: 'Courier New', monospace;
}

/* 科技进度条 */
.tech-progress-container {
  margin: 2rem 0;
}

.progress-label {
  font-size: 0.9rem;
  color: #6366f1;
  text-align: left;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 5px #6366f1;
}

.tech-progress-bar {
  position: relative;
  height: 8px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid #8b5cf6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%);
  animation: trackScan 2s linear infinite;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #6366f1);
  transition: width 0.3s ease;
  position: relative;
}

.progress-glow {
  position: absolute;
  top: -2px;
  left: 0;
  height: calc(100% + 4px);
  background: linear-gradient(90deg, #8b5cf6, #6366f1);
  filter: blur(4px);
  opacity: 0.6;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #a78bfa;
}

.progress-percent {
  text-shadow: 0 0 5px #a78bfa;
}

.progress-status {
  color: #a78bfa;
  text-shadow: 0 0 5px #a78bfa;
}

/* 系统信息 */
.system-info {
  text-align: left;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.info-line {
  display: flex;
  justify-content: space-between;
  margin: 0.3rem 0;
  padding: 0.2rem 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.info-label {
  color: #6366f1;
  text-shadow: 0 0 5px #6366f1;
}

.info-value {
  color: #a78bfa;
  text-shadow: 0 0 5px #a78bfa;
}

.status-online {
  color: #8b5cf6 !important;
  text-shadow: 0 0 5px #8b5cf6 !important;
  animation: statusBlink 2s ease-in-out infinite;
}

/* 扫描线效果 */
.scan-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(139, 92, 246, 0.03) 2px,
    rgba(139, 92, 246, 0.03) 4px
  );
  pointer-events: none;
  animation: scanMove 0.1s linear infinite;
}

/* 边框装饰 */
.tech-borders {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.corner-tl, .corner-tr, .corner-bl, .corner-br {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 2px solid #8b5cf6;
  opacity: 0.6;
}

.corner-tl {
  top: 20px;
  left: 20px;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 20px;
  right: 20px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 20px;
  left: 20px;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 20px;
  right: 20px;
  border-left: none;
  border-top: none;
}

/* 动画定义 */
@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
}

@keyframes rainFall {
  0% { transform: translateY(-100vh); opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

@keyframes holoRing {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
  50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
}

@keyframes coreRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes neuralPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes nodePulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}

@keyframes titleGlow {
  0%, 100% { 
    text-shadow: 0 0 20px #8b5cf6;
    transform: translateY(0px);
  }
  50% { 
    text-shadow: 0 0 30px #8b5cf6, 0 0 40px #6366f1;
    transform: translateY(-2px);
  }
}

@keyframes glitch {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-2px); }
  20% { transform: translateX(2px); }
  30% { transform: translateX(-1px); }
  40% { transform: translateX(1px); }
  50% { transform: translateX(0); }
}

@keyframes hexRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes hexPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes trackScan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes statusBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes scanMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .splash-content {
    padding: 1rem;
    max-width: 90%;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .hologram-container {
    width: 120px;
    height: 120px;
  }
  
  .ai-svg {
    width: 80px;
    height: 80px;
  }
}
</style>