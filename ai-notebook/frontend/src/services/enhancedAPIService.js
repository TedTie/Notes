/**
 * 增强版API服务
 * 集成错误处理、重试、超时和连接池管理
 */

import { errorHandler } from '../utils/errorHandler.js';
import { api } from '../utils/apiWrapper.js';

class EnhancedAPIService {
  constructor() {
    this.baseURL = '';
    this.requestQueue = [];
    this.isProcessing = false;
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    
    this.setupNetworkListeners();
  }

  /**
   * 设置网络状态监听器
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * 处理离线队列
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline requests...`);
    
    const failedRequests = [];
    
    for (const request of this.offlineQueue) {
      try {
        await this.executeRequest(request);
      } catch (error) {
        console.error('Failed to process offline request:', error);
        failedRequests.push(request);
      }
    }

    this.offlineQueue = failedRequests;
    
    if (failedRequests.length > 0) {
      console.warn(`${failedRequests.length} requests still failed after going online`);
    }
  }

  /**
   * 执行带错误处理的请求
   */
  async executeRequest(request) {
    return await errorHandler.executeWithRetry(
      async () => {
        const result = await api.request(
          request.endpoint,
          request.method,
          request.data,
          request.options
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      { 
        type: 'api_request',
        endpoint: request.endpoint,
        method: request.method
      }
    );
  }

  /**
   * 通用API请求方法
   */
  async makeRequest(endpoint, method = 'GET', data = null, options = {}) {
    const request = {
      endpoint,
      method,
      data,
      options: {
        ...options,
        maxRetries: options.maxRetries || 3
      }
    };

    // 如果离线，添加到离线队列
    if (!this.isOnline) {
      console.warn('Currently offline, queuing request...');
      this.offlineQueue.push(request);
      return {
        success: false,
        error: '当前离线，请求已加入队列',
        queued: true
      };
    }

    try {
      const result = await this.executeRequest(request);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      // 记录错误
      await errorHandler.logError(error, {
        endpoint,
        method,
        context: 'enhanced_api_service'
      });

      return {
        success: false,
        error: errorHandler.getUserFriendlyMessage(error),
        originalError: error.message
      };
    }
  }

  /**
   * 获取设置
   */
  async getSettings() {
    return await this.makeRequest('/api/settings', 'GET');
  }

  /**
   * 保存设置
   */
  async saveSettings(settings) {
    return await this.makeRequest('/api/settings', 'POST', settings);
  }

  /**
   * 获取笔记列表
   */
  async getNotes() {
    return await this.makeRequest('/api/notes', 'GET');
  }

  /**
   * 获取单个笔记
   */
  async getNote(id) {
    return await this.makeRequest(`/api/notes/${id}`, 'GET');
  }

  /**
   * 创建笔记
   */
  async createNote(note) {
    return await this.makeRequest('/api/notes', 'POST', note);
  }

  /**
   * 更新笔记
   */
  async updateNote(id, note) {
    return await this.makeRequest(`/api/notes/${id}`, 'PUT', note);
  }

  /**
   * 删除笔记
   */
  async deleteNote(id) {
    return await this.makeRequest(`/api/notes/${id}`, 'DELETE');
  }

  /**
   * 获取待办事项
   */
  async getTodos() {
    return await this.makeRequest('/api/todos', 'GET');
  }

  /**
   * 更新待办事项
   */
  async updateTodo(id, updates) {
    return await this.makeRequest(`/api/todos/${id}`, 'PUT', updates);
  }

  /**
   * 获取AI模型列表
   */
  async getAIModels() {
    return await this.makeRequest('/api/ai/models', 'GET');
  }

  /**
   * AI文本处理
   */
  async processTextWithAI(text, action) {
    return await this.makeRequest('/api/ai/action', 'POST', { text, action });
  }

  /**
   * AI聊天
   */
  async chatWithAI(messages, model) {
    return await this.makeRequest('/api/ai/chat', 'POST', { messages, model });
  }

  /**
   * 上传背景文件
   */
  async uploadBackground(file, theme = 'light') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('theme', theme);

    return await this.makeRequest('/api/backgrounds/upload', 'POST', formData, {
      headers: {} // 让浏览器自动设置Content-Type
    });
  }

  /**
   * 获取背景文件列表
   */
  async getBackgrounds() {
    return await this.makeRequest('/api/backgrounds', 'GET');
  }

  /**
   * 删除背景文件
   */
  async deleteBackground(id) {
    return await this.makeRequest(`/api/backgrounds/${id}`, 'DELETE');
  }

  /**
   * 获取番茄钟统计数据
   */
  async getPomodoroStats() {
    return await this.makeRequest('/api/pomodoro/stats', 'GET');
  }

  /**
   * 记录番茄钟会话
   */
  async recordPomodoroSession(sessionData) {
    return await this.makeRequest('/api/pomodoro/sessions', 'POST', sessionData);
  }

  /**
   * 批量操作
   */
  async batchOperations(operations) {
    return await errorHandler.handleBatchErrors(
      operations,
      async (operation) => {
        const result = await this.makeRequest(
          operation.endpoint,
          operation.method,
          operation.data,
          operation.options
        );
        
        return {
          id: operation.id,
          success: result.success,
          data: result.data,
          error: result.error
        };
      },
      { batchSize: 5, continueOnError: true }
    );
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return await this.makeRequest('/api/health', 'GET', null, {
      maxRetries: 1,
      timeout: 5000 // 5秒超时
    });
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus() {
    try {
      const health = await this.healthCheck();
      const isOnline = navigator.onLine;
      
      return {
        healthy: health.success && isOnline,
        online: isOnline,
        health: health.data,
        offlineQueueSize: this.offlineQueue.length
      };
    } catch (error) {
      return {
        healthy: false,
        online: navigator.onLine,
        error: error.message,
        offlineQueueSize: this.offlineQueue.length
      };
    }
  }

  /**
   * 清理离线队列
   */
  clearOfflineQueue() {
    this.offlineQueue = [];
  }

  /**
   * 获取离线队列大小
   */
  getOfflineQueueSize() {
    return this.offlineQueue.length;
  }

  /**
   * 设置基础URL
   */
  setBaseURL(url) {
    api.setBaseURL(url);
  }

  /**
   * 设置默认超时时间
   */
  setDefaultTimeout(timeout) {
    api.setDefaultTimeout(timeout);
  }
}

// 创建全局增强API服务实例
export const enhancedAPI = new EnhancedAPIService();

// 便捷导出
export const {
  getSettings,
  saveSettings,
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getTodos,
  updateTodo,
  getAIModels,
  processTextWithAI,
  chatWithAI,
  uploadBackground,
  getBackgrounds,
  deleteBackground,
  getPomodoroStats,
  recordPomodoroSession,
  batchOperations,
  healthCheck,
  getServiceStatus,
  clearOfflineQueue,
  getOfflineQueueSize,
  setBaseURL,
  setDefaultTimeout
} = enhancedAPI;

export default enhancedAPI;