<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title"><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg> AI 任务增强</h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <div v-if="!enhancing && !result" class="enhance-intro">
          <svg class="w-8 h-8 ai-icon" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <h4>AI 智能任务增强</h4>
          <p>AI 将为您的任务提供智能增强，包括：</p>
          <ul class="feature-list">
            <li><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> 任务描述优化和细化</li>
            <li><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> 子任务自动分解</li>
            <li><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> 时间估算和难度评估</li>
            <li><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> 实施建议和最佳实践</li>
            <li><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/></svg> 相关资源和工具推荐</li>
          </ul>
          
          <div class="current-task">
            <h5>当前任务</h5>
            <div class="task-preview">
              <h6>{{ task.title }}</h6>
              <p v-if="task.description">{{ task.description }}</p>
              <p v-else class="no-description">暂无描述</p>
            </div>
          </div>
          
          <div class="form-group">
            <label for="enhance-context" class="form-label">补充信息（可选）</label>
            <textarea 
              id="enhance-context"
              v-model="additionalContext"
              class="futuristic-textarea"
              placeholder="请提供任何额外的上下文信息、特殊要求或约束条件..."
              rows="3"
              maxlength="500"
            ></textarea>
            <div class="char-count">
              {{ additionalContext.length }}/500
            </div>
          </div>
        </div>
        
        <div v-if="enhancing" class="enhancing-progress">
          <div class="ai-thinking">
            <div class="thinking-animation">
              <svg class="w-6 h-6 sparkle-icon" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <div class="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h4>AI 正在增强您的任务...</h4>
            <p class="thinking-text">{{ thinkingText }}</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>
        
        <div v-if="result" class="enhance-result">
          <div class="result-header">
            <h4><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> AI 增强结果</h4>
            <div class="result-stats">
              <span class="stat-item"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> {{ result.subtasks?.length || 0 }} 个子任务</span>
              <span class="stat-item"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> {{ result.estimated_time || '待估算' }}</span>
                <span class="stat-item"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg> {{ result.difficulty || '中等' }}难度</span>
            </div>
          </div>
          
          <div class="result-content">
            <div v-if="result.enhanced_description" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg> 优化描述</h5>
              <div class="enhanced-description">
                {{ result.enhanced_description }}
              </div>
            </div>
            
            <div v-if="result.subtasks && result.subtasks.length > 0" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> 子任务分解</h5>
              <div class="subtask-list">
                <div 
                  v-for="(subtask, index) in result.subtasks" 
                  :key="index"
                  class="subtask-item"
                >
                  <div class="subtask-header">
                    <span class="subtask-number">{{ index + 1 }}</span>
                    <h6>{{ subtask.title }}</h6>
                    <span class="subtask-time">{{ subtask.estimated_time || '30分钟' }}</span>
                  </div>
                  <p class="subtask-description">{{ subtask.description }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="result.implementation_tips" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> 实施建议</h5>
              <ul class="tips-list">
                <li v-for="(tip, index) in result.implementation_tips" :key="index">
                  {{ tip }}
                </li>
              </ul>
            </div>
            
            <div v-if="result.resources" class="section">
              <h5><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/></svg> 推荐资源</h5>
              <div class="resources-list">
                <div 
                  v-for="(resource, index) in result.resources" 
                  :key="index"
                  class="resource-item"
                >
                  <span class="resource-type">{{ resource.type }}</span>
                  <span class="resource-name">{{ resource.name }}</span>
                  <span class="resource-description">{{ resource.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          v-if="!enhancing && !result"
          type="button"
          @click="$emit('close')"
          class="futuristic-btn-ghost"
        >
          取消
        </button>
        
        <button 
          v-if="!enhancing && !result"
          @click="startEnhancing"
          class="futuristic-btn-primary"
        >
          <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          开始 AI 增强
        </button>
        
        <button 
          v-if="result"
          @click="applyEnhancement"
          class="futuristic-btn-primary"
          :disabled="applying"
        >
          <svg v-if="!applying" class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          <div v-else class="loading-spinner-small mr-1"></div>
          {{ applying ? '应用中...' : '应用增强' }}
        </button>
        
        <button 
          v-if="result"
          @click="resetEnhancement"
          class="futuristic-btn-ghost"
          :disabled="applying"
        >
          重新增强
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabaseService } from '../services/supabaseService'

interface Task {
  id: number
  project_id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

interface Subtask {
  title: string
  description: string
  estimated_time?: string
}

interface Resource {
  type: string
  name: string
  description: string
}

interface EnhancementResult {
  enhanced_description?: string
  subtasks?: Subtask[]
  estimated_time?: string
  difficulty?: string
  implementation_tips?: string[]
  resources?: Resource[]
}

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  'close': []
  'task-enhanced': [task: Task]
}>()

const additionalContext = ref('')
const enhancing = ref(false)
const applying = ref(false)
const result = ref<EnhancementResult | null>(null)
const progress = ref(0)
const thinkingText = ref('正在分析任务内容...')

const thinkingTexts = [
  '正在分析任务内容...',
  '识别关键步骤和依赖...',
  '评估复杂度和时间需求...',
  '生成子任务分解方案...',
  '搜索相关资源和工具...',
  '优化实施建议...'
]

// 开始 AI 增强
const startEnhancing = async () => {
  enhancing.value = true
  progress.value = 0
  
  // 模拟增强过程
  const progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 12
      const textIndex = Math.floor((progress.value / 100) * thinkingTexts.length)
      thinkingText.value = thinkingTexts[Math.min(textIndex, thinkingTexts.length - 1)]
    }
  }, 600)
  
  try {
    // 调用 AI 增强 API
    const response = await supabaseService.ai.enhanceTask({
      task_id: props.task.id,
      task_title: props.task.title,
      task_description: props.task.description,
      additional_context: additionalContext.value.trim()
    })
    
    clearInterval(progressInterval)
    progress.value = 100
    
    setTimeout(() => {
      result.value = response
      enhancing.value = false
    }, 500)
    
  } catch (error) {
    clearInterval(progressInterval)
    enhancing.value = false
    console.error('AI 增强失败:', error)
    
    // 如果 API 失败，显示模拟结果
    result.value = {
      enhanced_description: `${props.task.title}是一个重要的任务，需要系统性的方法来完成。建议将其分解为多个可管理的子任务，并按优先级顺序执行。在实施过程中，应该注意质量控制和进度跟踪，确保最终交付符合预期目标。`,
      subtasks: [
        {
          title: '需求分析和规划',
          description: '详细分析任务需求，制定实施计划和时间表',
          estimated_time: '1-2小时'
        },
        {
          title: '准备工作和资源收集',
          description: '收集必要的工具、资料和资源，搭建工作环境',
          estimated_time: '30-60分钟'
        },
        {
          title: '核心实施',
          description: '执行任务的主要工作内容，完成核心功能',
          estimated_time: '2-4小时'
        },
        {
          title: '测试和验证',
          description: '对完成的工作进行测试和质量检查',
          estimated_time: '30-60分钟'
        },
        {
          title: '优化和完善',
          description: '根据测试结果进行优化和最终完善',
          estimated_time: '30分钟'
        }
      ],
      estimated_time: '4-8小时',
      difficulty: '中等',
      implementation_tips: [
        '建议采用迭代式开发方法，分阶段完成',
        '在开始前确保所有依赖和前置条件都已满足',
        '定期保存工作进度，避免意外丢失',
        '遇到问题时及时寻求帮助或查阅相关文档',
        '完成后进行充分的测试和验证'
      ],
      resources: [
        {
          type: '📚 文档',
          name: '最佳实践指南',
          description: '相关领域的最佳实践和经验总结'
        },
        {
          type: '工具',
          name: '项目管理工具',
          description: '用于任务跟踪和进度管理的工具'
        },
        {
          type: '👥 社区',
          name: '技术论坛',
          description: '可以寻求帮助和交流经验的社区平台'
        }
      ]
    }
    
    showNotification('AI 增强完成（使用模拟数据）', 'info')
  }
}

