// 测试前端fileService的背景文件获取功能
const { createClient } = require('@supabase/supabase-js');

// 使用前端相同的配置
const supabaseUrl = 'https://vcgythhenulnwuindgyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Uj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// 模拟前端fileService的getBackgroundsList函数
async function getBackgroundsList(theme = null) {
  try {
    const allFiles = [];
    const searchThemes = theme ? [theme] : ['light', 'dark'];
    
    for (const searchTheme of searchThemes) {
      console.log(`\n获取 ${searchTheme} 主题文件...`);
      
      const { data, error } = await supabase.storage
        .from('backgrounds')
        .list(searchTheme, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.warn(`获取${searchTheme}主题背景列表失败:`, error);
        continue;
      }
      
      console.log(`${searchTheme} 主题原始数据:`, data);
      
      const themeFiles = data?.map(file => {
        // 从文件名中提取ID（去掉主题后缀和扩展名）
        const fileId = file.name.split('_')[0];
        const fileData = {
          id: fileId,
          name: file.name,
          path: `${searchTheme}/${file.name}`,
          url: supabase.storage.from('backgrounds').getPublicUrl(`${searchTheme}/${file.name}`).data.publicUrl,
          size: file.metadata?.size,
          createdAt: file.created_at,
          theme: searchTheme
        };
        
        console.log(`处理文件:`, {
          原始名称: file.name,
          提取ID: fileId,
          完整路径: fileData.path,
          公共URL: fileData.url
        });
        
        return fileData;
      }) || [];
      
      allFiles.push(...themeFiles);
    }
    
    // 按创建时间排序
    const sortedFiles = allFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('\n=== 最终文件列表 ===');
    sortedFiles.forEach((file, index) => {
      console.log(`文件 ${index + 1}:`, {
        id: file.id,
        name: file.name,
        path: file.path,
        theme: file.theme,
        url: file.url
      });
    });
    
    return sortedFiles;
  } catch (error) {
    console.error('获取背景图片列表失败:', error);
    throw error;
  }
}

// 测试背景设置获取
async function testBackgroundSettings() {
  console.log('\n=== 测试背景设置获取 ===');
  
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['background_light', 'background_dark']);
    
    if (error) {
      console.error('获取背景设置失败:', error);
      return;
    }
    
    console.log('背景设置:');
    settings.forEach(setting => {
      console.log(`${setting.key}: ${setting.value}`);
    });
    
    return settings;
  } catch (error) {
    console.error('测试背景设置时出错:', error);
  }
}

// 主测试函数
async function runTest() {
  console.log('=== 测试前端fileService功能 ===');
  
  try {
    // 1. 测试背景设置获取
    const settings = await testBackgroundSettings();
    
    // 2. 测试文件列表获取
    console.log('\n=== 测试文件列表获取 ===');
    const files = await getBackgroundsList();
    
    // 3. 模拟前端查找逻辑
    console.log('\n=== 模拟前端查找逻辑 ===');
    if (settings) {
      for (const setting of settings) {
        const backgroundSetting = setting.value;
        const theme = setting.key.replace('background_', '');
        
        console.log(`\n查找 ${theme} 主题背景: ${backgroundSetting}`);
        
        const currentFile = files.find(file => 
          file.id === backgroundSetting || 
          file.name === backgroundSetting || 
          file.path === backgroundSetting
        );
        
        if (currentFile) {
          console.log(`✅ 找到匹配文件:`, currentFile);
        } else {
          console.log(`❌ 未找到匹配文件`);
          console.log(`可用文件:`, files.map(f => ({ id: f.id, name: f.name, path: f.path })));
        }
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

runTest().catch(console.error);