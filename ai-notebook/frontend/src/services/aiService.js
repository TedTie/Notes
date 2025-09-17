import { supabaseService } from './supabaseService'
import notesService from './notesService.js'
import todosService from './todosService.js'

const { aiService: supabaseAiService } = supabaseService;

class AIService {
  constructor() {
    // 使用 supabaseService，不再需要 axios 客户端
  }

  // 测试AI连接
   async testConnection() {
     return await supabaseAiService.testConnection();
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
  async parseCommand(command) {
     return await supabaseAiService.parseCommand(command);
   }

  // 执行文件操作
  async executeFileOperation(operation) {
     return await supabaseAiService.executeFileOperation(operation);
   }

  // 读取文件
  async readFile(filePath, encoding = 'utf-8') {
     return await supabaseAiService.readFile(filePath, encoding);
   }

   // 写入文件
   async writeFile(filePath, content, encoding = 'utf-8') {
     return await supabaseAiService.writeFile(filePath, content, encoding);
   }

   // 修改文件
   async modifyFile(filePath, content, encoding = 'utf-8') {
     return await supabaseAiService.modifyFile(filePath, content, encoding);
   }

  // 获取可用的AI模型列表
   async getAvailableModels() {
     return await supabaseAiService.getAvailableModels();
   }

   // 设置当前使用的AI模型
   async setCurrentModel(model) {
     return await supabaseAiService.setCurrentModel(model);
   }

   // 获取当前使用的AI模型
   async getCurrentModel() {
     return await supabaseAiService.getCurrentModel();
   }

  // 生成智能建议
   async generateSuggestions(type, context = {}) {
     return await supabaseAiService.generateSuggestions(type, context);
   }

   // 分析文本内容
   async analyzeText(text, analysisType = 'general') {
     return await supabaseAiService.analyzeText(text, analysisType);
   }

   // 生成摘要
   async generateSummary(content, maxLength = 200) {
     return await supabaseAiService.generateSummary(content, maxLength);
   }

   // 翻译文本
   async translateText(text, targetLanguage = 'zh', sourceLanguage = 'auto') {
     return await supabaseAiService.translateText(text, targetLanguage, sourceLanguage);
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
      
      const context = messages.slice(0, -1) // 传递除最后一条消息外的所有历史消息作为上下文
      
      // 如果启用全局上下文，添加笔记和待办事项信息
      let globalContext = null
      if (useGlobalContext) {
        globalContext = await this.getGlobalContext()
      }
      
      return await supabaseAiService.sendMessage(lastMessage, context, model, globalContext, webSearchEnabled)
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
    return await supabaseService.aiService.sendMessage(message, null, model);
  }

  // 生成话题名称
   async generateTopicName(firstMessage) {
     return await supabaseAiService.generateTopicName(firstMessage)
   }

  // ==================== 话题管理 API ====================

  // 获取所有话题
  async getTopics() {
    try {
      const topics = await supabaseService.topicsService.getAllTopics();
      return {
        success: true,
        topics: topics
      };
    } catch (error) {
      console.error("获取话题失败:", error);
      return {
        success: false,
        error: error.message || "获取话题失败"
      };
    }
  }

  // 创建新话题
  async createTopic(name, description = '') {
    return await supabaseService.topicsService.createTopic({ name, description });
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

  // 获取音频列表
   async getAudioList() {
     return await supabaseAiService.getAudioList();
   }
}

// 导出单例实例
export default new AIService()