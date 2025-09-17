/**
 * 直接使用用户提供的Supabase凭据修复notes表结构
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// 用户提供的Supabase凭据
const SUPABASE_URL = 'https://vcgythhenulnwuindgyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjYwNDcsImV4cCI6MjA3MzQwMjA0N30.Go2s1EwYsmG3Uj9Fiy2QB0eo-GcKTd3gwiRfBkRMKjA';

class DirectSupabaseFixer {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async checkCurrentTable() {
    console.log('🔍 检查当前notes表结构...');
    
    try {
      // 尝试查询现有数据来了解表结构
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ 查询notes表失败:', error.message);
        return false;
      }
      
      console.log('✅ notes表可访问');
      if (data && data.length > 0) {
        console.log('📋 现有列:', Object.keys(data[0]));
        
        // 检查是否已有所需列
        const existingColumns = Object.keys(data[0]);
        const requiredColumns = ['category', 'tags', 'is_favorite'];
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length === 0) {
          console.log('✅ 所有必需的列都已存在!');
          return true;
        } else {
          console.log('⚠️ 缺少列:', missingColumns);
          return false;
        }
      } else {
        console.log('📋 表为空，无法检查现有列结构');
        return false;
      }
    } catch (error) {
      console.error('❌ 检查表结构失败:', error.message);
      return false;
    }
  }

  async testInsertWithNewColumns() {
    console.log('\n🧪 测试插入包含新列的数据...');
    
    try {
      const testNote = {
        title: '测试笔记',
        content: '这是一个测试笔记',
        category: 'test',
        tags: ['测试', 'Supabase'],
        is_favorite: false
      };
      
      const { data, error } = await this.supabase
        .from('notes')
        .insert(testNote)
        .select();
      
      if (error) {
        console.error('❌ 插入测试数据失败:', error.message);
        
        // 如果是列不存在的错误，说明需要添加列
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('💡 确认需要添加缺失的列');
          return false;
        }
        
        return false;
      }
      
      console.log('✅ 测试数据插入成功!');
      console.log('📄 插入的数据:', data[0]);
      
      // 清理测试数据
      const { error: deleteError } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.log('⚠️ 清理测试数据失败，但插入成功');
      } else {
        console.log('🗑️ 测试数据已清理');
      }
      
      return true;
    } catch (error) {
      console.error('❌ 测试插入失败:', error.message);
      return false;
    }
  }

  async createSQLScript() {
    console.log('\n📝 生成SQL修复脚本...');
    
    const sqlScript = `-- 修复notes表结构 - 添加缺失的列\n-- 请在Supabase SQL编辑器中执行以下语句\n\n-- 1. 添加category列\nALTER TABLE notes ADD COLUMN IF NOT EXISTS category TEXT;\n\n-- 2. 添加tags列\nALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[];\n\n-- 3. 添加is_favorite列\nALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;\n\n-- 4. 验证表结构\nSELECT column_name, data_type, is_nullable, column_default\nFROM information_schema.columns\nWHERE table_name = 'notes' AND table_schema = 'public'\nORDER BY ordinal_position;\n\n-- 5. 测试插入数据\nINSERT INTO notes (title, content, category, tags, is_favorite)\nVALUES ('测试笔记', '这是一个测试笔记', 'test', ARRAY['测试', 'Supabase'], false)\nRETURNING *;\n\n-- 6. 清理测试数据（可选）\n-- DELETE FROM notes WHERE title = '测试笔记';`;
    
    require('fs').writeFileSync('supabase-fix-notes-table.sql', sqlScript);
    console.log('✅ SQL脚本已保存到: supabase-fix-notes-table.sql');
    
    return sqlScript;
  }

  async showInstructions() {
    console.log('\n📋 手动修复说明:');
    console.log('==================================================');
    console.log('1. 打开Supabase控制台: https://supabase.com/dashboard');
    console.log('2. 选择你的项目: vcgythhenulnwuindgyx');
    console.log('3. 进入 "SQL Editor" 页面');
    console.log('4. 执行以下SQL语句:');
    console.log('');
    console.log('ALTER TABLE notes ADD COLUMN IF NOT EXISTS category TEXT;');
    console.log('ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[];');
    console.log('ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;');
    console.log('');
    console.log('5. 执行完成后，前端应用就可以正常创建笔记了');
    console.log('==================================================');
  }

  async run() {
    console.log('🚀 开始修复Supabase notes表结构');
    console.log('==================================================');
    
    // 检查当前表状态
    const isTableComplete = await this.checkCurrentTable();
    
    if (isTableComplete) {
      console.log('\n🎉 表结构已完整，无需修复!');
      return;
    }
    
    // 测试插入新列数据
    const canInsertNewColumns = await this.testInsertWithNewColumns();
    
    if (canInsertNewColumns) {
      console.log('\n🎉 表结构修复成功!');
      console.log('✅ 现在可以正常创建包含category、tags、is_favorite字段的笔记了');
    } else {
      console.log('\n⚠️ 需要手动修复表结构');
      await this.createSQLScript();
      await this.showInstructions();
    }
  }
}

// 执行修复
async function main() {
  const fixer = new DirectSupabaseFixer();
  
  try {
    await fixer.run();
  } catch (error) {
    console.error('\n❌ 修复过程中出现错误:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);