import axios from 'axios'

const API_BASE_URL = '/api'

class TodosService {
  async getAllTodos() {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos`)
      return response.data.todos || []
    } catch (error) {
      console.error('获取待办事项失败:', error)
      return []
    }
  }

  async createTodo(todoData) {
    try {
      // 将content字段转换为title字段以匹配后端API
      const apiData = {
        title: todoData.content,
        description: todoData.description,
        priority: todoData.priority,
        category: todoData.category,
        due_date: todoData.due_date
      }
      const response = await axios.post(`${API_BASE_URL}/todos`, apiData)
      return {
        success: true,
        todo: response.data
      }
    } catch (error) {
      console.error('创建待办事项失败:', error)
      return {
        success: false,
        error: error.response?.data?.error || '创建待办事项失败'
      }
    }
  }

  async updateTodo(id, todoData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/todos/${id}`, todoData)
      return response.data
    } catch (error) {
      console.error('更新待办事项失败:', error)
      throw error
    }
  }

  async deleteTodo(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/todos/${id}`)
      return response.data
    } catch (error) {
      console.error('删除待办事项失败:', error)
      throw error
    }
  }

  async toggleTodo(id) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/todos/${id}/toggle`)
      return response.data
    } catch (error) {
      console.error('切换待办事项状态失败:', error)
      throw error
    }
  }

  async searchTodos(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/search`, {
        params: { q: query }
      })
      return response.data.todos || []
    } catch (error) {
      console.error('搜索待办事项失败:', error)
      return []
    }
  }

  async getTodoById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/${id}`)
      return response.data
    } catch (error) {
      console.error('获取待办事项详情失败:', error)
      throw error
    }
  }

  async getTodosByStatus(status) {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/status/${status}`)
      return response.data.todos || []
    } catch (error) {
      console.error('按状态获取待办事项失败:', error)
      return []
    }
  }

  async getTodosByPriority(priority) {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/priority/${priority}`)
      return response.data.todos || []
    } catch (error) {
      console.error('按优先级获取待办事项失败:', error)
      return []
    }
  }

  async getTodosByCategory(category) {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/category/${category}`)
      return response.data.todos || []
    } catch (error) {
      console.error('按分类获取待办事项失败:', error)
      return []
    }
  }

  async getOverdueTodos() {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/overdue`)
      return response.data.todos || []
    } catch (error) {
      console.error('获取过期待办事项失败:', error)
      return []
    }
  }

  async getTodayTodos() {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/today`)
      return response.data.todos || []
    } catch (error) {
      console.error('获取今日待办事项失败:', error)
      return []
    }
  }

  async getUpcomingTodos(days = 7) {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/upcoming`, {
        params: { days }
      })
      return response.data.todos || []
    } catch (error) {
      console.error('获取即将到期待办事项失败:', error)
      return []
    }
  }

  async getTodoStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/stats`)
      return response.data
    } catch (error) {
      console.error('获取待办事项统计失败:', error)
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0
      }
    }
  }

  async batchUpdateTodos(todoIds, updateData) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/todos/batch`, {
        todo_ids: todoIds,
        update_data: updateData
      })
      return response.data
    } catch (error) {
      console.error('批量更新待办事项失败:', error)
      throw error
    }
  }

  async batchDeleteTodos(todoIds) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/todos/batch`, {
        data: { todo_ids: todoIds }
      })
      return response.data
    } catch (error) {
      console.error('批量删除待办事项失败:', error)
      throw error
    }
  }

  async exportTodos(format = 'json') {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos/export`, {
        params: { format },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('导出待办事项失败:', error)
      throw error
    }
  }

  async importTodos(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE_URL}/todos/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('导入待办事项失败:', error)
      throw error
    }
  }
}

export default new TodosService()