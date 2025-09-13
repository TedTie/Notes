<template>
  <div class="kanban-board">
    <div class="board-header">
      <h3 class="board-title">{{ project.name }} - 任务看板</h3>
      <button 
        @click="showCreateTaskModal = true"
        class="futuristic-btn-primary"
      >
        <span class="mr-1">+</span>
        添加任务
      </button>
    </div>
    
    <div class="kanban-columns">
      <!-- 待办列 -->
      <div class="kanban-column">
        <div class="column-header todo">
          <h4 class="column-title">
            <svg class="w-5 h-5 column-icon" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>
            待办
            <span class="task-count">{{ todoTasks.length }}</span>
          </h4>
        </div>
        <div 
          class="column-content"
          @drop="handleDrop($event, 'todo')"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
        >
          <TaskCard
            v-for="task in todoTasks"
            :key="task.id"
            :task="task"
            @task-updated="$emit('task-updated', $event)"
            @task-deleted="$emit('task-deleted', $event)"
            @drag-start="handleDragStart"
          />
          <div v-if="todoTasks.length === 0" class="empty-column">
            <p>暂无待办任务</p>
          </div>
        </div>
      </div>
      
      <!-- 进行中列 -->
      <div class="kanban-column">
        <div class="column-header in-progress">
          <h4 class="column-title">
            <svg class="w-5 h-5 column-icon" fill="currentColor" viewBox="0 0 20 20"><path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/></svg>
            进行中
            <span class="task-count">{{ inProgressTasks.length }}</span>
          </h4>
        </div>
        <div 
          class="column-content"
          @drop="handleDrop($event, 'in_progress')"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
        >
          <TaskCard
            v-for="task in inProgressTasks"
            :key="task.id"
            :task="task"
            @task-updated="$emit('task-updated', $event)"
            @task-deleted="$emit('task-deleted', $event)"
            @drag-start="handleDragStart"
          />
          <div v-if="inProgressTasks.length === 0" class="empty-column">
            <p>暂无进行中任务</p>
          </div>
        </div>
      </div>
      
      <!-- 已完成列 -->
      <div class="kanban-column">
        <div class="column-header done">
          <h4 class="column-title">
            <svg class="w-5 h-5 column-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            已完成
            <span class="task-count">{{ doneTasks.length }}</span>
          </h4>
        </div>
        <div 
          class="column-content"
          @drop="handleDrop($event, 'done')"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
        >
          <TaskCard
            v-for="task in doneTasks"
            :key="task.id"
            :task="task"
            @task-updated="$emit('task-updated', $event)"
            @task-deleted="$emit('task-deleted', $event)"
            @drag-start="handleDragStart"
          />
          <div v-if="doneTasks.length === 0" class="empty-column">
            <p>暂无已完成任务</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建任务模态框 -->
    <CreateTaskModal 
      v-if="showCreateTaskModal"
      :project="project"
      @close="showCreateTaskModal = false"
      @task-created="handleTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaskCard from './TaskCard.vue'
import CreateTaskModal from './CreateTaskModal.vue'

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
  tasks: Task[]
}>()

const emit = defineEmits<{
  'task-updated': [task: Task]
  'task-created': [task: Task]
  'task-deleted': [taskId: number]
}>()

const showCreateTaskModal = ref(false)
const draggedTask = ref<Task | null>(null)

// 按状态分组任务
const todoTasks = computed(() => 
  props.tasks.filter(task => task.status === 'todo')
)

const inProgressTasks = computed(() => 
  props.tasks.filter(task => task.status === 'in_progress')
)

const doneTasks = computed(() => 
  props.tasks.filter(task => task.status === 'done')
)

// 拖拽处理
const handleDragStart = (task: Task) => {
  draggedTask.value = task
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.add('drag-over')
}

