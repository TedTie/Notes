<template>
  <div class="fixed inset-0 pointer-events-none" style="z-index: 1;">
    <!-- 静态渐变背景 - 根据主题切换 -->
    <div 
      class="absolute inset-0 transition-all duration-1000 ease-in-out"
      :class="{
        'day-background': !isDarkMode,
        'night-background': isDarkMode
      }"
    >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { isDarkMode } = useTheme()
</script>

<style scoped>
/* 日间模式背景 */
.day-background {
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    #f8fafc 25%,
    #f1f5f9 50%,
    #e2e8f0 75%,
    #cbd5e1 100%
  );
}

/* 夜间模式背景 */
.night-background {
  background: linear-gradient(
    135deg,
    #0c0c0c 0%,
    #1a1a2e 25%,
    #16213e 50%,
    #0f3460 75%,
    #533483 100%
  );
}
</style>