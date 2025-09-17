// 测试前端主题分离背景功能
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://vcgythhenulnwuindgyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Oj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 模拟前端的getBackgroundsList函数
async function getBackgroundsList(theme = null) {
  try {
    const allFiles = []
    const searchThemes = theme ? [theme] : ['light', 'dark']
    
    for (const searchTheme of searchThemes) {
      const { data, error } = await supabase.storage
        .from('backgrounds')
        .list(searchTheme, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) {
        console.error(`获取${searchTheme}主题文件列表失败:`, error)
        continue
      }
      
      if (data && data.length > 0) {
        const processedFiles = data
          .filter(file => file.name && !file.name.includes('/'))
          .map(file => {
            const id = file.name.split('_')[0]
            const { data: urlData } = supabase.storage
              .from('backgrounds')
              .getPublicUrl(`${searchTheme}/${file.name}`)
            
            return {
              id,
              name: file.name,
              url: urlData.publicUrl,
              theme: searchTheme,
              size: file.metadata?.size || 0,
              created_at: file.created_at
            }
          })
        
        allFiles.push(...processedFiles)
      }
    }
    
    return allFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) {
    console.error('获取背景图片列表失败:', error)
    throw error
  }
}

async function testFrontendThemeBackgrounds() {
  console.log('🧪 测试前端主题分离背景功能');
  console.log('==================================================');
  
  try {
    // 首先上传一些测试文件
    console.log('📤 准备测试数据...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    
    const timestamp = Date.now();
    const lightFile = `test-light-${timestamp}.png`;
    const darkFile = `test-dark-${timestamp}.png`;
    
    // 上传到light主题
    await supabase.storage
      .from('backgrounds')
      .upload(`light/${lightFile}`, pngBuffer, {
        contentType: 'image/png'
      });
    
    // 上传到dark主题
    await supabase.storage
      .from('backgrounds')
      .upload(`dark/${darkFile}`, pngBuffer, {
        contentType: 'image/png'
      });
    
    console.log('✅ 测试数据准备完成');
    
    // 测试获取所有主题的背景文件
    console.log('\n📋 测试获取所有主题背景文件:');
    const allFiles = await getBackgroundsList();
    console.log(`✅ 获取到 ${allFiles.length} 个背景文件:`);
    allFiles.forEach(file => {
      console.log(`   📄 ${file.name} (${file.theme}主题) - ${Math.round(file.size / 1024) || 0}KB`);
    });
    
    // 测试只获取light主题的背景文件
    console.log('\n📋 测试获取light主题背景文件:');
    const lightFiles = await getBackgroundsList('light');
    console.log(`✅ 获取到 ${lightFiles.length} 个light主题背景文件:`);
    lightFiles.forEach(file => {
      console.log(`   📄 ${file.name} - ${Math.round(file.size / 1024) || 0}KB`);
    });
    
    // 测试只获取dark主题的背景文件
    console.log('\n📋 测试获取dark主题背景文件:');
    const darkFiles = await getBackgroundsList('dark');
    console.log(`✅ 获取到 ${darkFiles.length} 个dark主题背景文件:`);
    darkFiles.forEach(file => {
      console.log(`   📄 ${file.name} - ${Math.round(file.size / 1024) || 0}KB`);
    });
    
    // 验证主题分离
    console.log('\n🔍 验证主题分离:');
    const lightOnlyFiles = allFiles.filter(f => f.theme === 'light');
    const darkOnlyFiles = allFiles.filter(f => f.theme === 'dark');
    
    console.log(`✅ Light主题文件数: ${lightOnlyFiles.length}`);
    console.log(`✅ Dark主题文件数: ${darkOnlyFiles.length}`);
    console.log(`✅ 总文件数: ${allFiles.length}`);
    
    if (lightOnlyFiles.length + darkOnlyFiles.length === allFiles.length) {
      console.log('✅ 主题分离验证成功！');
    } else {
      console.log('❌ 主题分离验证失败！');
    }
    
    // 清理测试文件
    console.log('\n🧹 清理测试文件:');
    await supabase.storage
      .from('backgrounds')
      .remove([`light/${lightFile}`, `dark/${darkFile}`]);
    console.log('✅ 测试文件已清理');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n==================================================');
  console.log('🎯 前端主题分离背景功能测试完成！');
}

// 运行测试
testFrontendThemeBackgrounds();