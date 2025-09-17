// 检查backgrounds存储桶中的文件夹结构
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://vcgythhenulnwuindgyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Uj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkBackgroundsStructure() {
  console.log('🔍 检查backgrounds存储桶结构');
  console.log('==================================================');
  
  try {
    // 检查根目录
    console.log('📁 检查根目录:');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('backgrounds')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (rootError) {
      console.error('❌ 获取根目录失败:', rootError.message);
    } else {
      console.log('✅ 根目录文件/文件夹:');
      rootFiles.forEach(item => {
        const type = item.metadata ? '📄 文件' : '📁 文件夹';
        console.log(`   ${type}: ${item.name}`);
      });
    }
    
    // 检查light文件夹
    console.log('\n📁 检查light文件夹:');
    const { data: lightFiles, error: lightError } = await supabase.storage
      .from('backgrounds')
      .list('light', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (lightError) {
      console.error('❌ 获取light文件夹失败:', lightError.message);
    } else {
      console.log(`✅ light文件夹包含 ${lightFiles.length} 个文件:`);
      lightFiles.forEach(file => {
        console.log(`   📄 ${file.name} (${Math.round(file.metadata?.size / 1024)}KB)`);
      });
    }
    
    // 检查dark文件夹
    console.log('\n📁 检查dark文件夹:');
    const { data: darkFiles, error: darkError } = await supabase.storage
      .from('backgrounds')
      .list('dark', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (darkError) {
      console.error('❌ 获取dark文件夹失败:', darkError.message);
    } else {
      console.log(`✅ dark文件夹包含 ${darkFiles.length} 个文件:`);
      darkFiles.forEach(file => {
        console.log(`   📄 ${file.name} (${Math.round(file.metadata?.size / 1024)}KB)`);
      });
    }
    
    // 测试上传到light文件夹
    console.log('\n🧪 测试上传到light文件夹:');
    const testContent = 'Test light theme background';
    const testFileName = `test-light-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backgrounds')
      .upload(`light/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('❌ 上传到light文件夹失败:', uploadError.message);
    } else {
      console.log('✅ 成功上传到light文件夹:', uploadData.path);
      
      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(`light/${testFileName}`);
      console.log('📎 公共URL:', urlData.publicUrl);
      
      // 清理测试文件
      await supabase.storage
        .from('backgrounds')
        .remove([`light/${testFileName}`]);
      console.log('🧹 测试文件已清理');
    }
    
    // 测试上传到dark文件夹
    console.log('\n🧪 测试上传到dark文件夹:');
    const testContentDark = 'Test dark theme background';
    const testFileNameDark = `test-dark-${Date.now()}.txt`;
    
    const { data: uploadDataDark, error: uploadErrorDark } = await supabase.storage
      .from('backgrounds')
      .upload(`dark/${testFileNameDark}`, testContentDark, {
        contentType: 'text/plain'
      });
    
    if (uploadErrorDark) {
      console.error('❌ 上传到dark文件夹失败:', uploadErrorDark.message);
    } else {
      console.log('✅ 成功上传到dark文件夹:', uploadDataDark.path);
      
      // 获取公共URL
      const { data: urlDataDark } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(`dark/${testFileNameDark}`);
      console.log('📎 公共URL:', urlDataDark.publicUrl);
      
      // 清理测试文件
      await supabase.storage
        .from('backgrounds')
        .remove([`dark/${testFileNameDark}`]);
      console.log('🧹 测试文件已清理');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
  
  console.log('\n==================================================');
  console.log('🎯 检查完成！');
}

// 运行检查
checkBackgroundsStructure();