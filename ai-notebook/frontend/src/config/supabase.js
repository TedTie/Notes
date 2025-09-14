/**
 * Supabase客户端配置
 * 用于连接Supabase后端服务
 */

import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase配置缺失，请检查环境变量：')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '已设置' : '未设置')
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 由于这是单用户应用，我们不需要持久化会话
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    // 启用实时功能
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'ai-notebook-frontend'
    }
  }
})

// 导出配置信息
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: !!(supabaseUrl && supabaseAnonKey)
}

// 测试连接函数
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1)
    
    if (error) {
      console.error('Supabase连接测试失败:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Supabase连接测试成功')
    return { success: true, data }
  } catch (error) {
    console.error('Supabase连接测试异常:', error)
    return { success: false, error: error.message }
  }
}

// 获取存储桶URL
export function getStorageUrl(bucket, path) {
  if (!supabaseUrl || !path) return null
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

// 获取背景图片URL
export function getBackgroundImageUrl(imagePath) {
  return getStorageUrl('backgrounds', imagePath)
}

// 实时订阅管理器
export class RealtimeManager {
  constructor() {
    this.subscriptions = new Map()
  }
  
  // 订阅表变更
  subscribe(table, callback, filter = null) {
    const subscriptionKey = `${table}_${filter || 'all'}`
    
    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`已存在对表 ${table} 的订阅`)
      return this.subscriptions.get(subscriptionKey)
    }
    
    let subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      }, callback)
      .subscribe()
    
    this.subscriptions.set(subscriptionKey, subscription)
    console.log(`已订阅表 ${table} 的变更`)
    
    return subscription
  }
  
  // 取消订阅
  unsubscribe(table, filter = null) {
    const subscriptionKey = `${table}_${filter || 'all'}`
    const subscription = this.subscriptions.get(subscriptionKey)
    
    if (subscription) {
      supabase.removeChannel(subscription)
      this.subscriptions.delete(subscriptionKey)
      console.log(`已取消对表 ${table} 的订阅`)
    }
  }
  
  // 取消所有订阅
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription)
    }
    this.subscriptions.clear()
    console.log('已取消所有实时订阅')
  }
}

// 创建全局实时管理器实例
export const realtimeManager = new RealtimeManager()

// 错误处理工具
export function handleSupabaseError(error, context = '') {
  console.error(`Supabase错误 ${context}:`, error)
  
  // 根据错误类型返回用户友好的消息
  if (error.code === 'PGRST116') {
    return '请求的资源不存在'
  } else if (error.code === 'PGRST301') {
    return '权限不足，无法访问该资源'
  } else if (error.message?.includes('connection')) {
    return '网络连接失败，请检查网络设置'
  } else if (error.message?.includes('timeout')) {
    return '请求超时，请稍后重试'
  } else {
    return error.message || '未知错误'
  }
}

// 批量操作工具
export class BatchOperations {
  constructor(batchSize = 100) {
    this.batchSize = batchSize
  }
  
  // 批量插入
  async batchInsert(table, data) {
    const results = []
    
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize)
      const { data: result, error } = await supabase
        .from(table)
        .insert(batch)
        .select()
      
      if (error) {
        throw error
      }
      
      results.push(...(result || []))
    }
    
    return results
  }
  
  // 批量更新
  async batchUpdate(table, updates) {
    const results = []
    
    for (const update of updates) {
      const { id, ...data } = update
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
      
      if (error) {
        throw error
      }
      
      results.push(...(result || []))
    }
    
    return results
  }
  
  // 批量删除
  async batchDelete(table, ids) {
    const results = []
    
    for (let i = 0; i < ids.length; i += this.batchSize) {
      const batch = ids.slice(i, i + this.batchSize)
      const { data: result, error } = await supabase
        .from(table)
        .delete()
        .in('id', batch)
        .select()
      
      if (error) {
        throw error
      }
      
      results.push(...(result || []))
    }
    
    return results
  }
}

// 创建批量操作实例
export const batchOps = new BatchOperations()

// 导出默认客户端
export default supabase