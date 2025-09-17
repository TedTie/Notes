<template>
  <div class="ai-assistant-page">
    <!-- 动态背景 -->
    <div class="dynamic-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="floating-particles">
        <div v-for="i in 20" :key="i" class="particle" :style="{ 
          '--delay': Math.random() * 10 + 's',
          '--duration': (Math.random() * 20 + 10) + 's',
          '--x': Math.random() * 100 + '%',
          '--y': Math.random() * 100 + '%'
        }"></div>
      </div>
    </div>
    <!-- 左侧话题管理面板 -->
    <div class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <div class="flex items-center justify-between">
          <h2 v-if="!sidebarCollapsed" class="text-lg font-bold text-white">对话话题</h2>
          <button @click="toggleSidebar" class="sidebar-toggle-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    :d="sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"></path>
            </svg>
          </button>
        </div>
        
        <!-- 新建话题按钮 -->
        <button v-if="!sidebarCollapsed" @click="createNewTopic" class="new-topic-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          新建对话
        </button>
      </div>
      
      <!-- 话题列表 -->
      <div class="topics-list" v-if="!sidebarCollapsed">
        <!-- 操作工具栏 -->
        <div class="topics-toolbar" v-if="topics.length > 0">
          <div class="toolbar-left">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="checkbox"
              >
              <span class="checkmark"></span>
              <span class="checkbox-label">全选</span>
            </label>
            <span class="selected-count" v-if="hasSelectedTopics">
              已选择 {{ selectedTopics.size }} 个话题
            </span>
          </div>
          <div class="toolbar-right">
            <button 
              v-if="hasSelectedTopics" 
              @click="deleteSelectedTopics" 
              class="batch-action-btn danger"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              删除选中
            </button>
            <button @click="clearAllTopics" class="batch-action-btn danger">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              清空全部
            </button>
          </div>
        </div>

        <!-- 话题项列表 -->
        <div class="topics-container">
          <div 
            v-for="topic in paginatedTopics" 
            :key="topic.id"
            :class="['topic-item', 'group', { 
              'active': currentTopicId === topic.id,
              'selected': selectedTopics.has(topic.id)
            }]"
          >
            <div class="topic-checkbox">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  :checked="selectedTopics.has(topic.id)"
                  @change="toggleTopicSelection(topic.id)"
                  @click.stop
                  class="checkbox"
                >
                <span class="checkmark"></span>
              </label>
            </div>
            <div class="topic-content" @click="selectTopic(topic.id)">
              <h3 class="topic-title">{{ topic.title }}</h3>
              <p class="topic-preview">{{ topic.lastMessage || '暂无消息' }}</p>
              <span class="topic-time">{{ formatTime(topic.updatedAt) }}</span>
            </div>
            <div class="topic-actions">
              <button @click.stop="renameTopic(topic.id)" class="action-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button @click.stop="deleteTopic(topic.id)" class="action-btn danger">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 分页组件 -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <div class="pagination-info">
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <span class="total-info">共 {{ topics.length }} 个话题</span>
          </div>
          
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="topics.length === 0" class="empty-state">
          <div class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p class="text-gray-400 text-sm">还没有对话话题</p>
            <p class="text-gray-500 text-xs mt-1">点击"新建对话"开始</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 主要对话区域 -->
    <div class="main-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold text-white">AI 助手</h1>
            <span v-if="currentTopic" class="text-gray-400 text-sm">{{ currentTopic.title }}</span>
          </div>
          
          <!-- 模型选择器 -->
          <div class="model-selector">
            <select v-model="selectedModel" class="model-select">
              <option v-for="model in availableModels" :key="model.id" :value="model.id">
                {{ model.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="!currentTopic" class="welcome-message">
          <div class="text-center py-16">
            <svg class="w-24 h-24 mb-6 text-cyber-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>
            <h2 class="text-2xl font-bold text-white mb-4">欢迎使用 AI 助手</h2>
            <p class="text-gray-400 mb-8">选择一个话题开始对话，或创建新的对话话题</p>
            
            <!-- 示例问题 -->
            <div class="example-questions">
              <h3 class="text-lg font-semibold text-white mb-4">试试这些问题：</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button 
                  v-for="example in exampleQuestions" 
                  :key="example.id"
                  @click="useExampleQuestion(example.question)"
                  class="example-question-btn"
                >
                  <div class="text-left">
                    <div class="font-medium text-white mb-1">{{ example.title }}</div>
                    <div class="text-sm text-gray-400">{{ example.question }}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="messages-list">
          <div 
            v-for="message in currentMessages" 
            :key="message.id"
            :class="['message-item', message.role === 'user' ? 'user-message' : 'assistant-message']"
          >
            <div class="message-avatar">
              <div v-if="message.role === 'user'" class="user-avatar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div v-else class="assistant-avatar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
            </div>
            
            <div class="message-content">
              <div class="message-bubble">
                <p class="message-text">{{ message.content }}</p>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 加载指示器 -->
          <div v-if="isLoading" class="message-item assistant-message">
            <div class="message-avatar">
              <div class="assistant-avatar">
                <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble loading">
                <div class="typing-indicator">
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <textarea 
            v-model="currentMessage"
            @keydown="handleKeyDown"
            :disabled="isLoading"
            placeholder="输入您的问题或指令..."
            class="message-input"
            rows="1"
            ref="messageInput"
          ></textarea>
          <button @click="sendMessage" class="send-btn" :disabled="!currentMessage.trim() || isLoading">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import aiService from '../services/aiService'
import TimeUtils from '../utils/timeUtils'

// 定义事件
defineEmits(['close'])

// 接口定义
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Topic {
  id: string
  title: string
  description?: string
  lastMessage?: string
  updatedAt: Date
  messages: Message[]
}

interface AIModel {
  id: string
  name: string
  provider: string
}

interface ExampleQuestion {
  id: string
  title: string
  question: string
}

// 响应式数据
const sidebarCollapsed = ref(false)
const currentTopicId = ref<string | null>(null)
const topics = ref<Topic[]>([])
const currentMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('openai/gpt-5-chat')
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(10)
const selectedTopics = ref<Set<string>>(new Set())

// AI模型选项
const availableModels: AIModel[] = [
  { id: 'openai/gpt-5-chat', name: 'GPT-5', provider: 'openrouter' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'openrouter' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini Pro Preview 2.5', provider: 'openrouter' },
  { id: 'deepseek/deepseek-chat-v3.1:free', name: 'Deepseek V3.1', provider: 'openrouter' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'Deepseek R1', provider: 'openrouter' }
]

// 示例问题
const exampleQuestions: ExampleQuestion[] = [
  {
    id: '1',
    title: '笔记管理',
    question: '请帮我创建一个关于项目规划的笔记'
  },
  {
    id: '2',
    title: '待办事项',
    question: '请帮我列出所有待办事项'
  },
  {
    id: '3',
    title: '文件操作',
    question: '请帮我查看当前目录的文件'
  },
  {
    id: '4',
    title: '代码助手',
    question: '请帮我解释这段代码的功能'
  }
]

// 分页计算属性
const totalPages = computed(() => Math.ceil(topics.value.length / pageSize.value))
const paginatedTopics = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return topics.value.slice(start, end)
})

// 选择相关计算属性
const hasSelectedTopics = computed(() => selectedTopics.value.size > 0)
const isAllSelected = computed(() => {
  return paginatedTopics.value.length > 0 && 
         paginatedTopics.value.every(topic => selectedTopics.value.has(topic.id))
})

// 计算属性
const currentTopic = computed(() => {
  return topics.value.find(topic => topic.id === currentTopicId.value)
})

const currentMessages = computed(() => {
  return currentTopic.value?.messages || []
})

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const createNewTopic = async () => {
  const newTopic: Topic = {
    id: Date.now().toString(),
    title: '新对话',
    updatedAt: TimeUtils.now(),
    messages: []
  }
  
  topics.value.unshift(newTopic)
  currentTopicId.value = newTopic.id
  
  // 保存到后端
  await saveTopic(newTopic)
  
  // 自动聚焦到输入框
  await nextTick()
  messageInput.value?.focus()
}

const selectTopic = (topicId: string) => {
  currentTopicId.value = topicId
  scrollToBottom()
}

const renameTopic = async (topicId: string) => {
  const topic = topics.value.find(t => t.id === topicId)
  if (!topic) return
  
  const newTitle = prompt('请输入新的话题名称:', topic.title)
  if (newTitle && newTitle.trim()) {
    topic.title = newTitle.trim()
    topic.updatedAt = TimeUtils.now()
    await saveTopic(topic)
  }
}

const deleteTopic = async (topicId: string) => {
  if (confirm('确定要删除这个话题吗？')) {
    await removeTopicFromBackend(topicId)
    topics.value = topics.value.filter(t => t.id !== topicId)
    localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
    
    if (currentTopicId.value === topicId) {
      currentTopicId.value = topics.value.length > 0 ? topics.value[0].id : null
    }
  }
}

const useExampleQuestion = async (question: string) => {
  if (!currentTopic.value) {
    await createNewTopic()
  }
  currentMessage.value = question
  await nextTick()
  sendMessage()
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isLoading.value) return
  
  if (!currentTopic.value) {
    await createNewTopic()
  }
  
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: currentMessage.value.trim(),
    timestamp: TimeUtils.now()
  }
  
  currentTopic.value!.messages.push(userMessage)
  currentTopic.value!.lastMessage = userMessage.content
  currentTopic.value!.updatedAt = TimeUtils.now()
  
  await saveTopic(currentTopic.value!)
  
  const messageContent = currentMessage.value.trim()
  currentMessage.value = ''
  
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
  }
  
  isLoading.value = true
  scrollToBottom()
  
  try {
    if (currentTopic.value!.messages.length === 1) {
      await autoNameTopic(currentTopic.value!.id, messageContent)
    }
    
    const response = await aiService.sendMessage(messageContent, selectedModel.value)
    
    if (response.success) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: TimeUtils.now()
      }
      
      currentTopic.value!.messages.push(assistantMessage)
      currentTopic.value!.lastMessage = response.message
      currentTopic.value!.updatedAt = TimeUtils.now()
      
      await saveTopic(currentTopic.value!)
    } else {
      throw new Error(response.error || '发送消息失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    const errorMessage: Message = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content: '抱歉，发送消息时出现错误，请稍后重试。',
      timestamp: TimeUtils.now()
    }
    currentTopic.value!.messages.push(errorMessage)
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const autoNameTopic = async (topicId: string, firstMessage: string) => {
  try {
    const response = await aiService.generateTopicName(firstMessage)
    if (response.success && response.topicName) {
      const topic = topics.value.find(t => t.id === topicId)
      if (topic) {
        topic.title = response.topicName
      }
    }
  } catch (error) {
    console.error('自动命名话题失败:', error)
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
  
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.style.height = 'auto'
      messageInput.value.style.height = messageInput.value.scrollHeight + 'px'
    }
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatTime = (date: Date | string | number) => {
  const now = TimeUtils.now()
  const dateObj = new Date(date)
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return dateObj.toLocaleDateString()
}

// 分页相关方法
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    selectedTopics.value.clear()
  }
}

