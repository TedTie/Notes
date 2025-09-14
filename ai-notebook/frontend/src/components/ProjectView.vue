<template>
  <div class="project-view">
    <!-- 项目选择器 -->
    <div class="mb-6">
      <ProjectSelector 
        :projects="projects"
        :current-project="currentProject"
        @project-selected="handleProjectSelected"
        @create-project="handleCreateProject"
        @project-deleted="handleProjectDeleted"
        @project-updated="handleProjectUpdated"
      />
    </div>

    <!-- 看板区域 -->
    <div v-if="currentProject" class="kanban-container">
      <KanbanBoard 
        :project="currentProject"
        :tasks="currentTasks"
        @task-updated="handleTaskUpdated"
        @task-created="handleTaskCreated"
        @task-deleted="handleTaskDeleted"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="futuristic-card text-center p-12 max-w-md mx-auto">
        <svg class="w-24 h-24 mb-4 text-cyber-primary/60" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
        <h2 class="futuristic-title mb-4">开始您的项目管理</h2>
        <p class="futuristic-subtitle mb-6">创建您的第一个项目，让AI帮助您规划任务</p>
        <button 
          @click="showCreateModal = true"
          class="futuristic-btn-primary px-6 py-3"
        >
          <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          创建新项目
        </button>
      </div>
    </div>

    <!-- 创建项目模态框 -->
    <CreateProjectModal 
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @project-created="handleProjectCreated"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import ProjectSelector from './ProjectSelector.vue'
import KanbanBoard from './KanbanBoard.vue'
import CreateProjectModal from './CreateProjectModal.vue'
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

const projects = ref<Project[]>([])
const currentProject = ref<Project | null>(null)
const currentTasks = ref<Task[]>([])
const loading = ref(false)
const showCreateModal = ref(false)

// 加载所有项目
const loadProjects = async () => {
  try {
    loading.value = true
    projects.value = await supabaseService.projects.getAllProjects()
    
    // 如果有项目且没有选中项目，选中第一个
    if (projects.value.length > 0 && !currentProject.value) {
      currentProject.value = projects.value[0]
    }
  } catch (error) {
    console.error('加载项目失败:', error)
    showNotification('加载项目失败', 'error')
  } finally {
    loading.value = false
  }
}

// 加载项目任务
const loadProjectTasks = async (projectId: number) => {
  try {
    loading.value = true
    currentTasks.value = await supabaseService.projects.getProjectTasks(projectId)
  } catch (error) {
    console.error('加载任务失败:', error)
    showNotification('加载任务失败', 'error')
  } finally {
    loading.value = false
  }
}

// 处理项目选择
const handleProjectSelected = (project: Project) => {
  currentProject.value = project
}

// 处理创建项目
const handleCreateProject = () => {
  showCreateModal.value = true
}

// 处理项目删除
const handleProjectDeleted = (deletedProjectId: number) => {
  // 从项目列表中移除已删除的项目
  projects.value = projects.value.filter(p => p.id !== deletedProjectId)
  
  // 如果删除的是当前项目，切换到第一个项目或清空
  if (currentProject.value?.id === deletedProjectId) {
    if (projects.value.length > 0) {
      currentProject.value = projects.value[0]
    } else {
      currentProject.value = null
      currentTasks.value = []
    }
  }
}

// 处理项目更新
const handleProjectUpdated = (updatedProject: Project) => {
  // 更新项目列表中的项目信息
  const projectIndex = projects.value.findIndex(p => p.id === updatedProject.id)
  if (projectIndex !== -1) {
    projects.value[projectIndex] = updatedProject
  }
  
  // 如果更新的是当前项目，也更新当前项目引用
  if (currentProject.value?.id === updatedProject.id) {
    currentProject.value = updatedProject
  }
}

