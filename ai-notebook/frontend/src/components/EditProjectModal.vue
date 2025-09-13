<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">编辑项目</h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="edit-project-name" class="form-label">项目名称 *</label>
          <input 
            id="edit-project-name"
            v-model="formData.name"
            type="text"
            class="futuristic-input"
            placeholder="输入项目名称"
            required
            maxlength="100"
          />
        </div>
        
        <div class="form-group">
          <label for="edit-project-description" class="form-label">项目描述</label>
          <textarea 
            id="edit-project-description"
            v-model="formData.description"
            class="futuristic-textarea"
            placeholder="描述项目的目标和范围（可选）"
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="char-count">
            {{ formData.description.length }}/500
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
            :disabled="loading || !formData.name.trim()"
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
import axios from 'axios'

interface Project {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  task_count: number
}

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  'close': []
  'project-updated': [project: Project]
}>()

const loading = ref(false)

const formData = reactive({
  name: '',
  description: ''
})

// 初始化表单数据
onMounted(() => {
  formData.name = props.project.name
  formData.description = props.project.description || ''
})

// 处理表单提交
const handleSubmit = async () => {
  if (!formData.name.trim()) {
    showNotification('请输入项目名称', 'error')
    return
  }
  
  try {
    loading.value = true
    
    const response = await axios.put(`/api/projects/${props.project.id}`, {
      name: formData.name.trim(),
      description: formData.description.trim() || null
    })
    
    const updatedProject = response.data
    emit('project-updated', updatedProject)
    
  } catch (error) {
    console.error('更新项目失败:', error)
    showNotification('更新项目失败，请稍后重试', 'error')
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
  max-width: 500px;
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

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--theme-text);
}

.futuristic-input,
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

.futuristic-input:focus,
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
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>