<template>
  <div class="ai-enhanced-editor">
    <!-- AI工具栏 -->
    <div class="ai-toolbar futuristic-card mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-bold futuristic-title flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          AI智能助手
        </h3>
        <button 
          @click="toggleAIPanel" 
          class="p-2 rounded transition-colors hover:opacity-80"
          style="background: var(--theme-surface);"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="aiPanelExpanded ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'"></path>
          </svg>
        </button>
      </div>
      
      <Transition name="slide-down">
        <div v-if="aiPanelExpanded" class="space-y-3">
          <!-- 快速操作按钮 -->
          <div class="flex flex-wrap gap-2">
            <button 
              @click="analyzeText('summary')"
              :disabled="!selectedText && !currentNote.content"
              class="ai-btn ai-btn-primary"
            >
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> 生成摘要
            </button>
            <button 
              @click="analyzeText('keywords')"
              :disabled="!selectedText && !currentNote.content"
              class="ai-btn ai-btn-secondary"
            >
              提取关键词
            </button>
            <button 
              @click="analyzeText('sentiment')"
              :disabled="!selectedText && !currentNote.content"
              class="ai-btn ai-btn-accent"
            >
              😊 情感分析
            </button>
            <button 
              @click="generateTodos"
              :disabled="!selectedText && !currentNote.content"
              class="ai-btn ai-btn-success"
            >
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> 生成待办
            </button>
          </div>
          
          <!-- 内容改进选项 -->
          <div class="border-t pt-3" style="border-color: var(--theme-border);">
            <h4 class="text-sm font-semibold mb-2 futuristic-subtitle">内容改进</h4>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="improveContent('general')"
                :disabled="!selectedText && !currentNote.content"
                class="ai-btn ai-btn-outline"
              >
                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> 通用优化
              </button>
              <button 
                @click="improveContent('grammar')"
                :disabled="!selectedText && !currentNote.content"
                class="ai-btn ai-btn-outline"
              >
                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> 语法检查
              </button>
              <button 
                @click="improveContent('structure')"
                :disabled="!selectedText && !currentNote.content"
                class="ai-btn ai-btn-outline"
              >
                结构优化
              </button>
              <button 
                @click="improveContent('expand')"
                :disabled="!selectedText && !currentNote.content"
                class="ai-btn ai-btn-outline"
              >
                📈 内容扩展
              </button>
            </div>
          </div>
          
          <!-- AI状态指示器 -->
          <div class="flex items-center justify-between text-xs futuristic-subtitle">
            <div class="flex items-center space-x-2">
              <div :class="['w-2 h-2 rounded-full', aiConnected ? 'animate-pulse' : 'bg-red-500']" :style="aiConnected ? 'background: var(--theme-success);' : ''">
              </div>
              <span>{{ aiConnected ? 'AI已连接' : 'AI连接失败' }}</span>
            </div>
            <div v-if="selectedText" class="futuristic-title">
              已选择 {{ selectedText.length }} 个字符
            </div>
          </div>
        </div>
      </Transition>
    </div>
    
    <!-- AI结果面板 -->
    <Transition name="fade">
      <div v-if="aiResult" class="ai-result-panel futuristic-card mb-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold futuristic-title flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {{ getResultTitle(aiResult.type) }}
          </h4>
          <div class="flex space-x-2">
            <button 
              @click="applyAIResult"
              v-if="aiResult.type.includes('improve')"
              class="text-xs px-3 py-1 rounded transition-colors futuristic-btn-primary"
            >
              应用改进
            </button>
            <button 
              @click="copyAIResult"
              class="text-xs px-3 py-1 rounded transition-colors futuristic-btn-secondary"
            >
              复制结果
            </button>
            <button 
              @click="aiResult = null"
              class="text-xs px-2 py-1 hover:bg-red-500/20 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div class="ai-result-content rounded p-3 text-sm" style="background: var(--theme-surface);">
          <pre v-if="aiResult.type === 'keywords'" class="whitespace-pre-wrap font-mono">{{ aiResult.content }}</pre>
          <div v-else-if="aiResult.type === 'todos'" class="space-y-2">
            <div v-for="(todo, index) in aiResult.todos" :key="index" class="flex items-center space-x-2">
              <input type="checkbox" class="rounded">
              <span class="flex-1">{{ todo.content }}</span>
              <span class="text-xs px-2 py-1 rounded" :class="getPriorityClass(todo.priority)">{{ todo.priority }}</span>
            </div>
          </div>
          <div v-else class="whitespace-pre-wrap">{{ aiResult.content }}</div>
        </div>
      </div>
    </Transition>
    
    <!-- 加载状态 -->
    <Transition name="fade">
      <div v-if="aiLoading" class="ai-loading futuristic-card mb-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2" style="border-color: var(--theme-success);"></div>
          <span class="text-sm futuristic-subtitle">{{ loadingMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import aiService from '../services/aiService'

// Props
const props = defineProps({
  currentNote: {
    type: Object,
    default: () => ({ title: '', content: '' })
  },
  selectedText: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update-content', 'add-todos'])

// 响应式数据
const aiPanelExpanded = ref(true)
const aiConnected = ref(false)
const aiLoading = ref(false)
const loadingMessage = ref('')
const aiResult = ref(null)

// 计算属性
const getTextToAnalyze = computed(() => {
  return props.selectedText || props.currentNote.content || ''
})

// 方法
const toggleAIPanel = () => {
  aiPanelExpanded.value = !aiPanelExpanded.value
}

const testAIConnection = async () => {
  try {
    const result = await aiService.testConnection()
    aiConnected.value = result.success
  } catch (error) {
    aiConnected.value = false
    console.error('AI连接测试失败:', error)
  }
}

const analyzeText = async (analysisType) => {
  const textToAnalyze = getTextToAnalyze.value
  if (!textToAnalyze.trim()) {
    alert('请先输入或选择要分析的文本')
    return
  }
  
  aiLoading.value = true
  loadingMessage.value = getLoadingMessage(analysisType)
  
  try {
    const result = await aiService.analyzeText(textToAnalyze, analysisType)
    if (result.success) {
      aiResult.value = {
        type: analysisType,
        content: result.result
      }
    } else {
      throw new Error(result.error || '分析失败')
    }
  } catch (error) {
    console.error('文本分析失败:', error)
    alert(`分析失败: ${error.message}`)
  } finally {
    aiLoading.value = false
  }
}

const generateTodos = async () => {
  const textToAnalyze = getTextToAnalyze.value
  if (!textToAnalyze.trim()) {
    alert('请先输入或选择要分析的文本')
    return
  }
  
  aiLoading.value = true
  loadingMessage.value = '正在生成待办事项...'
  
  try {
    const result = await aiService.generateTodos(textToAnalyze)
    if (result.success && result.todos.length > 0) {
      aiResult.value = {
        type: 'todos',
        todos: result.todos
      }
      emit('add-todos', result.todos)
    } else {
      aiResult.value = {
        type: 'todos',
        content: '未找到明确的待办事项',
        todos: []
      }
    }
  } catch (error) {
    console.error('生成待办事项失败:', error)
    alert(`生成待办事项失败: ${error.message}`)
  } finally {
    aiLoading.value = false
  }
}

const improveContent = async (improvementType) => {
  const textToImprove = getTextToAnalyze.value
  if (!textToImprove.trim()) {
    alert('请先输入或选择要改进的文本')
    return
  }
  
  aiLoading.value = true
  loadingMessage.value = getImprovementMessage(improvementType)
  
  try {
    const result = await aiService.improveContent(textToImprove, improvementType)
    if (result.success) {
      aiResult.value = {
        type: `improve_${improvementType}`,
        content: result.improved_content,
        original: textToImprove
      }
    } else {
      throw new Error(result.error || '改进失败')
    }
  } catch (error) {
    console.error('内容改进失败:', error)
    alert(`内容改进失败: ${error.message}`)
  } finally {
    aiLoading.value = false
  }
}

const applyAIResult = () => {
  if (aiResult.value && aiResult.value.content) {
    emit('update-content', aiResult.value.content)
    aiResult.value = null
  }
}

const copyAIResult = async () => {
  if (aiResult.value) {
    try {
      const textToCopy = aiResult.value.type === 'todos' 
        ? aiResult.value.todos.map(todo => `- ${todo.content}`).join('\n')
        : aiResult.value.content
      
      await navigator.clipboard.writeText(textToCopy)
      // 可以添加一个临时的成功提示
    } catch (error) {
      console.error('复制失败:', error)
    }
  }
}

const getResultTitle = (type) => {
  const titles = {
    summary: '内容摘要',
    keywords: '关键词',
    sentiment: '😊 情感分析',
    structure: '结构分析',
    todos: '待办事项',
    improve_general: '通用优化结果',
    improve_grammar: '语法检查结果',
    improve_structure: '结构优化结果',
    improve_expand: '📈 内容扩展结果'
  }
  return titles[type] || 'AI分析结果'
}

const getLoadingMessage = (type) => {
  const messages = {
    summary: '正在生成摘要...',
    keywords: '正在提取关键词...',
    sentiment: '正在分析情感...',
    structure: '正在分析结构...'
  }
  return messages[type] || '正在处理...'
}

const getImprovementMessage = (type) => {
  const messages = {
    general: '正在优化内容...',
    grammar: '正在检查语法...',
    structure: '正在优化结构...',
    expand: '正在扩展内容...'
  }
  return messages[type] || '正在改进...'
}

const getPriorityClass = (priority) => {
  const classes = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400'
  }
  return classes[priority] || 'bg-gray-500/20 text-gray-400'
}

// 生命周期
onMounted(() => {
  testAIConnection()
})

// 监听器
watch(() => props.currentNote, () => {
  // 当笔记改变时，清除之前的AI结果
  aiResult.value = null
}, { deep: true })
</script>

<style scoped>
.ai-enhanced-editor {
  @apply space-y-4;
}

.ai-btn {
  @apply px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.ai-btn-primary {
  @apply px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300;
}

.ai-btn-secondary {
  @apply px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300;
}

.ai-btn-accent {
  @apply bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30;
}

.ai-btn-success {
  @apply bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30;
}

.ai-btn-outline {
  @apply bg-transparent hover:opacity-80 border;
  color: var(--theme-text);
  border-color: var(--theme-border);
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.ai-result-content {
  max-height: 300px;
  overflow-y: auto;
}

.ai-loading {
  border: 1px solid;
  border-color: var(--theme-success);
}

.ai-result-panel {
  border: 1px solid;
  border-color: var(--theme-border);
}

.ai-toolbar {
  border: 1px solid;
  border-color: var(--theme-border);
}
</style>