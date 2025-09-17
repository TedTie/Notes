<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none" style="z-index: 3;">
    <!-- 动态效果层 - 多层滚动背景 -->
    <div class="absolute inset-0">
      <!-- 多层网格背景 -->
      <div class="absolute inset-0">
        <!-- 主网格层 - 慢速右下滚动 -->
        <div class="absolute inset-0 opacity-15">
          <div class="grid-layer-1" :class="{ 'day-grid-main': !isDarkMode, 'night-grid-main': isDarkMode }"></div>
        </div>
        
        <!-- 次网格层 - 中速左上滚动 -->
        <div class="absolute inset-0 opacity-10">
          <div class="grid-layer-2" :class="{ 'day-grid-secondary': !isDarkMode, 'night-grid-secondary': isDarkMode }"></div>
        </div>
        
        <!-- 细网格层 - 快速垂直滚动 -->
        <div class="absolute inset-0 opacity-8">
          <div class="grid-layer-3" :class="{ 'day-grid-fine': !isDarkMode, 'night-grid-fine': isDarkMode }"></div>
        </div>
      </div>
      
      <!-- 浮动粒子 -->
      <div class="particles-container">
        <div 
          v-for="particle in particles" 
          :key="particle.id"
          class="particle"
          :class="{ 
            'day-particle': !isDarkMode, 
            'night-particle': isDarkMode,
            'motion-right-up': particle.motionType === 0,
            'motion-left-up': particle.motionType === 1,
            'motion-vertical': particle.motionType === 2,
            'motion-diagonal': particle.motionType === 3
          }"
          :style="{
            left: particle.x + '%',
            top: particle.y + '%',
            animationDelay: particle.delay + 's',
            animationDuration: particle.duration + 's'
          }"
        ></div>
      </div>
      
      <!-- 光束效果 -->
      <div class="light-beams">
        <div class="beam beam-1" :class="{ 'day-beam': !isDarkMode, 'night-beam': isDarkMode }"></div>
      <div class="beam beam-2" :class="{ 'day-beam': !isDarkMode, 'night-beam': isDarkMode }"></div>
      <div class="beam beam-3" :class="{ 'day-beam': !isDarkMode, 'night-beam': isDarkMode }"></div>
      </div>
      
      <!-- 脉冲圆环 -->
      <div class="pulse-rings">
        <div class="ring ring-1" :class="{ 'day-ring': !isDarkMode, 'night-ring': isDarkMode }"></div>
      <div class="ring ring-2" :class="{ 'day-ring': !isDarkMode, 'night-ring': isDarkMode }"></div>
      <div class="ring ring-3" :class="{ 'day-ring': !isDarkMode, 'night-ring': isDarkMode }"></div>
      </div>
      
      <!-- 数字雨效果 -->
      <div class="digital-rain">
        <div 
          v-for="drop in digitalDrops" 
          :key="drop.id"
          class="rain-drop"
          :class="{ 'day-rain': !isDarkMode, 'night-rain': isDarkMode }"
          :style="{
            left: drop.x + '%',
            animationDelay: drop.delay + 's',
            animationDuration: drop.duration + 's'
          }"
        >
          {{ drop.char }}
        </div>
      </div>
      
      <!-- 赛博朋克城市建筑轮廓 -->
      <div class="city-skyline">
        <div 
          v-for="building in buildings" 
          :key="building.id"
          class="building"
          :style="{
            left: building.x + '%',
            width: building.width + 'px',
            height: building.height + 'px',
            animationDelay: building.delay + 's'
          }"
        >
          <!-- 建筑霓虹灯条 -->
          <div class="neon-lines">
            <div 
              v-for="line in building.neonLines" 
              :key="line.id"
              class="neon-line"
              :class="{ 'day-neon': !isDarkMode, 'night-neon': isDarkMode }"
              :style="{
                top: line.y + '%',
                width: line.width + '%',
                left: '50%',
                transform: 'translateX(-50%)',
                animationDelay: line.delay + 's'
              }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- 全息投影效果 -->
      <div class="hologram-container">
        <div 
          v-for="hologram in holograms" 
          :key="hologram.id"
          class="hologram"
          :class="!isDarkMode ? 'day-hologram' : 'night-hologram'"
          :style="{
            left: hologram.x + '%',
            top: hologram.y + '%',
            animationDelay: hologram.delay + 's',
            animationDuration: hologram.duration + 's'
          }"
        >
          {{ hologram.content }}
        </div>
      </div>
      
      <!-- 数据流效果 -->
      <div class="data-streams">
        <div 
          v-for="stream in dataStreams" 
          :key="stream.id"
          class="data-stream"
          :class="!isDarkMode ? 'day-stream' : 'night-stream'"
          :style="{
            left: stream.x + '%',
            animationDelay: stream.delay + 's',
            animationDuration: stream.duration + 's'
          }"
        ></div>
      </div>
      
      <!-- 浮动载具效果 -->
      <div class="floating-vehicles">
        <div 
          v-for="vehicle in vehicles" 
          :key="vehicle.id"
          class="vehicle"
          :class="!isDarkMode ? 'day-vehicle' : 'night-vehicle'"
          :style="{
            top: vehicle.y + '%',
            animationDelay: vehicle.delay + 's',
            animationDuration: vehicle.duration + 's'
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme'

