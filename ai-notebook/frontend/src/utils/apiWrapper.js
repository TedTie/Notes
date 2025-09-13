/**
 * API调用包装器
 * 提供统一的错误处理、重试和超时机制
 */

import { errorHandler } from './errorHandler.js';
import API_CONFIG from '../config/api.js';

class APIWrapper {
  constructor() {
    this.baseURL = API_CONFIG.API_BASE_URL;
    this.defaultTimeout = 30000; // 30秒默认超时
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.demoMode = API_CONFIG.DEMO_MODE;
  }

  /**
   * 创建请求配置
   */
  createRequestConfig(method, data = null, options = {}) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: options.signal, // 用于取消请求
      ...options
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    return config;
  }

  /**
   * 创建超时控制器
   */
  createTimeoutController(timeout = this.defaultTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    return {
      controller,
      timeoutId,
      cleanup: () => clearTimeout(timeoutId)
    };
  }

  /**
   * 执行HTTP请求
   */
  async request(endpoint, method = 'GET', data = null, options = {}) {
    // 检查是否处于演示模式
    if (this.demoMode) {
      return {
        success: false,
        error: '当前处于演示模式，后端服务不可用。请在本地环境中体验完整功能。',
        status: 503,
        demoMode: true
      };
    }
    
    const url = `${this.baseURL}${endpoint}`;
    const timeout = options.timeout || this.defaultTimeout;
    const maxRetries = options.maxRetries || this.maxRetries;
    
    const timeoutController = this.createTimeoutController(timeout);
    
    try {
      const requestConfig = this.createRequestConfig(method, data, {
        ...options,
        signal: timeoutController.controller.signal
      });

      const result = await errorHandler.executeWithRetry(
        async () => {
          const response = await fetch(url, requestConfig);
          
          // 清理超时定时器
          timeoutController.cleanup();
          
          // 检查响应状态
          if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.response = response;
            error.status = response.status;
            throw error;
          }
          
          // 解析响应数据
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          } else {
            return await response.text();
          }
        },
        { endpoint, method, attempt: 0 },
        { maxRetries, retryDelay: this.retryDelay }
      );
      
      return {
        success: true,
        data: result,
        status: 200
      };
      
    } catch (error) {
      // 清理超时定时器
      timeoutController.cleanup();
      
      // 处理不同类型的错误
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '请求超时，请稍后重试',
          status: 408,
          originalError: error.message
        };
      }
      
      if (error.response) {
        const status = error.response.status;
        let errorMessage = errorHandler.getUserFriendlyMessage(error);
        
        // 尝试解析错误响应
        try {
          const errorData = await error.response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // 如果无法解析JSON，使用默认消息
        }
        
        return {
          success: false,
          error: errorMessage,
          status: status,
          originalError: error.message
        };
      }
      
      // 网络错误或其他错误
      return {
        success: false,
        error: errorHandler.getUserFriendlyMessage(error),
        status: 0,
        originalError: error.message
      };
      
    } finally {
      // 确保清理超时定时器
      timeoutController.cleanup();
    }
  }

  /**
   * GET请求
   */
  async get(endpoint, params = null, options = {}) {
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    
    return this.request(url, 'GET', null, options);
  }

  /**
   * POST请求
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, 'POST', data, options);
  }

  /**
   * PUT请求
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, 'PUT', data, options);
  }

  /**
   * DELETE请求
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, 'DELETE', null, options);
  }

  /**
   * 上传文件
   */
  async upload(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加其他表单数据
    if (options.data) {
      Object.keys(options.data).forEach(key => {
        formData.append(key, options.data[key]);
      });
    }
    
    const uploadOptions = {
      ...options,
      headers: {
        // 不要设置Content-Type，让浏览器自动设置
        ...options.headers
      },
      timeout: options.timeout || 120000 // 文件上传默认2分钟超时
    };
    
    return this.request(endpoint, 'POST', formData, uploadOptions);
  }

  /**
   * 批量请求
   */
  async batch(requests, options = {}) {
    const batchSize = options.batchSize || 5;
    const results = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => 
        this.request(request.endpoint, request.method, request.data, request.options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
    );
  }

  /**
   * 创建取消令牌
   */
  createCancelToken() {
    return new AbortController();
  }

  /**
   * 设置基础URL
   */
  setBaseURL(url) {
    this.baseURL = url.replace(/\/$/, ''); // 移除末尾的斜杠
  }

  /**
   * 设置默认超时时间
   */
  setDefaultTimeout(timeout) {
    this.defaultTimeout = timeout;
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor) {
    // 预留：实现请求拦截器逻辑
    console.warn('Request interceptors not implemented yet');
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor) {
    // 预留：实现响应拦截器逻辑
    console.warn('Response interceptors not implemented yet');
  }
}

// 创建全局API包装器实例
export const api = new APIWrapper();

// 便捷函数
export const {
  get,
  post,
  put,
  delete: remove,
  upload,
  batch,
  setBaseURL,
  setDefaultTimeout,
  createCancelToken
} = api;

export default api;