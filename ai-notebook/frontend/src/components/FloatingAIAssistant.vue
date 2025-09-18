<template>
  <div class="floating-ai-assistant">
    <!-- AI助手浮动球 -->
    <Transition name="ball">
      <div 
        v-if="!isExpanded"
        ref="floatingBall"
        class="ai-floating-ball"
        :class="{ 'dragging': isDragging }"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
        @mousedown="startDrag"
        @click="togglePanel"
        @touchstart="startDrag"
        @touchend="handleTouchEnd"
      >
      <!-- 外层光环 -->
      <div class="outer-ring animate-pulse-ring"></div>
      <div class="outer-ring animate-pulse-ring" style="animation-delay: 0.5s;"></div>
      
      <!-- 主体球 -->
      <div class="ai-ball-main">
        <!-- 内部粒子效果 -->
        <div class="particle-effect">
          <div class="particle" v-for="i in 6" :key="i" :style="getParticleStyle(i)"></div>
        </div>
        
        <!-- AI图标 -->
        <div class="ai-icon">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- 状态指示器 -->
        <div class="status-indicator">
          <div class="status-dot animate-pulse"></div>
        </div>
      </div>
      </div>
    </Transition>

    <!-- AI助手面板 -->
    <Transition name="panel">
      <div 
        v-if="isExpanded" 
        class="ai-panel glass-effect"
        :style="{ left: panelPosition.x + 'px', top: panelPosition.y + 'px' }"
      >
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-4 h-4 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full animate-pulse"></div>
              <div class="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-30"></div>
            </div>
            <div>
              <h3 class="font-bold text-white text-lg">AI智能助手</h3>
              <p class="text-xs text-[var(--theme-text)]/70">Neural Network v2.0</p>
            </div>
          </div>
          
          <!-- 页面切换按钮 -->
          <div class="flex items-center space-x-2">
            <button 
              @click="toggleView" 
              class="view-mode-btn group"
              :title="currentView === 'compact' ? '切换到完整页面' : '返回紧凑模式'"
            >
              <svg v-if="currentView === 'compact'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </svg>
            </button>
            
            <button @click="closePanel" class="close-btn group">
              <svg class="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="text-center py-8">
              <!-- 动态AI头像 -->
              <div class="relative mb-6">
                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center animate-glow">
                  <svg class="w-8 h-8 text-white animate-pulse" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="absolute inset-0 w-16 h-16 mx-auto bg-purple-500 rounded-full animate-ping opacity-20"></div>
              </div>
              
              <h4 class="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                AI助手已激活
              </h4>
              <p class="text-[var(--theme-text)]/80 text-sm leading-relaxed">
                我是您的智能助手，可以帮助您：<br>
                管理笔记内容 • 处理待办事项 • 操作文件 • 调整设置
              </p>
              
              <!-- 能力指示器 -->
              <div class="mt-6 flex justify-center space-x-2">
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>
          
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              ]"
            >
              <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
              <span class="text-xs opacity-70 mt-1 block">
                {{ formatTime(message.timestamp) }}
              </span>
            </div>
          </div>
          
          <!-- 加载指示器 -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI模型选择提示 -->
        <div class="model-info">
          <div class="flex items-center justify-center space-x-2 text-[var(--theme-text)]/70 text-xs">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>当前模型: {{ selectedModel }}</span>
          </div>
        </div>

        <!-- 智能操作快捷面板 -->
        <div class="operations-panel" v-if="showOperations">
          <!-- 操作类型切换 -->
          <div class="ops-tabs">
            <button 
              v-for="tab in operationTabs" 
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="['tab-btn', { active: activeTab === tab.key }]"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
            <button @click="showOperations = false" class="close-tab-btn">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- 文件操作 -->
          <div v-if="activeTab === 'file'" class="ops-content">
            <div class="ops-grid">
              <button @click="insertCommand('read', '请读取文件: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                读取文件
              </button>
              <button @click="insertCommand('write', '请写入文件: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                写入文件
              </button>
              <button @click="insertCommand('create', '请创建文件: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                创建文件
              </button>
              <button @click="insertCommand('list', '请列出目录: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                </svg>
                列出目录
              </button>
              <button @click="insertCommand('delete', '请删除文件: ')" class="op-btn danger">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                删除文件
              </button>
            </div>
          </div>
          
          <!-- 笔记操作 -->
          <div v-if="activeTab === 'note'" class="ops-content">
            <div class="ops-grid">
              <button @click="insertCommand('create-note', '请创建笔记: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                创建笔记
              </button>
              <button @click="insertCommand('edit-note', '请编辑笔记: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                编辑笔记
              </button>
              <button @click="insertCommand('search-note', '请搜索笔记: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                搜索笔记
              </button>
              <button @click="insertCommand('list-notes', '请列出所有笔记')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                列出笔记
              </button>
              <button @click="insertCommand('delete-note', '请删除笔记: ')" class="op-btn danger">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                删除笔记
              </button>
            </div>
          </div>
          
          <!-- 待办事项操作 -->
          <div v-if="activeTab === 'todo'" class="ops-content">
            <div class="ops-grid">
              <button @click="insertCommand('create-todo', '请创建待办事项: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                创建待办
              </button>
              <button @click="insertCommand('complete-todo', '请完成待办事项: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                完成待办
              </button>
              <button @click="insertCommand('list-todos', '请列出所有待办事项')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                列出待办
              </button>
              <button @click="insertCommand('generate-todos', '请根据我的笔记生成待办事项')" class="op-btn special">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                AI生成
              </button>
              <button @click="insertCommand('delete-todo', '请删除待办事项: ')" class="op-btn danger">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                删除待办
              </button>
            </div>
          </div>
          
          <!-- 设置操作 -->
          <div v-if="activeTab === 'settings'" class="ops-content">
            <div class="ops-grid">
              <button @click="insertCommand('change-theme', '请切换主题为: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
                切换主题
              </button>
              <button @click="insertCommand('change-language', '请切换语言为: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                </svg>
                切换语言
              </button>
              <button @click="insertCommand('view-settings', '请显示当前设置')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                查看设置
              </button>
              <button @click="insertCommand('update-settings', '请更新设置: ')" class="op-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                更新设置
              </button>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- AI模型选择和文件操作按钮 -->
          <div class="input-controls">
            <div class="model-selector">
              <select v-model="selectedModel" class="model-select">
                <option v-for="model in connectedModels" :key="model.value" :value="model.value">
                  {{ model.label }}
                </option>
              </select>
            </div>
            <button @click="toggleOperations" class="operations-toggle-btn" :class="{ active: showOperations }">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
              </svg>
            </button>
          </div>
          
          <div class="input-container">
            <input 
              v-model="currentMessage"
              @keypress.enter="sendMessage"
              :disabled="isLoading"
              placeholder="输入您的问题或文件操作指令..."
              class="message-input"
            />
            <button @click="sendMessage" class="send-btn group" :disabled="!currentMessage.trim() || isLoading">
              <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
  
  <!-- 完整AI助手页面 -->
  <Transition name="fullpage">
    <div v-if="showFullPage" class="ai-assistant-fullpage">
      <AIAssistantPage @close="closeFullPage" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import aiService from '../services/aiService'