// 选择相关方法
const toggleTopicSelection = (topicId: string) => {
  if (selectedTopics.value.has(topicId)) {
    selectedTopics.value.delete(topicId)
  } else {
    selectedTopics.value.add(topicId)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedTopics.value.forEach(topic => {
      selectedTopics.value.delete(topic.id)
    })
  } else {
    paginatedTopics.value.forEach(topic => {
      selectedTopics.value.add(topic.id)
    })
  }
}

// 批量删除选中的话题
const deleteSelectedTopics = async () => {
  if (selectedTopics.value.size === 0) return
  
  if (!confirm(`确定要删除选中的 ${selectedTopics.value.size} 个话题吗？此操作不可撤销。`)) {
    return
  }
  
  const topicsToDelete = Array.from(selectedTopics.value)
  
  for (const topicId of topicsToDelete) {
    await removeTopicFromBackend(topicId)
    const index = topics.value.findIndex(t => t.id === topicId)
    if (index !== -1) {
      topics.value.splice(index, 1)
    }
    if (currentTopicId.value === topicId) {
      currentTopicId.value = null
    }
  }
  
  selectedTopics.value.clear()
  
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value
  }
  
  localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
}

// 清空所有话题
const clearAllTopics = async () => {
  if (topics.value.length === 0) return
  
  if (!confirm(`确定要清空所有 ${topics.value.length} 个话题吗？此操作不可撤销。`)) {
    return
  }
  
  for (const topic of topics.value) {
    await removeTopicFromBackend(topic.id)
  }
  
  topics.value = []
  selectedTopics.value.clear()
  currentTopicId.value = null
  currentPage.value = 1
  
  localStorage.setItem('ai-assistant-topics', JSON.stringify([]))
}