interface Particle {
  id: number
  x: number
  y: number
  delay: number
  duration: number
}

interface DigitalDrop {
  id: number
  x: number
  char: string
  delay: number
  duration: number
}

interface Building {
  id: number
  x: number
  width: number
  height: number
  delay: number
  neonLines: NeonLine[]
}

interface NeonLine {
  id: number
  y: number
  width: number
  delay: number
}

interface Hologram {
  id: number
  x: number
  y: number
  delay: number
  duration: number
  content: string
}

interface DataStream {
  id: number
  x: number
  delay: number
  duration: number
}

interface Vehicle {
  id: number
  x: number
  y: number
  delay: number
  duration: number
}

const { isDarkMode } = useTheme()

const particles = ref<Particle[]>([])
const digitalDrops = ref<DigitalDrop[]>([])
const buildings = ref<Building[]>([])
const holograms = ref<Hologram[]>([])
const dataStreams = ref<DataStream[]>([])
const vehicles = ref<Vehicle[]>([])

const generateParticles = () => {
  const particleCount = 12 // 适度减少数量，但增加多样性
  particles.value = Array.from({ length: particleCount }, (_, i) => {
    // 创建不同类型的粒子运动模式
    const motionType = Math.floor(Math.random() * 4)
    let x, y, delay, duration
    
    switch(motionType) {
      case 0: // 从左侧进入，向右上飘动
        x = -5 + Math.random() * 10
        y = 50 + Math.random() * 40
        break
      case 1: // 从右侧进入，向左上飘动  
        x = 95 + Math.random() * 10
        y = 60 + Math.random() * 30
        break
      case 2: // 从底部进入，垂直上升
        x = Math.random() * 100
        y = 95 + Math.random() * 10
        break
      default: // 随机位置，对角线飘动
        x = Math.random() * 100
        y = Math.random() * 100
    }
    
    return {
      id: i,
      x,
      y,
      delay: Math.random() * 8, // 增加延迟范围
      duration: 4 + Math.random() * 6, // 增加持续时间范围
      motionType // 添加运动类型标识
    }
  })
}

const generateDigitalRain = () => {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  const dropCount = 8 // 从20减少到8以提升性能
  digitalDrops.value = Array.from({ length: dropCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    char: chars[Math.floor(Math.random() * chars.length)],
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 4
  }))
}

const generateBuildings = () => {
  const buildingCount = 6 // 从12减少到6以提升性能
  buildings.value = Array.from({ length: buildingCount }, (_, i) => {
    const neonLineCount = 3 + Math.floor(Math.random() * 5)
    const neonLines = Array.from({ length: neonLineCount }, (_, j) => ({
      id: j,
      y: 20 + Math.random() * 60,
      width: 60 + Math.random() * 40,
      delay: Math.random() * 3
    }))
    
    return {
      id: i,
      x: (i * 8) + Math.random() * 5, // 均匀分布建筑
      width: 40 + Math.random() * 60,
      height: 200 + Math.random() * 300,
      delay: Math.random() * 2,
      neonLines
    }
  })
}

const generateHolograms = () => {
  const hologramCount = 6
  const contents = ['◊', '△', '◯', '◢', '◣', '◤', '◥', '⬟', '⬢', '⬡']
  holograms.value = Array.from({ length: hologramCount }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10,
    y: Math.random() * 60 + 20,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 4,
    content: contents[Math.floor(Math.random() * contents.length)]
  }))
}

const generateDataStreams = () => {
  const streamCount = 8
  dataStreams.value = Array.from({ length: streamCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 3
  }))
}

const generateVehicles = () => {
  const vehicleCount = 4
  vehicles.value = Array.from({ length: vehicleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 120 - 10,
    y: 30 + Math.random() * 40,
    delay: Math.random() * 15,
    duration: 20 + Math.random() * 15
  }))
}

