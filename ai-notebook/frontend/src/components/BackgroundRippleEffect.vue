<template>
  <div 
    class="background-ripple-container"
    :class="{ 'dark-theme': isDark, 'light-theme': !isDark }"
  >
    <div 
      class="ripple-grid"
      :style="{
          '--rows': gridSize.rows,
          '--cols': gridSize.cols,
          '--cell-size': props.cellSize + 'px',
          gridTemplateColumns: `repeat(${gridSize.cols}, ${props.cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize.rows}, ${props.cellSize}px)`
        }"
    >
      <div
        v-for="(cell, index) in cells"
        :key="index"
        class="ripple-cell"
        :class="{ 'rippled': cell.rippled }"
        @click="handleCellClick(cell.row, cell.col)"
        @mouseenter="handleCellHover(cell.row, cell.col)"
        :style="{
          '--delay': cell.delay + 'ms'
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

const props = defineProps({
  rows: {
    type: Number,
    default: 8
  },
  cols: {
    type: Number,
    default: 27
  },
  cellSize: {
    type: Number,
    default: 56
  },
  interactive: {
    type: Boolean,
    default: true
  }
})

// 计算动态网格尺寸以覆盖全屏
const calculateGridSize = () => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  // 计算需要的列数和行数，确保覆盖全屏
  const calculatedCols = Math.ceil(screenWidth / props.cellSize) + 2 // 额外2列确保覆盖
  const calculatedRows = Math.ceil(screenHeight / props.cellSize) + 2 // 额外2行确保覆盖
  
  return {
    cols: Math.max(calculatedCols, props.cols),
    rows: Math.max(calculatedRows, props.rows)
  }
}

const gridSize = ref(calculateGridSize())

const { isDark } = useTheme()
const cells = ref([])
const rippleTimeouts = ref(new Map())

// 初始化网格
const initializeGrid = () => {
  // 重新计算网格尺寸
  gridSize.value = calculateGridSize()
  
  cells.value = []
  for (let row = 0; row < gridSize.value.rows; row++) {
    for (let col = 0; col < gridSize.value.cols; col++) {
      cells.value.push({
        row,
        col,
        rippled: false,
        delay: 0
      })
    }
  }
}

// 处理点击事件
const handleCellClick = (row, col) => {
  if (!props.interactive) return
  triggerRipple(row, col, 3) // 点击时更大的涟漪范围
}

// 处理悬停事件
const handleCellHover = (row, col) => {
  if (!props.interactive) return
  triggerRipple(row, col, 2) // 悬停时较小的涟漪范围
}

// 触发涟漪效果
const triggerRipple = (centerRow, centerCol, radius = 2) => {
  const affectedCells = []
  
  // 计算受影响的单元格
  for (let row = Math.max(0, centerRow - radius); row <= Math.min(gridSize.value.rows - 1, centerRow + radius); row++) {
    for (let col = Math.max(0, centerCol - radius); col <= Math.min(gridSize.value.cols - 1, centerCol + radius); col++) {
      const distance = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2))
      if (distance <= radius) {
        const cellIndex = row * gridSize.value.cols + col
        const delay = distance * 50 // 延迟基于距离
        affectedCells.push({ index: cellIndex, delay })
      }
    }
  }
  
  // 应用涟漪效果
  affectedCells.forEach(({ index, delay }) => {
    setTimeout(() => {
      if (cells.value[index]) {
        cells.value[index].rippled = true
        cells.value[index].delay = delay
        
        // 清除之前的超时
        const timeoutKey = `${cells.value[index].row}-${cells.value[index].col}`
        if (rippleTimeouts.value.has(timeoutKey)) {
          clearTimeout(rippleTimeouts.value.get(timeoutKey))
        }
        
        // 设置新的超时来重置涟漪
        const timeout = setTimeout(() => {
          if (cells.value[index]) {
            cells.value[index].rippled = false
          }
          rippleTimeouts.value.delete(timeoutKey)
        }, 600)
        
        rippleTimeouts.value.set(timeoutKey, timeout)
      }
    }, delay)
  })
}