// 获取话题列表
const loadTopics = async () => {
  try {
    const response = await aiService.getTopics()
    if (response.success) {
      topics.value = response.topics || []
      localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
    } else {
      console.error('加载话题失败:', response.error)
      const savedTopics = localStorage.getItem('ai-assistant-topics')
      if (savedTopics) {
        topics.value = JSON.parse(savedTopics)
      }
    }
  } catch (error) {
    console.error('加载话题失败:', error)
    const savedTopics = localStorage.getItem('ai-assistant-topics')
    if (savedTopics) {
      topics.value = JSON.parse(savedTopics)
    }
  }
}

// 保存话题到后端
const saveTopic = async (topic: Topic) => {
  try {
    let response
    if (topic.id && topics.value.find(t => t.id === topic.id)) {
      response = await aiService.updateTopic(topic.id, topic)
    } else {
      response = await aiService.createTopic(topic)
      if (response.success && response.topic) {
        topic.id = response.topic.id
      }
    }
    
    if (!response.success) {
      console.error('保存话题失败:', response.error)
      localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
      return response
    }
    
    return response
  } catch (error) {
    console.error('保存话题失败:', error)
    localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
    return { success: false, error: error.message || '保存话题失败' }
  }
}

// 删除话题从后端
const removeTopicFromBackend = async (topicId: string) => {
  try {
    const response = await aiService.deleteTopic(topicId)
    if (!response.success) {
      console.error('删除话题失败:', response.error)
    }
  } catch (error) {
    console.error('删除话题失败:', error)
  }
}