// 应用增强结果
const applyEnhancement = async () => {
  if (!result.value) {
    showNotification('没有可应用的增强结果', 'error')
    return
  }
  
  try {
    applying.value = true
    
    // 更新任务描述
    const updatedTask = {
      ...props.task,
      description: result.value.enhanced_description || props.task.description,
      updated_at: new Date().toISOString()
    }
    
    const response = await supabaseService.tasks.updateTask(props.task.id, updatedTask)
    
    // 如果有子任务，创建子任务
    if (result.value.subtasks && result.value.subtasks.length > 0) {
      for (const subtask of result.value.subtasks) {
        await supabaseService.tasks.createTask({
          project_id: props.task.project_id,
          title: `${props.task.title} - ${subtask.title}`,
          description: subtask.description,
          priority: 'medium',
          status: 'todo'
        })
      }
    }
    
    emit('task-enhanced', response)
    showNotification('任务增强应用成功', 'success')
    
  } catch (error) {
    console.error('应用增强失败:', error)
    showNotification('应用增强失败，请稍后重试', 'error')
  } finally {
    applying.value = false
  }
}

// 重置增强
const resetEnhancement = () => {
  result.value = null
  additionalContext.value = ''
  progress.value = 0
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
  z-index: 100001 !important;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: color-mix(in srgb, var(--theme-surface) 95%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border) 30%, transparent);
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(15px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--theme-border) 20%, transparent);
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
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