// 随机涟漪效果
const createRandomRipple = () => {
  const randomRow = Math.floor(Math.random() * gridSize.value.rows)
  const randomCol = Math.floor(Math.random() * gridSize.value.cols)
  triggerRipple(randomRow, randomCol, 1)
}

// 定期创建随机涟漪
let randomRippleInterval
const startRandomRipples = () => {
  randomRippleInterval = setInterval(() => {
    if (Math.random() < 0.3) { // 30% 概率
      createRandomRipple()
    }
  }, 2000)
}

onMounted(() => {
  initializeGrid()
  startRandomRipples()
  
  // 监听窗口大小变化
  window.addEventListener('resize', initializeGrid)
})

// 监听props变化重新初始化
watch([() => props.rows, () => props.cols], () => {
  initializeGrid()
})

// 清理定时器
const cleanup = () => {
  if (randomRippleInterval) {
    clearInterval(randomRippleInterval)
  }
  rippleTimeouts.value.forEach(timeout => clearTimeout(timeout))
  rippleTimeouts.value.clear()
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', initializeGrid)
})
</script>

<style scoped>
.background-ripple-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}

.ripple-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  grid-template-rows: repeat(var(--rows), var(--cell-size));
  gap: 0;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-content: center;
  min-width: 100vw;
  min-height: 100vh;
}

.ripple-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  border-radius: 4px;
  transition: all 0.3s ease;
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

/* 浅色主题样式 */
.light-theme .ripple-cell {
  background: rgba(34, 197, 94, 0.05); /* 更淡的半透明绿色 */
  border: 1px solid rgba(59, 130, 246, 0.1); /* 更淡的半透明蓝色边框 */
}

.light-theme .ripple-cell:hover {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(59, 130, 246, 0.25);
  transform: scale(1.02);
}

.light-theme .ripple-cell.rippled {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.25) 0%, 
    rgba(59, 130, 246, 0.25) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
  animation: ripple-pulse-light 0.6s ease-out;
}

/* 深色主题样式 */
.dark-theme .ripple-cell {
  background: rgba(147, 51, 234, 0.08); /* 更淡的半透明紫色 */
  border: 1px solid rgba(59, 130, 246, 0.15); /* 更淡的半透明蓝色边框 */
}

.dark-theme .ripple-cell:hover {
  background: rgba(147, 51, 234, 0.18);
  border-color: rgba(59, 130, 246, 0.3);
  transform: scale(1.02);
}

.dark-theme .ripple-cell.rippled {
  background: linear-gradient(135deg, 
    rgba(147, 51, 234, 0.35) 0%, 
    rgba(59, 130, 246, 0.35) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
  animation: ripple-pulse-dark 0.6s ease-out;
}

/* 动画效果 */
@keyframes ripple-pulse-light {
  0% {
    opacity: 0.3;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.15);
  }
  100% {
    opacity: 0.4;
    transform: scale(1.1);
  }
}

@keyframes ripple-pulse-dark {
  0% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
  }
  100% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ripple-grid {
    grid-template-columns: repeat(var(--cols), calc(var(--cell-size) * 0.7));
    grid-template-rows: repeat(var(--rows), calc(var(--cell-size) * 0.7));
  }
  
  .ripple-cell {
    width: calc(var(--cell-size) * 0.7);
    height: calc(var(--cell-size) * 0.7);
  }
}

@media (max-width: 480px) {
  .ripple-grid {
    grid-template-columns: repeat(var(--cols), calc(var(--cell-size) * 0.5));
    grid-template-rows: repeat(var(--rows), calc(var(--cell-size) * 0.5));
  }
  
  .ripple-cell {
    width: calc(var(--cell-size) * 0.5);
    height: calc(var(--cell-size) * 0.5);
  }
}
</style>