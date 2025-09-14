<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AIEnhancedEditor from './AIEnhancedEditor.vue'
import SmartSearch from './SmartSearch.vue'
import languageService from '../services/languageService'
import TimeUtils from '../utils/timeUtils'
import { supabaseService } from '../services/supabaseService'

interface Note {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  tags: string[]
}

const notes = ref<Note[]>([])
const selectedNote = ref<Note | null>(null)
const isCreating = ref(false)
const searchQuery = ref('')
const newNoteTitle = ref('')
const newNoteContent = ref('')
const isLoading = ref(false)
const showAIPanel = ref(false)
const selectedText = ref('')
const showSmartSearch = ref(false)
const currentLanguage = ref(languageService.getLanguage())

const selectedNoteId = ref('')

// 语言监听器
let removeLanguageListener: (() => void) | null = null

// 获取所有笔记
const fetchNotes = async () => {
  isLoading.value = true
  try {
    const data = await supabaseService.notes.getAllNotes()
    notes.value = data || []
  } catch (error) {
    console.error('获取笔记失败:', error)
    notes.value = []
  } finally {
    isLoading.value = false
  }
}

const createNote = async () => {
  if (!newNoteTitle.value.trim()) return
  
  try {
    const createdNote = await supabaseService.notes.createNote({
      title: newNoteTitle.value,
      content: newNoteContent.value
    })
    notes.value.unshift(createdNote)
    selectedNote.value = createdNote
  } catch (error) {
    console.error('创建笔记请求失败:', error)
    alert(languageService.t('create_note_failed'))
  }
  
  newNoteTitle.value = ''
  newNoteContent.value = ''
  isCreating.value = false
}

const selectNote = (note: Note) => {
  selectedNote.value = note
  selectedNoteId.value = note.id.toString()
  isCreating.value = false
}

// 处理下拉选择器变化
const onNoteSelect = () => {
  const noteId = selectedNoteId.value
  if (noteId) {
    const note = notes.value.find(n => n.id.toString() === noteId)
    if (note) {
      selectedNote.value = note
      isCreating.value = false
    }
  }
}

const updateNoteContent = (newContent: string) => {
  if (selectedNote.value) {
    selectedNote.value.content = newContent
    selectedNote.value.updated_at = TimeUtils.toISOString(TimeUtils.now())
  }
}

const addTodosToNote = (todos: any[]) => {
  if (selectedNote.value && todos.length > 0) {
    const todoText = todos.map(todo => `- [ ] ${todo.content}`).join('\n')
    const currentContent = selectedNote.value.content
    selectedNote.value.content = currentContent + (currentContent ? '\n\n' : '') + '## 待办事项\n' + todoText
    selectedNote.value.updated_at = TimeUtils.toISOString(TimeUtils.now())
  }
}

const handleTextSelection = (event: Event) => {
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    selectedText.value = selection.toString().trim()
  } else {
    selectedText.value = ''
  }
}

const toggleSmartSearch = () => {
  showSmartSearch.value = !showSmartSearch.value
}



const handleSearchResult = (result: any) => {
  if (result.type === 'note') {
    selectNote(result)
    showSmartSearch.value = false
  }
}

const deleteNote = async (noteId: number) => {
  console.log('deleteNote函数被调用，noteId:', noteId)
  
  if (!confirm(languageService.t('confirm_delete_note'))) {
    console.log('用户取消删除')
    return
  }
  
  console.log('开始发送删除请求')
  
  try {
    const success = await supabaseService.notes.deleteNote(noteId)
    if (success) {
      notes.value = notes.value.filter(note => note.id !== noteId)
      if (selectedNote.value?.id === noteId) {
        selectedNote.value = null
      }
      console.log('笔记删除成功，本地状态已更新')
      alert('笔记删除成功！')
    } else {
      alert('删除失败')
    }
  } catch (error) {
    console.error('删除请求失败:', error)
    alert('删除失败，请检查网络连接')
  }
}

const filteredNotes = ref<Note[]>([])