const handleDrop = (event: DragEvent, newStatus: 'todo' | 'in_progress' | 'done') => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.remove('drag-over')
  
  if (draggedTask.value && draggedTask.value.status !== newStatus) {
    const updatedTask = {
      ...draggedTask.value,
      status: newStatus,
      updated_at: new Date().toISOString()
    }
    
    emit('task-updated', updatedTask)
    showNotification(`任务已移动到${getStatusText(newStatus)}`, 'success')
  }
  
  draggedTask.value = null
}

// 处理任务创建
const handleTaskCreated = (task: Task) => {
  emit('task-created', task)
  showCreateTaskModal.value = false
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    'todo': '待办',
    'in_progress': '进行中',
    'done': '已完成'
  }
  return statusMap[status as keyof typeof statusMap] || status
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
.kanban-board {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(187, 134, 252, 0.2);
}

.board-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-primary);
  margin: 0;
}

.kanban-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.kanban-column {
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(187, 134, 252, 0.2);
}

.column-header.todo {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
}

.column-header.in-progress {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
}

.column-header.done {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
}

.column-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--theme-text);
}

.column-icon {
  font-size: 1.2rem;
}

.task-count {
  background: rgba(187, 134, 252, 0.2);
  color: var(--theme-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: auto;
}

.column-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: background-color 0.3s ease;
}

.column-content.drag-over {
  background: rgba(187, 134, 252, 0.1);
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--theme-text-secondary);
  font-style: italic;
  border: 2px dashed rgba(187, 134, 252, 0.2);
  border-radius: 8px;
}

/* 滚动条样式 */
.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: rgba(26, 26, 46, 0.3);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb {
  background: rgba(187, 134, 252, 0.3);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: rgba(187, 134, 252, 0.5);
}

/* 移动端响应式设计 */
@media (max-width: 1024px) {
  .kanban-columns {
    grid-template-columns: 1fr;
    gap: 1rem;
    height: auto;
    min-height: auto;
  }
  
  .kanban-column {
    max-height: 50vh;
    min-height: 300px;
  }
  
  .board-title {
    font-size: 1.375rem;
  }
}

@media (max-width: 768px) {
  .kanban-board {
    padding: 0;
  }
  
  /* 看板头部优化 */
  .board-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(26, 26, 46, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(187, 134, 252, 0.2);
  }
  
  .board-title {
    font-size: 1.25rem;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  
  .futuristic-btn-primary {
    width: 100%;
    padding: 0.875rem;
    font-size: 0.9rem;
    justify-content: center;
  }
  
  /* 看板列布局优化 */
  .kanban-columns {
    gap: 1rem;
    height: auto;
    min-height: auto;
  }
  
  .kanban-column {
    max-height: 45vh;
    min-height: 250px;
    margin-bottom: 1rem;
  }
  
  /* 列头部优化 */
  .column-header {
    padding: 0.875rem;
  }
  
  .column-title {
    font-size: 1rem;
    gap: 0.375rem;
  }
  
  .column-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .task-count {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  /* 列内容优化 */
  .column-content {
    padding: 0.75rem;
    gap: 0.75rem;
    -webkit-overflow-scrolling: touch;
  }
  
  /* 空列状态优化 */
  .empty-column {
    height: 80px;
    font-size: 0.875rem;
    border-width: 1px;
  }
  
  /* 滚动条优化 */
  .column-content::-webkit-scrollbar {
    width: 4px;
  }
}

/* 小屏幕设备进一步优化 */
@media (max-width: 480px) {
  .board-header {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .board-title {
    font-size: 1.125rem;
  }
  
  .futuristic-btn-primary {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
  
  .kanban-columns {
    gap: 0.75rem;
  }
  
  .kanban-column {
    max-height: 40vh;
    min-height: 200px;
  }
  
  .column-header {
    padding: 0.75rem;
  }
  
  .column-title {
    font-size: 0.9rem;
  }
  
  .column-content {
    padding: 0.625rem;
    gap: 0.625rem;
  }
  
  .empty-column {
    height: 60px;
    font-size: 0.8125rem;
  }
  
  /* 触摸设备优化 */
  .kanban-column,
  .column-content,
  .empty-column {
    touch-action: manipulation;
  }
}
</style>