<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import todosService from '../services/todosService'
import aiService from '../services/aiService'
import languageService from '../services/languageService'
import TimeUtils from '../utils/timeUtils'

// 定义emit事件
const emit = defineEmits(['set-view', 'start-pomodoro'])

interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  updated_at: string
  category: string
  completed_at?: string
}

const todos = ref<Todo[]>([])
const newTodoTitle = ref('')
const newTodoDescription = ref('')
const newTodoPriority = ref<'low' | 'medium' | 'high'>('medium')
const newTodoCategory = ref('personal')
const newTodoDueDate = ref('')

// AI功能相关
const showAIPanel = ref(false)
const aiPrompt = ref('')
const isGeneratingTodos = ref(false)
const aiGeneratedTodos = ref<any[]>([])
const filterStatus = ref<'all' | 'pending' | 'completed'>('all')
const filterCategory = ref('all')
const isLoading = ref(false)
const currentLanguage = ref(languageService.getLanguage())

// 语言监听器
let removeLanguageListener: (() => void) | null = null

const categories = computed(() => {
  // 依赖currentLanguage以触发响应式更新
  currentLanguage.value
  return [
    languageService.t('personal'),
    languageService.t('work'),
    languageService.t('study'),
    languageService.t('health'),
    languageService.t('other'),
    languageService.t('life'),
    languageService.t('project')
  ]
})
const priorityColors = {
  low: 'text-green-400 border-green-400',
  medium: 'text-yellow-400 border-yellow-400', 
  high: 'text-red-400 border-red-400'
}

const priorityLabels = computed(() => ({
  low: languageService.t('low_priority'),
  medium: languageService.t('medium_priority'),
  high: languageService.t('high_priority')
}))

const fetchTodos = async () => {
  isLoading.value = true
  try {
    const todoList = await todosService.getAllTodos()
    todos.value = todoList
  } catch (error) {
    console.error('Failed to fetch todos:', error)
    // 如果API失败，使用模拟数据
    todos.value = [
      {
        id: 1,
        title: 'Complete project documentation',
        description: 'Write technical documentation and user manual',
        completed: false,
        priority: 'high',
        due_date: '2024-01-20',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        category: 'work'
      },
      {
        id: 2,
        title: 'Learn Vue.js',
        description: 'Deep dive into Vue 3 composition API',
        completed: true,
        priority: 'medium',
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-14T16:30:00Z',
        category: 'study'
      },
      {
        id: 3,
        title: 'Buy daily necessities',
        completed: false,
        priority: 'low',
        due_date: '2024-01-18',
        created_at: '2024-01-16T14:00:00Z',
        updated_at: '2024-01-16T14:00:00Z',
        category: 'personal'
      }
    ]
  } finally {
    isLoading.value = false
  }
}

const createTodo = async () => {
  if (!newTodoTitle.value.trim()) return
  
  const todoData = {
    content: newTodoTitle.value,
    description: newTodoDescription.value || undefined,
    priority: newTodoPriority.value,
    due_date: newTodoDueDate.value || undefined,
    category: newTodoCategory.value
  }
  
  try {
    const result = await todosService.createTodo(todoData)
    if (result.success) {
      await fetchTodos() // 重新获取列表
    }
  } catch (error) {
    console.error('Failed to create todo:', error)
    alert(languageService.t('create_todo_failed'))
  }
  
  // 重置表单
  newTodoTitle.value = ''
  newTodoDescription.value = ''
  newTodoPriority.value = 'medium'
  newTodoCategory.value = '个人'
  newTodoDueDate.value = ''
}

// AI生成待办事项
const generateTodosWithAI = async () => {
  if (!aiPrompt.value.trim()) return
  
  isGeneratingTodos.value = true
  try {
    const result = await aiService.generateTodos(aiPrompt.value)
    if (result.success && result.todos) {
      aiGeneratedTodos.value = result.todos
    }
  } catch (error) {
    console.error('AI failed to generate todos:', error)
    alert(languageService.t('ai_generation_failed'))
  } finally {
    isGeneratingTodos.value = false
  }
}

// 添加AI生成的待办事项
const addAITodo = async (aiTodo: any) => {
  try {
    const result = await todosService.createTodo({
      content: aiTodo.title,
      description: aiTodo.description,
      priority: aiTodo.priority || 'medium',
      category: aiTodo.category || '个人',
      due_date: aiTodo.due_date
    })
    if (result.success) {
      await fetchTodos()
      // 从AI生成列表中移除已添加的项目
      aiGeneratedTodos.value = aiGeneratedTodos.value.filter(todo => todo !== aiTodo)
    } else {
      alert(result.error || languageService.t('add_todo_failed'))
    }
  } catch (error) {
    console.error('Failed to add AI todo:', error)
    alert(languageService.t('add_todo_failed'))
  }
}