import AIAssistantPage from './AIAssistantPage.vue'
import TimeUtils from '../utils/timeUtils'
import apiStatusService from '../services/apiStatusService'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIModel {
  value: string
  label: string
}

// 响应式数据
const floatingBall = ref<HTMLElement>()
const messagesContainer = ref<HTMLElement>()
const isExpanded = ref(false)
const isDragging = ref(false)
const isLoading = ref(false)
const currentMessage = ref('')
const messages = ref<Message[]>([])
const selectedModel = ref('openai/gpt-5-chat')
const showOperations = ref(false)
const activeTab = ref('file')

// 话题管理
const currentTopicId = ref<string | null>(null)
const topics = ref<any[]>([])

// 视图模式管理
const currentView = ref<'compact' | 'full'>('compact')
const showFullPage = ref(false)

// 位置管理
const position = reactive({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
const panelPosition = reactive({ x: 0, y: 0 })
const dragOffset = reactive({ x: 0, y: 0 })
const dragStart = reactive({ x: 0, y: 0, time: 0 })
const hasMoved = ref(false)

// 粒子效果
const getParticleStyle = (index: number) => {
  const angle = (index * 60) * Math.PI / 180
  const radius = 15
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  return {
    transform: `translate(${x}px, ${y}px)`,
    animationDelay: `${index * 0.1}s`
  }
}

// AI模型选项 - 根据用户要求的模型映射
const availableModels = [
  // OpenRouter 模型
  { value: 'openai/gpt-5-chat', label: 'GPT-5', provider: 'openrouter' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'openrouter' },
  { value: 'google/gemini-2.5-pro-preview', label: 'Gemini Pro Preview 2.5', provider: 'openrouter' },
  { value: 'deepseek/deepseek-chat-v3.1:free', label: 'Deepseek V3.1', provider: 'openrouter' },
  { value: 'deepseek/deepseek-r1-0528:free', label: 'Deepseek R1', provider: 'openrouter' }
]

// 获取当前可用的模型（基于已连接的API）
const getAvailableModels = async () => {
  try {
    // 检查API连接状态
    const apiStatus = await apiStatusService.checkSupabaseConnection()
    const statusIndicator = apiStatusService.getConnectionIndicator()

    console.log(`[API STATUS] Connection status: ${statusIndicator.status}`)
    console.log(`[API STATUS] ${statusIndicator.message}`)

    if (!apiStatus) {
      console.warn('[API STATUS] Supabase connection failed, using cached models')
      // 可以在这里显示状态通知
      apiStatusService.showStatusNotification()
    }

    // 返回所有可用模型（无论连接状态如何）
    return availableModels
  } catch (error) {
    console.error('获取可用模型失败:', error)
    return availableModels
  }
}

// 响应式的可用模型列表
const connectedModels = ref(availableModels)

// 操作面板标签配置
const operationTabs = [
  { 
    key: 'file', 
    label: '文件', 
    icon: 'svg' // 这里会被实际的SVG组件替换
  },
  { 
    key: 'note', 
    label: '笔记', 
    icon: 'svg'
  },
  { 
    key: 'todo', 
    label: '待办', 
    icon: 'svg'
  },
  { 
    key: 'settings', 
    label: '设置', 
    icon: 'svg'
  }
]

// 拖拽功能
const startDrag = (event: MouseEvent | TouchEvent) => {
  if (isExpanded.value) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // 记录拖动开始位置和时间
  dragStart.x = clientX
  dragStart.y = clientY
  dragStart.time = Date.now()
  hasMoved.value = false
  
  dragOffset.x = clientX - position.x
  dragOffset.y = clientY - position.y
  
  document.addEventListener('mousemove', onDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (event: MouseEvent | TouchEvent) => {
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // 计算移动距离
  const deltaX = Math.abs(clientX - dragStart.x)
  const deltaY = Math.abs(clientY - dragStart.y)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  // 如果移动距离超过阈值，则认为是拖动
  if (distance > 5 && !isDragging.value) {
    isDragging.value = true
    hasMoved.value = true
  }
  
  if (isDragging.value) {
    position.x = Math.max(0, Math.min(window.innerWidth - 64, clientX - dragOffset.x))
    position.y = Math.max(0, Math.min(window.innerHeight - 64, clientY - dragOffset.y))
  }
}

const stopDrag = () => {
  // 延迟重置拖动状态，防止点击事件立即触发
  setTimeout(() => {
    isDragging.value = false
  }, 10)
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 处理触摸结束事件
const handleTouchEnd = (event: TouchEvent) => {
  console.log('handleTouchEnd called', { isDragging: isDragging.value, hasMoved: hasMoved.value })
  
  // 如果没有拖动，则触发点击
  if (!isDragging.value && !hasMoved.value) {
    event.preventDefault()
    togglePanel()
  }
}

// 面板控制
const togglePanel = () => {
  console.log('togglePanel called', { isDragging: isDragging.value, hasMoved: hasMoved.value })
  
  // 如果刚刚进行了拖动，则不触发点击
  if (isDragging.value || hasMoved.value) {
    hasMoved.value = false
    console.log('togglePanel blocked due to dragging')
    return
  }
  
  // 检查是否为快速点击（防止长按误触发）
  const clickDuration = Date.now() - dragStart.time
  if (clickDuration > 500) { // 增加时间阈值，移动端可能需要更长时间
    console.log('togglePanel blocked due to long press', clickDuration)
    return
  }
  
  console.log('togglePanel executing', { isExpanded: isExpanded.value })
  if (isExpanded.value) {
    closePanel()
  } else {
    openPanel()
  }
}

const openPanel = () => {
  isExpanded.value = true
  calculatePanelPosition()
}

const closePanel = () => {
  isExpanded.value = false
}

const minimizePanel = () => {
  isExpanded.value = false
}

const calculatePanelPosition = () => {
  // 动态计算面板尺寸
  const panelWidth = Math.min(420, window.innerWidth - 40)
  const panelHeight = Math.min(600, window.innerHeight - 40)
  
  // 计算最佳位置，避免超出屏幕
  let x = position.x - panelWidth + 64
  let y = position.y
  
  // 确保面板不超出屏幕边界
  x = Math.max(20, Math.min(window.innerWidth - panelWidth - 20, x))
  y = Math.max(20, Math.min(window.innerHeight - panelHeight - 20, y))
  
  panelPosition.x = x
  panelPosition.y = y
}

// 消息处理
const sendMessage = async () => {
  if (!currentMessage.value.trim() || isLoading.value) return
  
  // 如果没有当前话题，创建新话题
  if (!currentTopicId.value) {
    await createNewTopic()
  }
  
  const userMessage: Message = {
    role: 'user',
    content: currentMessage.value,
    timestamp: TimeUtils.now()
  }
  
  messages.value.push(userMessage)
  const messageText = currentMessage.value
  currentMessage.value = ''
  
  // 保存用户消息到后端
  if (currentTopicId.value) {
    await aiService.addMessageToTopic(currentTopicId.value, {
      role: 'user',
      content: messageText,
      timestamp: TimeUtils.now()
    })
  }
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 发送到AI
  isLoading.value = true
  try {
    // 传递完整的对话历史给AI，并启用全局上下文
    const response = await aiService.chat(messages.value, selectedModel.value, true)
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.success ? response.response : '抱歉，我现在无法回答您的问题。',
      timestamp: TimeUtils.now()
    }
    
    messages.value.push(assistantMessage)
    
    // 保存AI回复到后端
    if (currentTopicId.value) {
      await aiService.addMessageToTopic(currentTopicId.value, {
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: TimeUtils.now()
      })
      
      // 如果是第一条消息，自动生成话题名称
      if (messages.value.length === 2) {
        await autoNameTopic(messageText)
      }
    }
    
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('AI聊天失败:', error)
    const errorMessage: Message = {
      role: 'assistant',
      content: '抱歉，发生了错误，请稍后再试。',
      timestamp: TimeUtils.now()
    }
    messages.value.push(errorMessage)
  } finally {
    isLoading.value = false
  }
}

// 智能操作相关方法
const toggleOperations = () => {
  showOperations.value = !showOperations.value
}

const insertCommand = (operation: string, commandText: string) => {
  currentMessage.value = commandText
  showOperations.value = false
  
  // 自动聚焦到输入框
  nextTick(() => {
    const input = document.querySelector('.message-input') as HTMLInputElement
    if (input) {
      input.focus()
    }
  })
}

// AI模型切换处理
const handleModelChange = () => {
  console.log('AI模型已切换为:', selectedModel.value)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (date: Date) => {
  return TimeUtils.formatTime(date, 'zh-CN')
}

// 窗口大小变化处理
const handleResize = () => {
  // 确保浮动球不超出屏幕
  position.x = Math.max(0, Math.min(window.innerWidth - 64, position.x))
  position.y = Math.max(0, Math.min(window.innerHeight - 64, position.y))
  
  // 重新计算面板位置
  if (isExpanded.value) {
    calculatePanelPosition()
  }
}

// 初始化可用模型
const initializeModels = async () => {
  const models = await getAvailableModels()
  connectedModels.value = models
  
  // 如果当前选中的模型不在可用列表中，选择第一个可用模型
  if (models.length > 0 && !models.find(m => m.value === selectedModel.value)) {
    selectedModel.value = models[0].value
  }
}

// 话题管理方法
const createNewTopic = async () => {
  const newTopic = {
    id: Date.now().toString(),
    title: '新对话',
    description: '',
    lastMessage: '',
    createdAt: TimeUtils.now(),
    updatedAt: TimeUtils.now(),
    messages: []
  }
  
  try {
    const response = await aiService.createTopic(newTopic)
    if (response.success && response.topic) {
      newTopic.id = response.topic.id
      topics.value.unshift(newTopic)
      currentTopicId.value = newTopic.id
    } else {
      // 如果API失败，使用本地存储
      topics.value.unshift(newTopic)
      currentTopicId.value = newTopic.id
      localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
    }
  } catch (error) {
    console.error('创建话题失败:', error)
    // 如果API失败，使用本地存储
    topics.value.unshift(newTopic)
    currentTopicId.value = newTopic.id
    localStorage.setItem('ai-assistant-topics', JSON.stringify(topics.value))
  }
}

const autoNameTopic = async (firstMessage: string) => {
  if (!currentTopicId.value) return
  
  try {
    const response = await aiService.generateTopicName(firstMessage)
    if (response.success && response.topicName) {
      const currentTopic = topics.value.find(t => t.id === currentTopicId.value)
      if (currentTopic) {
        currentTopic.title = response.topicName
        currentTopic.updatedAt = TimeUtils.now()
        
        // 更新后端
        await aiService.updateTopic(currentTopicId.value, {
          title: response.topicName,
          updatedAt: TimeUtils.now()
        })
      }
    }
  } catch (error) {
    console.error('自动命名话题失败:', error)
  }
}

// 视图模式切换方法
const toggleView = () => {
  if (currentView.value === 'compact') {
    currentView.value = 'full'
    showFullPage.value = true
    isExpanded.value = false // 关闭浮动球面板
  } else {
    currentView.value = 'compact'
    showFullPage.value = false
  }
}

// 关闭完整页面
const closeFullPage = () => {
  currentView.value = 'compact'
  showFullPage.value = false
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
  initializeModels()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.floating-ai-assistant {
  position: fixed;
  z-index: 1000;
}

/* AI浮动球样式 */
.ai-floating-ball {
  position: fixed;
  width: 80px;
  height: 80px;
  cursor: grab;
  z-index: 1001;
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease;
}

.ai-floating-ball:hover {
  cursor: grab;
}

.ai-floating-ball.dragging {
  transform: scale(1.05);
  filter: brightness(1.1);
  cursor: grabbing;
  transition: transform 0.1s ease, filter 0.1s ease;
}

/* 外层光环 */
.outer-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border: 2px solid var(--theme-border);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 主体球 */
.ai-ball-main {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--theme-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 0 30px var(--theme-glow-shadow),
    0 0 60px var(--theme-secondary),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.ai-ball-main:hover {
  transform: scale(1.05);
  box-shadow: 
    0 0 40px var(--theme-glow-shadow),
    0 0 80px var(--theme-secondary),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
}

/* 粒子效果 */
.particle-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  background: color-mix(in srgb, var(--theme-text) 80%, transparent);
  border-radius: 50%;
  animation: particle-float 3s ease-in-out infinite;
}

/* AI图标 */
.ai-icon {
  position: relative;
  z-index: 2;
  color: var(--theme-text);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--theme-text) 50%, transparent));
}

/* 状态指示器 */
.status-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--theme-accent);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--theme-accent);
}

