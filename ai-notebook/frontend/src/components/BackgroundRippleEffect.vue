<template>
  <div 
    class="background-ripple-container"
    :class="{ 'theme-dark': isDark, 'theme-light': !isDark }"
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
    default: 80
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
  const calculatedCols = Math.ceil(screenWidth / props.cellSize) + 1 // 减少额外列数
  const calculatedRows = Math.ceil(screenHeight / props.cellSize) + 1 // 减少额外行数
  
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

// 防抖变量和动画优化
let hoverTimeout = null
let animationFrame = null
const pendingUpdates = new Set()

// 批量更新DOM，使用requestAnimationFrame优化
const batchUpdateCells = () => {
  if (animationFrame) return
  
  animationFrame = requestAnimationFrame(() => {
    // 批量处理所有待更新的单元格
    pendingUpdates.forEach(cellIndex => {
      if (cells.value[cellIndex]) {
        // 触发响应式更新
        cells.value[cellIndex] = { ...cells.value[cellIndex] }
      }
    })
    pendingUpdates.clear()
    animationFrame = null
  })
}

// 处理点击事件
const handleCellClick = (row, col) => {
  if (!props.interactive) return
  triggerRipple(row, col, 3) // 点击时更大的涟漪范围
}

// 处理悬停事件（添加防抖）
const handleCellHover = (row, col) => {
  if (!props.interactive) return
  
  // 清除之前的悬停定时器
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }
  
  // 设置新的悬停定时器，减少频繁触发
  hoverTimeout = setTimeout(() => {
    triggerRipple(row, col, 2) // 悬停时较小的涟漪范围
  }, 100) // 增加防抖延迟到100ms
}

// 触发涟漪效果（优化算法）
const triggerRipple = (centerRow, centerCol, radius = 2) => {
  const affectedCells = []
  const radiusSquared = radius * radius // 避免重复计算平方根
  
  // 计算受影响的单元格
  for (let row = Math.max(0, centerRow - radius); row <= Math.min(gridSize.value.rows - 1, centerRow + radius); row++) {
    for (let col = Math.max(0, centerCol - radius); col <= Math.min(gridSize.value.cols - 1, centerCol + radius); col++) {
      const distanceSquared = Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
      if (distanceSquared <= radiusSquared) {
        const cellIndex = row * gridSize.value.cols + col
        const delay = Math.sqrt(distanceSquared) * 20 // 只在需要时计算平方根
        affectedCells.push({ index: cellIndex, delay })
      }
    }
  }
  
  // 应用涟漪效果（使用批量更新优化）
  affectedCells.forEach(({ index, delay }) => {
    setTimeout(() => {
      if (cells.value[index]) {
        cells.value[index].rippled = true
        cells.value[index].delay = delay
        pendingUpdates.add(index) // 添加到待更新队列
        batchUpdateCells() // 触发批量更新
        
        // 清除之前的超时
        const timeoutKey = `${cells.value[index].row}-${cells.value[index].col}`
        if (rippleTimeouts.value.has(timeoutKey)) {
          clearTimeout(rippleTimeouts.value.get(timeoutKey))
        }
        
        // 设置新的超时来重置涟漪
        const timeout = setTimeout(() => {
          if (cells.value[index]) {
            cells.value[index].rippled = false
            pendingUpdates.add(index) // 添加到待更新队列
            batchUpdateCells() // 触发批量更新
          }
          rippleTimeouts.value.delete(timeoutKey)
        }, 300) // 进一步减少持续时间
        
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
    if (Math.random() < 0.15) { // 降低到15% 概率
      createRandomRipple()
    }
  }, 4000) // 增加间隔到4秒
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

// 清理定时器和动画帧
const cleanup = () => {
  if (randomRippleInterval) {
    clearInterval(randomRippleInterval)
  }
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  rippleTimeouts.value.forEach(timeout => clearTimeout(timeout))
  rippleTimeouts.value.clear()
  pendingUpdates.clear()
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', initializeGrid)
})
</script>

<style scoped>
/* 引入涟漪主题样式 */
@import url('/ripple-light.css');
@import url('/ripple-dark.css');

.background-ripple-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.ripple-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  grid-template-rows: repeat(var(--rows), var(--cell-size));
  gap: 0;
  width: 100%;
  height: 100%;
  justify-content: start;
  align-content: start;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 主题样式通过外部CSS文件加载 */

/* 响应式设计已移除，使用动态计算确保全屏覆盖 */
</style>