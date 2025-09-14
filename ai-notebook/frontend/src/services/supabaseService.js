/**
 * Supabase服务层
 * 替换原有的API调用，使用Supabase客户端进行数据操作
 */

import { supabase, handleSupabaseError, batchOps } from '../config/supabase.js'

// ==================== 笔记服务 ====================
export const notesService = {
  // 获取所有笔记
  async getAllNotes() {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取笔记失败:', error)
      throw new Error(handleSupabaseError(error, '获取笔记'))
    }
  },

  // 根据ID获取笔记
  async getNoteById(id) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      throw new Error(handleSupabaseError(error, '获取笔记详情'))
    }
  },

  // 创建笔记
  async createNote(noteData) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: noteData.title || '新笔记',
          content: noteData.content || '',
          category: noteData.category || 'general',
          tags: noteData.tags || [],
          is_favorite: noteData.is_favorite || false
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建笔记失败:', error)
      throw new Error(handleSupabaseError(error, '创建笔记'))
    }
  },

  // 更新笔记
  async updateNote(id, noteData) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...noteData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新笔记失败:', error)
      throw new Error(handleSupabaseError(error, '更新笔记'))
    }
  },

  // 删除笔记
  async deleteNote(id) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw new Error(handleSupabaseError(error, '删除笔记'))
    }
  },

  // 搜索笔记
  async searchNotes(query) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('搜索笔记失败:', error)
      throw new Error(handleSupabaseError(error, '搜索笔记'))
    }
  }
}

// ==================== 待办事项服务 ====================
export const todosService = {
  // 获取所有待办事项
  async getAllTodos() {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '获取待办事项'))
    }
  },

  // 创建待办事项
  async createTodo(todoData) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          title: todoData.title,
          description: todoData.description || '',
          priority: todoData.priority || 'medium',
          due_date: todoData.due_date || null,
          category: todoData.category || 'general',
          is_completed: false
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '创建待办事项'))
    }
  },

  // 更新待办事项
  async updateTodo(id, todoData) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({
          ...todoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '更新待办事项'))
    }
  },

  // 切换完成状态
  async toggleTodo(id) {
    try {
      // 先获取当前状态
      const { data: currentTodo, error: fetchError } = await supabase
        .from('todos')
        .select('is_completed')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      // 更新状态
      const { data, error } = await supabase
        .from('todos')
        .update({
          is_completed: !currentTodo.is_completed,
          completed_at: !currentTodo.is_completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('切换待办状态失败:', error)
      throw new Error(handleSupabaseError(error, '切换待办状态'))
    }
  },

  // 删除待办事项
  async deleteTodo(id) {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('删除待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '删除待办事项'))
    }
  }
}

// ==================== 聊天历史服务 ====================
export const chatService = {
  // 获取聊天历史
  async getChatHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取聊天历史失败:', error)
      throw new Error(handleSupabaseError(error, '获取聊天历史'))
    }
  },

  // 保存聊天消息
  async saveChatMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          message: messageData.message,
          response: messageData.response,
          model: messageData.model || 'default',
          tokens_used: messageData.tokens_used || 0,
          response_time: messageData.response_time || 0
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('保存聊天消息失败:', error)
      throw new Error(handleSupabaseError(error, '保存聊天消息'))
    }
  },

  // 清空聊天历史
  async clearChatHistory() {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .neq('id', 0) // 删除所有记录
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('清空聊天历史失败:', error)
      throw new Error(handleSupabaseError(error, '清空聊天历史'))
    }
  }
}

// ==================== 设置服务 ====================
export const settingsService = {
  // 获取所有设置
  async getAllSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
      
      if (error) throw error
      
      // 转换为键值对对象
      const settings = {}
      data?.forEach(item => {
        settings[item.key] = item.value
      })
      
      return settings
    } catch (error) {
      console.error('获取设置失败:', error)
      throw new Error(handleSupabaseError(error, '获取设置'))
    }
  },

  // 获取单个设置
  async getSetting(key) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()
      
      if (error) throw error
      return data?.value
    } catch (error) {
      console.error('获取设置失败:', error)
      throw new Error(handleSupabaseError(error, '获取设置'))
    }
  },

  // 更新设置
  async updateSetting(key, value) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新设置失败:', error)
      throw new Error(handleSupabaseError(error, '更新设置'))
    }
  },

  // 批量更新设置
  async updateSettings(settings) {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('settings')
        .upsert(updates)
        .select()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('批量更新设置失败:', error)
      throw new Error(handleSupabaseError(error, '批量更新设置'))
    }
  }
}

// ==================== 主题服务 ====================
export const topicsService = {
  // 获取所有主题
  async getAllTopics() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取主题失败:', error)
      throw new Error(handleSupabaseError(error, '获取主题'))
    }
  },

  // 创建主题
  async createTopic(topicData) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          name: topicData.name,
          description: topicData.description || '',
          color: topicData.color || '#3B82F6'
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建主题失败:', error)
      throw new Error(handleSupabaseError(error, '创建主题'))
    }
  },

  // 更新主题
  async updateTopic(id, topicData) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .update({
          ...topicData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新主题失败:', error)
      throw new Error(handleSupabaseError(error, '更新主题'))
    }
  },

  // 删除主题
  async deleteTopic(id) {
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('删除主题失败:', error)
      throw new Error(handleSupabaseError(error, '删除主题'))
    }
  }
}