/* AI面板样式 */
.ai-panel {
  position: fixed;
  width: min(420px, calc(100vw - 40px));
  height: min(600px, calc(100vh - 40px));
  max-width: 420px;
  max-height: 600px;
  background: var(--theme-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--theme-border);
  border-radius: 24px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板头部 */
.panel-header {
  padding: 20px 24px;
  background: var(--theme-card-gradient);
  border-bottom: 1px solid var(--theme-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(10px);
}

.close-btn {
  background: color-mix(in srgb, var(--theme-text) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-text) 20%, transparent);
  color: color-mix(in srgb, var(--theme-text) 80%, transparent);
  width: 36px;
  height: 36px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: color-mix(in srgb, var(--theme-text) 20%, transparent);
  color: var(--theme-text);
  transform: scale(1.05);
}

/* 消息容器 */
.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-message {
  color: color-mix(in srgb, var(--theme-text) 90%, transparent);
}

/* 模型信息区域 */
.model-info {
  padding: 12px 20px;
  border-top: 1px solid var(--theme-border);
  background: var(--theme-card-gradient);
  backdrop-filter: blur(10px);
}

/* 模型选择器 */
.model-selector {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme-border);
}

.model-select {
  width: 100%;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--theme-text) 10%, transparent);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  color: var(--theme-text);
  font-size: 13px;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.model-select:focus {
  border-color: var(--theme-glow);
  box-shadow: 0 0 0 2px var(--theme-glow-shadow);
  background: color-mix(in srgb, var(--theme-text) 15%, transparent);
}

