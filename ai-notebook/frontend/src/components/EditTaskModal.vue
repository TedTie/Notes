<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">编辑任务</h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="edit-task-title" class="form-label">任务标题 *</label>
          <input 
            id="edit-task-title"
            v-model="formData.title"
            type="text"
            class="futuristic-input"
            placeholder="输入任务标题"
            required
            maxlength="200"
          />
        </div>
        
        <div class="form-group">
          <label for="edit-task-description" class="form-label">任务描述</label>
          <textarea 
            id="edit-task-description"
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
            <label for="edit-task-status" class="form-label">状态</label>
            <select 
              id="edit-task-status"
              v-model="formData.status"
              class="futuristic-select"
            >
              <option value="todo">📋 待办</option>
                <option value="in_progress">🔄 进行中</option>
                <option value="done">✅ 已完成</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-task-priority" class="form-label">优先级</label>
            <select 
              id="edit-task-priority"
              v-model="formData.priority"
              class="futuristic-select"
            >
              <option value="low">🟢 低优先级</option>
              <option value="medium">🟡 中优先级</option>
              <option value="high">🔴 高优先级</option>
            </select>
          </div>
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
            <span v-if="!loading" class="mr-1">💾</span>
            <div v-else class="loading-spinner-small mr-1"></div>
            {{ loading ? '保存中...' : '保存更改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  'close': []
  'task-updated': [task: Task]
}>()

const loading = ref(false)

const formData = reactive({
  title: '',
  description: '',
  status: 'todo' as 'todo' | 'in_progress' | 'done',
  priority: 'medium' as 'low' | 'medium' | 'high'
})

// 初始化表单数据
onMounted(() => {
  formData.title = props.task.title
  formData.description = props.task.description || ''
  formData.status = props.task.status
  formData.priority = props.task.priority
})

// 处理表单提交
const handleSubmit = async () => {
  if (!formData.title.trim()) {
    showNotification('请输入任务标题', 'error')
    return
  }
  
  try {
    loading.value = true
    
    const updatedTaskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority
    }
    
    const updatedTask = await supabaseService.tasks.updateTask(props.task.id, updatedTaskData)
    
    emit('task-updated', updatedTask)
    showNotification('任务更新成功', 'success')
    
  } catch (error) {
    console.error('更新任务失败:', error)
    showNotification('更新任务失败，请稍后重试', 'error')
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
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    width: 100%;
    margin: 0;
    max-height: 95vh;
    border-radius: 8px;
  }
  
  .modal-header {
    padding: 1rem;
    position: sticky;
    top: 0;
    background: rgba(26, 26, 46, 0.98);
    backdrop-filter: blur(10px);
    z-index: 1;
  }
  
  .modal-body {
    padding: 1rem;
    max-height: calc(95vh - 140px);
    overflow-y: auto;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    position: sticky;
    bottom: 0;
    background: rgba(26, 26, 46, 0.98);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(187, 134, 252, 0.2);
  }
  
  /* 表单元素优化 */
  .futuristic-input,
  .futuristic-textarea,
  .futuristic-select {
    font-size: 1rem;
    padding: 0.875rem;
  }
  
  .futuristic-textarea {
    min-height: 100px;
  }
  
  /* 按钮优化 */
  .futuristic-btn-primary,
  .futuristic-btn-ghost {
    min-height: 48px;
    font-size: 1rem;
    padding: 0.875rem 1.25rem;
  }
  
  /* 关闭按钮优化 */
  .close-btn {
    min-height: 44px;
    min-width: 44px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.25rem;
  }
  
  .modal-content {
    border-radius: 6px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 0.875rem;
  }
  
  .modal-title {
    font-size: 1.125rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-row {
    gap: 0.5rem;
  }
  
  .futuristic-input,
  .futuristic-textarea,
  .futuristic-select {
    font-size: 0.9rem;
    padding: 0.75rem;
  }
  
  .futuristic-btn-primary,
  .futuristic-btn-ghost {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .modal-content {
    touch-action: manipulation;
  }
  
  .close-btn {
    min-height: 48px;
    min-width: 48px;
  }
  
  .futuristic-btn-primary,
  .futuristic-btn-ghost {
    min-height: 48px;
    touch-action: manipulation;
  }
  
  .futuristic-select {
    min-height: 48px;
  }
}
</style>