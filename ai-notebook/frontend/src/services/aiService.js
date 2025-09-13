import axios from 'axios'
import notesService from './notesService.js'
import todosService from './todosService.js'

const API_BASE_URL = '/api'

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // 测试AI连接
  async testConnection() {
    try {
      const response = await this.client.get('/ai/test')
      return response.data
    } catch (error) {
      console.error('AI连接测试失败:', error)
      throw error
    }
  }

  // 获取全局上下文信息
  async getGlobalContext() {
    try {
      const [notes, todos] = await Promise.all([
        notesService.getAllNotes(),
        todosService.getAllTodos()
      ])
      
      // 构建上下文摘要
      const contextSummary = {
        notes: notes.slice(0, 10).map(note => ({
          id: note.id,
          title: note.title,
          content: note.content.substring(0, 200) + (note.content.length > 200 ? '...' : ''),
          created_at: note.created_at
        })),
        todos: todos.slice(0, 20).map(todo => ({
          id: todo.id,
          content: todo.content,
          status: todo.status,
          priority: todo.priority,
          category: todo.category,
          created_at: todo.created_at
        }))
      }
      
      return contextSummary
    } catch (error) {
      console.error('获取全局上下文失败:', error)
      return { notes: [], todos: [] }
    }
  }

  // 发送AI聊天消息
  async sendMessage(message, model = 'openai/gpt-5-chat', context = null) {
    try {
      // 如果没有提供上下文，获取全局上下文
      if (!context) {
        context = await this.getGlobalContext()
      }
      
      const response = await this.client.post('/ai/chat', {
        message,
        model,
        context
      })
      
      return response.data
    } catch (error) {
      console.error('AI聊天失败:', error)
      throw error
    }
  }

  // 解析AI指令
  async parseCommand(message) {
    try {
      const response = await this.client.post('/ai/parse-command', {
        command: message
      })
      
      return response.data
    } catch (error) {
      console.error('AI指令解析失败:', error)
      throw error
    }
  }

  // 执行文件操作
  async executeFileOperation(operation, params) {
    try {
      const response = await this.client.post('/ai/file/execute', {
        operation,
        params
      })
      
      return response.data
    } catch (error) {
      console.error('文件操作执行失败:', error)
      throw error
    }
  }

  // 读取文件
  async readFile(filePath, encoding = 'utf-8') {
    try {
      const response = await this.client.post('/ai/file/read', {
        file_path: filePath,
        encoding
      })
      
      return response.data
    } catch (error) {
      console.error('文件读取失败:', error)
      throw error
    }
  }

  // 写入文件
  async writeFile(filePath, content, encoding = 'utf-8') {
    try {
      const response = await this.client.post('/ai/file/write', {
        file_path: filePath,
        content,
        encoding
      })
      
      return response.data
    } catch (error) {
      console.error('文件写入失败:', error)
      throw error
    }
  }

  // 修改文件
  async modifyFile(filePath, content, encoding = 'utf-8') {
    try {
      const response = await this.client.post('/ai/file/modify', {
        file_path: filePath,
        content,
        encoding
      })
      
      return response.data
    } catch (error) {
      console.error('文件修改失败:', error)
      throw error
    }
  }

  // 获取可用的AI模型列表
  async getAvailableModels() {
    try {
      const response = await this.client.get('/ai/models')
      return response.data
    } catch (error) {
      console.error('获取AI模型列表失败:', error)
      throw error
    }
  }

  // 设置当前使用的AI模型
  async setCurrentModel(modelId) {
    try {
      const response = await this.client.post('/ai/models/current', {
        model_id: modelId
      })
      return response.data
    } catch (error) {
      console.error('设置AI模型失败:', error)
      throw error
    }
  }

  // 获取当前使用的AI模型
  async getCurrentModel() {
    try {
      const response = await this.client.get('/ai/models/current')
      return response.data
    } catch (error) {
      console.error('获取当前AI模型失败:', error)
      throw error
    }
  }

  // 生成智能建议
  async generateSuggestions(type, context = {}) {
    try {
      const response = await this.client.post('/ai/suggestions', {
        type,
        context
      })
      return response.data
    } catch (error) {
      console.error('生成智能建议失败:', error)
      throw error
    }
  }

  // 分析文本内容
  async analyzeText(text, analysisType = 'general') {
    try {
      const response = await this.client.post('/ai/analyze', {
        text,
        analysis_type: analysisType
      })
      return response.data
    } catch (error) {
      console.error('文本分析失败:', error)
      throw error
    }
  }

  // 生成摘要
  async generateSummary(content, maxLength = 200) {
    try {
      const response = await this.client.post('/ai/summarize', {
        content,
        max_length: maxLength
      })
      return response.data
    } catch (error) {
      console.error('生成摘要失败:', error)
      throw error
    }
  }

  // 翻译文本
  async translateText(text, targetLanguage = 'zh', sourceLanguage = 'auto') {
    try {
      const response = await this.client.post('/ai/translate', {
        text,
        target_language: targetLanguage,
        source_language: sourceLanguage
      })
      return response.data
    } catch (error) {
      console.error('文本翻译失败:', error)
      throw error
    }
  }

  // AI聊天对话（支持消息历史和模型选择）
  async chat(messages, model = 'gpt-5-chat', useGlobalContext = false, webSearchEnabled = false) {
    try {
      // 构建请求数据
      const lastMessage = messages[messages.length - 1]?.content || ''
      
      // 检查消息是否为空
      if (!lastMessage.trim()) {
        return {
          success: false,
          response: '请输入有效的消息内容',
          error: 'Empty message'
        }
      }
      
      const requestData = {
        message: lastMessage,
        model: model,
        context: messages.slice(0, -1), // 传递除最后一条消息外的所有历史消息作为上下文
        web_search_enabled: webSearchEnabled // 添加联网搜索参数
      }
      
      // 如果启用全局上下文，添加笔记和待办事项信息
      if (useGlobalContext) {
        const globalContext = await this.getGlobalContext()
        requestData.global_context = globalContext
      }
      
      const response = await this.client.post('/ai/chat', requestData)
      
      return {
        success: response.data.success || true,
        response: response.data.response,
        provider: response.data.provider,
        model: response.data.model,
        usage: response.data.usage
      }
    } catch (error) {
      console.error('AI聊天失败:', error)
      return {
        success: false,
        response: '抱歉，AI服务暂时不可用，请稍后再试。',
        error: error.message
      }
    }
  }

  // 发送单条消息（用于AI助手页面）
  async sendMessage(message, model = 'gpt-5-chat') {
    try {
      const response = await this.client.post('/ai/chat', {
        message: message,
        model: model
      })
      
      return {
        success: true,
        message: response.data.response,
        provider: response.data.provider,
        model: response.data.model,
        usage: response.data.usage
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      return {
        success: false,
        message: '抱歉，AI服务暂时不可用，请稍后再试。',
        error: error.message
      }
    }
  }

  // 生成话题名称
  async generateTopicName(firstMessage) {
    try {
      const response = await this.client.post('/topics/generate-name', {
        message: firstMessage
      })
      
      return response.data
    } catch (error) {
      console.error('生成话题名称失败:', error)
      return {
        success: false,
        error: '网络错误或服务不可用'
      }
    }
  }

  // ==================== 话题管理 API ====================

  // 获取所有话题
  async getTopics() {
    try {
      const response = await this.client.get('/topics')
      return response.data
    } catch (error) {
      console.error('获取话题失败:', error)
      return { success: false, error: '获取话题失败' }
    }
  }

  // 创建新话题
  async createTopic(topicData) {
    try {
      const response = await this.client.post('/topics', topicData)
      return response.data
    } catch (error) {
      console.error('创建话题失败:', error)
      return { success: false, error: '创建话题失败' }
    }
  }

  // 获取指定话题
  async getTopic(topicId) {
    try {
      const response = await this.client.get(`/topics/${topicId}`)
      return response.data
    } catch (error) {
      console.error('获取话题失败:', error)
      return { success: false, error: '获取话题失败' }
    }
  }

  // 更新话题
  async updateTopic(topicId, updateData) {
    try {
      const response = await this.client.put(`/topics/${topicId}`, updateData)
      return response.data
    } catch (error) {
      console.error('更新话题失败:', error)
      return { success: false, error: '更新话题失败' }
    }
  }

  // 删除话题
  async deleteTopic(topicId) {
    try {
      const response = await this.client.delete(`/topics/${topicId}`)
      return response.data
    } catch (error) {
      // 如果话题不存在(404)，认为删除成功
      if (error.response && error.response.status === 404) {
        console.log('话题不存在，视为删除成功:', topicId)
        return { success: true, message: '话题已删除' }
      }
      console.error('删除话题失败:', error)
      return { success: false, error: '删除话题失败' }
    }
  }

  // 向话题添加消息
  async addMessageToTopic(topicId, messageData) {
    try {
      const response = await this.client.post(`/topics/${topicId}/messages`, messageData)
      return response.data
    } catch (error) {
      console.error('添加消息失败:', error)
      return { error: '添加消息失败' }
    }
  }

  // 格式化上下文为文本
  formatContextAsText(context) {
    if (!context) return ''
    
    let contextText = ''
    
    // 添加笔记信息
    if (context.notes && context.notes.length > 0) {
      contextText += '### 最近的笔记：\n'
      context.notes.forEach(note => {
        contextText += `**${note.title}**\n${note.content}\n\n`
      })
    }
    
    // 添加待办事项信息
    if (context.todos && context.todos.length > 0) {
      const pendingTodos = context.todos.filter(todo => todo.status !== 'completed')
      const completedTodos = context.todos.filter(todo => todo.status === 'completed')
      
      if (pendingTodos.length > 0) {
        contextText += '### 待办事项：\n'
        pendingTodos.forEach(todo => {
          contextText += `- [${todo.priority || 'medium'}] ${todo.content}`
          if (todo.category) contextText += ` (${todo.category})`
          if (todo.due_date) contextText += ` - 截止：${todo.due_date}`
          contextText += '\n'
        })
      }
      
      if (completedTodos.length > 0) {
        contextText += '### 已完成：\n'
        completedTodos.slice(0, 5).forEach(todo => {
          contextText += `- ${todo.content}\n`
        })
      }
    }
    
    return contextText || '用户暂无保存的笔记和待办事项。'
  }

  // 获取音频文件列表
  async getAudioList() {
    try {
      const response = await this.client.get('/audio')
      return response.data
    } catch (error) {
      console.error('获取音频列表失败:', error)
      return { success: false, error: '获取音频列表失败' }
    }
  }
}

// 导出单例实例
export default new AIService()