// 监听当前话题变化，滚动到底部
watch(currentTopicId, () => {
  scrollToBottom()
})

// 监听话题数量变化，调整分页
watch(() => topics.value.length, () => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value
  }
})

// 组件挂载
onMounted(async () => {
  await loadTopics()
})
</script>

<style scoped>
.ai-assistant-page {
  @apply flex h-screen text-white relative;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%, 
    rgba(15, 23, 42, 0.95) 100%);
  backdrop-filter: blur(20px);
  z-index: 10;
}

/* 侧边栏样式 */
.sidebar {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 
    0 0 30px rgba(168, 85, 247, 0.1),
    inset 0 0 20px rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 320px;
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.1) 0%, 
    rgba(6, 182, 212, 0.1) 100%);
  border-radius: 0;
  pointer-events: none;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  @apply p-4;
  border-bottom: 1px solid rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
  position: relative;
  z-index: 1;
}

.sidebar-toggle-btn {
  @apply p-2 text-gray-300 rounded-lg transition-all duration-300;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.sidebar-toggle-btn:hover {
  @apply text-white;
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
  transform: scale(1.05);
}

.new-topic-btn {
  @apply w-full mt-3 px-4 py-2 text-white rounded-lg flex items-center justify-center space-x-2 transition-all duration-300;
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.8) 0%, 
    rgba(6, 182, 212, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 15px rgba(168, 85, 247, 0.3),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.new-topic-btn:hover {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 1) 0%, 
    rgba(6, 182, 212, 1) 100%);
  box-shadow: 
    0 6px 25px rgba(168, 85, 247, 0.5),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.topics-list {
  @apply flex-1 overflow-y-auto p-2;
  position: relative;
  z-index: 1;
}

/* 话题工具栏样式 */
.topics-toolbar {
  @apply flex items-center justify-between p-3;
  border-bottom: 1px solid rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
  backdrop-filter: blur(10px);
}

.toolbar-left {
  @apply flex items-center space-x-3;
}

.toolbar-right {
  @apply flex items-center space-x-2;
}

.selected-count {
  @apply text-sm font-medium;
  color: rgba(168, 85, 247, 1);
  text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}

.batch-action-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.batch-action-btn:hover {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
  transform: translateY(-1px);
}

.batch-action-btn.danger {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
  color: rgba(248, 113, 113, 1);
}

.batch-action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
}

