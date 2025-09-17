// 测试主题分离的背景文件上传功能
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase配置
const SUPABASE_URL = 'https://vcgythhenulnwuindgyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Uj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testThemeBackgroundUpload() {
  console.log('🧪 测试主题分离的背景文件上传功能');
  console.log('==================================================');
  
  try {
    // 创建一个简单的1x1像素PNG图片的base64数据
    // 这是一个透明的1x1像素PNG图片
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    
    // 测试上传到light主题
    console.log('📤 测试上传到light主题:');
    const lightFileName = `test-light-${Date.now()}.png`;
    const lightFilePath = `light/${lightFileName}`;
    
    const { data: lightUploadData, error: lightUploadError } = await supabase.storage
      .from('backgrounds')
      .upload(lightFilePath, pngBuffer, {
        contentType: 'image/png'
      });
    
    if (lightUploadError) {
      console.error('❌ 上传到light主题失败:', lightUploadError.message);
    } else {
      console.log('✅ 成功上传到light主题:', lightUploadData.path);
      
      // 获取公共URL
      const { data: lightUrlData } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(lightFilePath);
      console.log('📎 Light主题公共URL:', lightUrlData.publicUrl);
    }
    
    // 测试上传到dark主题
    console.log('\n📤 测试上传到dark主题:');
    const darkFileName = `test-dark-${Date.now()}.png`;
    const darkFilePath = `dark/${darkFileName}`;
    
    const { data: darkUploadData, error: darkUploadError } = await supabase.storage
      .from('backgrounds')
      .upload(darkFilePath, pngBuffer, {
        contentType: 'image/png'
      });
    
    if (darkUploadError) {
      console.error('❌ 上传到dark主题失败:', darkUploadError.message);
    } else {
      console.log('✅ 成功上传到dark主题:', darkUploadData.path);
      
      // 获取公共URL
      const { data: darkUrlData } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(darkFilePath);
      console.log('📎 Dark主题公共URL:', darkUrlData.publicUrl);
    }
    
    // 测试获取light主题文件列表
    console.log('\n📋 测试获取light主题文件列表:');
    const { data: lightFiles, error: lightListError } = await supabase.storage
      .from('backgrounds')
      .list('light', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (lightListError) {
      console.error('❌ 获取light主题文件列表失败:', lightListError.message);
    } else {
      console.log(`✅ Light主题包含 ${lightFiles.length} 个文件:`);
      lightFiles.forEach(file => {
        console.log(`   📄 ${file.name} (${Math.round(file.metadata?.size / 1024) || 0}KB)`);
      });
    }
    
    // 测试获取dark主题文件列表
    console.log('\n📋 测试获取dark主题文件列表:');
    const { data: darkFiles, error: darkListError } = await supabase.storage
      .from('backgrounds')
      .list('dark', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (darkListError) {
      console.error('❌ 获取dark主题文件列表失败:', darkListError.message);
    } else {
      console.log(`✅ Dark主题包含 ${darkFiles.length} 个文件:`);
      darkFiles.forEach(file => {
        console.log(`   📄 ${file.name} (${Math.round(file.metadata?.size / 1024) || 0}KB)`);
      });
    }
    
    // 测试根目录文件列表（应该为空或只包含文件夹）
    console.log('\n📋 测试获取根目录文件列表:');
    const { data: rootFiles, error: rootListError } = await supabase.storage
      .from('backgrounds')
      .list('', {
        limit: 10
      });
    
    if (rootListError) {
      console.error('❌ 获取根目录文件列表失败:', rootListError.message);
    } else {
      console.log(`✅ 根目录包含 ${rootFiles.length} 个项目:`);
      rootFiles.forEach(file => {
        const type = file.id ? '📁 文件夹' : '📄 文件';
        console.log(`   ${type} ${file.name}`);
      });
    }
    
    // 清理测试文件
    console.log('\n🧹 清理测试文件:');
    const filesToDelete = [];
    if (lightUploadData) filesToDelete.push(lightFilePath);
    if (darkUploadData) filesToDelete.push(darkFilePath);
    
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('backgrounds')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.error('❌ 清理测试文件失败:', deleteError.message);
      } else {
        console.log('✅ 测试文件已清理');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n==================================================');
  console.log('🎯 主题分离背景上传测试完成！');
}

// 运行测试
testThemeBackgroundUpload();