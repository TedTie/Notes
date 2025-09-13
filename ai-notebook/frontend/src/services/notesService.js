import axios from 'axios'

const API_BASE_URL = '/api'

class NotesService {
  async getAllNotes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes`)
      return response.data.notes || []
    } catch (error) {
      console.error('获取笔记失败:', error)
      return []
    }
  }

  async createNote(noteData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/notes`, noteData)
      return response.data
    } catch (error) {
      console.error('创建笔记失败:', error)
      throw error
    }
  }

  async updateNote(id, noteData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/notes/${id}`, noteData)
      return response.data
    } catch (error) {
      console.error('更新笔记失败:', error)
      throw error
    }
  }

  async deleteNote(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/notes/${id}`)
      return response.data
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  }

  async searchNotes(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/search`, {
        params: { q: query }
      })
      return response.data.notes || []
    } catch (error) {
      console.error('搜索笔记失败:', error)
      return []
    }
  }

  async getNoteById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/${id}`)
      return response.data
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      throw error
    }
  }

  async getNotesByCategory(category) {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/category/${category}`)
      return response.data.notes || []
    } catch (error) {
      console.error('按分类获取笔记失败:', error)
      return []
    }
  }

  async getRecentNotes(limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/recent`, {
        params: { limit }
      })
      return response.data.notes || []
    } catch (error) {
      console.error('获取最近笔记失败:', error)
      return []
    }
  }

  async exportNotes(format = 'json') {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/export`, {
        params: { format },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('导出笔记失败:', error)
      throw error
    }
  }

  async importNotes(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE_URL}/notes/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('导入笔记失败:', error)
      throw error
    }
  }
}

export default new NotesService()