.model-select option {
  background: var(--theme-bg);
  color: var(--theme-text);
  padding: 8px;
}

/* 输入区域 */
.input-area {
  padding: 20px;
  border-top: 1px solid var(--theme-border);
  background: var(--theme-card-gradient);
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  padding: 8px;
  background: color-mix(in srgb, var(--theme-text) 5%, transparent);
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent);
}

.message-input {
  flex: 1;
  padding: 16px 20px;
  background: color-mix(in srgb, var(--theme-text) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent);
  border-radius: 25px;
  color: var(--theme-text);
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.message-input::placeholder {
  color: color-mix(in srgb, var(--theme-text) 60%, transparent);
}

.message-input:focus {
  border-color: color-mix(in srgb, var(--theme-primary) 60%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 20%, transparent);
  background: color-mix(in srgb, var(--theme-text) 15%, transparent);
}

.send-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-primary) 80%, transparent) 0%, 
    color-mix(in srgb, var(--theme-secondary) 80%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--theme-text) 20%, transparent);
  border-radius: 50%;
  color: var(--theme-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 8px 25px color-mix(in srgb, var(--theme-primary) 40%, transparent);
  background: linear-gradient(135deg, 
    var(--theme-primary) 0%, 
    var(--theme-secondary) 100%);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 面板动画 */
.panel-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.panel-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

/* 浮动球动画 */
.ball-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ball-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ball-enter-from {
  opacity: 0;
  transform: scale(0.3);
}

.ball-leave-to {
  opacity: 0;
  transform: scale(0.3);
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.6) 0%, 
    rgba(6, 182, 212, 0.6) 100%);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.8) 0%, 
    rgba(6, 182, 212, 0.8) 100%);
}

