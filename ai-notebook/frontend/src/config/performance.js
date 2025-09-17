// 性能优化配置
export const PERFORMANCE_CONFIG = {
  // 缓存配置
  cache: {
    // 番茄时钟统计缓存时间（毫秒）
    pomodoroStats: {
      today: 60000,    // 1分钟
      week: 300000     // 5分钟
    },
    // 番茄时钟会话缓存时间
    pomodoroSessions: 30000,  // 30秒
    // 设置缓存时间
    settings: 300000,         // 5分钟
    // 待办事项缓存时间
    todos: 120000            // 2分钟
  },
  
  // API调用优化
  api: {
    // 延迟加载时间（毫秒）
    delayedLoadTime: 200,
    // 请求超时时间
    timeout: 10000,
    // 重试次数
    retryCount: 3,
    // 重试延迟
    retryDelay: 1000
  },
  
  // UI优化
  ui: {
    // 页面加载动画延迟
    pageLoadDelay: 100,
    // 防抖延迟
    debounceDelay: 300,
    // 节流延迟
    throttleDelay: 100
  },
  
  // Vercel部署优化
  vercel: {
    // 启用预加载
    enablePreload: true,
    // 启用服务端渲染优化
    enableSSROptimization: true,
    // 启用静态资源缓存
    enableStaticCache: true
  }
}

// 缓存工具函数
export class CacheManager {
  constructor(ttl = 300000) {
    this.cache = new Map()
    this.ttl = ttl
  }
  
  set(key, value, customTTL = null) {
    const expiry = Date.now() + (customTTL || this.ttl)
    this.cache.set(key, { value, expiry })
  }
  
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  delete(key) {
    this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
  
  // 清理过期缓存
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// 防抖函数
export function debounce(func, delay = PERFORMANCE_CONFIG.ui.debounceDelay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// 节流函数
export function throttle(func, delay = PERFORMANCE_CONFIG.ui.throttleDelay) {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      return func.apply(this, args)
    }
  }
}

// API重试函数
export async function retryAPI(apiCall, maxRetries = PERFORMANCE_CONFIG.api.retryCount) {
  let lastError
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      if (i < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, PERFORMANCE_CONFIG.api.retryDelay * (i + 1))
        )
      }
    }
  }
  
  throw lastError
}