watch([notes, searchQuery], () => {
  if (!searchQuery.value) {
    filteredNotes.value = notes.value
  } else {
    filteredNotes.value = notes.value.filter(note => 
      note.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
}, { immediate: true })

// 监听selectedNote变化，同步selectedNoteId
watch(selectedNote, (newNote) => {
  if (newNote) {
    selectedNoteId.value = newNote.id.toString()
  } else {
    selectedNoteId.value = ''
  }
}, { immediate: true })

const formatDate = (dateString: string) => {
  const lang = languageService.getLanguage()
  const locale = lang === 'zh-CN' ? 'zh-CN' : 'en-US'
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchNotes()
  
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
  <div class="flex h-full note-editor-container">
    <!-- 笔记列表 -->
    <div class="w-80 flex flex-col note-list-panel" style="border-right: 1px solid var(--theme-border); background: var(--theme-surface);">
      <!-- 搜索和新建 -->
      <div class="search-new-section">
        <div class="search-input-container">
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="languageService.t('search_notes_placeholder')"
              class="futuristic-input futuristic-input-with-icon w-full"
            >
            <div class="search-icon">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          <button
            @click="isCreating = true"
            class="new-note-btn"
            :title="languageService.t('create_new_note')"
          >
            <svg class="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
        
        <!-- 功能按钮 -->
        <div class="function-buttons-grid">
          <button
            @click="toggleSmartSearch"
            :class="[
              'function-btn',
              showSmartSearch ? 'function-btn-active' : ''
            ]"
          >
            <div class="function-btn-content">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              <span class="function-btn-text">{{ languageService.t('smart_search') }}</span>
            </div>
          </button>
          <button
            @click="showAIPanel = !showAIPanel"
            :class="[
              'function-btn',
              showAIPanel ? 'function-btn-active' : ''
            ]"
          >
            <div class="function-btn-content">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="function-btn-text">{{ languageService.t('ai_helper') }}</span>
            </div>
          </button>
        </div>
      </div>
      
      <!-- 笔记选择器 -->
      <div class="note-selector-container">
        <div class="px-2 py-1">
          <div v-if="isLoading" class="text-center futuristic-subtitle">
            <div class="animate-pulse">{{ languageService.t('loading') }}</div>
          </div>
          
          <div v-else-if="filteredNotes.length === 0" class="text-center futuristic-subtitle">
            {{ searchQuery ? languageService.t('no_matching_notes') : languageService.t('create_first_note') }}
          </div>
          
          <!-- 桌面端笔记列表 -->
          <div class="desktop-note-list space-y-2">
            <div 
              v-for="note in filteredNotes" 
              :key="note.id"
              @click="selectNote(note)"
              :class="[
                'note-item futuristic-card cursor-pointer transition-all duration-300 group',
                selectedNote?.id === note.id ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              ]"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="futuristic-title text-sm font-medium truncate mb-1">
                    {{ note.title || '无标题笔记' }}
                  </h3>
                  <p class="text-xs futuristic-subtitle opacity-70 mb-2">
                    {{ formatDate(note.updated_at) }}
                  </p>
                  <p class="text-xs futuristic-subtitle line-clamp-2 leading-relaxed">
                    {{ (note.content || '').substring(0, 80) }}{{ (note.content || '').length > 80 ? '...' : '' }}
                  </p>
                </div>
                <button
                  @click.stop="deleteNote(note.id)"
                  class="futuristic-btn-danger text-xs px-2 py-1 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  :title="languageService.t('delete_note')"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 移动端下拉选择器 -->
          <div class="mobile-note-selector space-y-2">
            <div class="relative">
              <label class="block text-sm futuristic-subtitle mb-0.5 font-medium">选择笔记</label>
              <select 
                v-model="selectedNoteId"
                @change="onNoteSelect"
                class="futuristic-select w-full"
              >
                <option value="" disabled>请选择一条笔记</option>
                <option 
                  v-for="note in filteredNotes" 
                  :key="note.id" 
                  :value="note.id.toString()"
                >
                  {{ note.title || '无标题笔记' }}
                </option>
              </select>
            </div>
            
            <!-- 当前选中笔记信息 -->
            <div v-if="selectedNote" class="selected-note-info">
              <div class="flex items-center justify-between mb-2">
                <h3 class="futuristic-title text-sm font-medium truncate">{{ selectedNote.title || '无标题笔记' }}</h3>
                <button
                  @click="deleteNote(selectedNote.id)"
                  class="futuristic-btn-danger text-xs px-3 py-2 ml-2 flex-shrink-0"
                  :title="languageService.t('delete_note')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
              <p class="text-xs futuristic-subtitle opacity-70 mb-2">{{ formatDate(selectedNote.updated_at) }}</p>
              <p class="text-xs futuristic-subtitle line-clamp-2 leading-relaxed">
                {{ (selectedNote.content || '').substring(0, 100) }}{{ (selectedNote.content || '').length > 100 ? '...' : '' }}
              </p>
            </div>
          </div>
        </div>
      </div>
      

    </div>
    
    <!-- 智能搜索面板 -->
    <div v-if="showSmartSearch" class="flex-1 flex flex-col smart-search-panel">
      <div class="h-full overflow-y-auto p-6">
        <SmartSearch 
          :auto-focus="true"
          @select-result="handleSearchResult"
          @close="showSmartSearch = false"
        />
      </div>
    </div>
    
    <!-- 编辑器区域 -->
    <div v-else class="flex-1 flex flex-col editor-area">
      <!-- 新建笔记表单 -->
      <div v-if="isCreating" class="p-8 border-b" style="border-color: var(--theme-border); background: var(--theme-card-gradient);">
        <div class="futuristic-header mb-6">
          <h2 class="futuristic-title-medium">{{ languageService.t('create_note') }}</h2>
          <div class="futuristic-subtitle">{{ languageService.t('start_writing_placeholder') }}</div>
        </div>
        <div class="space-y-6">
          <div class="relative">
            <input
              v-model="newNoteTitle"
              type="text"
              :placeholder="languageService.t('note_title_placeholder')"
              class="futuristic-input w-full text-lg"
              @keyup.enter="createNote"
            >
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-40" style="color: var(--theme-text);">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
          </div>
          <div class="relative">
            <textarea
              v-model="newNoteContent"
              :placeholder="languageService.t('start_writing_placeholder')"
              class="futuristic-input w-full h-40 resize-none"
            ></textarea>
          </div>
          <div class="flex space-x-4">
            <button @click="createNote" class="futuristic-btn-primary flex-1 group">
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{{ languageService.t('create_note') }}</span>
              </div>
            </button>
            <button @click="isCreating = false" class="futuristic-btn-danger flex-1 group">
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>{{ languageService.t('cancel') }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 笔记编辑器 -->
      <div v-else-if="selectedNote" class="flex-1 flex">
        <!-- 主编辑区 -->
        <div :class="['flex-1 flex flex-col', showAIPanel ? 'w-2/3' : 'w-full']">
          <div class="p-8 border-b" style="border-color: var(--theme-border); background: var(--theme-card-gradient);">
            <div class="futuristic-header">
              <input
                v-model="selectedNote.title"
                class="futuristic-title-input w-full text-2xl font-bold bg-transparent border-none focus:outline-none"
                :placeholder="languageService.t('untitled_note')"
              >
              <div class="futuristic-meta mt-3">
                <div class="flex items-center space-x-4 text-sm futuristic-subtitle">
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ formatDate(selectedNote.updated_at) }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>{{ (selectedNote.content || '').length }} {{ languageService.t('characters') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex-1 p-8">
            <div class="futuristic-editor-container h-full">
              <textarea
                v-model="selectedNote.content"
                @mouseup="handleTextSelection"
                @keyup="handleTextSelection"
                class="futuristic-textarea w-full h-full resize-none text-base leading-relaxed"
                :placeholder="languageService.t('start_writing_placeholder')"
              ></textarea>
            </div>
          </div>
        </div>
        
        <!-- AI助手面板 -->
        <div v-if="showAIPanel" class="w-1/3 overflow-y-auto" style="border-left: 1px solid var(--theme-border); background: var(--theme-surface);">
          <AIEnhancedEditor 
            :current-note="selectedNote"
            :selected-text="selectedText"
            @update-content="updateNoteContent"
            @add-todos="addTodosToNote"
          />
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="futuristic-empty-state text-center">
          <div class="futuristic-icon-container mb-8">
            <svg class="w-24 h-24 mx-auto opacity-40 animate-pulse" style="color: var(--theme-text);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </div>
          <h2 class="futuristic-title-medium mb-4">{{ languageService.t('start_your_creation') }}</h2>
          <p class="futuristic-subtitle mb-8">{{ languageService.t('select_note_or_create_new') }}</p>
          <button @click="isCreating = true" class="futuristic-btn-primary group">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>{{ languageService.t('create_note') }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

/* 桌面端和移动端显示控制 */
.note-editor-container .desktop-note-list {
  display: block !important;
}

.note-editor-container .mobile-note-selector {
  display: none !important;
}

/* 移动端响应式设计 - 使用多重条件确保移动端检测 */
@media (max-width: 768px), (hover: none) and (pointer: coarse), (max-device-width: 768px) {
  /* 移动端显示控制 */
  .note-editor-container .desktop-note-list {
    display: none !important;
  }
  
  .note-editor-container .mobile-note-selector {
    display: block !important;
  }
  
  .note-editor-container {
    flex-direction: column;
    height: 100vh;
    position: relative;
  }
  
  /* 笔记选择器面板优化 */
  .note-list-panel {
    width: 100%;
    height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--theme-border);
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
    position: relative;
    transition: height 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
  }
  
  /* 搜索和新建区域移动端优化 */
  .search-new-section {
    padding: 1rem;
  }
  
  .search-input-container {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .function-buttons-grid {
    gap: 0.5rem;
  }
  
  .function-btn {
    padding: 0.625rem;
    min-height: 40px;
  }
  
  .function-btn-text {
    font-size: 0.7rem;
  }
  
  .new-note-btn {
    min-width: 40px;
    height: 40px;
    padding: 0.625rem;
  }
  
  .note-list-panel .p-4 {
    padding: 1rem;
  }
  
  /* 移动端下拉选择器优化 */
  .note-list-panel .futuristic-select {
    font-size: 0.8rem;
    padding: 0.625rem 0.75rem;
    padding-right: 2.25rem;
    min-height: 40px;
  }
  
  .note-list-panel .futuristic-card {
    margin-top: 0.75rem;
    padding: 0.75rem;
  }
  
  /* 搜索和新建按钮区域 */
  .note-list-panel .flex.space-x-3 {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .note-list-panel .flex.space-x-3 .relative {
    order: 1;
  }
  
  .note-list-panel .flex.space-x-3 button {
    order: 2;
    width: 100%;
  }
  
  /* 功能按钮网格调整 */
  .grid-cols-1 {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  /* 编辑器区域优化 */
  .editor-area {
    width: 100%;
    height: 50vh;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  
  .editor-area .p-8 {
    padding: 1rem;
  }
  
  /* 新建笔记表单移动端优化 */
  .editor-area .space-y-6 {
    gap: 1rem;
  }
  
  .editor-area .h-40 {
    height: 6rem;
    min-height: 6rem;
  }
  
  /* 笔记编辑器移动端优化 */
  .editor-area .flex {
    flex-direction: column;
  }
  
  .editor-area .w-2\/3,
  .editor-area .w-1\/3 {
    width: 100%;
  }
  
  /* AI助手面板在移动端调整 */
  .editor-area .w-1\/3 {
    max-height: 25vh;
    border-left: none;
    border-top: 1px solid var(--theme-border);
    margin-top: 1rem;
  }
  
  /* 笔记卡片间距调整 */
  .futuristic-card {
    margin-bottom: 0.75rem;
    padding: 0.75rem;
  }
  
  /* 文本区域调整 */
  .futuristic-textarea {
    font-size: 0.9rem;
    line-height: 1.5;
    min-height: 120px;
  }
  
  /* 笔记项点击区域优化 */
  .note-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    touch-action: manipulation;
  }
  
  /* 按钮组优化 */
  .button-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* 输入框优化 */
  .futuristic-input {
    font-size: 1rem;
    padding: 0.875rem;
  }
}

@media (max-width: 480px), (max-device-width: 480px) {
  /* 小屏幕显示控制 */
  .note-editor-container .desktop-note-list {
    display: none !important;
  }
  
  .note-editor-container .mobile-note-selector {
    display: block !important;
  }
  
  .note-list-panel {
    height: 40vh;
  }
  
  .editor-area {
    height: 60vh;
    min-height: 60vh;
  }
  
  .mobile-note-list .p-6,
  .editor-area .p-8 {
    padding: 0.75rem;
  }
  
  /* 更小的按钮和输入框 */
  .futuristic-input {
    font-size: 0.9rem;
    padding: 0.75rem;
  }
  
  .futuristic-btn-primary,
  .futuristic-btn-secondary {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
  
  /* 笔记标题调整 */
  .futuristic-title-input {
    font-size: 1.25rem;
  }
  
  /* 功能按钮单列显示 */
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  /* AI助手面板在小屏幕上隐藏 */
  .editor-area .w-1\/3 {
    display: none;
  }


}

/* 笔记选择器容器 */
.note-selector-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 笔记卡片样式 */
.note-item {
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  background: var(--theme-card-gradient);
  transition: all 0.3s ease;
  position: relative;
  group: true;
}

.note-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--theme-shadow);
  border-color: var(--theme-accent);
}

.note-item:hover .futuristic-btn-danger {
  opacity: 1;
}

.note-item.ring-2 {
  border-color: var(--theme-accent);
  background: var(--theme-accent-alpha);
}

/* 选中笔记信息卡片 */
.selected-note-info {
  background: var(--theme-card-gradient);
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

/* 下拉选择器样式 */
.futuristic-select {
  background: var(--theme-card-gradient);
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--theme-text);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ff8c00' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem;
  min-height: 44px;
}

.futuristic-select:focus {
  outline: none;
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 3px var(--theme-accent-alpha);
  transform: translateY(-1px);
}

.futuristic-select:hover {
  border-color: var(--theme-accent);
  background: var(--theme-surface);
  transform: translateY(-1px);
}

.futuristic-select option {
  background: var(--theme-surface);
  color: var(--theme-text);
  padding: 0.75rem;
  font-size: 0.875rem;
}

/* 搜索和新建区域样式 */
  .search-new-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--theme-border);
    background: var(--theme-card-gradient);
    flex-shrink: 0;
  }
  
  .search-input-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.6;
    color: var(--theme-text);
    pointer-events: none;
  }
  
  .new-note-btn {
    background: var(--theme-accent);
    border: 1px solid var(--theme-accent);
    border-radius: 8px;
    padding: 0.75rem;
    color: white;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    flex-shrink: 0;
  }
  
  .new-note-btn:hover {
    background: var(--theme-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--theme-accent-alpha);
  }
  
  /* 功能按钮网格 */
  .function-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .function-btn {
    background: var(--theme-card-gradient);
    border: 1px solid var(--theme-border);
    border-radius: 8px;
    padding: 0.75rem;
    color: var(--theme-text);
    transition: all 0.3s ease;
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .function-btn:hover {
    border-color: var(--theme-accent);
    background: var(--theme-surface);
    transform: translateY(-1px);
  }
  
  .function-btn-active {
    background: var(--theme-accent-alpha);
    border-color: var(--theme-accent);
    color: var(--theme-accent);
  }
  
  .function-btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .function-btn-text {
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
  }

  /* 工具类样式 */
   .mb-0\.5 {
  margin-bottom: 0.125rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .flex-shrink-0 {
    flex-shrink: 0;
  }
  
  .leading-relaxed {
    line-height: 1.625;
  }

/* 强制移动端布局 - 针对所有可能的移动设备 */
@media screen and (max-width: 1024px) and (orientation: portrait),
       screen and (max-width: 1366px) and (orientation: landscape) and (max-height: 1024px),
       (hover: none) and (pointer: coarse) {
  .note-editor-container .desktop-note-list {
    display: none !important;
  }
  
  .note-editor-container .mobile-note-selector {
    display: block !important;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .futuristic-card {
    padding: 1rem;
  }
  
  .futuristic-btn-primary,
  .futuristic-btn-secondary,
  .futuristic-btn-danger {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 删除按钮触摸优化 */
  .futuristic-btn-danger {
    opacity: 1;
    padding: 0.5rem;
  }
  
  .futuristic-select {
    font-size: 16px; /* 防止iOS缩放 */
    min-height: 44px; /* 触摸友好的最小高度 */
  }
  
  .selected-note-info {
    padding: 0.875rem;
  }
}
</style>