/* 智能操作面板样式 */
.operations-panel {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 12px;
  margin: 12px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

/* 操作标签切换 */
.ops-tabs {
  display: flex;
  background: rgba(168, 85, 247, 0.1);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  padding: 8px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.tab-btn:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
  color: white;
}

.tab-btn.active {
  background: rgba(168, 85, 247, 0.4);
  border-color: rgba(168, 85, 247, 0.6);
  color: white;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

.close-tab-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.close-tab-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: white;
}

/* 操作内容区域 */
.ops-content {
  padding: 16px;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.op-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  text-align: left;
}

.op-btn:hover {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
}

.op-btn.danger {
  border-color: rgba(239, 68, 68, 0.5);
}

.op-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.7);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.op-btn.special {
  border-color: rgba(34, 197, 94, 0.5);
}

.op-btn.special:hover {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(34, 197, 94, 0.7);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

/* 输入控制区域样式 */
.input-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.model-selector {
  flex: 1;
}

.operations-toggle-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.operations-toggle-btn:hover {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
  color: white;
}

.operations-toggle-btn.active {
  background: rgba(168, 85, 247, 0.5);
  border-color: rgba(168, 85, 247, 0.7);
  color: white;
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
}

/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* 动画效果 */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0;
  }
}

.animate-pulse-ring {
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes particle-float {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 完整页面样式 */
.ai-assistant-fullpage {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 完整页面过渡动画 */
.fullpage-enter-active,
.fullpage-leave-active {
  transition: all 0.3s ease;
}

.fullpage-enter-from,
.fullpage-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fullpage-enter-to,
.fullpage-leave-from {
  opacity: 1;
  transform: scale(1);
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.8), 0 0 40px rgba(6, 182, 212, 0.5);
  }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.glass-effect {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .ai-floating-ball {
    width: 60px;
    height: 60px;
    bottom: 20px;
    right: 20px;
    position: fixed;
  }
  
  .ai-panel {
    width: calc(100vw - 20px);
    height: calc(100vh - 40px);
    max-width: none;
    max-height: none;
    left: 10px !important;
    top: 20px !important;
    border-radius: 16px;
  }
  
  .panel-header {
    padding: 16px 20px;
  }
  
  .messages-container {
    padding: 16px;
    gap: 12px;
  }
  
  .model-info {
    padding: 10px 16px;
  }
  
  .input-container {
    padding: 16px 20px;
  }
  
  .message-input {
    font-size: 16px;
    padding: 12px 16px;
  }
  
  .send-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
  }
}

@media (max-width: 480px) {
  .ai-floating-ball {
    width: 56px;
    height: 56px;
    bottom: 16px;
    right: 16px;
  }
  
  .ai-panel {
    width: calc(100vw - 16px);
    height: calc(100vh - 32px);
    left: 8px !important;
    top: 16px !important;
    border-radius: 12px;
  }
  
  .panel-header {
    padding: 12px 16px;
  }
  
  .panel-header h3 {
    font-size: 16px;
  }
  
  .messages-container {
    padding: 12px;
    gap: 10px;
  }
  
  .message-content {
    font-size: 14px;
    padding: 10px 12px;
  }
  
  .model-info {
    padding: 8px 12px;
  }
  
  .model-select {
    font-size: 14px;
    padding: 6px 10px;
  }
  
  .input-container {
    padding: 12px 16px;
  }
  
  .message-input {
    font-size: 14px;
    padding: 10px 14px;
  }
  
  .send-btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .ai-floating-ball {
    transform: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  .ai-floating-ball:active {
    transform: scale(0.95);
  }
  
  .ai-ball-main {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  .close-btn,
  .send-btn,
  .operations-toggle-btn {
    min-width: 44px;
    min-height: 44px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  .close-btn:active,
  .send-btn:active,
  .operations-toggle-btn:active {
    transform: scale(0.95);
  }
  
  /* 移除hover效果 */
  .ai-floating-ball:hover,
  .ai-ball-main:hover,
  .close-btn:hover,
  .send-btn:hover,
  .operations-toggle-btn:hover {
    transform: none;
    box-shadow: inherit;
    background: inherit;
    color: inherit;
    border-color: inherit;
  }
}
</style>