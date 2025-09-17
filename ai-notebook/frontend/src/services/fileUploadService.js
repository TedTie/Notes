/**
 * 文件上传服务
 * 使用 Supabase Storage 替代本地文件系统
 */

import { fileService } from './supabaseService'

const fileUploadService = {
  /**
   * 上传背景文件
   * @param {File} file - 要上传的文件
   * @param {string} theme - 主题 ('light' 或 'dark')
   * @returns {Promise<{url: string, filename: string}>}
   */
  async uploadBackground(file, theme = 'light') {
    try {
      console.log('[UPLOAD] 开始上传背景文件:', file.name, '主题:', theme)
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`不支持的文件类型: ${file.type}`)
      }
      
      // 验证文件大小 (50MB)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`文件大小超过限制 (${Math.round(file.size / 1024 / 1024)}MB > 50MB)`)
      }
      
      console.log('[UPLOAD] 使用Supabase上传文件...')
      
      // 使用Supabase Storage上传文件，传递主题参数
      const result = await fileService.uploadBackground(file, theme)
      console.log('[UPLOAD] 上传成功:', result)
      
      return {
        url: result.url,
        filename: result.fileName,
        size: file.size,
        type: file.type,
        theme: result.theme
      }
      
    } catch (error) {
      console.error('[UPLOAD] 上传过程中发生错误:', error)
      throw error
    }
  },
  
  /**
   * 获取背景文件列表
   * @param {string} theme - 主题筛选 ('light', 'dark' 或 null 获取全部)
   * @returns {Promise<Array>}
   */
  async getBackgrounds(theme = null) {
    try {
      console.log('[UPLOAD] 获取背景文件列表...', theme ? `主题: ${theme}` : '全部主题')
      
      const backgrounds = await fileService.getBackgroundsList(theme)
      console.log('[UPLOAD] 获取到背景文件:', backgrounds.length, '个')
      
      return backgrounds
      
    } catch (error) {
      console.error('[UPLOAD] 获取背景列表失败:', error)
      return []
    }
  },
  
  /**
   * 删除背景文件
   * @param {string} fileId - 文件ID
   * @param {string} theme - 主题 ('light', 'dark' 或 null 自动查找)
   * @returns {Promise<boolean>}
   */
  async deleteBackground(fileId, theme = null) {
    try {
      console.log('[UPLOAD] 删除背景文件:', fileId, theme ? `主题: ${theme}` : '自动查找')
      
      const result = await fileService.deleteBackground(fileId, theme)
      
      if (result && result.success) {
        console.log('[UPLOAD] 文件删除成功')
        return true
      } else {
        throw new Error('删除文件失败')
      }
      
    } catch (error) {
      console.error('[UPLOAD] 删除文件失败:', error)
      return false
    }
  }
}

// 导出默认服务
export default fileUploadService