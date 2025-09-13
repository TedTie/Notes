<template>
  <div 
    class="task-card"
    :class="[
      `priority-${task.priority}`,
      `status-${task.status}`,
      { 'dragging': isDragging }
    ]"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- 任务头部 -->
    <div class="task-header">
      <div class="task-priority">
        <span class="priority-indicator" :class="`priority-${task.priority}`">
          {{ getPriorityIcon(task.priority) }}
        </span>
        <span class="priority-text">{{ getPriorityText(task.priority) }}</span>
      </div>
      
      <div class="task-actions">
        <button 
          @click="handleAiEnhance"
          class="action-btn ai-btn"
          :disabled="aiLoading"
          title="AI增强任务"
        >
          <svg v-if="!aiLoading" class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
          <div v-else class="loading-spinner-tiny"></div>
        </button>
        
        <button 
          @click="showEditModal = true"
          class="action-btn edit-btn"
          title="编辑任务"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        
        <button 
          @click="handleDelete"
          class="action-btn delete-btn"
          title="删除任务"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
    
    <!-- 任务内容 -->
    <div class="task-content">
      <h4 class="task-title">{{ task.title }}</h4>
      <p v-if="task.description" class="task-description">
        {{ task.description }}
      </p>
    </div>
    
    <!-- 任务底部 -->
    <div class="task-footer">
      <div class="task-meta">
        <span class="meta-item">
          <span class="icon"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg></span>
          {{ formatDate(task.created_at) }}
        </span>
        <span v-if="task.updated_at !== task.created_at" class="meta-item">
          <span class="icon"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></span>
          {{ formatDate(task.updated_at) }}
        </span>
      </div>
      
      <div class="status-actions">
        <button 
          v-if="task.status !== 'todo'"
          @click="updateStatus('todo')"
          class="status-btn todo-btn"
          title="移至待办"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>
        </button>
        
        <button 
          v-if="task.status !== 'in_progress'"
          @click="updateStatus('in_progress')"
          class="status-btn progress-btn"
          title="移至进行中"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/></svg>
        </button>
        
        <button 
          v-if="task.status !== 'done'"
          @click="updateStatus('done')"
          class="status-btn done-btn"
          title="标记完成"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    </div>
    
    <!-- 编辑任务模态框 -->
    <EditTaskModal 
      v-if="showEditModal"
      :task="task"
      @close="showEditModal = false"
      @task-updated="handleTaskUpdated"
    />
    
    <!-- AI增强结果模态框 -->
    <AiEnhanceModal 
      v-if="showAiModal"
      :task="task"
      :enhancement="aiEnhancement"
      @close="showAiModal = false"
      @apply-enhancement="handleApplyEnhancement"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EditTaskModal from './EditTaskModal.vue'
import AiEnhanceModal from './AiEnhanceModal.vue'
import axios from 'axios'

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

interface AiEnhancement {
  enhanced_title?: string
  enhanced_description?: string
  suggested_subtasks?: string[]
  estimated_time?: string
  tips?: string[]
}

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  'task-updated': [task: Task]
  'task-deleted': [taskId: number]
  'drag-start': [task: Task]
}>()

const isDragging = ref(false)
const showEditModal = ref(false)
const showAiModal = ref(false)
const aiLoading = ref(false)
const aiEnhancement = ref<AiEnhancement | null>(null)

// 拖拽处理
const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  emit('drag-start', props.task)
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.task.id.toString())
  }
}

const handleDragEnd = () => {
  isDragging.value = false
}

// 更新任务状态
const updateStatus = (newStatus: 'todo' | 'in_progress' | 'done') => {
  const updatedTask = {
    ...props.task,
    status: newStatus,
    updated_at: new Date().toISOString()
  }
  
  emit('task-updated', updatedTask)
}

// 处理任务更新
const handleTaskUpdated = (updatedTask: Task) => {
  showEditModal.value = false
  emit('task-updated', updatedTask)
}

// 处理删除任务
const handleDelete = () => {
  if (confirm(`确定要删除任务 "${props.task.title}" 吗？`)) {
    emit('task-deleted', props.task.id)
  }
}

// 处理AI增强
const handleAiEnhance = async () => {
  try {
    aiLoading.value = true
    
    const response = await axios.post(`/api/tasks/${props.task.id}/enhance`, {
      action: 'breakdown',
      task: props.task
    })
    
    aiEnhancement.value = response.data
    showAiModal.value = true
    
  } catch (error) {
    console.error('AI增强失败:', error)
    showNotification('AI增强失败，请稍后重试', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 应用AI增强
const handleApplyEnhancement = (enhancement: AiEnhancement) => {
  const updatedTask = {
    ...props.task,
    title: enhancement.enhanced_title || props.task.title,
    description: enhancement.enhanced_description || props.task.description,
    updated_at: new Date().toISOString()
  }
  
  emit('task-updated', updatedTask)
  showAiModal.value = false
  showNotification('AI增强已应用', 'success')
}

// 获取优先级图标
const getPriorityIcon = (priority: string) => {
  const icons = {
    'low': '🟢',
    'medium': '🟡', 
    'high': '🔴'
  }
  return icons[priority as keyof typeof icons] || '⚪'
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts = {
    'low': '低',
    'medium': '中',
    'high': '高'
  }
  return texts[priority as keyof typeof texts] || priority
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
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
.task-card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 8px;
  padding: 1rem;
  cursor: grab;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.task-card:hover {
  border-color: rgba(187, 134, 252, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(187, 134, 252, 0.1);
}

.task-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
  cursor: grabbing;
}

.task-card.priority-high {
  border-left: 4px solid #ef4444;
}

.task-card.priority-medium {
  border-left: 4px solid #f59e0b;
}

.task-card.priority-low {
  border-left: 4px solid #22c55e;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.task-priority {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.priority-indicator {
  font-size: 0.8rem;
}

.priority-text {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.action-btn:hover {
  background: rgba(187, 134, 252, 0.2);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

.edit-btn:hover {
  background: rgba(245, 158, 11, 0.2);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.loading-spinner-tiny {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-top: 1px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.task-content {
  margin-bottom: 0.75rem;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.task-description {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(187, 134, 252, 0.1);
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
}

.icon {
  font-size: 0.7rem;
}

.status-actions {
  display: flex;
  gap: 0.25rem;
}

.status-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

.progress-btn:hover {
  background: rgba(245, 158, 11, 0.2);
}

.done-btn:hover {
  background: rgba(34, 197, 94, 0.2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-card {
    padding: 0.75rem;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .task-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .task-meta {
    flex-direction: row;
    gap: 0.75rem;
  }
}
</style>