<template>
  <div class="project-selector">
    <div class="selector-header">
      <h2 class="futuristic-title">项目管理</h2>
      <div class="selector-controls">
        <!-- 项目下拉选择 -->
        <div class="project-dropdown">
          <select 
            v-model="selectedProjectId"
            @change="handleProjectChange"
            class="futuristic-select"
          >
            <option value="" disabled>选择项目</option>
            <option 
              v-for="project in projects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }} ({{ project.task_count || 0 }} 个任务)
            </option>
          </select>
        </div>
        
        <!-- 创建项目按钮 -->
        <button 
          @click="$emit('create-project')"
          class="futuristic-btn-primary create-btn"
          title="创建新项目"
        >
          <span class="mr-1">+</span>
          新建项目
        </button>
        
        <!-- AI规划按钮 -->
        <button 
          v-if="currentProject"
          @click="handleAiPlanning"
          class="futuristic-btn-secondary ai-btn"
          :disabled="aiLoading"
          title="AI智能规划项目任务"
        >
          <svg v-if="!aiLoading" class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
          <div v-else class="loading-spinner-small mr-1"></div>
          {{ aiLoading ? '规划中...' : 'AI规划' }}
        </button>
      </div>
    </div>
    
    <!-- 项目信息卡片 -->
    <div v-if="currentProject" class="project-info-card">
      <div class="project-details">
        <h3 class="project-name">{{ currentProject.name }}</h3>
        <p v-if="currentProject.description" class="project-description">
          {{ currentProject.description }}
        </p>
        <div class="project-meta">
          <span class="meta-item">
            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0l-.5 8.5A2 2 0 0013.5 21h-3A2 2 0 018.5 18.5L8 7z"></path>
            </svg>
            创建于 {{ formatDate(currentProject.created_at) }}
          </span>
          <span class="meta-item">
            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h.01M9 16h.01M9 12h.01m3-5h3m-3 4h3m-3 4h3"></path>
            </svg>
            {{ currentProject.task_count || 0 }} 个任务
          </span>
        </div>
      </div>
      
      <div class="project-actions">
        <button 
          @click="showEditModal = true"
          class="futuristic-btn-ghost"
          title="编辑项目"
        >
          <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          编辑
        </button>
        <button 
          @click="handleDeleteProject"
          class="futuristic-btn-danger"
          title="删除项目"
        >
          <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          删除
        </button>
      </div>
    </div>
    
    <!-- 编辑项目模态框 -->
    <EditProjectModal 
      v-if="showEditModal && currentProject"
      :project="currentProject"
      @close="showEditModal = false"
      @project-updated="handleProjectUpdated"
    />
    
    <!-- AI规划模态框 -->
    <AiPlanningModal 
      v-if="showAiModal && currentProject"
      :project="currentProject"
      @close="showAiModal = false"
      @planning-applied="handlePlanningApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EditProjectModal from './EditProjectModal.vue'
import AiPlanningModal from './AiPlanningModal.vue'
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
  projects: Project[]
  currentProject: Project | null
}>()

const emit = defineEmits<{
  'project-selected': [project: Project]
  'create-project': []
  'project-deleted': [projectId: number]
  'project-updated': [project: Project]
}>()

const selectedProjectId = ref<number | ''>(props.currentProject?.id || '')
const showEditModal = ref(false)
const showAiModal = ref(false)
const aiLoading = ref(false)

// 确保模态框初始状态为关闭
console.log('ProjectSelector initialized, showAiModal:', showAiModal.value)

// 监听当前项目变化
watch(() => props.currentProject, (newProject) => {
  selectedProjectId.value = newProject?.id || ''
})

// 处理项目选择变化
const handleProjectChange = () => {
  if (selectedProjectId.value) {
    const project = props.projects.find(p => p.id === selectedProjectId.value)
    if (project) {
      emit('project-selected', project)
    }
  }
}

// 处理项目更新
const handleProjectUpdated = (updatedProject: Project) => {
  showEditModal.value = false
  emit('project-updated', updatedProject)
  emit('project-selected', updatedProject)
  showNotification('项目更新成功', 'success')
}

// 处理删除项目
const handleDeleteProject = async () => {
  if (!props.currentProject) return
  
  if (!confirm(`确定要删除项目 "${props.currentProject.name}" 吗？此操作不可撤销。`)) {
    return
  }
  
  try {
    await supabaseService.projects.deleteProject(props.currentProject.id)
    showNotification('项目删除成功', 'success')
    
    // 通知父组件项目已删除
    emit('project-deleted', props.currentProject.id)
  } catch (error) {
    console.error('删除项目失败:', error)
    showNotification('删除项目失败', 'error')
  }
}

// 处理AI规划
const handleAiPlanning = () => {
  showAiModal.value = true
}

// 处理AI规划应用
const handlePlanningApplied = () => {
  showAiModal.value = false
  showNotification('AI规划已成功应用', 'success')
  
  // 触发重新加载任务
  window.dispatchEvent(new CustomEvent('reload-tasks'))
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
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
.project-selector {
  background: color-mix(in srgb, var(--theme-surface) 40%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border) 30%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.selector-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.project-dropdown {
  min-width: 200px;
}

.futuristic-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--theme-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border) 30%, transparent);
  border-radius: 8px;
  color: var(--theme-text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.futuristic-select:focus {
  outline: none;
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-border) 20%, transparent);
}

.create-btn {
  white-space: nowrap;
  padding: 0.75rem 1.5rem;
}

.ai-btn {
  white-space: nowrap;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
}

.ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, var(--theme-border) 30%, transparent);
  border-top: 2px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.project-info-card {
  background: color-mix(in srgb, var(--theme-surface) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border) 20%, transparent);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-details {
  flex: 1;
}

.project-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--theme-primary);
  margin-bottom: 0.5rem;
}

.project-description {
  color: var(--theme-text-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--theme-text-secondary);
  font-size: 0.9rem;
}

.icon {
  font-size: 1rem;
}

.project-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .selector-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .project-dropdown {
    min-width: auto;
  }
  
  .project-info-card {
    flex-direction: column;
    gap: 1rem;
  }
  
  .project-actions {
    align-self: stretch;
    justify-content: space-between;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>