// ==================== 项目服务 ====================
export const projectsService = {
  // 获取所有项目
  async getAllProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取项目失败:', error)
      throw new Error(handleSupabaseError(error, '获取项目'))
    }
  },

  // 创建项目
  async createProject(projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description || '',
          status: projectData.status || 'active',
          priority: projectData.priority || 'medium',
          start_date: projectData.start_date || null,
          end_date: projectData.end_date || null
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建项目失败:', error)
      throw new Error(handleSupabaseError(error, '创建项目'))
    }
  },

  // 更新项目
  async updateProject(id, projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...projectData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新项目失败:', error)
      throw new Error(handleSupabaseError(error, '更新项目'))
    }
  },

  // 删除项目
  async deleteProject(id) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('删除项目失败:', error)
      throw new Error(handleSupabaseError(error, '删除项目'))
    }
  }
}

// ==================== 番茄钟服务 ====================
export const pomodoroService = {
  // 获取番茄钟会话
  async getPomodoroSessions(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取番茄钟会话失败:', error)
      throw new Error(handleSupabaseError(error, '获取番茄钟会话'))
    }
  },

  // 创建番茄钟会话
  async createPomodoroSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          task_name: sessionData.task_name || '专注任务',
          duration_minutes: sessionData.duration_minutes || 25,
          session_type: sessionData.session_type || 'work',
          is_completed: false
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建番茄钟会话失败:', error)
      throw new Error(handleSupabaseError(error, '创建番茄钟会话'))
    }
  },

  // 完成番茄钟会话
  async completePomodoroSession(id) {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('完成番茄钟会话失败:', error)
      throw new Error(handleSupabaseError(error, '完成番茄钟会话'))
    }
  },

  // 获取今日统计
  async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .eq('is_completed', true)
      
      if (error) throw error
      
      const sessions = data || []
      const totalSessions = sessions.length
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0)
      
      return {
        totalSessions,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 100) / 100
      }
    } catch (error) {
      console.error('获取今日统计失败:', error)
      throw new Error(handleSupabaseError(error, '获取今日统计'))
    }
  }
}

// ==================== 文件上传服务 ====================
export const fileService = {
  // 上传背景图片
  async uploadBackground(file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `backgrounds/${fileName}`
      
      const { data, error } = await supabase.storage
        .from('backgrounds')
        .upload(filePath, file)
      
      if (error) throw error
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(filePath)
      
      return {
        path: filePath,
        url: publicUrl,
        fileName
      }
    } catch (error) {
      console.error('上传背景图片失败:', error)
      throw new Error(handleSupabaseError(error, '上传背景图片'))
    }
  },

  // 删除背景图片
  async deleteBackground(filePath) {
    try {
      const { error } = await supabase.storage
        .from('backgrounds')
        .remove([filePath])
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('删除背景图片失败:', error)
      throw new Error(handleSupabaseError(error, '删除背景图片'))
    }
  },

  // 获取背景图片列表
  async getBackgroundsList() {
    try {
      const { data, error } = await supabase.storage
        .from('backgrounds')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) throw error
      
      return data?.map(file => ({
        name: file.name,
        path: `backgrounds/${file.name}`,
        url: supabase.storage.from('backgrounds').getPublicUrl(`backgrounds/${file.name}`).data.publicUrl,
        size: file.metadata?.size,
        createdAt: file.created_at
      })) || []
    } catch (error) {
      console.error('获取背景图片列表失败:', error)
      throw new Error(handleSupabaseError(error, '获取背景图片列表'))
    }
  }
}

// ==================== 统计服务 ====================
export const statsService = {
  // 获取总体统计
  async getOverallStats() {
    try {
      const [notesCount, todosCount, completedTodosCount, projectsCount] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('todos').select('id', { count: 'exact', head: true }),
        supabase.from('todos').select('id', { count: 'exact', head: true }).eq('is_completed', true),
        supabase.from('projects').select('id', { count: 'exact', head: true })
      ])
      
      return {
        notesCount: notesCount.count || 0,
        todosCount: todosCount.count || 0,
        completedTodosCount: completedTodosCount.count || 0,
        projectsCount: projectsCount.count || 0,
        todoCompletionRate: todosCount.count > 0 ? Math.round((completedTodosCount.count / todosCount.count) * 100) : 0
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw new Error(handleSupabaseError(error, '获取统计数据'))
    }
  }
}

// 导出所有服务
export default {
  notes: notesService,
  todos: todosService,
  chat: chatService,
  settings: settingsService,
  topics: topicsService,
  projects: projectsService,
  pomodoro: pomodoroService,
  file: fileService,
  stats: statsService
}