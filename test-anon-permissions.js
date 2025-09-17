// 测试前端anon key的权限
const { createClient } = require('@supabase/supabase-js');

// 使用前端相同的anon key配置
const supabaseUrl = 'https://vcgythhenulnwuindgyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Uj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function testAnonPermissions() {
  console.log('=== 测试anon key权限 ===');
  
  try {
    // 1. 测试settings表访问
    console.log('\n1. 测试settings表访问...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['background_light', 'background_dark']);
    
    if (settingsError) {
      console.error('❌ settings表访问失败:', settingsError);
    } else {
      console.log('✅ settings表访问成功:', settings);
    }
    
    // 2. 测试storage访问
    console.log('\n2. 测试storage访问...');
    
    // 测试light主题
    console.log('\n2.1 测试light主题文件列表...');
    const { data: lightFiles, error: lightError } = await supabase.storage
      .from('backgrounds')
      .list('light');
    
    if (lightError) {
      console.error('❌ light主题storage访问失败:', lightError);
    } else {
      console.log('✅ light主题storage访问成功:', lightFiles);
    }
    
    // 测试dark主题
    console.log('\n2.2 测试dark主题文件列表...');
    const { data: darkFiles, error: darkError } = await supabase.storage
      .from('backgrounds')
      .list('dark');
    
    if (darkError) {
      console.error('❌ dark主题storage访问失败:', darkError);
    } else {
      console.log('✅ dark主题storage访问成功:', darkFiles);
    }
    
    // 3. 测试公共URL生成
    console.log('\n3. 测试公共URL生成...');
    if (lightFiles && lightFiles.length > 0) {
      const testFile = lightFiles[0];
      const { data: urlData } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(`light/${testFile.name}`);
      
      console.log('✅ 公共URL生成成功:', urlData.publicUrl);
      
      // 测试URL是否可访问
      console.log('\n4. 测试URL可访问性...');
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ URL可访问，状态码:', response.status);
        } else {
          console.log('❌ URL不可访问，状态码:', response.status);
        }
      } catch (fetchError) {
        console.error('❌ URL访问测试失败:', fetchError.message);
      }
    }
    
    // 5. 测试完整的fileService逻辑
    console.log('\n5. 测试完整的fileService逻辑...');
    
    if (settings && lightFiles && darkFiles) {
      const allFiles = [];
      
      // 处理light文件
      const lightProcessed = lightFiles.map(file => {
        const fileId = file.name.split('_')[0];
        return {
          id: fileId,
          name: file.name,
          path: `light/${file.name}`,
          url: supabase.storage.from('backgrounds').getPublicUrl(`light/${file.name}`).data.publicUrl,
          theme: 'light'
        };
      });
      
      // 处理dark文件
      const darkProcessed = darkFiles.map(file => {
        const fileId = file.name.split('_')[0];
        return {
          id: fileId,
          name: file.name,
          path: `dark/${file.name}`,
          url: supabase.storage.from('backgrounds').getPublicUrl(`dark/${file.name}`).data.publicUrl,
          theme: 'dark'
        };
      });
      
      allFiles.push(...lightProcessed, ...darkProcessed);
      
      console.log('处理后的文件列表:', allFiles);
      
      // 测试查找逻辑
      for (const setting of settings) {
        const backgroundSetting = setting.value;
        const theme = setting.key.replace('background_', '');
        
        console.log(`\n查找 ${theme} 主题背景: ${backgroundSetting}`);
        
        const currentFile = allFiles.find(file => 
          file.id === backgroundSetting || 
          file.name === backgroundSetting || 
          file.path === backgroundSetting
        );
        
        if (currentFile) {
          console.log(`✅ 找到匹配文件:`, currentFile);
        } else {
          console.log(`❌ 未找到匹配文件`);
          console.log(`可用文件:`, allFiles.map(f => ({ id: f.id, name: f.name, path: f.path })));
        }
      }
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testAnonPermissions().catch(console.error);