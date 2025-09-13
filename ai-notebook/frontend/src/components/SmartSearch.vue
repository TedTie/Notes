<template>
  <div class="smart-search">
    <!-- 搜索输入框 -->
    <div class="search-container cyber-card mb-4">
      <div class="flex items-center space-x-3">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            @keyup.enter="performSearch"
            @input="onSearchInput"
            type="text"
            placeholder="智能搜索笔记和待办事项..."
            class="input-neon w-full pl-10 pr-4"
          >
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyber-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        
        <button 
          @click="toggleAISearch"
          :class="[
            'px-4 py-2 rounded transition-all duration-200 text-sm font-medium',
            aiSearchEnabled 
              ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' 
              : 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30'
          ]"
        >
          <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          {{ aiSearchEnabled ? 'AI搜索' : '普通搜索' }}
        </button>
        
        <button 
          @click="performSearch"
          :disabled="!searchQuery.trim() || isSearching"
          class="btn-neon px-4 py-2"
        >
          <svg v-if="isSearching" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>搜索</span>
        </button>
      </div>
      
      <!-- 搜索选项 -->
      <div class="flex items-center justify-between mt-3 text-sm">
        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="searchOptions.includeNotes" type="checkbox" class="rounded">
            <span class="text-cyber-primary/80"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg> 笔记</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="searchOptions.includeTodos" type="checkbox" class="rounded">
            <span class="text-cyber-primary/80"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> 待办</span>
          </label>
        </div>
        
        <div class="flex items-center space-x-2 text-xs text-cyber-primary/60">
          <span>{{ searchResults.length }} 个结果</span>
          <span v-if="aiSearchEnabled && lastSearchTime">• AI增强 {{ lastSearchTime }}ms</span>
        </div>
      </div>
    </div>
    
    <!-- 搜索建议 -->
    <div v-if="searchSuggestions.length > 0 && !searchResults.length" class="search-suggestions cyber-card mb-4">
      <h4 class="text-sm font-semibold mb-2 text-cyber-primary/80"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> 搜索建议</h4>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="suggestion in searchSuggestions"
          :key="suggestion"
          @click="applySuggestion(suggestion)"
          class="px-3 py-1 text-xs bg-cyber-primary/10 text-cyber-primary rounded hover:bg-cyber-primary/20 transition-colors"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
    
    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results space-y-3">
      <div 
        v-for="result in searchResults"
        :key="`${result.type}-${result.id}`"
        @click="selectResult(result)"
        class="result-item cyber-card cursor-pointer hover:border-cyber-primary/50 transition-all duration-200"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-2">
            <svg v-if="result.type === 'note'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            <h3 class="font-semibold text-glow">{{ result.title }}</h3>
            <span v-if="aiSearchEnabled && result.relevanceScore" class="text-xs px-2 py-1 bg-neon-green/20 text-neon-green rounded">
              {{ Math.round(result.relevanceScore * 100) }}% 匹配
            </span>
          </div>
          <span class="text-xs text-cyber-primary/60">{{ formatDate(result.updated_at) }}</span>
        </div>
        
        <p class="text-sm text-cyber-primary/80 mb-2 line-clamp-2">
          {{ result.content }}
        </p>
        
        <!-- AI相关性说明 -->
        <div v-if="aiSearchEnabled && result.reason" class="text-xs text-cyber-primary/60 bg-cyber-gray/20 rounded p-2">
          <strong>AI分析：</strong> {{ result.reason }}
        </div>
        
        <!-- 关键词高亮 -->
        <div v-if="result.highlights && result.highlights.length > 0" class="mt-2">
          <div class="flex flex-wrap gap-1">
            <span 
              v-for="highlight in result.highlights"
              :key="highlight"
              class="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded"
            >
              {{ highlight }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="hasSearched && !isSearching" class="empty-state text-center py-8">
      <svg class="w-16 h-16 mb-4 text-cyber-primary/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
      <h3 class="text-lg font-semibold mb-2 text-glow">未找到相关内容</h3>
      <p class="text-cyber-primary/60 mb-4">尝试使用不同的关键词或启用AI搜索</p>
      <button 
        v-if="!aiSearchEnabled"
        @click="toggleAISearch"
        class="btn-neon"
      >
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg> 启用AI智能搜索
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isSearching" class="loading-state text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto mb-4"></div>
      <p class="text-cyber-primary/80">
              <svg v-if="aiSearchEnabled" class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
              <svg v-else class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
              {{ aiSearchEnabled ? 'AI正在分析搜索内容...' : '搜索中...' }}
            </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import aiService from '../services/aiService'
import notesService from '../services/notesService'
import todosService from '../services/todosService'

// Props
const props = defineProps({
  autoFocus: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['select-result', 'close'])

// 响应式数据
const searchQuery = ref('')
const aiSearchEnabled = ref(false)
const isSearching = ref(false)
const hasSearched = ref(false)
const searchResults = ref([])
const searchSuggestions = ref(['会议记录', '项目计划', '学习笔记', '待办事项', '重要提醒'])
const lastSearchTime = ref(0)

const searchOptions = ref({
  includeNotes: true,
  includeTodos: true
})

// 计算属性
const filteredSuggestions = computed(() => {
  if (!searchQuery.value) return searchSuggestions.value
  return searchSuggestions.value.filter(s => 
    s.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 方法
const toggleAISearch = () => {
  aiSearchEnabled.value = !aiSearchEnabled.value
  if (searchQuery.value.trim() && hasSearched.value) {
    performSearch()
  }
}

const onSearchInput = () => {
  // 实时搜索建议
  if (searchQuery.value.length > 2) {
    // 可以在这里添加实时搜索建议的逻辑
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  hasSearched.value = true
  const startTime = Date.now()
  
  try {
    if (aiSearchEnabled.value) {
      await performAISearch()
    } else {
      await performRegularSearch()
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
    lastSearchTime.value = Date.now() - startTime
  }
}

const performRegularSearch = async () => {
  const results = []
  
  // 搜索笔记
  if (searchOptions.value.includeNotes) {
    try {
      const notes = await notesService.searchNotes(searchQuery.value)
      results.push(...notes.map(note => ({
        ...note,
        type: 'note',
        highlights: extractHighlights(note.content, searchQuery.value)
      })))
    } catch (error) {
      console.error('搜索笔记失败:', error)
    }
  }
  
  // 搜索待办事项
  if (searchOptions.value.includeTodos) {
    try {
      const todos = await todosService.searchTodos(searchQuery.value)
      results.push(...todos.map(todo => ({
        ...todo,
        type: 'todo',
        title: todo.content.substring(0, 50) + (todo.content.length > 50 ? '...' : ''),
        highlights: extractHighlights(todo.content, searchQuery.value)
      })))
    } catch (error) {
      console.error('搜索待办事项失败:', error)
    }
  }
  
  searchResults.value = results
}

const performAISearch = async () => {
  try {
    // 获取所有内容
    const allContent = []
    
    if (searchOptions.value.includeNotes) {
      const notes = await notesService.getAllNotes()
      allContent.push(...notes.map(note => ({ ...note, type: 'note' })))
    }
    
    if (searchOptions.value.includeTodos) {
      const todos = await todosService.getAllTodos()
      allContent.push(...todos.map(todo => ({ 
        ...todo, 
        type: 'todo',
        title: todo.content.substring(0, 50) + (todo.content.length > 50 ? '...' : '')
      })))
    }
    
    // 使用AI进行智能搜索
    const aiResult = await aiService.smartSearch(searchQuery.value, allContent)
    
    if (aiResult.success && aiResult.results) {
      // 根据AI结果筛选和排序内容
      const enhancedResults = aiResult.results.map(aiItem => {
        const originalItem = allContent.find(item => item.id.toString() === aiItem.id.toString())
        if (originalItem) {
          return {
            ...originalItem,
            relevanceScore: aiItem.relevance_score,
            reason: aiItem.reason,
            highlights: extractHighlights(originalItem.content, searchQuery.value)
          }
        }
        return null
      }).filter(Boolean)
      
      searchResults.value = enhancedResults
    } else {
      // AI搜索失败，回退到普通搜索
      await performRegularSearch()
    }
  } catch (error) {
    console.error('AI搜索失败:', error)
    // 回退到普通搜索
    await performRegularSearch()
  }
}

const extractHighlights = (content, query) => {
  const words = query.toLowerCase().split(' ').filter(w => w.length > 1)
  const highlights = []
  
  words.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = content.match(regex)
    if (matches) {
      highlights.push(...matches.slice(0, 3)) // 最多3个高亮
    }
  })
  
  return [...new Set(highlights)] // 去重
}

const applySuggestion = (suggestion) => {
  searchQuery.value = suggestion
  performSearch()
}

const selectResult = (result) => {
  emit('select-result', result)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  if (props.autoFocus) {
    // 自动聚焦搜索框
    setTimeout(() => {
      const input = document.querySelector('.smart-search input')
      if (input) input.focus()
    }, 100)
  }
})

// 监听器
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchResults.value = []
    hasSearched.value = false
  }
})
</script>

<style scoped>
.smart-search {
  @apply max-w-4xl mx-auto;
}

.search-container {
  @apply border border-cyber-primary/30;
}

.result-item {
  @apply border border-cyber-primary/20 hover:shadow-neon-sm;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 搜索结果动画 */
.search-results .result-item {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 高亮效果 */
.result-item:hover {
  transform: translateY(-2px);
}

/* 加载动画 */
.loading-state {
  @apply text-cyber-primary/60;
}

/* 空状态 */
.empty-state {
  @apply text-cyber-primary/60;
}
</style>