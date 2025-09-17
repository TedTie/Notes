// 简化的存储功能测试
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://vcgythhenulnwuindgyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Ij9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorageSimple() {
  console.log('🧪 简化存储功能测试');
  console.log('====================');
  
  try {
    // 测试存储桶访问
    console.log('📋 测试存储桶访问:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ 获取存储桶列表失败:', bucketsError.message);
    } else {
      console.log('✅ 可访问的存储桶:', buckets.map(b => b.name));
    }
    
    // 测试backgrounds存储桶根目录
    console.log('\n📋 测试backgrounds存储桶根目录:');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('backgrounds')
      .list('', { limit: 10 });
    
    if (rootError) {
      console.error('❌ 访问根目录失败:', rootError.message);
    } else {
      console.log('✅ 根目录内容:', rootFiles.map(f => f.name));
    }
    
    // 测试light文件夹
    console.log('\n📋 测试light文件夹:');
    const { data: lightFiles, error: lightError } = await supabase.storage
      .from('backgrounds')
      .list('light', { limit: 10 });
    
    if (lightError) {
      console.error('❌ 访问light文件夹失败:', lightError.message);
    } else {
      console.log('✅ Light文件夹内容:', lightFiles.map(f => f.name));
    }
    
    // 测试dark文件夹
    console.log('\n📋 测试dark文件夹:');
    const { data: darkFiles, error: darkError } = await supabase.storage
      .from('backgrounds')
      .list('dark', { limit: 10 });
    
    if (darkError) {
      console.error('❌ 访问dark文件夹失败:', darkError.message);
    } else {
      console.log('✅ Dark文件夹内容:', darkFiles.map(f => f.name));
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n====================');
  console.log('🎯 简化存储功能测试完成！');
}

// 运行测试
testStorageSimple();