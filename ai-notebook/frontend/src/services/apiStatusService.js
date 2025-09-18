// API状态监控服务
import { supabase } from '../config/supabase'

class ApiStatusService {
  constructor() {
    this.status = {
      supabase: false,
      lastCheck: null,
      error: null
    }
    this.checkInterval = null
  }

  // 检查Supabase连接状态
  async checkSupabaseConnection() {
    try {
      // 尝试执行一个简单的查询来测试连接
      const { data, error } = await supabase
        .from('notes')
        .select('id')
        .limit(1)

      if (error) {
        throw error
      }

      this.status.supabase = true
      this.status.error = null
      this.status.lastCheck = new Date()

      console.log('[API STATUS] Supabase connection successful')
      return true
    } catch (error) {
      this.status.supabase = false
      this.status.error = error.message
      this.status.lastCheck = new Date()

      console.error('[API STATUS] Supabase connection failed:', error)
      return false
    }
  }

  // 获取当前API状态
  getStatus() {
    return {
      ...this.status,
      isOnline: this.status.supabase,
      lastCheckFormatted: this.status.lastCheck ? this.status.lastCheck.toLocaleString() : '从未检查'
    }
  }

  // 开始定期检查
  startPeriodicCheck(intervalMinutes = 5) {
    // 先执行一次检查
    this.checkSupabaseConnection()

    // 设置定期检查
    this.checkInterval = setInterval(() => {
      this.checkSupabaseConnection()
    }, intervalMinutes * 60 * 1000)

    console.log(`[API STATUS] Started periodic checks every ${intervalMinutes} minutes`)
  }

  // 停止定期检查
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('[API STATUS] Stopped periodic checks')
    }
  }

  // 获取连接状态指示器
  getConnectionIndicator() {
    const status = this.getStatus()

    return {
      status: status.isOnline ? 'connected' : 'disconnected',
      color: status.isOnline ? '#10b981' : '#ef4444',
      message: status.isOnline ? 'API连接正常' : 'API连接失败',
      lastCheck: status.lastCheckFormatted,
      error: status.error
    }
  }

  // 显示状态通知
  showStatusNotification() {
    const status = this.getConnectionIndicator()

    // 创建状态通知元素
    const notification = document.createElement('div')
    notification.className = 'api-status-notification'
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${status.color};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
          opacity: 0.9;
        "></div>
        ${status.message}
        ${status.error ? `<div style="font-size: 12px; opacity: 0.8;">${status.error}</div>` : ''}
      </div>
    `

    document.body.appendChild(notification)

    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
}

// 创建单例实例
const apiStatusService = new ApiStatusService()

export default apiStatusService