onMounted(() => {
  generateParticles()
  generateDigitalRain()
  generateBuildings()
  generateHolograms()
  generateDataStreams()
  generateVehicles()
  
  // 大幅减少重新生成频率以提升性能
  setInterval(() => {
    generateParticles()
  }, 60000) // 从10秒改为60秒
  
  setInterval(() => {
    generateDigitalRain()
  }, 120000) // 从15秒改为120秒
  
  // 移除建筑物和全息图的重新生成以减少性能负担
  // setInterval(() => {
  //   generateBuildings()
  // }, 45000)
  
  // setInterval(() => {
  //   generateHolograms()
  // }, 20000)
})
</script>

<style scoped>
/* 动态效果样式 */

/* 多层网格图案 */

/* 主网格层 - 大网格，慢速右下滚动 */
.grid-layer-1 {
  background-size: 80px 80px;
  animation: grid-move-main 45s linear infinite;
}

.day-grid-main {
  background-image: 
    linear-gradient(rgba(0, 150, 255, 0.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 150, 255, 0.25) 1px, transparent 1px);
}

.night-grid-main {
  background-image: 
    linear-gradient(rgba(147, 51, 234, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147, 51, 234, 0.2) 1px, transparent 1px);
}

/* 次网格层 - 中等网格，中速左上滚动 */
.grid-layer-2 {
  background-size: 40px 40px;
  animation: grid-move-secondary 25s linear infinite;
}

.day-grid-secondary {
  background-image: 
    linear-gradient(rgba(34, 197, 94, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 197, 94, 0.15) 1px, transparent 1px);
}

.night-grid-secondary {
  background-image: 
    linear-gradient(rgba(236, 72, 153, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(236, 72, 153, 0.12) 1px, transparent 1px);
}

/* 细网格层 - 小网格，快速垂直滚动 */
.grid-layer-3 {
  background-size: 20px 20px;
  animation: grid-move-fine 15s linear infinite;
}

.day-grid-fine {
  background-image: 
    linear-gradient(rgba(251, 191, 36, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251, 191, 36, 0.1) 1px, transparent 1px);
}

.night-grid-fine {
  background-image: 
    linear-gradient(rgba(168, 85, 247, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.08) 1px, transparent 1px);
}

/* 不同方向的滚动动画 */
@keyframes grid-move-main {
  0% { transform: translate(0, 0); }
  100% { transform: translate(80px, 80px); }
}

@keyframes grid-move-secondary {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-40px, -40px); }
}

@keyframes grid-move-fine {
  0% { transform: translate(0, 0); }
  100% { transform: translate(0, -20px); }
}

/* 粒子动画 */
.particles-container {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  animation: float infinite ease-in-out;
}

/* 不同运动类型的粒子动画 */
.particle.motion-right-up {
  animation-name: float-right-up;
}

.particle.motion-left-up {
  animation-name: float-left-up;
}

.particle.motion-vertical {
  animation-name: float-vertical;
}

.particle.motion-diagonal {
  animation-name: float-diagonal;
}

.day-particle {
  background: linear-gradient(45deg, #0ea5e9, #22d3ee);
  box-shadow: 0 0 10px rgba(14, 165, 233, 0.7);
}

.night-particle {
  background: linear-gradient(45deg, #a855f7, #ec4899);
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.9);
}

@keyframes float {
  0% {
    transform: translateY(0px);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh);
    opacity: 0;
  }
}

/* 多样化粒子动画 */
@keyframes float-right-up {
  0% {
    transform: translate(0px, 0px);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translate(120vw, -80vh);
    opacity: 0;
  }
}

@keyframes float-left-up {
  0% {
    transform: translate(0px, 0px);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-120vw, -80vh);
    opacity: 0;
  }
}

@keyframes float-vertical {
  0% {
    transform: translateY(0px);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
  }
  85% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(-120vh);
    opacity: 0;
  }
}

@keyframes float-diagonal {
  0% {
    transform: translate(0px, 0px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translate(80vw, -100vh) rotate(360deg);
    opacity: 0;
  }
}

/* 光束效果 */
.light-beams {
  position: absolute;
  inset: 0;
}

.beam {
  position: absolute;
  height: 1px;
  width: 100%;
  animation: beam-sweep 8s ease-in-out infinite;
}

.day-beam {
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.5), transparent);
}

.night-beam {
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.4), transparent);
}

.beam-1 {
  top: 20%;
  animation-delay: 0s;
}

.beam-2 {
  top: 50%;
  animation-delay: 2s;
}

.beam-3 {
  top: 80%;
  animation-delay: 4s;
}

