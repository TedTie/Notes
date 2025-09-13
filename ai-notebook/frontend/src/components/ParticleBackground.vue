<template>
  <div class="particle-background">
    <canvas ref="canvas" class="particle-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const canvas = ref(null)
const { isDarkMode } = useTheme()
let ctx = null
let animationId = null
let particles = []

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.size = Math.random() * 3 + 1
    this.speedX = Math.random() * 3 - 1.5
    this.speedY = Math.random() * 3 - 1.5
    this.opacity = Math.random() * 0.5 + 0.2
    this.life = Math.random() * 100 + 50
    this.maxLife = this.life
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY
    this.life--
    this.opacity = (this.life / this.maxLife) * 0.7
    
    // 边界检测
    if (this.x < 0 || this.x > canvas.value.width) this.speedX *= -1
    if (this.y < 0 || this.y > canvas.value.height) this.speedY *= -1
  }

  draw() {
    ctx.save()
    ctx.globalAlpha = this.opacity
    
    // 根据主题设置粒子颜色
    const color = isDarkMode.value 
      ? `rgba(147, 51, 234, ${this.opacity})` // 紫色
      : `rgba(6, 182, 212, ${this.opacity})`  // 青色
    
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    
    // 添加光晕效果
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 3
    )
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }

  isDead() {
    return this.life <= 0
  }
}

const initCanvas = () => {
  if (!canvas.value) return
  
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  
  // 初始化粒子
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(
      Math.random() * canvas.value.width,
      Math.random() * canvas.value.height
    ))
  }
  
  animate()
}

const resizeCanvas = () => {
  if (!canvas.value) return
  
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

const animate = () => {
  if (!ctx || !canvas.value) return
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // 更新和绘制粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i]
    particle.update()
    particle.draw()
    
    if (particle.isDead()) {
      particles.splice(i, 1)
    }
  }
  
  // 添加新粒子
  if (particles.length < 50 && Math.random() < 0.1) {
    particles.push(new Particle(
      Math.random() * canvas.value.width,
      Math.random() * canvas.value.height
    ))
  }
  
  // 绘制连接线
  drawConnections()
  
  animationId = requestAnimationFrame(animate)
}

const drawConnections = () => {
  const maxDistance = 100
  
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < maxDistance) {
        const opacity = (1 - distance / maxDistance) * 0.2
        
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.strokeStyle = isDarkMode.value 
          ? 'rgba(147, 51, 234, 0.3)' 
          : 'rgba(6, 182, 212, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
        ctx.restore()
      }
    }
  }
}

const handleResize = () => {
  resizeCanvas()
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.particle-canvas {
  width: 100%;
  height: 100%;
  opacity: 0.6;
}
</style>