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
  },

  // 按分类获取笔记
  async getNotesByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('category', category)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('按分类获取笔记失败:', error)
      throw new Error(handleSupabaseError(error, '按分类获取笔记'))
    }
  },

  // 获取最近笔记
  async getRecentNotes(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取最近笔记失败:', error)
      throw new Error(handleSupabaseError(error, '获取最近笔记'))
    }
  },

  // 导出笔记
  async exportNotes(format = 'json') {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        return blob
      } else if (format === 'markdown') {
        const markdownContent = data.map(note => {
          return `# ${note.title}\n\n${note.content}\n\n---\n\n`
        }).join('')
        const blob = new Blob([markdownContent], { type: 'text/markdown' })
        return blob
      } else if (format === 'csv') {
        const headers = ['id', 'title', 'content', 'category', 'tags', 'is_favorite', 'created_at', 'updated_at']
        const csvContent = [headers.join(',')]
        data.forEach(note => {
          const row = headers.map(header => {
            let value = note[header] || ''
            if (header === 'tags' && Array.isArray(value)) {
              value = value.join(';')
            }
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
          csvContent.push(row.join(','))
        })
        const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' })
        return blob
      }
      
      throw new Error('不支持的导出格式')
    } catch (error) {
      console.error('导出笔记失败:', error)
      throw new Error(handleSupabaseError(error, '导出笔记'))
    }
  },

  // 导入笔记
  async importNotes(file) {
    try {
      const text = await file.text()
      let notes = []
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        notes = JSON.parse(text)
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const lines = text.split('\n')
        const headers = lines[0].split(',')
        notes = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',')
          const note = {}
          headers.forEach((header, index) => {
            note[header.trim()] = values[index]?.trim() || ''
          })
          return note
        })
      } else if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        // 简单的 Markdown 解析
        const sections = text.split('---').filter(section => section.trim())
        notes = sections.map(section => {
          const lines = section.trim().split('\n')
          const title = lines[0].replace(/^#\s*/, '') || '未命名笔记'
          const content = lines.slice(1).join('\n').trim()
          return {
            title,
            content,
            category: 'imported',
            tags: [],
            is_favorite: false
          }
        })
      } else {
        throw new Error('不支持的文件格式')
      }
      
      // 清理数据并插入
      const cleanNotes = notes.map(note => ({
        title: note.title || '未命名笔记',
        content: note.content || '',
        category: note.category || 'imported',
        tags: Array.isArray(note.tags) ? note.tags : (note.tags ? note.tags.split(';') : []),
        is_favorite: Boolean(note.is_favorite)
      }))
      
      const { data, error } = await supabase
        .from('notes')
        .insert(cleanNotes)
        .select()
      
      if (error) throw error
      return { success: true, importedCount: data.length, notes: data }
    } catch (error) {
      console.error('导入笔记失败:', error)
      throw new Error(handleSupabaseError(error, '导入笔记'))
    }
  },

  // 导出笔记
  async exportNotes() {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('导出笔记失败:', error)
      throw new Error(handleSupabaseError(error, '导出笔记'))
    }
  },

  // 清除所有笔记
  async clearAllNotes() {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .neq('id', 0) // 删除所有记录
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('清除笔记失败:', error)
      throw new Error(handleSupabaseError(error, '清除笔记'))
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
  },

  // 搜索待办事项
  async searchTodos(query) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('搜索待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '搜索待办事项'))
    }
  },

  // 根据ID获取待办事项
  async getTodoById(id) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('获取待办事项详情失败:', error)
      throw new Error(handleSupabaseError(error, '获取待办事项详情'))
    }
  },

  // 按状态获取待办事项
  async getTodosByStatus(status) {
    try {
      const isCompleted = status === 'completed'
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('is_completed', isCompleted)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('按状态获取待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '按状态获取待办事项'))
    }
  },

  // 按优先级获取待办事项
  async getTodosByPriority(priority) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('priority', priority)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('按优先级获取待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '按优先级获取待办事项'))
    }
  },

  // 按分类获取待办事项
  async getTodosByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('按分类获取待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '按分类获取待办事项'))
    }
  },

  // 获取过期待办事项
  async getOverdueTodos() {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .lt('due_date', now)
        .eq('is_completed', false)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取过期待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '获取过期待办事项'))
    }
  },

  // 获取今日待办事项
  async getTodayTodos() {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .gte('due_date', startOfDay)
        .lt('due_date', endOfDay)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取今日待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '获取今日待办事项'))
    }
  },

  // 获取即将到期的待办事项
  async getUpcomingTodos(days = 7) {
    try {
      const now = new Date()
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .gte('due_date', now.toISOString())
        .lte('due_date', futureDate.toISOString())
        .eq('is_completed', false)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取即将到期待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '获取即将到期待办事项'))
    }
  },

  // 获取待办事项统计
  async getTodosStats() {
    try {
      const { data: allTodos, error: allError } = await supabase
        .from('todos')
        .select('is_completed, priority, category')
      
      if (allError) throw allError
      
      const stats = {
        total: allTodos.length,
        completed: allTodos.filter(t => t.is_completed).length,
        pending: allTodos.filter(t => !t.is_completed).length,
        high_priority: allTodos.filter(t => t.priority === 'high').length,
        medium_priority: allTodos.filter(t => t.priority === 'medium').length,
        low_priority: allTodos.filter(t => t.priority === 'low').length
      }
      
      return stats
    } catch (error) {
      console.error('获取待办事项统计失败:', error)
      throw new Error(handleSupabaseError(error, '获取待办事项统计'))
    }
  },

  // 批量更新待办事项
  async batchUpdateTodos(todoIds, updateData) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update(updateData)
        .in('id', todoIds)
        .select()
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('批量更新待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '批量更新待办事项'))
    }
  },

  // 批量删除待办事项
  async batchDeleteTodos(todoIds) {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', todoIds)
      
      if (error) throw error
      return { success: true, deletedCount: todoIds.length }
    } catch (error) {
      console.error('批量删除待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '批量删除待办事项'))
    }
  },

  // 导出待办事项
  async exportTodos(format = 'json') {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        return blob
      } else if (format === 'csv') {
        const headers = ['id', 'title', 'description', 'is_completed', 'priority', 'category', 'due_date', 'created_at']
        const csvContent = [headers.join(',')]
        data.forEach(todo => {
          const row = headers.map(header => {
            const value = todo[header] || ''
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
          csvContent.push(row.join(','))
        })
        const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' })
        return blob
      }
      
      throw new Error('不支持的导出格式')
    } catch (error) {
      console.error('导出待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '导出待办事项'))
    }
  },

  // 导入待办事项
  async importTodos(file) {
    try {
      const text = await file.text()
      let todos = []
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        todos = JSON.parse(text)
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const lines = text.split('\n')
        const headers = lines[0].split(',')
        todos = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',')
          const todo = {}
          headers.forEach((header, index) => {
            todo[header.trim()] = values[index]?.trim() || ''
          })
          return todo
        })
      } else {
        throw new Error('不支持的文件格式')
      }
      
      // 清理数据并插入
      const cleanTodos = todos.map(todo => ({
        title: todo.title || '',
        description: todo.description || '',
        is_completed: Boolean(todo.is_completed),
        priority: todo.priority || 'medium',
        category: todo.category || 'general',
        due_date: todo.due_date || null
      }))
      
      const { data, error } = await supabase
        .from('todos')
        .insert(cleanTodos)
        .select()
      
      if (error) throw error
      return { success: true, importedCount: data.length, todos: data }
    } catch (error) {
      console.error('导入待办事项失败:', error)
      throw new Error(handleSupabaseError(error, '导入待办事项'))
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
          description: projectData.description || ''
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

  // 获取项目任务
  async getProjectTasks(projectId) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取项目任务失败:', error)
      throw new Error(handleSupabaseError(error, '获取项目任务'))
    }
  },

  // 更新项目
  async updateProject(id, projectData) {
    try {
      const updateData = {}
      if (projectData.name !== undefined) updateData.name = projectData.name
      if (projectData.description !== undefined) updateData.description = projectData.description
      updateData.updated_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
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
  },

  // 清除所有项目
  async clearAllProjects() {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .neq('id', 0) // 删除所有记录
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('清除项目失败:', error)
      throw new Error(handleSupabaseError(error, '清除项目'))
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

// ==================== AI服务 ====================
export const aiService = {
  // 测试AI连接
  async testConnection() {
    try {
      // 这里可以调用实际的AI API或返回模拟数据
      return { success: true, message: 'AI服务连接正常' }
    } catch (error) {
      console.error('AI连接测试失败:', error)
      throw new Error('AI服务连接失败')
    }
  },

  // 发送消息
  async sendMessage(message, context = null, model = null, globalContext = null, webSearchEnabled = false) {
    try {
      // 这里应该调用实际的AI API
      // 目前返回模拟响应
      return {
        success: true,
        response: `这是对"${message}"的AI回复（模拟）`,
        provider: 'openai',
        model: model || 'gpt-3.5-turbo',
        usage: { tokens: 100 }
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw new Error('发送消息失败')
    }
  },

  // 解析命令
  async parseCommand(command) {
    try {
      // 简单的命令解析逻辑
      return {
        success: true,
        command: command,
        action: 'unknown',
        parameters: {}
      }
    } catch (error) {
      console.error('解析命令失败:', error)
      throw new Error('解析命令失败')
    }
  },

  // 执行文件操作
  async executeFileOperation(operation) {
    try {
      return {
        success: true,
        message: '文件操作执行成功（模拟）',
        operation: operation
      }
    } catch (error) {
      console.error('执行文件操作失败:', error)
      throw new Error('执行文件操作失败')
    }
  },

  // 读取文件
  async readFile(filePath, encoding = 'utf-8') {
    try {
      return {
        success: true,
        content: '文件内容（模拟）',
        path: filePath,
        encoding: encoding
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      throw new Error('读取文件失败')
    }
  },

  // 写入文件
  async writeFile(filePath, content, encoding = 'utf-8') {
    try {
      return {
        success: true,
        message: '文件写入成功（模拟）',
        path: filePath
      }
    } catch (error) {
      console.error('写入文件失败:', error)
      throw new Error('写入文件失败')
    }
  },

  // 修改文件
  async modifyFile(filePath, content, encoding = 'utf-8') {
    try {
      return {
        success: true,
        message: '文件修改成功（模拟）',
        path: filePath
      }
    } catch (error) {
      console.error('修改文件失败:', error)
      throw new Error('修改文件失败')
    }
  },

  // 获取可用模型
  async getAvailableModels() {
    try {
      return {
        success: true,
        models: [
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
          { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
          { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' }
        ]
      }
    } catch (error) {
      console.error('获取模型列表失败:', error)
      throw new Error('获取模型列表失败')
    }
  },

  // 设置当前模型
  async setCurrentModel(model) {
    try {
      return {
        success: true,
        model: model,
        message: '模型设置成功'
      }
    } catch (error) {
      console.error('设置模型失败:', error)
      throw new Error('设置模型失败')
    }
  },

  // 获取当前模型
  async getCurrentModel() {
    try {
      return {
        success: true,
        model: 'gpt-3.5-turbo'
      }
    } catch (error) {
      console.error('获取当前模型失败:', error)
      throw new Error('获取当前模型失败')
    }
  },

  // 生成建议
  async generateSuggestions(text, type = 'general') {
    try {
      return {
        success: true,
        suggestions: [
          '建议1：优化文本结构',
          '建议2：增加更多细节',
          '建议3：改进表达方式'
        ]
      }
    } catch (error) {
      console.error('生成建议失败:', error)
      throw new Error('生成建议失败')
    }
  },

  // 分析文本
  async analyzeText(text, analysisType = 'sentiment') {
    try {
      return {
        success: true,
        analysis: {
          type: analysisType,
          result: '积极',
          confidence: 0.85,
          details: '文本整体情感倾向积极'
        }
      }
    } catch (error) {
      console.error('文本分析失败:', error)
      throw new Error('文本分析失败')
    }
  },

  // 生成摘要
  async generateSummary(text, maxLength = 200) {
    try {
      return {
        success: true,
        summary: text.length > maxLength ? text.substring(0, maxLength) + '...' : text,
        originalLength: text.length,
        summaryLength: Math.min(text.length, maxLength)
      }
    } catch (error) {
      console.error('生成摘要失败:', error)
      throw new Error('生成摘要失败')
    }
  },

  // 翻译文本
  async translateText(text, targetLanguage = 'en', sourceLanguage = 'auto') {
    try {
      return {
        success: true,
        translatedText: `[${targetLanguage}] ${text}`,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage
      }
    } catch (error) {
      console.error('翻译失败:', error)
      throw new Error('翻译失败')
    }
  },

  // 生成话题名称
  async generateTopicName(messages) {
    try {
      const firstMessage = Array.isArray(messages) ? messages[0] : messages
      const topicName = typeof firstMessage === 'string' 
        ? firstMessage.substring(0, 20) + '...' 
        : '新话题'
      
      return {
        success: true,
        name: topicName
      }
    } catch (error) {
      console.error('生成话题名称失败:', error)
      throw new Error('生成话题名称失败')
    }
  },

  // 获取音频列表
  async getAudioList() {
    try {
      return {
        success: true,
        audioList: []
      }
    } catch (error) {
      console.error('获取音频列表失败:', error)
      throw new Error('获取音频列表失败')
    }
  },

  // 任务增强
  async enhanceTask(taskData) {
    try {
      // 模拟AI任务增强
      return {
        enhanced_description: `${taskData.task_title}是一个重要的任务，需要系统性的方法来完成。建议将其分解为多个可管理的子任务，并按优先级顺序执行。在实施过程中，应该注意质量控制和进度跟踪，确保最终交付符合预期目标。`,
        subtasks: [
          {
            title: '需求分析和规划',
            description: '详细分析任务需求，制定实施计划和时间表',
            estimated_time: '1-2小时'
          },
          {
            title: '准备工作和资源收集',
            description: '收集必要的工具、资料和资源，搭建工作环境',
            estimated_time: '30-60分钟'
          },
          {
            title: '核心实施',
            description: '执行任务的主要工作内容，完成核心功能',
            estimated_time: '2-4小时'
          }
        ],
        estimated_time: '4-8小时',
        difficulty: '中等',
        implementation_tips: [
          '建议采用迭代式开发方法，分阶段完成',
          '在开始前确保所有依赖和前置条件都已满足',
          '定期保存工作进度，避免意外丢失'
        ]
      }
    } catch (error) {
      console.error('AI任务增强失败:', error)
      throw new Error('AI任务增强失败')
    }
  },

  // 项目规划
  async planProject(projectData) {
    try {
      // 模拟AI项目规划
      return {
        overview: `基于您的需求，我为"${projectData.project_name}"项目制定了详细的执行计划。该计划包含了关键任务的分解、优先级排序和时间估算。`,
        tasks: [
          {
            title: '项目初始化和环境搭建',
            description: '设置开发环境、配置工具链、创建项目结构',
            priority: 'high',
            estimated_time: '1-2 天'
          },
          {
            title: '核心功能开发',
            description: '实现项目的主要功能模块和业务逻辑',
            priority: 'high',
            estimated_time: '5-7 天'
          },
          {
            title: '用户界面设计和实现',
            description: '设计用户界面，实现前端交互功能',
            priority: 'medium',
            estimated_time: '3-4 天'
          }
        ],
        estimated_duration: '2-3 周',
        recommendations: [
          '建议采用敏捷开发方法，分阶段交付',
          '优先实现核心功能，后续迭代完善细节',
          '建立持续集成和自动化测试流程'
        ]
      }
    } catch (error) {
      console.error('AI项目规划失败:', error)
      throw new Error('AI项目规划失败')
    }
  }
}

// ==================== 任务服务 ====================
export const tasksService = {
  // 创建任务
  async createTask(taskData) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          project_id: taskData.project_id || null,
          assignee: taskData.assignee || null,
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date || null,
          is_completed: false
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建任务失败:', error)
      throw new Error(handleSupabaseError(error, '创建任务'))
    }
  },

  // 更新任务
  async updateTask(id, taskData) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新任务失败:', error)
      throw new Error(handleSupabaseError(error, '更新任务'))
    }
  },

  // 删除任务
  async deleteTask(id) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('删除任务失败:', error)
      throw new Error(handleSupabaseError(error, '删除任务'))
    }
  },

  // 获取任务详情
  async getTask(id) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('获取任务详情失败:', error)
      throw new Error(handleSupabaseError(error, '获取任务详情'))
    }
  },

  // 获取所有任务
  async getAllTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取任务失败:', error)
      throw new Error(handleSupabaseError(error, '获取任务'))
    }
  },

  // 清除所有任务
  async clearAllTasks() {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .neq('id', 0) // 删除所有记录
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('清除任务失败:', error)
      throw new Error(handleSupabaseError(error, '清除任务'))
    }
  }
}

// 导出所有服务
const supabaseService = {
  notes: notesService,
  todos: todosService,
  chat: chatService,
  settings: settingsService,
  topics: topicsService,
  projects: projectsService,
  tasks: tasksService,
  pomodoro: pomodoroService,
  file: fileService,
  stats: statsService,
  ai: aiService
}

export { supabaseService }
export default supabaseService