/**
 * 测试背景删除功能
 * 验证Supabase存储中的文件删除是否正常工作
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://vcgythhenulnwuindgyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Uj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

class BackgroundDeleteTester {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async listBackgroundFiles() {
    console.log('📋 获取背景文件列表...');
    try {
      // 首先列出根目录
      const { data: rootData, error: rootError } = await this.supabase.storage
        .from('backgrounds')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (rootError) throw rootError;
      
      console.log(`✅ 根目录找到 ${rootData?.length || 0} 个项目:`);
      rootData?.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (类型: ${item.metadata ? '文件' : '文件夹'})`);
      });
      
      // 如果有backgrounds文件夹，列出其内容
      const backgroundsFolder = rootData?.find(item => item.name === 'backgrounds');
      if (backgroundsFolder) {
        console.log('\n📁 检查backgrounds文件夹内容...');
        const { data: folderData, error: folderError } = await this.supabase.storage
          .from('backgrounds')
          .list('backgrounds', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (folderError) {
          console.error('❌ 获取文件夹内容失败:', folderError.message);
        } else {
          console.log(`✅ backgrounds文件夹中找到 ${folderData?.length || 0} 个文件:`);
          folderData?.forEach((file, index) => {
            const fileId = file.name.split('.')[0];
            console.log(`  ${index + 1}. ${file.name} (ID: ${fileId})`);
          });
          return folderData || [];
        }
      }
      
      return rootData || [];
    } catch (error) {
      console.error('❌ 获取文件列表失败:', error.message);
      return [];
    }
  }

  async testDeleteFunction(fileId) {
    console.log(`\n🗑️  测试删除文件 ID: ${fileId}`);
    
    try {
      // 首先获取文件列表，找到对应的文件名
      const { data: files, error: listError } = await this.supabase.storage
        .from('backgrounds')
        .list('backgrounds', { limit: 1000 });
      
      if (listError) throw listError;
      
      // 找到匹配的文件
      const targetFile = files?.find(file => {
        const id = file.name.split('.')[0];
        return id === fileId;
      });
      
      if (!targetFile) {
        console.log(`❌ 文件不存在: ${fileId}`);
        return false;
      }
      
      console.log(`📁 找到目标文件: ${targetFile.name}`);
      
      // 使用正确的文件路径进行删除
      const filePath = `backgrounds/${targetFile.name}`;
      console.log(`📍 删除路径: ${filePath}`);
      
      // 删除文件
      const { error } = await this.supabase.storage
        .from('backgrounds')
        .remove([filePath]);
      
      if (error) throw error;
      
      console.log(`✅ 文件删除成功: ${targetFile.name}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除文件失败:`, error.message);
      return false;
    }
  }

  async checkFileExists(fileName) {
    console.log(`\n🔍 检查文件是否存在: ${fileName}`);
    
    try {
      // 检查backgrounds文件夹中的文件
      const { data, error } = await this.supabase.storage
        .from('backgrounds')
        .list('backgrounds', { limit: 1000 });
      
      if (error) throw error;
      
      const exists = data?.some(file => file.name === fileName);
      console.log(`${exists ? '✅ 文件存在' : '❌ 文件不存在'}: backgrounds/${fileName}`);
      return exists;
    } catch (error) {
      console.error('❌ 检查文件失败:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 开始测试背景删除功能');
    console.log('=' .repeat(50));
    
    // 1. 列出所有文件
    const files = await this.listBackgroundFiles();
    
    if (files.length === 0) {
      console.log('\n⚠️  没有找到背景文件，无法测试删除功能');
      return;
    }
    
    // 2. 检查特定文件是否存在
    const targetFileName = '1757864679510.png';
    const fileExists = await this.checkFileExists(targetFileName);
    
    if (fileExists) {
      console.log(`\n🎯 测试删除文件: ${targetFileName}`);
      const fileId = targetFileName.split('.')[0];
      const deleteSuccess = await this.testDeleteFunction(fileId);
      
      if (deleteSuccess) {
        // 3. 验证文件是否真的被删除
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        const stillExists = await this.checkFileExists(targetFileName);
        
        if (!stillExists) {
          console.log('\n🎉 删除功能测试成功！文件已从Supabase存储中删除');
        } else {
          console.log('\n⚠️  删除可能未完全生效，文件仍然存在');
        }
      }
    } else {
      console.log(`\n⚠️  目标文件 ${targetFileName} 不存在，无法测试删除`);
      console.log('💡 可以手动指定一个存在的文件ID进行测试');
    }
    
    // 4. 最终文件列表
    console.log('\n📋 最终文件列表:');
    await this.listBackgroundFiles();
  }
}

// 执行测试
async function main() {
  const tester = new BackgroundDeleteTester();
  
  try {
    await tester.run();
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);