<template>
  <div class="relative w-full max-w-4xl mx-auto antialiased pt-4 relative">
    <div class="absolute left-4 md:left-8 top-6 bottom-0 overflow-hidden">
      <svg
        ref="svgRef"
        viewBox="0 0 20 100"
        class="ml-4 block h-full w-4 md:w-8"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            :y1="y1"
            :y2="y2"
          >
            <stop stop-color="#18CCFC" stop-opacity="0"></stop>
            <stop stop-color="#18CCFC"></stop>
            <stop offset="0.325" stop-color="#6344F5"></stop>
            <stop offset="1" stop-color="#AE48FF" stop-opacity="0"></stop>
          </linearGradient>
        </defs>
        <path
          d="m0,2.5 l0,95"
          stroke="url(#gradient)"
          stroke-width="1.25"
          fill="none"
        ></path>
      </svg>
    </div>
    <div ref="contentRef" class="relative">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  className: {
    type: String,
    default: ''
  }
})

const svgRef = ref(null)
const contentRef = ref(null)
const y1 = ref(0)
const y2 = ref(10)
const svgHeight = ref(0)

let animationId = null

const updateGradient = () => {
  if (!contentRef.value || !svgRef.value) return
  
  const rect = contentRef.value.getBoundingClientRect()
  const svgRect = svgRef.value.getBoundingClientRect()
  
  const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)))
  
  // 计算渐变位置
  const gradientStart = scrollProgress * 100
  const gradientEnd = Math.min(100, gradientStart + 10)
  
  y1.value = gradientStart
  y2.value = gradientEnd
}

const handleScroll = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  animationId = requestAnimationFrame(updateGradient)
}

const updateSvgHeight = () => {
  if (contentRef.value) {
    svgHeight.value = contentRef.value.scrollHeight
  }
}

onMounted(async () => {
  await nextTick()
  updateSvgHeight()
  updateGradient()
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateSvgHeight)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateSvgHeight)
})
</script>

<style scoped>
/* 隐藏默认滚动条 */
:deep(*) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

:deep(*::-webkit-scrollbar) {
  display: none; /* Chrome, Safari and Opera */
}

/* 确保组件内容可以正常滚动 */
.relative {
  overflow: visible;
}
</style>