<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          AI 项目规划
        </h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <div v-if="!planning && !result" class="planning-intro">
          <div class="ai-icon">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h4>AI 智能项目规划</h4>
          <p>AI 将为您的项目生成详细的任务规划，包括：</p>
          <ul class="feature-list">
            <li>
              <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              任务分解与优先级排序
            </li>
            <li>
              <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              时间估算与里程碑设置
            </li>
            <li>
              <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              任务依赖关系分析
            </li>
            <li>
              <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              最佳实践建议
            </li>
          </ul>
          
          <div class="form-group">
            <label for="planning-requirements" class="form-label">项目需求描述</label>
            <textarea 
              id="planning-requirements"
              v-model="requirements"
              class="futuristic-textarea"
              placeholder="请详细描述您的项目需求、目标和约束条件..."
              rows="4"
              maxlength="1000"
            ></textarea>
            <div class="char-count">
              {{ requirements.length }}/1000
            </div>
          </div>
        </div>
        
        <div v-if="planning" class="planning-progress">
          <div class="ai-thinking">
            <div class="thinking-animation">
              <div class="brain-icon">🧠</div>
              <div class="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h4>AI 正在分析您的项目...</h4>
            <p class="thinking-text">{{ thinkingText }}</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>
        
        <div v-if="result" class="planning-result">
          <div class="result-header">
            <h4><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> AI 规划结果</h4>
            <div class="result-stats">
              <span class="stat-item"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> {{ result.tasks?.length || 0 }} 个任务</span>
              <span class="stat-item">⏱ 预计 {{ result.estimated_duration || 'N/A' }}</span>
            </div>
          </div>
          
          <div class="result-content">
            <div v-if="result.overview" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg> 项目概述</h5>
              <p>{{ result.overview }}</p>
            </div>
            
            <div v-if="result.tasks && result.tasks.length > 0" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> 任务列表</h5>
              <div class="task-list">
                <div 
                  v-for="(task, index) in result.tasks" 
                  :key="index"
                  class="task-item"
                >
                  <div class="task-header">
                    <span class="task-priority" :class="`priority-${task.priority}`">
                      {{ getPriorityIcon(task.priority) }}
                    </span>
                    <h6>{{ task.title }}</h6>
                    <span class="task-estimate">{{ task.estimated_time || '待估算' }}</span>
                  </div>
                  <p class="task-description">{{ task.description }}</p>
                  <div v-if="task.dependencies" class="task-dependencies">
                    <small>依赖: {{ task.dependencies.join(', ') }}</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="result.recommendations" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> 建议</h5>
              <ul class="recommendations">
                <li v-for="(rec, index) in result.recommendations" :key="index">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          v-if="!planning && !result"
          type="button"
          @click="$emit('close')"
          class="futuristic-btn-ghost"
        >
          取消
        </button>
        
        <button 
          v-if="!planning && !result"
          @click="startPlanning"
          class="futuristic-btn-primary"
          :disabled="!requirements.trim()"
        >
          <span class="mr-1"></span>
          开始 AI 规划
        </button>
        
        <button 
          v-if="result"
          @click="applyPlanning"
          class="futuristic-btn-primary"
          :disabled="applying"
        >
          <svg v-if="!applying" class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          <div v-else class="loading-spinner-small mr-1"></div>
          {{ applying ? '应用中...' : '应用规划' }}
        </button>
        
        <button 
          v-if="result"
          @click="resetPlanning"
          class="futuristic-btn-ghost"
          :disabled="applying"
        >
          重新规划
        </button>
        
        <button 
          @click="$emit('close')"
          class="futuristic-btn-ghost"
          :disabled="applying"
        >
          取消
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface PlanningTask {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimated_time?: string
  dependencies?: string[]
}

interface PlanningResult {
  overview?: string
  tasks?: PlanningTask[]
  estimated_duration?: string
  recommendations?: string[]
}

const props = defineProps<{
  project: {
    id: number
    name: string
    description?: string
  }
}>()

const emit = defineEmits<{
  'close': []
  'planning-applied': []
}>()

const requirements = ref('')
const planning = ref(false)
const applying = ref(false)
const result = ref<PlanningResult | null>(null)
const progress = ref(0)
const thinkingText = ref('正在分析项目需求...')

const thinkingTexts = [
  '正在分析项目需求...',
  '识别关键任务和里程碑...',
  '评估任务复杂度和依赖关系...',
  '优化任务优先级和时间安排...',
  '生成最佳实践建议...'
]