// 清空AI生成的待办事项
const clearAITodos = () => {
  aiGeneratedTodos.value = []
  aiPrompt.value = ''
}

const toggleTodo = async (todo: Todo) => {
  try {
    const result = await todosService.toggleTodo(todo.id)
    // 后端直接返回更新后的todo对象
    if (result && result.id) {
      const updatedTodo = result
      const index = todos.value.findIndex(t => t.id === todo.id)
      if (index !== -1) {
        todos.value[index] = { ...updatedTodo }
      }
    } else {
      // 兼容旧格式
      todo.completed = !todo.completed
      todo.updated_at = TimeUtils.toISOString(TimeUtils.now())
    }
  } catch (error) {
    console.error('Failed to update todo:', error)
    alert(languageService.t('update_todo_failed'))
  }
}

const deleteTodo = async (todoId: number) => {
  if (!confirm(languageService.t('confirm_delete_todo'))) return
  
  try {
    const result = await todosService.deleteTodo(todoId)
    // 后端返回 { message: '待办事项删除成功' } 或无响应体
    // 直接更新本地列表，无需检查success字段
    todos.value = todos.value.filter(todo => todo.id !== todoId)
  } catch (error) {
    console.error('Failed to delete todo:', error)
    alert(languageService.t('delete_todo_failed'))
  }
}

const startFocusSession = (todo: Todo) => {
  // 切换到番茄时钟页面并传递任务信息
  emit('start-pomodoro', {
    taskId: todo.id.toString(),
    taskTitle: todo.title
  })
  emit('set-view', 'pomodoro')
}

const focusNewTodoInput = () => {
  newTodoTitle.value = ''
  const input = document.querySelector('input[placeholder*="task"]') as HTMLInputElement
  if (input) {
    input.focus()
  }
}

