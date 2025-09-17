// 调试文件匹配逻辑
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './ai-notebook/frontend/.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function debugFileMatching() {
  try {
    console.log('=== 调试文件匹配逻辑 ===')
    
    // 1. 获取当前背景设置
    console.log('\n1. 获取当前背景设置:')
    const { data: lightSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'background_light')
      .single()
    
    const { data: darkSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'background_dark')
      .single()
    
    console.log('Light background setting:', lightSetting?.value)
    console.log('Dark background setting:', darkSetting?.value)
    
    // 2. 获取文件列表
    console.log('\n2. 获取文件列表:')
    const allFiles = []
    const themes = ['light', 'dark']
    
    for (const theme of themes) {
      const { data, error } = await supabase.storage
        .from('backgrounds')
        .list(theme, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) {
        console.warn(`获取${theme}主题背景列表失败:`, error)
        continue
      }
      
      const themeFiles = data?.map(file => {
        // 从文件名中提取ID（去掉主题后缀和扩展名）
        const fileId = file.name.split('_')[0]
        return {
          id: fileId,
          name: file.name,
          path: `${theme}/${file.name}`,
          url: supabase.storage.from('backgrounds').getPublicUrl(`${theme}/${file.name}`).data.publicUrl,
          theme: theme
        }
      }) || []
      
      allFiles.push(...themeFiles)
    }
    
    console.log('所有文件:', allFiles.map(f => ({ id: f.id, name: f.name, path: f.path, theme: f.theme })))
    
    // 3. 测试匹配逻辑
    console.log('\n3. 测试匹配逻辑:')
    const testSettings = [lightSetting?.value, darkSetting?.value].filter(Boolean)
    
    for (const setting of testSettings) {
      console.log(`\n查找设置: ${setting}`)
      
      // 模拟前端查找逻辑
      const matchedFile = allFiles.find(file => 
        file.id === setting || 
        file.name === setting || 
        file.path === setting
      )
      
      if (matchedFile) {
        console.log('✅ 找到匹配文件:', {
          id: matchedFile.id,
          name: matchedFile.name,
          path: matchedFile.path,
          url: matchedFile.url,
          theme: matchedFile.theme
        })
      } else {
        console.log('❌ 未找到匹配文件')
        console.log('可用文件ID:', allFiles.map(f => f.id))
        console.log('可用文件名:', allFiles.map(f => f.name))
        console.log('可用文件路径:', allFiles.map(f => f.path))
      }
    }
    
  } catch (error) {
    console.error('调试失败:', error)
  }
}

debugFileMatching()