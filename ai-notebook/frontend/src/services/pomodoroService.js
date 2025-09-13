// 番茄时钟服务
class PomodoroService {
  constructor() {
    this.baseURL = '/api/pomodoro'
  }

  // 记录完成的番茄钟会话
  async recordSession(sessionData) {
    try {
      const response = await fetch(`${this.baseURL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('记录番茄钟会话失败:', error)
      throw error
    }
  }

  // 获取番茄钟统计数据
  async getStats(period = 'today') {
    try {
      const response = await fetch(`${this.baseURL}/stats?period=${period}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('获取番茄钟统计数据失败:', error)
      throw error
    }
  }

  // 获取番茄钟会话历史记录
  async getSessions(options = {}) {
    try {
      const params = new URLSearchParams()
      
      if (options.taskId) {
        params.append('task_id', options.taskId)
      }
      
      if (options.page) {
        params.append('page', options.page)
      }
      
      if (options.limit) {
        params.append('limit', options.limit)
      }
      
      const url = `${this.baseURL}/sessions${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('获取番茄钟会话历史失败:', error)
      throw error
    }
  }

  // 获取今日统计
  async getTodayStats() {
    const stats = await this.getStats('today')
    return stats.today || { completedSessions: 0, totalMinutes: 0 }
  }

  // 获取本周统计
  async getWeekStats() {
    const stats = await this.getStats('week')
    return stats.week || { completedSessions: 0, totalMinutes: 0 }
  }

  // 获取指定任务的番茄钟会话
  async getTaskSessions(taskId, page = 1, limit = 10) {
    return await this.getSessions({
      taskId,
      page,
      limit
    })
  }

  // 格式化会话数据
  formatSessionData(duration, sessionType, taskId = null) {
    return {
      duration_minutes: Math.max(1, Math.ceil(duration / 60)), // 至少记录1分钟
      session_type: sessionType,
      task_id: taskId
    }
  }

  // 计算会话完成率
  calculateCompletionRate(timeLeft, totalTime) {
    if (totalTime === 0) return 0
    const completedTime = totalTime - timeLeft
    return Math.round((completedTime / totalTime) * 100)
  }

  // 检查是否应该记录会话（至少完成了25%）
  shouldRecordSession(timeLeft, totalTime) {
    const completionRate = this.calculateCompletionRate(timeLeft, totalTime)
    return completionRate >= 25
  }

  // 获取会话类型的显示名称
  getSessionTypeLabel(sessionType) {
    const labels = {
      'work': '专注工作',
      'short_break': '短休息',
      'long_break': '长休息'
    }
    return labels[sessionType] || '未知类型'
  }

  // 获取会话类型的图标
  getSessionTypeIcon(sessionType) {
    const icons = {
      'work': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      'short_break': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>',
      'long_break': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>'
    }
    return icons[sessionType] || '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
  }

  // 格式化时间显示
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 格式化持续时间（分钟）
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}分钟`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
    }
  }

  // 获取今日完成的番茄钟数量
  async getTodayPomodoroCount() {
    try {
      const stats = await this.getTodayStats()
      return stats.completedSessions || 0
    } catch (error) {
      console.error('获取今日番茄钟数量失败:', error)
      return 0
    }
  }

  // 获取本周完成的番茄钟数量
  async getWeekPomodoroCount() {
    try {
      const stats = await this.getWeekStats()
      return stats.completedSessions || 0
    } catch (error) {
      console.error('获取本周番茄钟数量失败:', error)
      return 0
    }
  }

  // 计算平均专注时长
  async getAverageFocusTime() {
    try {
      const sessions = await this.getSessions({ limit: 50 })
      const workSessions = sessions.sessions?.filter(s => s.session_type === 'work') || []
      
      if (workSessions.length === 0) return 0
      
      const totalMinutes = workSessions.reduce((sum, session) => sum + session.duration_minutes, 0)
      return Math.round(totalMinutes / workSessions.length)
    } catch (error) {
      console.error('计算平均专注时长失败:', error)
      return 0
    }
  }
}

// 创建单例实例
const pomodoroService = new PomodoroService()

export default pomodoroService