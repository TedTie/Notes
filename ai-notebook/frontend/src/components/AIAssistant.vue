<template>
  <!-- AI助手浮动球 -->
  <div
    v-if="!isMinimized"
    class="ai-assistant-container"
    :class="{ 'expanded': isExpanded }"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @mousedown="startDrag"
  >
    <!-- 拖拽手柄 -->
    <div class="drag-handle" v-if="isExpanded">
      <div class="flex items-center justify-between p-2 bg-gray-800/90 rounded-t-lg border-b border-cyan-500/30">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span class="text-[var(--theme-primary)] text-sm font-medium">{{ languageService.t('ai_assistant', 'AI助手') }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <button
            @click.stop="minimizeAssistant"
            class="p-1 hover:bg-gray-700 rounded transition-colors"
            :title="languageService.t('minimize', '最小化')"
          >
            <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 10h12v2H4z"/>
            </svg>
          </button>
          <button
            @click.stop="toggleExpanded"
            class="p-1 hover:bg-gray-700 rounded transition-colors"
            :title="languageService.t('collapse', '收起')"
          >
            <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 浮动球 -->
    <div
      v-if="!isExpanded"
      class="ai-ball"
      @click="toggleExpanded"
      @mousedown.stop
    >
      <div class="ball-content">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="pulse-ring"></div>
      </div>
      <div class="ball-tooltip" v-if="showTooltip">
        {{ languageService.t('click_to_expand_ai', '点击展开AI助手') }}
      </div>
    </div>

    <!-- 展开的聊天界面 -->
    <div v-if="isExpanded" class="chat-container" @mousedown.stop>
      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="message.type"
        >
          <div class="message-avatar">
            <div v-if="message.type === 'user'" class="user-avatar">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div v-else class="ai-avatar">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 加载指示器 -->
        <div v-if="isLoading" class="message ai">
          <div class="message-avatar">
            <div class="ai-avatar">
              <svg class="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作按钮 -->
      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.id"
          @click="handleQuickAction(action)"
          class="quick-action-btn"
          :title="action.description"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path :d="action.icon"/>
          </svg>
          <span class="text-xs">{{ action.label }}</span>
        </button>
      </div>

      <!-- 搜索选项 -->
      <div class="search-options-container">
        <div class="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-cyan-500/20">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-[var(--theme-primary)]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm text-gray-300">{{ languageService.t('web_search', '联网搜索') }}</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="webSearchEnabled"
              class="sr-only"
            >
            <div class="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-container">
        <div class="input-wrapper">
          <textarea
            v-model="inputMessage"
            @keydown="handleKeyDown"
            @input="adjustTextareaHeight"
            ref="messageInput"
            :placeholder="languageService.t('input_message_placeholder', '输入消息...')"
            class="chat-input"
            rows="1"
            :disabled="isLoading"
          ></textarea>
          <button
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isLoading"
            class="send-btn"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 最小化状态的小图标 -->
  <div
    v-if="isMinimized"
    class="minimized-icon"
    @click="restoreAssistant"
    :title="languageService.t('expand_ai_assistant', '展开AI助手')"
  >
    <svg class="w-5 h-5 text-[var(--theme-primary)]" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import languageService from '../services/languageService'
import aiService from '../services/aiService'
import TimeUtils from '../utils/timeUtils'

export default {
  name: 'AIAssistant',
  setup() {
    // 响应式数据
    const isExpanded = ref(false)
    const isMinimized = ref(false)
    const isLoading = ref(false)
    const isDragging = ref(false)
    const showTooltip = ref(false)
    const inputMessage = ref('')
    const currentLanguage = ref(languageService.getLanguage())
    const selectedModel = ref('openai/gpt-5-chat')
    const webSearchEnabled = ref(false)
    
    // 语言监听器
    let removeLanguageListener = null
    
    const messages = ref([
      {
        type: 'ai',
        content: languageService.t('ai_assistant_greeting', '你好！我是你的AI助手，有什么可以帮助你的吗？'),
        timestamp: new Date()
      }
    ])
    
    // 位置信息
    const position = reactive({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      // 清理语言监听器
      if (removeLanguageListener) {
        removeLanguageListener()
      }
    })
    
    const dragOffset = reactive({ x: 0, y: 0 })
    
    // 引用
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    
    // 快捷操作 - 使用计算属性以支持语言切换
    const quickActions = ref([
      {
        id: 'summarize',
        label: languageService.t('summarize', '总结'),
        description: languageService.t('summarize_description', '总结当前页面内容'),
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        id: 'translate',
        label: languageService.t('translate', '翻译'),
        description: languageService.t('translate_description', '翻译选中的文本'),
        icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'
      },
      {
        id: 'extract_todos',
        label: languageService.t('extract_todos', '提取任务'),
        description: languageService.t('extract_todos_description', '从文本中提取待办事项'),
        icon: 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
      },
      {
        id: 'improve_text',
        label: '改进',
        description: '改进文本表达',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
      }
    ])
    
    // 方法
    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value
      if (isExpanded.value) {
        nextTick(() => {
          scrollToBottom()
          if (messageInput.value) {
            messageInput.value.focus()
          }
        })
      }
    }
    
    const minimizeAssistant = () => {
      isMinimized.value = true
      isExpanded.value = false
    }
    
    const restoreAssistant = () => {
      isMinimized.value = false
      isExpanded.value = true
      nextTick(() => {
        if (messageInput.value) {
          messageInput.value.focus()
        }
      })
    }
    
    const startDrag = (e) => {
      if (e.target.closest('.chat-container')) return
      
      isDragging.value = true
      dragOffset.x = e.clientX - position.x
      dragOffset.y = e.clientY - position.y
      
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
      e.preventDefault()
    }
    
    const onDrag = (e) => {
      if (!isDragging.value) return
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // 限制在窗口范围内
      const maxX = window.innerWidth - (isExpanded.value ? 320 : 60)
      const maxY = window.innerHeight - (isExpanded.value ? 400 : 60)
      
      position.x = Math.max(0, Math.min(newX, maxX))
      position.y = Math.max(0, Math.min(newY, maxY))
    }
    
    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }
    
    const sendMessage = async () => {
      if (!inputMessage.value.trim() || isLoading.value) return
      
      const userMessage = {
        type: 'user',
        content: inputMessage.value.trim(),
        timestamp: TimeUtils.now()
      }
      
      messages.value.push(userMessage)
      const messageToSend = inputMessage.value.trim()
      inputMessage.value = ''
      
      // 调整输入框高度
      adjustTextareaHeight()
      
      // 滚动到底部
      nextTick(() => scrollToBottom())
      
      // 发送到AI API
      await sendToAI(messageToSend)
    }
    
    const sendToAI = async (message) => {
      isLoading.value = true
      
      try {
        // 检查消息是否为空
        if (!message || !message.trim()) {
          throw new Error('消息内容不能为空')
        }
        
        // 构建消息历史
        const messageHistory = messages.value.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
        
        // 使用aiService进行API调用，传递联网搜索参数
        const result = await aiService.chat(messageHistory, selectedModel.value, webSearchEnabled.value)
        
        if (result.success) {
          const aiMessage = {
            type: 'ai',
            content: result.response,
            timestamp: TimeUtils.now()
          }
          
          messages.value.push(aiMessage)
        } else {
          throw new Error(result.response || 'AI服务暂时不可用')
        }
      } catch (error) {
        console.error('AI聊天错误:', error)
        
        const errorMessage = {
          type: 'ai',
          content: '抱歉，我现在无法回应。请稍后再试。',
          timestamp: TimeUtils.now()
        }
        
        messages.value.push(errorMessage)
      } finally {
        isLoading.value = false
        nextTick(() => scrollToBottom())
      }
    }
    
    const handleQuickAction = async (action) => {
      let message = ''
      
      switch (action.id) {
        case 'summarize':
          message = '请帮我总结当前页面的主要内容'
          break
        case 'translate':
          const selectedText = window.getSelection().toString()
          if (selectedText) {
            message = `请翻译以下文本：${selectedText}`
          } else {
            message = '请选择要翻译的文本，然后再点击翻译按钮'
          }
          break
        case 'extract_todos':
          message = '请帮我从当前内容中提取待办事项'
          break
        case 'improve_text':
          const selectedForImprovement = window.getSelection().toString()
          if (selectedForImprovement) {
            message = `请改进以下文本的表达：${selectedForImprovement}`
          } else {
            message = '请选择要改进的文本，然后再点击改进按钮'
          }
          break
      }
      
      if (message) {
        inputMessage.value = message
        await sendMessage()
      }
    }
    
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }
    
    const adjustTextareaHeight = () => {
      nextTick(() => {
        if (messageInput.value) {
          messageInput.value.style.height = 'auto'
          messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 100) + 'px'
        }
      })
    }
    
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    const formatMessage = (content) => {
      // 简单的Markdown格式化
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    }
    
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // 监听窗口大小变化
    const handleResize = () => {
      const maxX = window.innerWidth - (isExpanded.value ? 320 : 60)
      const maxY = window.innerHeight - (isExpanded.value ? 400 : 60)
      
      position.x = Math.min(position.x, maxX)
      position.y = Math.min(position.y, maxY)
    }
    
    // 生命周期
    onMounted(() => {
      window.addEventListener('resize', handleResize)
      
      // 添加语言变化监听器
      removeLanguageListener = languageService.addListener((newLanguage) => {
        currentLanguage.value = newLanguage
        // 更新快捷操作的标签
        quickActions.value.forEach(action => {
          switch(action.id) {
            case 'summarize':
              action.label = languageService.t('summarize', '总结')
              action.description = languageService.t('summarize_description', '总结当前页面内容')
              break
            case 'translate':
              action.label = languageService.t('translate', '翻译')
              action.description = languageService.t('translate_description', '翻译选中的文本')
              break
            case 'extract_todos':
              action.label = languageService.t('extract_todos', '提取任务')
              action.description = languageService.t('extract_todos_description', '从文本中提取待办事项')
              break
          }
        })
      })
      
      // 显示提示
      setTimeout(() => {
        showTooltip.value = true
        setTimeout(() => {
          showTooltip.value = false
        }, 3000)
      }, 1000)
    })
    
    // 监听展开状态变化，调整位置
    watch(isExpanded, () => {
      handleResize()
    })
    
    return {
      // 响应式数据
      isExpanded,
      isMinimized,
      isLoading,
      showTooltip,
      inputMessage,
      messages,
      position,
      quickActions,
      currentLanguage,
      webSearchEnabled,
      
      // 服务
      languageService,
      
      // 引用
      messagesContainer,
      messageInput,
      
      // 方法
      toggleExpanded,
      minimizeAssistant,
      restoreAssistant,
      startDrag,
      sendMessage,
      handleQuickAction,
      handleKeyDown,
      adjustTextareaHeight,
      formatMessage,
      formatTime
    }
  }
}
</script>