/* 复选框样式 */
.checkbox-container {
  @apply flex items-center space-x-2 cursor-pointer;
}

.checkbox {
  @apply sr-only;
}

.checkmark {
  @apply w-4 h-4 rounded flex items-center justify-center transition-all duration-300;
  border: 2px solid rgba(168, 85, 247, 0.5);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.checkmark:hover {
  border-color: rgba(168, 85, 247, 0.8);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
}

.checkbox:checked + .checkmark {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.9) 0%, 
    rgba(6, 182, 212, 0.9) 100%);
  border-color: rgba(168, 85, 247, 1);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
}

.checkbox:checked + .checkmark::after {
  content: '✓';
  @apply text-white text-xs font-bold;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
}

.checkbox-label {
  @apply text-sm text-gray-300;
}

/* 话题项样式 */
.topics-container {
  @apply flex-1 overflow-y-auto;
}

.topic-item {
  @apply relative flex items-center p-3 cursor-pointer transition-all duration-300;
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid transparent;
  border-radius: 8px;
  margin: 4px 8px;
  backdrop-filter: blur(10px);
}

.topic-item:hover {
  background: rgba(168, 85, 247, 0.1);
  border-left-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2);
  transform: translateX(4px);
}

.topic-item.active {
  background: rgba(168, 85, 247, 0.2);
  border-left-color: rgba(168, 85, 247, 1);
  box-shadow: 
    0 0 20px rgba(168, 85, 247, 0.3),
    inset 0 0 20px rgba(168, 85, 247, 0.1);
}

.topic-item.selected {
  background: rgba(6, 182, 212, 0.2);
  border-left-color: rgba(6, 182, 212, 1);
  box-shadow: 
    0 0 20px rgba(6, 182, 212, 0.3),
    inset 0 0 20px rgba(6, 182, 212, 0.1);
}

.topic-checkbox {
  @apply flex-shrink-0 mr-3;
}

.topic-content {
  @apply flex-1 min-w-0 pr-12;
}

.topic-title {
  @apply font-medium text-sm text-white truncate;
}

.topic-preview {
  @apply text-xs text-gray-400 mt-1 truncate;
}

.topic-time {
  @apply text-xs text-gray-500 mt-1;
}

.topic-actions {
  @apply absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity;
}

.action-btn {
  @apply p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors;
}

.action-btn.danger {
  @apply hover:text-red-400 hover:bg-red-900/20;
}

/* 分页样式 */
.pagination {
  @apply flex items-center justify-between p-3;
  border-top: 1px solid rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
  backdrop-filter: blur(10px);
}

.pagination-btn {
  @apply p-2 rounded-lg transition-all duration-300;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.pagination-btn:hover:not(:disabled) {
  @apply text-white;
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
  transform: scale(1.05);
}

.pagination-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.pagination-info {
  @apply flex flex-col items-center space-y-1;
}

.page-info {
  @apply text-sm font-medium text-white;
  text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}

.total-info {
  @apply text-xs;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state {
  @apply text-center py-8;
}

/* 主内容区域 */
.main-content {
  @apply flex-1 flex flex-col;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(20px);
}

.toolbar {
  @apply p-4;
  border-bottom: 1px solid rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
  backdrop-filter: blur(20px);
}

.model-selector {
  @apply flex items-center space-x-2;
}

.model-select {
  @apply text-white px-3 py-1 rounded-lg text-sm transition-all duration-300;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  backdrop-filter: blur(10px);
}

.model-select:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.8);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
}

/* 消息区域 */
.messages-container {
  @apply flex-1 overflow-y-auto p-4;
  background: rgba(15, 23, 42, 0.2);
}

.welcome-message {
  @apply h-full flex items-center justify-center;
}

.example-questions {
  @apply mt-8;
}

.example-question-btn {
  @apply p-4 rounded-lg text-left transition-all duration-300;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.2);
  backdrop-filter: blur(10px);
}

.example-question-btn:hover {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2);
  transform: translateY(-2px);
}

.messages-list {
  @apply space-y-4;
}

.message-item {
  @apply flex space-x-3;
}

.message-item.user-message {
  @apply flex-row-reverse space-x-reverse;
}

.message-avatar {
  @apply flex-shrink-0;
}