// 处理项目创建完成
const handleProjectCreated = async (newProject: Project) => {
  // 添加新项目到列表
  projects.value.unshift(newProject)
  
  // 切换到新项目
  currentProject.value = newProject
  
  // 如果项目使用了AI规划，需要重新加载任务
  if (newProject.id) {
    await loadProjectTasks(newProject.id)
  } else {
    currentTasks.value = []
  }
  
  showCreateModal.value = false
}

// 处理任务更新
const handleTaskUpdated = async (task: Task) => {
  try {
    const response = await axios.put(`/api/tasks/${task.id}`, task)
    
    // 更新本地任务列表
    const index = currentTasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      currentTasks.value[index] = response.data
    }
    
    showNotification('任务更新成功', 'success')
  } catch (error) {
    console.error('更新任务失败:', error)
    showNotification('更新任务失败', 'error')
    
    // 如果更新失败，重新加载任务列表以确保数据一致性
    if (currentProject.value) {
      await loadProjectTasks(currentProject.value.id)
    }
  }
}

// 处理任务创建
const handleTaskCreated = (newTask: Task) => {
  // 直接添加新任务到当前任务列表
  currentTasks.value.push(newTask)
  
  // 更新项目的任务计数
  if (currentProject.value) {
    currentProject.value.task_count = currentTasks.value.length
    
    // 更新项目列表中的任务计数
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) {
      projects.value[projectIndex].task_count = currentTasks.value.length
    }
  }
}

// 处理任务删除
const handleTaskDeleted = async (taskId: number) => {
  try {
    await axios.delete(`/api/tasks/${taskId}`)
    
    // 从本地列表中移除
    currentTasks.value = currentTasks.value.filter(t => t.id !== taskId)
    
    // 更新项目的任务计数
    if (currentProject.value) {
      currentProject.value.task_count = currentTasks.value.length
      
      // 更新项目列表中的任务计数
      const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
      if (projectIndex !== -1) {
        projects.value[projectIndex].task_count = currentTasks.value.length
      }
    }
    
    showNotification('任务删除成功', 'success')
  } catch (error) {
    console.error('删除任务失败:', error)
    showNotification('删除任务失败', 'error')
  }
}

// 显示通知
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const event = new CustomEvent('setting-notification', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
}

// 监听当前项目变化，加载对应任务
watch(currentProject, (newProject) => {
  if (newProject) {
    loadProjectTasks(newProject.id)
  } else {
    currentTasks.value = []
  }
})

// 处理重新加载任务事件
const handleReloadTasks = () => {
  if (currentProject.value) {
    loadProjectTasks(currentProject.value.id)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadProjects()
  
  // 监听重新加载任务事件
  window.addEventListener('reload-tasks', handleReloadTasks)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('reload-tasks', handleReloadTasks)
})
</script>

<style scoped>
.project-view {
  min-height: 100vh;
  padding: 1rem;
}

.kanban-container {
  background: rgba(26, 26, 46, 0.3);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(187, 134, 252, 0.3);
  border-top: 3px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .project-view {
    padding: 0.75rem;
    min-height: calc(100vh - 80px);
  }
  
  .kanban-container {
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  /* 空状态优化 */
  .empty-state {
    min-height: 50vh;
    padding: 1rem;
  }
  
  .empty-state .futuristic-card {
    padding: 2rem;
    margin: 0 auto;
    max-width: 90%;
  }
  
  .empty-state .w-24 {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1rem;
  }
  
  .empty-state h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
  
  .empty-state button {
    width: 100%;
    padding: 0.875rem;
    font-size: 0.9rem;
  }
  
  /* 加载状态优化 */
  .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 2px;
  }
}

/* 小屏幕设备进一步优化 */
@media (max-width: 480px) {
  .project-view {
    padding: 0.5rem;
  }
  
  .kanban-container {
    padding: 0.75rem;
  }
  
  .empty-state .futuristic-card {
    padding: 1.5rem;
  }
  
  .empty-state .w-24 {
    width: 3rem;
    height: 3rem;
  }
  
  .empty-state h2 {
    font-size: 1.125rem;
  }
  
  .empty-state p {
    font-size: 0.875rem;
  }
}
</style>