<style scoped>
.ai-assistant-container {
  position: fixed;
  z-index: 9999;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-assistant-container.expanded {
  width: 320px;
  height: 400px;
}

.drag-handle {
  cursor: move;
}

.ai-ball {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(8, 145, 178, 0.4);
  transition: all 0.3s ease;
}

.ai-ball:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(8, 145, 178, 0.6);
}

.ball-content {
  position: relative;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid rgba(8, 145, 178, 0.6);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.ball-tooltip {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  animation: fadeInUp 0.3s ease;
}

.ball-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.chat-container {
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  gap: 8px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.user-avatar {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.ai-avatar {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  background: rgba(55, 65, 81, 0.8);
  padding: 8px 12px;
  border-radius: 12px;
  color: #e5e7eb;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message.user .message-text {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: white;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.message.ai .message-time {
  text-align: left;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(55, 65, 81, 0.8);
  border-radius: 12px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #06b6d4;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.quick-actions {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  border-top: 1px solid rgba(6, 182, 212, 0.2);
  overflow-x: auto;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: rgba(55, 65, 81, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  color: #06b6d4;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 50px;
}

.quick-action-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  border-color: #06b6d4;
}

.chat-input-container {
  padding: 16px;
  border-top: 1px solid rgba(6, 182, 212, 0.2);
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: rgba(55, 65, 81, 0.8);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: #e5e7eb;
  font-size: 14px;
  resize: none;
  min-height: 36px;
  max-height: 100px;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  outline: none;
  border-color: #06b6d4;
}

.chat-input::placeholder {
  color: #9ca3af;
}

.send-btn {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(8, 145, 178, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.minimized-icon {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(8, 145, 178, 0.4);
  transition: all 0.3s ease;
}

.minimized-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(8, 145, 178, 0.6);
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.7);
}

.quick-actions::-webkit-scrollbar {
  height: 4px;
}

.quick-actions::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
}

.quick-actions::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 2px;
}
</style>