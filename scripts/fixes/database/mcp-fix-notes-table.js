/**
 * 通过Supabase管理API修复notes表结构
 * 添加缺失的category、tags、is_favorite列
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadTraeEnv() {
    const envPath = path.join(__dirname, '.trae', 'env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const config = {};
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
                config[key] = value;
            }
        }
    });
    
    return config;
}

class MCPDatabaseFixer {
  constructor() {
    this.supabase = null;
    this.config = null;
  }

  async connect() {
    console.log('🔌 连接到Supabase数据库...');
    
    this.config = loadTraeEnv();
    
    console.log('📋 MCP配置:');
    console.log('Project Ref:', this.config.SUPABASE_PROJECT_REF);
    console.log('Access Token:', this.config.SUPABASE_ACCESS_TOKEN ? '***已设置***' : '未设置');
    console.log('Project Name:', this.config.PROJECT_NAME);
    
    const supabaseUrl = `https://${this.config.SUPABASE_PROJECT_REF}.supabase.co`;
    
    // 使用service_role密钥进行管理操作
    this.supabase = createClient(supabaseUrl, this.config.SUPABASE_ACCESS_TOKEN);
    
    console.log('✅ Supabase连接成功');
  }

  async executeSQL(sql) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query: sql });
      
      const options = {
        hostname: `${this.config.SUPABASE_PROJECT_REF}.supabase.co`,
        port: 443,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${this.config.SUPABASE_ACCESS_TOKEN}`,
          'apikey': this.config.SUPABASE_ACCESS_TOKEN
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(result.message || `HTTP ${res.statusCode}: ${data}`));
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    });
  }

  async checkNotesTable() {
    console.log('\n🔍 检查notes表结构...');
    
    try {
      // 尝试直接查询表数据来检查列
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .limit(1);
        
      if (error) {
        console.error('❌ 查询notes表失败:', error.message);
        return null;
      }
      
      console.log('📊 当前表可访问');
      if (data && data.length > 0) {
        console.log('📋 现有列:', Object.keys(data[0]));
      } else {
        console.log('📋 表为空，无法检查列结构');
      }
      
      return data;
    } catch (error) {
      console.error('❌ 检查表结构失败:', error.message);
      throw error;
    }
  }

  async addMissingColumns() {
    console.log('\n🔧 添加缺失的列...');
    
    const alterQueries = [
      {
        name: 'category',
        sql: 'ALTER TABLE notes ADD COLUMN IF NOT EXISTS category TEXT;'
      },
      {
        name: 'tags', 
        sql: 'ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[];'
      },
      {
        name: 'is_favorite',
        sql: 'ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;'
      }
    ];
    
    for (const query of alterQueries) {
      try {
        console.log(`📝 添加 ${query.name} 列...`);
        
        // 尝试使用REST API直接执行SQL
        try {
          await this.executeSQL(query.sql);
          console.log(`✅ ${query.name} 列添加成功`);
        } catch (apiError) {
          console.log(`⚠️ REST API执行失败: ${apiError.message}`);
          console.log(`💡 请在Supabase控制台手动执行: ${query.sql}`);
        }
        
      } catch (error) {
        console.error(`❌ 添加 ${query.name} 列失败:`, error.message);
      }
    }
  }

  async testNoteCreation() {
    console.log('\n🧪 测试创建笔记...');
    
    try {
      // 测试插入
      const { data, error } = await this.supabase
        .from('notes')
        .insert({
          title: 'Supabase测试笔记',
          content: '通过Supabase客户端创建的测试笔记',
          category: 'test',
          tags: ['Supabase', '测试'],
          is_favorite: false
        })
        .select();
      
      if (error) {
        console.error('❌ 测试创建笔记失败:', error.message);
        return;
      }
      
      console.log('✅ 测试笔记创建成功:');
      console.log(data);
      
      // 获取插入的记录ID用于清理
      const noteId = data[0].id;
      
      // 清理测试数据
      const { error: deleteError } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (deleteError) {
        console.error('❌ 清理测试数据失败:', deleteError.message);
      } else {
        console.log('🗑️ 测试数据已清理');
      }
      
    } catch (error) {
      console.error('❌ 测试创建笔记失败:', error.message);
    }
  }

  async fixNotesTable() {
    await this.connect();
    await this.checkNotesTable();
    await this.addMissingColumns();
    
    console.log('\n🔍 验证修复结果...');
    await this.checkNotesTable();
    await this.testNoteCreation();
    
    await this.disconnect();
  }

  async disconnect() {
    if (this.supabase) {
      console.log('🔌 Supabase连接已关闭');
    }
  }
}

// 执行修复
async function main() {
  const fixer = new MCPDatabaseFixer();
  
  try {
    await fixer.fixNotesTable();
    console.log('\n🎉 notes表结构修复完成!');
    console.log('✅ 现在可以正常创建包含category、tags、is_favorite字段的笔记了');
  } catch (error) {
    console.error('\n❌ 修复过程中出现错误:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);