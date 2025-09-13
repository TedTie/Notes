/**
 * 错误处理工具模块
 * 提供统一的错误处理和恢复机制
 */

class ErrorHandler {
  constructor() {
    this.errorCallbacks = new Map();
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000, // 初始延迟1秒
      backoffMultiplier: 2,
      maxRetryDelay: 30000 // 最大30秒
    };
  }

  /**
   * 注册错误回调
   */
  registerCallback(errorType, callback) {
    if (!this.errorCallbacks.has(errorType)) {
      this.errorCallbacks.set(errorType, []);
    }
    this.errorCallbacks.get(errorType).push(callback);
  }

  /**
   * 触发错误回调
   */
  triggerCallbacks(errorType, error, context = {}) {
    const callbacks = this.errorCallbacks.get(errorType) || [];
    callbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (cbError) {
        console.error('Error in error callback:', cbError);
      }
    });
  }

  /**
   * 分类错误类型
   */
  classifyError(error) {
    if (error.response) {
      // HTTP错误
      const status = error.response.status;
      if (status >= 500) return 'SERVER_ERROR';
      if (status === 429) return 'RATE_LIMIT_ERROR';
      if (status === 401) return 'AUTHENTICATION_ERROR';
      if (status === 403) return 'AUTHORIZATION_ERROR';
      if (status >= 400) return 'CLIENT_ERROR';
    }
    
    if (error.code === 'NETWORK_ERROR') return 'NETWORK_ERROR';
    if (error.code === 'TIMEOUT') return 'TIMEOUT_ERROR';
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'TypeError') return 'TYPE_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(error, context = {}) {
    const errorType = this.classifyError(error);
    
    const messages = {
      'SERVER_ERROR': '服务器暂时不可用，请稍后重试',
      'NETWORK_ERROR': '网络连接失败，请检查网络连接',
      'TIMEOUT_ERROR': '请求超时，请稍后重试',
      'RATE_LIMIT_ERROR': '请求过于频繁，请稍后再试',
      'AUTHENTICATION_ERROR': '身份验证失败，请重新登录',
      'AUTHORIZATION_ERROR': '权限不足，无法执行此操作',
      'CLIENT_ERROR': '请求参数错误，请检查输入',
      'VALIDATION_ERROR': '数据验证失败，请检查输入内容',
      'TYPE_ERROR': '数据类型错误，请联系技术支持',
      'UNKNOWN_ERROR': '发生未知错误，请稍后重试'
    };
    
    return messages[errorType] || '发生未知错误，请稍后重试';
  }

  /**
   * 执行带重试的异步操作
   */
  async executeWithRetry(asyncFunction, context = {}, options = {}) {
    const config = { ...this.retryConfig, ...options };
    let lastError = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await asyncFunction();
      } catch (error) {
        lastError = error;
        const errorType = this.classifyError(error);
        
        // 触发错误回调
        this.triggerCallbacks(errorType, error, { ...context, attempt });
        
        // 如果是不可重试的错误，立即抛出
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // 最后一次尝试失败，抛出错误
        if (attempt === config.maxRetries) {
          console.error(`Operation failed after ${config.maxRetries} retries:`, error);
          throw error;
        }
        
        // 计算延迟时间（指数退避）
        const delay = Math.min(
          config.retryDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxRetryDelay
        );
        
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * 判断是否为不可重试的错误
   */
  isNonRetryableError(error) {
    const nonRetryableTypes = [
      'AUTHENTICATION_ERROR',
      'AUTHORIZATION_ERROR',
      'VALIDATION_ERROR',
      'CLIENT_ERROR'
    ];
    
    const errorType = this.classifyError(error);
    return nonRetryableTypes.includes(errorType);
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建错误边界包装器
   */
  createErrorBoundary(componentName, fallbackFunction) {
    return async (originalFunction, ...args) => {
      try {
        return await originalFunction(...args);
      } catch (error) {
        console.error(`Error in ${componentName}:`, error);
        
        // 触发错误回调
        this.triggerCallbacks('COMPONENT_ERROR', error, { componentName });
        
        // 如果提供了回退函数，执行它
        if (fallbackFunction) {
          try {
            return await fallbackFunction(error, ...args);
          } catch (fallbackError) {
            console.error('Fallback function failed:', fallbackError);
          }
        }
        
        // 返回用户友好的错误信息
        return {
          success: false,
          error: this.getUserFriendlyMessage(error),
          originalError: error.message
        };
      }
    };
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error, retryFunction) {
    if (navigator.onLine === false) {
      return {
        success: false,
        error: '网络连接已断开，请检查网络连接',
        offline: true
      };
    }
    
    if (retryFunction) {
      return this.executeWithRetry(retryFunction, { type: 'network' });
    }
    
    throw error;
  }

  /**
   * 记录错误到日志服务（预留接口）
   */
  async logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      type: this.classifyError(error),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // 这里可以发送到后端日志服务
    console.error('Logging error:', errorInfo);
    
    // 预留：发送到后端
    // try {
    //   await fetch('/api/logs/error', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorInfo)
    //   });
    // } catch (logError) {
    //   console.error('Failed to log error:', logError);
    // }
  }

  /**
   * 批量处理错误
   */
  async handleBatchErrors(items, processFunction, options = {}) {
    const results = [];
    const errors = [];
    
    const batchSize = options.batchSize || 10;
    const continueOnError = options.continueOnError !== false;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item, index) => {
        try {
          const result = await processFunction(item, i + index);
          return { success: true, result, item };
        } catch (error) {
          const errorInfo = { 
            item, 
            error, 
            index: i + index,
            errorType: this.classifyError(error)
          };
          
          errors.push(errorInfo);
          
          if (!continueOnError) {
            throw error;
          }
          
          return { success: false, error: errorInfo };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }
    
    return {
      results: results.filter(r => r.status === 'fulfilled').map(r => r.value),
      errors: errors,
      successRate: (results.length - errors.length) / results.length
    };
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler();

// 便捷函数
export const {
  executeWithRetry,
  createErrorBoundary,
  handleNetworkError,
  getUserFriendlyMessage,
  classifyError,
  logError,
  handleBatchErrors
} = errorHandler;

export default errorHandler;