@keyframes beam-sweep {
  0%, 100% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 脉冲圆环 */
.pulse-rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  border-radius: 50%;
  animation: pulse-ring 4s ease-out infinite;
}

.day-ring {
  border: 1px solid rgba(0, 229, 255, 0.4);
}

.night-ring {
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.ring-1 {
  width: 200px;
  height: 200px;
  animation-delay: 0s;
}

.ring-2 {
  width: 400px;
  height: 400px;
  animation-delay: 1s;
}

.ring-3 {
  width: 600px;
  height: 600px;
  animation-delay: 2s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 数字雨 */
.digital-rain {
  position: absolute;
  inset: 0;
}

.rain-drop {
  position: absolute;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  font-weight: bold;
  animation: digital-fall infinite linear;
}

.day-rain {
  color: rgba(0, 188, 212, 0.7);
  text-shadow: 0 0 6px rgba(0, 188, 212, 0.9);
}

.night-rain {
  color: rgba(6, 182, 212, 0.6);
  text-shadow: 0 0 5px rgba(6, 182, 212, 0.8);
}

@keyframes digital-fall {
  0% {
    transform: translateY(-100vh);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* 赛博朋克城市建筑 */
.city-skyline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60%;
  pointer-events: none;
  z-index: 3;
}

.building {
  position: absolute;
  bottom: 0;
  border-bottom: none;
  clip-path: polygon(0 100%, 0 20%, 10% 15%, 15% 0%, 85% 0%, 90% 15%, 100% 20%, 100% 100%);
  transition: all 0.3s ease;
}

.day-mode .building {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 245, 250, 0.95) 100%);
  border: 1px solid rgba(0, 255, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

.night-mode .building {
  background: linear-gradient(180deg, rgba(20, 25, 40, 0.9) 0%, rgba(10, 15, 25, 0.95) 100%);
  border: 1px solid rgba(147, 51, 234, 0.4);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.2);
}

/* 建筑霓虹灯条 */
.neon-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.neon-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
  animation: neon-pulse 3s ease-in-out infinite;
  border-radius: 1px;
}

.day-neon {
  color: #00ffff;
  box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
}

.night-neon {
  color: #9333ea;
  box-shadow: 0 0 10px #9333ea, 0 0 20px #9333ea;
}

@keyframes neon-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scaleX(0.8);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
}

/* 全息投影效果 */
.hologram-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

.hologram {
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  animation: hologram-float ease-in-out infinite;
  filter: blur(0.5px);
}

.day-hologram {
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
}

.night-hologram {
  color: #9333ea;
  text-shadow: 0 0 10px #9333ea, 0 0 20px #9333ea, 0 0 30px #9333ea;
}

@keyframes hologram-float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* 数据流效果 */
.data-streams {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.data-stream {
  position: absolute;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, transparent 0%, currentColor 20%, currentColor 80%, transparent 100%);
  animation: data-flow linear infinite;
  opacity: 0.8;
}

.day-stream {
  color: #00ffff;
}

.night-stream {
  color: #9333ea;
}

@keyframes data-flow {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(100vh);
  }
}

/* 浮动载具效果 */
.floating-vehicles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.vehicle {
  position: absolute;
  width: 40px;
  height: 8px;
  background: linear-gradient(90deg, transparent 0%, currentColor 30%, currentColor 70%, transparent 100%);
  border-radius: 4px;
  animation: vehicle-fly linear infinite;
  filter: blur(0.5px);
}

.vehicle::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 4px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.6;
}

.day-vehicle {
  color: #00ffff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.night-vehicle {
  color: #9333ea;
  box-shadow: 0 0 15px rgba(147, 51, 234, 0.5);
}

@keyframes vehicle-fly {
  from {
    transform: translateX(-50px);
  }
  to {
    transform: translateX(calc(100vw + 50px));
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .particle {
    width: 1px;
    height: 1px;
  }
  
  .rain-drop {
    font-size: 12px;
  }
  
  .ring-1 {
    width: 150px;
    height: 150px;
  }
  
  .ring-2 {
    width: 300px;
    height: 300px;
  }
  
  .ring-3 {
    width: 450px;
    height: 450px;
  }
  
  .building {
    width: 30px !important;
    height: 150px !important;
  }
  
  .neon-line {
    height: 1px;
  }
  
  .hologram {
    font-size: 16px;
  }
  
  .vehicle {
    width: 25px;
    height: 5px;
  }
  
  .vehicle::before {
    width: 12px;
    height: 2px;
  }
  
  .data-stream {
    width: 1px;
  }
}
</style>