.user-avatar {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
  background: linear-gradient(135deg, 
    rgba(6, 182, 212, 0.9) 0%, 
    rgba(168, 85, 247, 0.9) 100%);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
  backdrop-filter: blur(10px);
}

.assistant-avatar {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.9) 0%, 
    rgba(6, 182, 212, 0.9) 100%);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
  backdrop-filter: blur(10px);
}

.message-content {
  @apply flex-1 min-w-0;
}

.message-bubble {
  @apply max-w-xs lg:max-w-md px-4 py-2 rounded-lg;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-message .message-bubble {
  @apply text-white ml-auto;
  background: linear-gradient(135deg, 
    rgba(6, 182, 212, 0.8) 0%, 
    rgba(168, 85, 247, 0.8) 100%);
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2);
}

.assistant-message .message-bubble {
  @apply text-white;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.1);
}

.message-bubble.loading {
  background: rgba(255, 255, 255, 0.1);
}

.message-text {
  @apply text-sm whitespace-pre-wrap;
}

.message-time {
  @apply text-xs opacity-70 mt-1 block;
}

.typing-indicator {
  @apply flex space-x-1;
}

.typing-dot {
  @apply w-2 h-2 bg-gray-400 rounded-full animate-bounce;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.1s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.2s;
}

/* 输入区域 */
.input-area {
  @apply p-4;
  border-top: 1px solid rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
  backdrop-filter: blur(20px);
}

.input-container {
  @apply flex items-end space-x-3;
}

.message-input {
  @apply flex-1 text-white px-4 py-3 rounded-lg resize-none min-h-[48px] max-h-32 transition-all duration-300;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  backdrop-filter: blur(10px);
}

.message-input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.8);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  @apply p-3 text-white rounded-lg transition-all duration-300;
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.8) 0%, 
    rgba(6, 182, 212, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 15px rgba(168, 85, 247, 0.3),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 1) 0%, 
    rgba(6, 182, 212, 1) 100%);
  box-shadow: 
    0 6px 25px rgba(168, 85, 247, 0.5),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.send-btn:disabled {
  @apply cursor-not-allowed opacity-50;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

/* 滚动条样式 */
.topics-list::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.topics-list::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.topics-list::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.6) 0%, 
    rgba(6, 182, 212, 0.6) 100%);
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
}

.topics-list::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.8) 0%, 
    rgba(6, 182, 212, 0.8) 100%);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
}

/* 动态背景样式 */
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(168, 85, 247, 0.2) 70%, transparent 100%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.6) 0%, rgba(6, 182, 212, 0.1) 70%, transparent 100%);
  top: 60%;
  right: 10%;
  animation-delay: -7s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, rgba(236, 72, 153, 0.2) 70%, transparent 100%);
  bottom: 20%;
  left: 30%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  25% {
    transform: translate(30px, -50px) rotate(90deg) scale(1.1);
  }
  50% {
    transform: translate(-20px, -30px) rotate(180deg) scale(0.9);
  }
  75% {
    transform: translate(-40px, 20px) rotate(270deg) scale(1.05);
  }
}

.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, rgba(168, 85, 247, 0.8), rgba(6, 182, 212, 0.8));
  border-radius: 50%;
  animation: particle-float var(--duration) linear infinite;
  animation-delay: var(--delay);
  left: var(--x);
  top: var(--y);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}