// 开始 AI 规划
const startPlanning = async () => {
  if (!requirements.value.trim()) {
    showNotification('请输入项目需求描述', 'error')
    return
  }
  
  planning.value = true
  progress.value = 0
  
  // 模拟规划过程
  const progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 15
      const textIndex = Math.floor((progress.value / 100) * thinkingTexts.length)
      thinkingText.value = thinkingTexts[Math.min(textIndex, thinkingTexts.length - 1)]
    }
  }, 800)
  
  try {
    // 调用 AI 规划 API
    const response = await axios.post('/api/ai/plan-project', {
      project_id: props.project.id,
      project_name: props.project.name,
      project_description: props.project.description,
      requirements: requirements.value.trim()
    })
    
    clearInterval(progressInterval)
    progress.value = 100
    
    setTimeout(() => {
      result.value = response.data
      planning.value = false
    }, 500)
    
  } catch (error) {
    clearInterval(progressInterval)
    planning.value = false
    console.error('AI 规划失败:', error)
    
    // 如果 API 失败，显示模拟结果
    result.value = {
      overview: `基于您的需求，我为"${props.project.name}"项目制定了详细的执行计划。该计划包含了关键任务的分解、优先级排序和时间估算。`,
      tasks: [
        {
          title: '项目初始化和环境搭建',
          description: '设置开发环境、配置工具链、创建项目结构',
          priority: 'high',
          estimated_time: '1-2 天'
        },
        {
          title: '核心功能开发',
          description: '实现项目的主要功能模块和业务逻辑',
          priority: 'high',
          estimated_time: '5-7 天',
          dependencies: ['项目初始化和环境搭建']
        },
        {
          title: '用户界面设计和实现',
          description: '设计用户界面，实现前端交互功能',
          priority: 'medium',
          estimated_time: '3-4 天'
        },
        {
          title: '测试和质量保证',
          description: '编写测试用例，进行功能测试和性能优化',
          priority: 'medium',
          estimated_time: '2-3 天',
          dependencies: ['核心功能开发', '用户界面设计和实现']
        },
        {
          title: '部署和发布',
          description: '配置生产环境，部署应用并进行发布',
          priority: 'low',
          estimated_time: '1 天',
          dependencies: ['测试和质量保证']
        }
      ],
      estimated_duration: '2-3 周',
      recommendations: [
        '建议采用敏捷开发方法，分阶段交付',
        '优先实现核心功能，后续迭代完善细节',
        '建立持续集成和自动化测试流程',
        '定期进行代码审查和技术债务清理'
      ]
    }
    
    showNotification('AI 规划完成（使用模拟数据）', 'info')
  }
}

// 应用规划结果
const applyPlanning = async () => {
  if (!result.value?.tasks) {
    showNotification('没有可应用的规划结果', 'error')
    return
  }
  
  try {
    applying.value = true
    
    // 为每个规划任务创建实际任务
    for (const planTask of result.value.tasks) {
      await axios.post('/api/tasks', {
        project_id: props.project.id,
        title: planTask.title,
        description: planTask.description,
        priority: planTask.priority,
        status: 'todo'
      })
    }
    
    showNotification(`成功创建 ${result.value.tasks.length} 个任务`, 'success')
    emit('planning-applied')
    
  } catch (error) {
    console.error('应用规划失败:', error)
    showNotification('应用规划失败，请稍后重试', 'error')
  } finally {
    applying.value = false
  }
}

// 重置规划
const resetPlanning = () => {
  result.value = null
  requirements.value = ''
  progress.value = 0
}

// 获取优先级图标
const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return '🔴'
    case 'medium': return '🟡'
    case 'low': return '🟢'
    default: return '⚪'
  }
}

// 处理点击遮罩层
const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// 显示通知
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const event = new CustomEvent('setting-notification', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
}

// 初始化
onMounted(() => {
  if (props.project.description) {
    requirements.value = props.project.description
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999 !important;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(15px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 100000 !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(187, 134, 252, 0.2);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--theme-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--theme-text);
  background: rgba(187, 134, 252, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.planning-intro {
  text-align: center;
}

.ai-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

.planning-intro h4 {
  color: var(--theme-primary);
  margin-bottom: 1rem;
}

.feature-list {
  text-align: left;
  margin: 1.5rem 0;
  padding-left: 1rem;
}

.feature-list li {
  margin-bottom: 0.5rem;
  color: var(--theme-text-secondary);
}

.planning-progress {
  text-align: center;
  padding: 2rem 0;
}

.ai-thinking {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.thinking-animation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brain-icon {
  font-size: 3rem;
  animation: bounce 1s infinite;
}

.thinking-dots {
  display: flex;
  gap: 0.5rem;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: var(--theme-primary);
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

.thinking-text {
  color: var(--theme-text-secondary);
  font-style: italic;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(187, 134, 252, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
  transition: width 0.3s ease;
}

.planning-result {
  animation: fadeIn 0.5s ease;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(187, 134, 252, 0.2);
}

.result-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  background: rgba(187, 134, 252, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--theme-text-secondary);
}

.section {
  margin-bottom: 2rem;
}

.section h5 {
  color: var(--theme-primary);
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  background: rgba(187, 134, 252, 0.05);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.task-priority {
  font-size: 1.2rem;
}

.task-header h6 {
  flex: 1;
  margin: 0;
  color: var(--theme-text);
}

.task-estimate {
  background: rgba(187, 134, 252, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--theme-text-secondary);
}

.task-description {
  color: var(--theme-text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.task-dependencies {
  font-size: 0.8rem;
  color: var(--theme-text-muted);
}

.recommendations {
  list-style: none;
  padding: 0;
}

.recommendations li {
  background: rgba(187, 134, 252, 0.05);
  border-left: 3px solid var(--theme-primary);
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0 6px 6px 0;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(187, 134, 252, 0.2);
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--theme-text);
}

.futuristic-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-radius: 8px;
  color: var(--theme-text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  resize: vertical;
}

.futuristic-textarea:focus {
  outline: none;
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(187, 134, 252, 0.2);
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  margin-top: 0.25rem;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(187, 134, 252, 0.3);
  border-top: 2px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-10px); }
  70% { transform: translateY(-5px); }
}

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .result-stats {
    flex-wrap: wrap;
  }
  
  .task-header {
    flex-wrap: wrap;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>