const filteredTodos = computed(() => {
  let filtered = todos.value
  
  // 按状态过滤
  if (filterStatus.value === 'pending') {
    filtered = filtered.filter(todo => !todo.completed)
  } else if (filterStatus.value === 'completed') {
    filtered = filtered.filter(todo => todo.completed)
  }
  
  // 按分类过滤
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(todo => todo.category === filterCategory.value)
  }
  
  // 按优先级和创建时间排序
  return filtered.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const todoStats = computed(() => {
  const total = todos.value.length
  const completed = todos.value.filter(todo => todo.completed).length
  const pending = total - completed
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return { total, completed, pending, completionRate }
})

const formatDate = (dateString: string) => {
  const lang = languageService.getLanguage()
  const locale = lang === 'zh-CN' ? 'zh-CN' : 'en-US'
  return TimeUtils.formatDate(dateString, locale)
}

const isOverdue = (dueDate?: string) => {
  return TimeUtils.isOverdue(dueDate)
}

onMounted(() => {
  fetchTodos()
  
  // 添加语言变化监听器
  removeLanguageListener = languageService.addListener((newLanguage) => {
    currentLanguage.value = newLanguage
  })
})

onUnmounted(() => {
  // 清理语言监听器
  if (removeLanguageListener) {
    removeLanguageListener()
  }
})
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <!-- 统计信息 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="futuristic-card text-center group hover:scale-105 transition-transform duration-300">
        <div class="flex items-center justify-center mb-2">
          <svg class="w-6 h-6 mr-2 opacity-60" style="color: var(--theme-text);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <div class="text-3xl font-bold futuristic-title mb-1">{{ todoStats.total }}</div>
        <div class="futuristic-subtitle">{{ languageService.t('total_tasks') }}</div>
      </div>
      <div class="futuristic-card text-center group hover:scale-105 transition-transform duration-300">
        <div class="flex items-center justify-center mb-2">
          <svg class="w-6 h-6 mr-2" style="color: var(--theme-accent);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="text-3xl font-bold text-blue-400 mb-1">{{ todoStats.pending }}</div>
        <div class="futuristic-subtitle">{{ languageService.t('pending') }}</div>
      </div>
      <div class="futuristic-card text-center group hover:scale-105 transition-transform duration-300">
        <div class="flex items-center justify-center mb-2">
          <svg class="w-6 h-6 mr-2" style="color: var(--theme-success);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div class="text-3xl font-bold text-green-400 mb-1">{{ todoStats.completed }}</div>
        <div class="futuristic-subtitle">{{ languageService.t('completed') }}</div>
      </div>
      <div class="futuristic-card text-center group hover:scale-105 transition-transform duration-300">
        <div class="flex items-center justify-center mb-2">
          <svg class="w-6 h-6 mr-2" style="color: var(--theme-warning);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <div class="text-3xl font-bold text-purple-400 mb-1">{{ todoStats.completionRate }}%</div>
        <div class="futuristic-subtitle">{{ languageService.t('completion_rate') }}</div>
      </div>
    </div>
    
    <!-- 新建待办事项 -->
    <div class="futuristic-card mb-8">
      <div class="futuristic-header mb-6">
        <h2 class="futuristic-title-medium">{{ languageService.t('create_new_task') }}</h2>
        <div class="futuristic-subtitle">{{ languageService.t('add_your_todos') }}</div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="relative">
            <input
              v-model="newTodoTitle"
              type="text"
              :placeholder="languageService.t('enter_task_title') + '...'"
              class="futuristic-input w-full"
              @keyup.enter="createTodo"
            >
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-40" style="color: var(--theme-text);">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
          </div>
          <textarea
            v-model="newTodoDescription"
            :placeholder="languageService.t('add_task_description_optional') + '...'"
            class="futuristic-input w-full h-24 resize-none"
          ></textarea>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <select v-model="newTodoPriority" class="futuristic-input">
              <option value="low">🟢 {{ languageService.t('low_priority') }}</option>
              <option value="medium">🟡 {{ languageService.t('medium_priority') }}</option>
              <option value="high">🔴 {{ languageService.t('high_priority') }}</option>
            </select>
            <select v-model="newTodoCategory" class="futuristic-input">
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <input
            v-model="newTodoDueDate"
            type="date"
            class="futuristic-input w-full"
          >
          <div class="flex gap-3">
            <button @click="createTodo" class="futuristic-btn-primary flex-1 group">
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>{{ languageService.t('add_task') }}</span>
              </div>
            </button>
            <button 
              @click="showAIPanel = !showAIPanel"
              :class="[
                'futuristic-btn-secondary group px-4',
                showAIPanel ? 'futuristic-btn-active' : ''
              ]"
              :title="languageService.t('ai_smart_generate')"
            >
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- AI助手面板 -->
    <div v-if="showAIPanel" class="futuristic-card mb-8" style="background: var(--theme-card-gradient);">
      <div class="flex items-center justify-between mb-6">
        <div class="futuristic-header">
          <h3 class="futuristic-title-small">{{ languageService.t('ai_smart_assistant') }}</h3>
          <div class="futuristic-subtitle">{{ languageService.t('let_ai_help_plan_tasks') }}</div>
        </div>
        <button 
          @click="showAIPanel = false"
          class="futuristic-btn-danger hover:scale-110 transition-transform"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium futuristic-subtitle mb-3">
            {{ languageService.t('describe_your_tasks_or_goals') }}
          </label>
          <div class="relative">
            <textarea
              v-model="aiPrompt"
              :placeholder="languageService.t('example_prepare_presentation')"
              class="futuristic-input w-full h-24 resize-none"
            ></textarea>
            <div class="absolute bottom-3 right-3 opacity-40" style="color: var(--theme-text);">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="generateTodosWithAI"
            :disabled="!aiPrompt.trim() || isGeneratingTodos"
            class="futuristic-btn-primary flex-1 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div class="flex items-center justify-center space-x-2">
              <svg v-if="isGeneratingTodos" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <svg v-else class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span v-if="isGeneratingTodos">{{ languageService.t('generating') }}...</span>
              <span v-else>{{ languageService.t('generate_tasks') }}</span>
            </div>
          </button>
          <button 
            @click="clearAITodos"
            v-if="aiGeneratedTodos.length > 0"
            class="futuristic-btn-danger group"
          >
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>{{ languageService.t('clear') }}</span>
            </div>
          </button>
        </div>
        
        <!-- AI生成的待办事项列表 -->
        <div v-if="aiGeneratedTodos.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium futuristic-subtitle">{{ languageService.t('ai_generated_todos') }}：</h4>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            <div 
              v-for="(aiTodo, index) in aiGeneratedTodos" 
              :key="index"
              class="p-3 rounded border" style="background: var(--theme-surface); border-color: var(--theme-border);"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h5 class="font-medium futuristic-title">{{ aiTodo.title }}</h5>
                  <p v-if="aiTodo.description" class="text-sm futuristic-subtitle mt-1">{{ aiTodo.description }}</p>
                  <div class="flex items-center gap-2 mt-2 text-xs">
                    <span class="px-2 py-1 rounded border" :class="{
                      'text-red-400 border-red-400': aiTodo.priority === 'high',
                      'text-yellow-400 border-yellow-400': aiTodo.priority === 'medium',
                      'text-green-400 border-green-400': aiTodo.priority === 'low'
                    }">
                      {{ aiTodo.priority === 'high' ? '高' : aiTodo.priority === 'medium' ? '中' : '低' }}
                    </span>
                    <span v-if="aiTodo.category" class="futuristic-tag">
                      {{ aiTodo.category }}
                    </span>
                    <span v-if="aiTodo.due_date" class="px-2 py-1 rounded futuristic-subtitle" style="background: var(--theme-surface);">
                      <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg> {{ aiTodo.due_date }}
                    </span>
                  </div>
                </div>
                <button 
                  @click="addAITodo(aiTodo)"
                  class="ml-3 futuristic-btn-primary px-3 py-1 text-sm"
                >
                  {{ languageService.t('add') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 过滤器 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <div class="flex space-x-2">
        <button
          v-for="status in ['all', 'pending', 'completed']"
          :key="status"
          @click="filterStatus = status"
          :class="[
            'futuristic-btn-secondary transition-all duration-300',
            filterStatus === status ? 'futuristic-btn-active' : ''
          ]"
        >
          {{ status === 'all' ? languageService.t('all') : status === 'pending' ? languageService.t('pending') : languageService.t('completed') }}
        </button>
      </div>
      
      <select v-model="filterCategory" class="futuristic-input min-w-32">
        <option value="all">{{ languageService.t('all_categories') }}</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>
    
    <!-- 待办事项列表 -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-pulse futuristic-subtitle">加载中...</div>
      </div>
      
      <div v-else-if="filteredTodos.length === 0" class="futuristic-empty-state text-center py-12">
        <div class="futuristic-icon-container mb-8">
          <svg class="w-24 h-24 mx-auto animate-pulse opacity-40" style="color: var(--theme-text);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
        </div>
        <h3 class="futuristic-title-small mb-4">{{ languageService.t('no_tasks') }}</h3>
        <p class="futuristic-subtitle mb-8">{{ languageService.t('add_new_todo_start_manage') }}</p>
        <button @click="focusNewTodoInput" class="futuristic-btn-primary group">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>{{ languageService.t('create_first_task') }}</span>
          </div>
        </button>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="todo in filteredTodos"
          :key="todo.id"
          :class="[
            'futuristic-card mb-6 group hover:scale-[1.02] transition-all duration-300',
            todo.completed ? 'opacity-60' : ''
          ]"
        >
          <div class="flex items-start space-x-4">
            <!-- 完成状态 -->
            <div class="relative mt-1">
              <input
                type="checkbox"
                :checked="todo.completed"
                @change="toggleTodo(todo)"
                class="sr-only"
                :id="`todo-${todo.id}`"
              >
              <label
                :for="`todo-${todo.id}`"
                :class="[
                  'flex items-center justify-center w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-300',
                  todo.completed 
                    ? 'futuristic-btn-primary border-0' 
                    : 'hover:scale-110 transition-all duration-300' + ' border-2 opacity-50 hover:opacity-100'
                ]"
              >
                <svg v-if="todo.completed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </label>
            </div>
            
            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-3">
                <h3 :class="[
                  'font-semibold text-lg leading-tight',
                  todo.completed ? 'line-through opacity-50' : 'futuristic-title'
                ]">
                  {{ todo.title }}
                </h3>
                
                <div class="flex items-center space-x-2 ml-4">
                  <!-- 优先级标签 -->
                  <span :class="[
                    'px-3 py-1 text-xs rounded-full font-medium flex items-center space-x-1',
                    todo.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  ]">
                    <span>{{ todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢' }}</span>
                    <span>{{ todo.priority === 'high' ? languageService.t('high_priority') : todo.priority === 'medium' ? languageService.t('medium_priority') : languageService.t('low_priority') }}</span>
                  </span>
                  
                  <!-- 分类标签 -->
                  <span class="futuristic-tag">
                    {{ todo.category }}
                  </span>
                </div>
              </div>
              
              <p v-if="todo.description" :class="[
                'text-sm mb-4 leading-relaxed',
                todo.completed ? 'opacity-40' : 'futuristic-subtitle'
              ]">
                {{ todo.description }}
              </p>
              
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center space-x-4">
                  <span class="flex items-center space-x-1 futuristic-subtitle">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ formatDate(todo.created_at) }}</span>
                  </span>
                  <span v-if="todo.due_date" :class="[
                    'flex items-center space-x-1',
                    isOverdue(todo.due_date) && !todo.completed ? 'text-red-400' : 'futuristic-subtitle'
                  ]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{{ formatDate(todo.due_date) }}</span>
                    <span v-if="isOverdue(todo.due_date) && !todo.completed"><svg class="w-4 h-4 inline text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg></span>
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center space-x-2">
              <!-- 开始专注按钮 -->
              <button
                v-if="!todo.completed"
                @click="startFocusSession(todo)"
                class="futuristic-btn-primary group-hover:opacity-100 opacity-60 hover:scale-110 transition-all duration-300 p-2"
                :title="languageService.t('start_focus_session')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>
              
              <!-- 删除按钮 -->
              <button
                @click="deleteTodo(todo.id)"
                class="futuristic-btn-danger group-hover:opacity-100 opacity-60 hover:scale-110 transition-all duration-300 p-2"
                :title="languageService.t('delete_task')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-through {
  text-decoration: line-through;
}

