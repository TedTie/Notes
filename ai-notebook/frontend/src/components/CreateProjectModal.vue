<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">创建新项目</h3>
        <button @click="$emit('close')" class="close-btn">
          ✕
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="project-name" class="form-label">项目名称 *</label>
          <input 
            id="project-name"
            v-model="formData.name"
            type="text"
            class="futuristic-input"
            placeholder="输入项目名称"
            required
            maxlength="100"
          />
        </div>
        
        <div class="form-group">
          <label for="project-description" class="form-label">项目描述</label>
          <textarea 
            id="project-description"
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
        
        <div class="form-group">
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input 
                v-model="formData.useAiPlanning"
                type="checkbox"
                class="futuristic-checkbox"
              />
              <span class="checkbox-text">
                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
                使用AI智能规划初始任务
              </span>
            </label>
          </div>
          <p class="help-text">
            AI将根据项目名称和描述自动生成合理的初始任务列表
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
            :disabled="loading || !formData.name.trim()"
          >
            <svg v-if="!loading" class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <div v-else class="loading-spinner-small mr-1"></div>
            {{ loading ? '创建中...' : '创建项目' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import axios from 'axios'

interface Project {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  task_count: number
}

const emit = defineEmits<{
  'close': []
  'project-created': [project: Project]
}>()

const loading = ref(false)

const formData = reactive({
  name: '',
  description: '',
  useAiPlanning: true
})

// 处理表单提交
const handleSubmit = async () => {
  if (!formData.name.trim()) {
    showNotification('请输入项目名称', 'error')
    return
  }
  
  try {
    loading.value = true
    
    // 创建项目
    const projectResponse = await axios.post('/api/projects', {
      name: formData.name.trim(),
      description: formData.description.trim() || null
    })
    
    const newProject = projectResponse.data
    
    // 如果启用AI规划，生成初始任务
    if (formData.useAiPlanning) {
      try {
        await axios.post(`/api/projects/${newProject.id}/ai-planning`, {
          project_name: newProject.name,
          project_description: newProject.description
        })
        
        showNotification('项目创建成功，AI已生成初始任务', 'success')
      } catch (aiError) {
        console.error('AI规划失败:', aiError)
        showNotification('项目创建成功，但AI规划失败', 'info')
      }
    } else {
      showNotification('项目创建成功', 'success')
    }
    
    emit('project-created', newProject)
    
  } catch (error) {
    console.error('创建项目失败:', error)
    showNotification('创建项目失败，请稍后重试', 'error')
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
  
  .help-text {
    padding-left: 1rem;
  }
  
  /* 表单元素优化 */
  .futuristic-input,
  .futuristic-textarea {
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
  
  .futuristic-input,
  .futuristic-textarea {
    font-size: 0.9rem;
    padding: 0.75rem;
  }
  
  .futuristic-btn-primary,
  .futuristic-btn-ghost {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
  
  .help-text {
    font-size: 0.75rem;
    padding-left: 0.75rem;
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
  
  .checkbox-label {
    min-height: 48px;
    padding: 0.75rem;
  }
  
  .futuristic-checkbox {
    width: 20px;
    height: 20px;
  }
}
</style>