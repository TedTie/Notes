/**
 * 前端时间处理工具类
 * 与后端TimeUtils保持一致，确保时间显示的统一性
 */

class TimeUtils {
  /**
   * 格式化日期为本地化字符串
   * @param {string|Date} dateInput - 日期字符串或Date对象
   * @param {string} locale - 语言环境，默认为'zh-CN'
   * @returns {string} 格式化后的日期字符串
   */
  static formatDate(dateInput, locale = 'zh-CN') {
    if (!dateInput) return ''
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleDateString(locale)
  }

  /**
   * 格式化时间为本地化字符串
   * @param {string|Date} dateInput - 日期字符串或Date对象
   * @param {string} locale - 语言环境，默认为'zh-CN'
   * @returns {string} 格式化后的时间字符串
   */
  static formatTime(dateInput, locale = 'zh-CN') {
    if (!dateInput) return ''
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * 格式化日期时间为本地化字符串
   * @param {string|Date} dateInput - 日期字符串或Date对象
   * @param {string} locale - 语言环境，默认为'zh-CN'
   * @returns {string} 格式化后的日期时间字符串
   */
  static formatDateTime(dateInput, locale = 'zh-CN') {
    if (!dateInput) return ''
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleString(locale)
  }

  /**
   * 检查日期是否过期
   * @param {string|Date} dateInput - 日期字符串或Date对象
   * @returns {boolean} 是否过期
   */
  static isOverdue(dateInput) {
    if (!dateInput) return false
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return false
    
    return date < new Date()
  }

  /**
   * 获取相对时间描述（如：刚刚、5分钟前、2小时前等）
   * @param {string|Date} dateInput - 日期字符串或Date对象
   * @param {string} locale - 语言环境，默认为'zh-CN'
   * @returns {string} 相对时间描述
   */
  static getRelativeTime(dateInput, locale = 'zh-CN') {
    if (!dateInput) return ''
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return ''
    
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (locale === 'zh-CN') {
      if (diffMinutes < 1) return '刚刚'
      if (diffMinutes < 60) return `${diffMinutes}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      if (diffDays < 7) return `${diffDays}天前`
      return this.formatDate(date, locale)
    } else {
      if (diffMinutes < 1) return 'just now'
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      return this.formatDate(date, locale)
    }
  }

  /**
   * 将日期转换为ISO字符串（用于发送到后端）
   * @param {Date} date - Date对象
   * @returns {string} ISO格式的日期字符串
   */
  static toISOString(date) {
    if (!date || !(date instanceof Date)) return null
    return date.toISOString()
  }

  /**
   * 从ISO字符串解析日期
   * @param {string} isoString - ISO格式的日期字符串
   * @returns {Date|null} Date对象或null
   */
  static fromISOString(isoString) {
    if (!isoString) return null
    
    try {
      const date = new Date(isoString)
      return isNaN(date.getTime()) ? null : date
    } catch (error) {
      console.warn('Invalid ISO string:', isoString)
      return null
    }
  }

  /**
   * 获取当前本地时间
   * @returns {Date} 当前本地时间
   */
  static now() {
    return new Date()
  }

  /**
   * 格式化时间供显示使用（统一的显示格式）
   * @param {string|Date} dateInput - 日期字符串或Date对象
   * @param {string} locale - 语言环境
   * @returns {string} 格式化后的显示时间
   */
  static formatForDisplay(dateInput, locale = 'zh-CN') {
    if (!dateInput) return ''
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return ''
    
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // 如果是今天，显示时间
    if (diffDays === 0) {
      return this.formatTime(date, locale)
    }
    // 如果是昨天，显示"昨天"
    else if (diffDays === 1) {
      return locale === 'zh-CN' ? '昨天' : 'Yesterday'
    }
    // 如果是一周内，显示相对时间
    else if (diffDays < 7) {
      return this.getRelativeTime(date, locale)
    }
    // 否则显示完整日期
    else {
      return this.formatDate(date, locale)
    }
  }
}

export default TimeUtils