/* 待办事项列表动画 */
.todo-list {
  transition: all 0.3s ease;
}

/* 待办事项卡片动画 */
.futuristic-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.futuristic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 245, 255, 0.15);
}

/* 待办事项项目动画 */
.todo-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.todo-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.todo-item:hover::before {
  left: 100%;
}

.todo-item:hover {
  transform: translateX(4px);
  background: rgba(0, 245, 255, 0.05);
}

/* 复选框动画 */
input[type="checkbox"] {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

input[type="checkbox"]:checked {
  animation: checkboxPulse 0.3s ease;
}

@keyframes checkboxPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 按钮动画增强 */
.futuristic-btn-primary, .futuristic-btn-secondary, .futuristic-btn-danger {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.futuristic-btn-primary:hover, .futuristic-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 245, 255, 0.3);
}

.futuristic-btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
}

/* AI面板动画 */
.ai-panel {
  animation: slideInDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 文本区域动画 */
textarea {
  transition: all 0.3s ease;
}

textarea:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.3);
}

/* 加载动画 */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 完成状态动画 */
.todo-completed {
  animation: completionPulse 0.5s ease;
}

@keyframes completionPulse {
  0% { background-color: transparent; }
  50% { background-color: rgba(16, 185, 129, 0.2); }
  100% { background-color: transparent; }
}

