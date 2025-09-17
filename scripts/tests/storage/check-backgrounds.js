const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vcgythhenulnwuindgyx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgyNjA0NywiZXhwIjoyMDczNDAyMDQ3fQ.abniAxY_nB9EtPL4cOaxwV390ToIgzXSMySFvmHbXB4'
);

async function listBackgroundFiles() {
  console.log('检查背景文件列表...');
  
  const themes = ['light', 'dark'];
  
  for (const theme of themes) {
    console.log(`\n=== ${theme.toUpperCase()} 主题文件 ===`);
    
    try {
      const { data, error } = await supabase.storage
        .from('backgrounds')
        .list(theme);
      
      if (error) {
        console.error(`获取${theme}主题文件失败:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        data.forEach(file => {
          const id = file.name.split('_')[0];
          console.log(`ID: ${id}`);
          console.log(`文件名: ${file.name}`);
          console.log(`路径: ${theme}/${file.name}`);
          console.log(`创建时间: ${file.created_at}`);
          console.log('---');
        });
      } else {
        console.log('无文件');
      }
    } catch (err) {
      console.error(`处理${theme}主题时出错:`, err);
    }
  }
  
  // 检查当前保存的背景设置
  console.log('\n=== 检查背景设置 ===');
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['background_light', 'background_dark']);
    
    if (settingsError) {
      console.error('获取背景设置失败:', settingsError);
    } else {
      settings.forEach(setting => {
        console.log(`${setting.key}: ${setting.value}`);
      });
    }
  } catch (err) {
    console.error('检查背景设置时出错:', err);
  }
}

listBackgroundFiles().catch(console.error);