@keyframes particle-float {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

/* 增强现有元素的视觉效果 */
.ai-assistant-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* 为侧边栏和主内容添加更强的玻璃效果 */
.sidebar {
  backdrop-filter: blur(25px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(168, 85, 247, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.main-content {
  backdrop-filter: blur(20px) saturate(150%);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

/* 增强按钮和交互元素的发光效果 */
.new-topic-btn:hover {
  box-shadow: 
    0 0 30px rgba(168, 85, 247, 0.6),
    0 0 60px rgba(6, 182, 212, 0.3),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
}

.send-btn:hover:not(:disabled) {
  box-shadow: 
    0 0 25px rgba(168, 85, 247, 0.7),
    0 0 50px rgba(6, 182, 212, 0.4),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
}

.topic-item.active {
  box-shadow: 
    0 0 25px rgba(168, 85, 247, 0.4),
    0 0 50px rgba(168, 85, 247, 0.2),
    inset 0 0 20px rgba(168, 85, 247, 0.1);
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .ai-assistant-page {
    flex-direction: column;
    height: 100vh;
  }
  
  /* 侧边栏移动端优化 */
  .sidebar {
    width: 100%;
    height: 40vh;
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* 侧边栏头部优化 */
  .sidebar-header {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .sidebar-header h2 {
    font-size: 1.25rem;
    text-align: center;
  }
  
  /* 新建话题按钮优化 */
  .new-topic-btn {
    width: 100%;
    padding: 0.875rem;
    font-size: 0.9rem;
  }
  
  /* 话题工具栏优化 */
  .topics-toolbar {
    padding: 0.75rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
  
  /* 话题列表优化 */
  .topics-list {
    padding: 0.5rem;
    max-height: calc(40vh - 120px);
  }
  
  .topic-item {
    margin: 2px 4px;
    padding: 0.75rem;
  }
  
  .topic-title {
    font-size: 0.875rem;
  }
  
  .topic-preview {
    font-size: 0.75rem;
  }
  
  /* 分页优化 */
  .pagination {
    padding: 0.75rem;
  }
  
  .pagination-btn {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  /* 主内容区域优化 */
  .main-content {
    width: 100%;
    height: 60vh;
    flex: 1;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* 聊天头部优化 */
  .chat-header {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .model-selector {
    width: 100%;
    padding: 0.75rem;
  }
  
  /* 消息容器优化 */
  .messages-container {
    height: calc(60vh - 140px);
    padding: 0.75rem;
    -webkit-overflow-scrolling: touch;
  }
  
  /* 消息气泡优化 */
  .message {
    margin-bottom: 1rem;
    max-width: 95%;
  }
  
  .message.user {
    margin-left: 5%;
  }
  
  .message.assistant {
    margin-right: 5%;
  }
  
  .message-content {
    padding: 0.875rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  /* 输入区域优化 */
  .input-area {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .message-input {
    min-height: 44px;
    max-height: 120px;
    padding: 0.875rem;
    font-size: 1rem;
  }
  
  .send-btn {
    padding: 0.875rem;
    min-width: 44px;
    min-height: 44px;
  }
  
  /* 示例问题优化 */
  .example-questions {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .example-question {
    padding: 0.75rem;
    font-size: 0.875rem;
    text-align: center;
  }
  
  /* 批量操作按钮优化 */
  .batch-action-btn {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  /* 复选框优化 */
  .checkmark {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  /* 动态背景优化 */
  .gradient-orb {
    filter: blur(40px);
    opacity: 0.4;
  }
  
  .orb-1 {
    width: 200px;
    height: 200px;
  }
  
  .orb-2 {
    width: 250px;
    height: 250px;
  }
  
  .orb-3 {
    width: 150px;
    height: 150px;
  }
  
  /* 触摸设备优化 */
  .topic-item,
  .message,
  .example-question,
  .batch-action-btn,
  .new-topic-btn,
  .send-btn {
    touch-action: manipulation;
  }
  
  /* 移除hover效果在移动端 */
  .topic-item:hover {
    transform: none;
  }
  
  .new-topic-btn:hover,
  .send-btn:hover:not(:disabled),
  .batch-action-btn:hover {
    transform: none;
  }
}

/* 小屏幕设备进一步优化 */
@media (max-width: 480px) {
  .sidebar {
    height: 35vh;
    max-height: 35vh;
  }
  
  .main-content {
    height: 65vh;
  }
  
  .sidebar-header {
    padding: 0.75rem;
  }
  
  .sidebar-header h2 {
    font-size: 1.125rem;
  }
  
  .topics-toolbar {
    padding: 0.5rem;
  }
  
  .topic-item {
    padding: 0.625rem;
  }
  
  .topic-title {
    font-size: 0.8125rem;
  }
  
  .topic-preview {
    font-size: 0.6875rem;
  }
  
  .messages-container {
    height: calc(65vh - 120px);
    padding: 0.5rem;
  }
  
  .message-content {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
  
  .input-area {
    padding: 0.75rem;
  }
  
  .message-input {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
  
  .example-questions {
    padding: 0.5rem;
  }
  
  .example-question {
    padding: 0.625rem;
    font-size: 0.8125rem;
  }
}
</style>