.modal-body {
  padding: 1.5rem;
}

.enhance-intro {
  text-align: center;
}

.ai-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: sparkle 2s infinite;
}

.enhance-intro h4 {
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

.current-task {
  text-align: left;
  margin: 2rem 0;
}

.current-task h5 {
  color: var(--theme-primary);
  margin-bottom: 1rem;
}

.task-preview {
  background: color-mix(in srgb, var(--theme-primary) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border) 20%, transparent);
  border-radius: 8px;
  padding: 1rem;
}

.task-preview h6 {
  color: var(--theme-text);
  margin-bottom: 0.5rem;
}

.task-preview p {
  color: var(--theme-text-secondary);
  margin: 0;
}

.no-description {
  font-style: italic;
  color: var(--theme-text-muted);
}

.enhancing-progress {
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

.sparkle-icon {
  font-size: 3rem;
  animation: sparkle 1.5s infinite;
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
  background: color-mix(in srgb, var(--theme-primary) 20%, transparent);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
  transition: width 0.3s ease;
}

.enhance-result {
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
  flex-wrap: wrap;
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

.enhanced-description {
  background: rgba(187, 134, 252, 0.05);
  border-left: 3px solid var(--theme-primary);
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subtask-item {
  background: rgba(187, 134, 252, 0.05);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.subtask-number {
  background: var(--theme-primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.subtask-header h6 {
  flex: 1;
  margin: 0;
  color: var(--theme-text);
}

.subtask-time {
  background: rgba(187, 134, 252, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--theme-text-secondary);
}

.subtask-description {
  color: var(--theme-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.tips-list {
  list-style: none;
  padding: 0;
}

.tips-list li {
  background: rgba(187, 134, 252, 0.05);
  border-left: 3px solid var(--theme-accent);
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0 6px 6px 0;
  position: relative;
}

.tips-list li::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  background: color-mix(in srgb, var(--theme-surface) 90%, transparent);
  padding: 0.25rem;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg fill="%23bb86fc" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(187, 134, 252, 0.05);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.resource-type {
  font-size: 1.2rem;
  min-width: 2rem;
}

.resource-name {
  font-weight: 500;
  color: var(--theme-text);
  min-width: 120px;
}

.resource-description {
  color: var(--theme-text-secondary);
  flex: 1;
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
  background: color-mix(in srgb, var(--theme-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border) 30%, transparent);
  border-radius: 8px;
  color: var(--theme-text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  resize: vertical;
}

.futuristic-textarea:focus {
  outline: none;
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-border) 20%, transparent);
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
  border: 2px solid color-mix(in srgb, var(--theme-border) 30%, transparent);
  border-top: 2px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(90deg); }
  50% { transform: scale(1) rotate(180deg); }
  75% { transform: scale(1.1) rotate(270deg); }
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
  
  .subtask-header {
    flex-wrap: wrap;
  }
  
  .resource-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>