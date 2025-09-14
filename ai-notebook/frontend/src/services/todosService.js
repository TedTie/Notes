import { todosService as supabaseTodosService } from './supabaseService.js'

class TodosService {
  async getAllTodos() {
    try {
      return await supabaseTodosService.getAllTodos()
    } catch (error) {
      console.error('获取待办事项失败:', error)
      return []
    }
  }

  async createTodo(todoData) {
    try {
      // 将content字段转换为title字段以匹配Supabase表结构
      const apiData = {
        title: todoData.content || todoData.title,
        description: todoData.description,
        priority: todoData.priority,
        category: todoData.category,
        due_date: todoData.due_date
      }
      const todo = await supabaseTodosService.createTodo(apiData)
      return {
        success: true,
        todo: todo
      }
    } catch (error) {
      console.error('创建待办事项失败:', error)
      return {
        success: false,
        error: error.message || '创建待办事项失败'
      }
    }
  }

  async updateTodo(id, todoData) {
    try {
      return await supabaseTodosService.updateTodo(id, todoData)
    } catch (error) {
      console.error('更新待办事项失败:', error)
      throw error
    }
  }

  async deleteTodo(id) {
    try {
      return await supabaseTodosService.deleteTodo(id)
    } catch (error) {
      console.error('删除待办事项失败:', error)
      throw error
    }
  }

  async toggleTodo(id) {
    try {
      return await supabaseTodosService.toggleTodo(id)
    } catch (error) {
      console.error('切换待办状态失败:', error)
      throw error
    }
  }

  async searchTodos(query) {
    return await supabaseTodosService.searchTodos(query)
  }

  async getTodoById(id) {
    return await supabaseTodosService.getTodoById(id)
  }

  async getTodosByStatus(status) {
    return await supabaseTodosService.getTodosByStatus(status)
  }

  async getTodosByPriority(priority) {
    return await supabaseTodosService.getTodosByPriority(priority)
  }

  async getTodosByCategory(category) {
    return await supabaseTodosService.getTodosByCategory(category)
  }

  async getOverdueTodos() {
    return await supabaseTodosService.getOverdueTodos()
  }

  async getTodayTodos() {
    return await supabaseTodosService.getTodayTodos()
  }

  async getUpcomingTodos(days = 7) {
    return await supabaseTodosService.getUpcomingTodos(days)
  }

  async getTodoStats() {
    return await supabaseTodosService.getTodoStats()
  }

  async batchUpdateTodos(todoIds, updateData) {
    return await supabaseTodosService.batchUpdateTodos(todoIds, updateData)
  }

  async batchDeleteTodos(todoIds) {
    return await supabaseTodosService.batchDeleteTodos(todoIds)
  }

  async exportTodos(format = 'json') {
    return await supabaseTodosService.exportTodos(format)
  }

  async importTodos(file) {
    return await supabaseTodosService.importTodos(file)
  }
}

export default new TodosService()