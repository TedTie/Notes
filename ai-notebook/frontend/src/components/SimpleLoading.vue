<template>
  <div v-if="visible" class="simple-loading-overlay">
    <div class="loading-container">
      <!-- 简单的旋转圆环 -->
      <div class="spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      
      <!-- 加载文本 -->
      <div class="loading-text">
        {{ text || 'AI笔记本正在启动...' }}
      </div>
      
      <!-- 进度条（可选） -->
      <div v-if="showProgress" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: 'AI笔记本正在启动...'
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['loaded'])

// 模拟加载完成（可选）
const simulateLoading = () => {
  setTimeout(() => {
    emit('loaded')
  }, 2000)
}

onMounted(() => {
  if (props.visible) {
    simulateLoading()
  }
})
</script>

<style scoped>
.simple-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 旋转圆环动画 */
.spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #3498db;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: #e74c3c;
  animation-delay: 0.5s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #2ecc71;
  animation-delay: 1s;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 加载文本 */
.loading-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 进度条 */
.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .spinner {
    width: 50px;
    height: 50px;
  }
  
  .loading-text {
    font-size: 14px;
  }
  
  .progress-bar {
    width: 150px;
  }
}
</style>