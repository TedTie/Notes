<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">创建新任务</h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="task-title" class="form-label">任务标题 *</label>
          <input 
            id="task-title"
            v-model="formData.title"
            type="text"
            class="futuristic-input"
            placeholder="输入任务标题"
            required
            maxlength="200"
          />
        </div>
        
        <div class="form-group">
          <label for="task-description" class="form-label">任务描述</label>
          <textarea 
            id="task-description"
            v-model="formData.description"
            class="futuristic-textarea"
            placeholder="详细描述任务内容和要求（可选）"
            rows="4"
            maxlength="1000"
          ></textarea>
          <div class="char-count">
            {{ formData.description.length }}/1000
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="task-status" class="form-label">状态</label>
            <select 
              id="task-status"
              v-model="formData.status"
              class="futuristic-select"
            >
              <option value="todo">待办</option>
              <option value="in_progress">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="task-priority" class="form-label">优先级</label>
            <select 
              id="task-priority"
              v-model="formData.priority"
              class="futuristic-select"
            >
              <option value="low">🟢 低优先级</option>
              <option value="medium">🟡 中优先级</option>
              <option value="high">🔴 高优先级</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input 
                v-model="formData.useAiEnhance"
                type="checkbox"
                class="futuristic-checkbox"
              />
              <span class="checkbox-text">
                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
                创建后使用AI增强任务
              </span>
            </label>
          </div>
          <p class="help-text">
            AI将自动优化任务描述，提供执行建议和子任务分解
          </p>
        </div>
        
        <div class="modal-footer">
          <button 
            type="button"
            @click="$emit('close')"
            class="futuristic-btn-ghost"
            :disabled="loading"
          >
            取消
          </button>
          
          <button 
            type="submit"
            class="futuristic-btn-primary"
            :disabled="loading || !formData.title.trim()"
          >
            <svg v-if="!loading" class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <div v-else class="loading-spinner-small mr-1"></div>
            {{ loading ? '创建中...' : '创建任务' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { supabaseService } from '../services/supabaseService'

interface Project {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  task_count: number
}

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

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  'close': []
  'task-created': [task: Task]
}>()

const loading = ref(false)

const formData = reactive({
  title: '',
  description: '',
  status: 'todo' as 'todo' | 'in_progress' | 'done',
  priority: 'medium' as 'low' | 'medium' | 'high',
  useAiEnhance: false
})

// 处理表单提交
const handleSubmit = async () => {
  if (!formData.title.trim()) {
    showNotification('请输入任务标题', 'error')
    return
  }
  
  try {
    loading.value = true
    
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      project_id: props.project.id
    }
    
    // 创建任务
    const newTask = await supabaseService.tasks.createTask(taskData)
    
    // 如果启用AI增强
    if (formData.useAiEnhance) {
      try {
        const enhancement = await supabaseService.ai.analyzeText(newTask.title + ' ' + (newTask.description || ''), 'task_enhancement')
        
        // 应用AI增强结果
        if (enhancement.enhanced_title || enhancement.enhanced_description) {
          const enhancedTask = {
            ...newTask,
            title: enhancement.enhanced_title || newTask.title,
            description: enhancement.enhanced_description || newTask.description
          }
          
          const updatedTask = await supabaseService.tasks.updateTask(newTask.id, enhancedTask)
          
          showNotification('任务创建成功，AI增强已应用', 'success')
          emit('task-created', updatedTask)
        } else {
          showNotification('任务创建成功', 'success')
          emit('task-created', newTask)
        }
        
      } catch (aiError) {
        console.error('AI增强失败:', aiError)
        showNotification('任务创建成功，但AI增强失败', 'info')
        emit('task-created', newTask)
      }
    } else {
      showNotification('任务创建成功', 'success')
      emit('task-created', newTask)
    }
    
  } catch (error) {
    console.error('创建任务失败:', error)
    showNotification('创建任务失败，请稍后重试', 'error')
  } finally {
    loading.value = false
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
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000 !important;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(187, 134, 252, 0.2);
}

.modal-title {
  font-size: 1.25rem;
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--theme-text);
}

.futuristic-input,
.futuristic-textarea,
.futuristic-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-radius: 8px;
  color: var(--theme-text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.futuristic-textarea {
  resize: vertical;
}

.futuristic-input:focus,
.futuristic-textarea:focus,
.futuristic-select:focus {
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

.checkbox-group {
  margin-bottom: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background: rgba(187, 134, 252, 0.05);
}

.futuristic-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--theme-primary);
}

.checkbox-text {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--theme-text);
}

.help-text {
  font-size: 0.8rem;
  color: var(--theme-text-secondary);
  margin: 0;
  padding-left: 2rem;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(187, 134, 252, 0.3);
  border-top: 2px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  .modal-body {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .help-text {
    padding-left: 1rem;
  }
}
</style>