/* 删除动画 */
.todo-removing {
  animation: slideOutRight 0.3s ease-in-out forwards;
}

@keyframes slideOutRight {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  /* 统计卡片网格优化 */
  .grid.grid-cols-2.md\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  /* 新建任务表单优化 */
  .grid.grid-cols-1.lg\:grid-cols-2 {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  /* 表单控件网格调整 */
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  /* 按钮组布局调整 */
  .flex.gap-3 {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  /* 任务列表优化 */
  .todo-item {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
  
  /* 任务操作按钮调整 */
  .todo-actions {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  
  /* 过滤器布局调整 */
  .filters-container {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  /* AI面板优化 */
  .ai-panel-content {
    padding: 1rem;
  }
  
  /* 禁用hover效果 */
  .futuristic-card:hover {
    transform: none;
  }
  
  .todo-item:hover {
    transform: none;
  }
  
  /* 文本大小调整 */
  .text-3xl {
    font-size: 1.75rem;
  }
  
  /* 间距调整 */
  .p-6 {
    padding: 1rem;
  }
  
  .mb-8 {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  /* 更小屏幕的统计卡片 */
  .grid.grid-cols-2.md\:grid-cols-4 {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  /* 更紧凑的间距 */
  .p-6 {
    padding: 0.75rem;
  }
  
  .mb-8 {
    margin-bottom: 1rem;
  }
  
  /* 任务卡片更紧凑 */
  .todo-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  /* 文本大小进一步调整 */
  .text-3xl {
    font-size: 1.5rem;
  }
  
  .futuristic-title-medium {
    font-size: 1.25rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 确保触摸目标足够大 */
  .todo-checkbox,
  .todo-actions button {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 增加按钮间距 */
  .todo-actions {
    gap: 0.75rem;
  }
  
  /* 优化表单控件 */
  input, textarea, select {
    min-height: 44px;
    padding: 0.875rem;
    font-size: 1rem;
  }
  
  /* 移除hover效果，使用active状态 */
  .todo-item:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
  
  .futuristic-btn-primary:active,
  .futuristic-btn-secondary:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}
</style>