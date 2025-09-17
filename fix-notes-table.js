require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNotesTable() {
  console.log('🔍 检查notes表结构...');
  
  try {
    // 首先检查当前表结构
    const { data: existingNotes, error: selectError } = await supabase
      .from('notes')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('查询notes表失败:', selectError);
      return;
    }
    
    console.log('✅ notes表存在，当前结构:', existingNotes);
    
    // 尝试添加缺失的列
    console.log('\n🔧 添加缺失的列...');
    
    const alterQueries = [
      'ALTER TABLE notes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT \'general\';',
      'ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT \'{}\';',
      'ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;'
    ];
    
    for (const query of alterQueries) {
      try {
        console.log('执行:', query);
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error) {
          console.error('执行失败:', error);
        } else {
          console.log('✅ 执行成功');
        }
      } catch (err) {
        console.error('执行错误:', err.message);
      }
    }
    
    // 验证修改结果
    console.log('\n🔍 验证表结构修改...');
    const { data: updatedNotes, error: verifyError } = await supabase
      .from('notes')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('验证失败:', verifyError);
    } else {
      console.log('✅ 修改后的表结构:', updatedNotes);
    }
    
    // 测试创建笔记
    console.log('\n🧪 测试创建笔记...');
    const testNote = {
      title: '测试笔记',
      content: '这是一个测试笔记',
      category: 'test',
      tags: ['测试'],
      is_favorite: false
    };
    
    const { data: newNote, error: createError } = await supabase
      .from('notes')
      .insert(testNote)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 创建测试笔记失败:', createError);
    } else {
      console.log('✅ 成功创建测试笔记:', newNote);
      
      // 删除测试笔记
      await supabase.from('notes').delete().eq('id', newNote.id);
      console.log('🗑️ 已删除测试笔记');
    }
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixNotesTable();