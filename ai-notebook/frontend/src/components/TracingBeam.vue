<template>
  <div class="tracing-beam-wrapper">
    <!-- 左侧追踪光束 -->
    <div class="beam-track">
      <div class="beam-progress" :style="{ height: progress + '%' }"></div>
      <div class="beam-dot" :style="{ top: progress + '%' }"></div>
    </div>
    
    <!-- 内容区域 -->
    <div class="beam-content" @scroll="handleScroll" ref="contentEl">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const progress = ref(0)
const contentEl = ref(null)

const handleScroll = () => {
  if (!contentEl.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = contentEl.value
  const maxScroll = scrollHeight - clientHeight
  
  if (maxScroll > 0) {
    progress.value = (scrollTop / maxScroll) * 100
  }
}

onMounted(() => {
  if (contentEl.value) {
    handleScroll()
  }
})
</script>

<style scoped>
.tracing-beam-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.beam-track {
  position: fixed;
  left: 20px;
  top: 0;
  width: 2px;
  height: 100vh;
  background: color-mix(in srgb, var(--theme-text) 10%, transparent);
  z-index: 50;
}

.beam-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to bottom, var(--theme-secondary), var(--theme-primary));
  transition: height 0.2s ease;
}

.beam-dot {
  position: absolute;
  left: -4px;
  width: 10px;
  height: 10px;
  background: var(--theme-secondary);
  border-radius: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 15px var(--theme-secondary);
  transition: top 0.2s ease;
}

.beam-content {
  flex: 1;
  padding-left: 60px;
  overflow-y: auto;
  height: 100vh;
  
  /* 隐藏滚动条但保持功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.beam-content::-webkit-scrollbar {
  display: none;
}

@media (max-width: 768px) {
  .beam-track {
    left: 10px;
  }
  
  .beam-content {
    padding-left: 30px;
  }
}
</style>