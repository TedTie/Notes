const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.log('需要设置: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initSettingsData() {
  console.log('🔍 检查settings表状态...')
  
  try {
    // 检查settings表是否存在数据
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('key')
      .limit(1)
    
    if (checkError) {
      console.error('❌ 检查settings表失败:', checkError)
      return
    }
    
    console.log(`📊 当前settings表中有 ${existingSettings?.length || 0} 条记录`)
    
    // 如果没有数据，插入默认设置
    if (!existingSettings || existingSettings.length === 0) {
      console.log('📝 插入默认设置数据...')
      
      const defaultSettings = [
        { key: 'theme', value: 'auto', setting_type: 'string' },
        { key: 'language', value: 'zh-CN', setting_type: 'string' },
        { key: 'font_family', value: 'system-ui', setting_type: 'string' },
        { key: 'auto_save', value: 'true', setting_type: 'boolean' },
        { key: 'pomodoro_work_duration', value: '25', setting_type: 'integer' },
        { key: 'pomodoro_short_break', value: '5', setting_type: 'integer' },
        { key: 'pomodoro_long_break', value: '15', setting_type: 'integer' },
        { key: 'pomodoro_sessions_until_long_break', value: '4', setting_type: 'integer' },
        { key: 'ai_provider', value: 'openrouter', setting_type: 'string' },
        { key: 'ai_model', value: 'deepseek/deepseek-chat-v3.1:free', setting_type: 'string' },
        { key: 'ai_max_tokens', value: '1000', setting_type: 'integer' },
        { key: 'ai_temperature', value: '0.7', setting_type: 'string' },
        { key: 'background_light', value: '', setting_type: 'string' },
        { key: 'background_dark', value: '', setting_type: 'string' }
      ]
      
      const { data: insertData, error: insertError } = await supabase
        .from('settings')
        .insert(defaultSettings)
        .select()
      
      if (insertError) {
        console.error('❌ 插入默认设置失败:', insertError)
        return
      }
      
      console.log(`✅ 成功插入 ${insertData.length} 条默认设置`)
    } else {
      console.log('✅ settings表已有数据，无需初始化')
    }
    
    // 验证特定设置是否存在
    const { data: backgroundSettings, error: bgError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['background_light', 'background_dark'])
    
    if (bgError) {
      console.error('❌ 检查背景设置失败:', bgError)
      return
    }
    
    console.log('🎨 背景设置状态:')
    console.log('background_light:', backgroundSettings.find(s => s.key === 'background_light')?.value || '未设置')
    console.log('background_dark:', backgroundSettings.find(s => s.key === 'background_dark')?.value || '未设置')
    
    // 如果背景设置不存在，添加它们
    const existingKeys = backgroundSettings.map(s => s.key)
    const missingSettings = []
    
    if (!existingKeys.includes('background_light')) {
      missingSettings.push({ key: 'background_light', value: '', setting_type: 'string' })
    }
    if (!existingKeys.includes('background_dark')) {
      missingSettings.push({ key: 'background_dark', value: '', setting_type: 'string' })
    }
    
    if (missingSettings.length > 0) {
      console.log(`📝 添加缺失的背景设置 (${missingSettings.length} 项)...`)
      const { error: addError } = await supabase
        .from('settings')
        .insert(missingSettings)
      
      if (addError) {
        console.error('❌ 添加背景设置失败:', addError)
      } else {
        console.log('✅ 成功添加背景设置')
      }
    }
    
    console.log('🎉 settings表初始化完成！')
    
  } catch (error) {
    console.error('❌ 初始化过程中发生错误:', error)
  }
}

initSettingsData()