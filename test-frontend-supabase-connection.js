/**
 * 测试前端Supabase连接
 * 验证前端项目是否能正确连接到Supabase后端
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取前端环境变量
function loadFrontendEnv() {
  const envPath = path.join(__dirname, 'ai-notebook', 'frontend', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ 前端.env文件不存在:', envPath);
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  
  return env;
}

// 测试Supabase连接
async function testSupabaseConnection() {
  console.log('🔍 测试前端Supabase连接...');
  console.log('=' .repeat(50));
  
  // 加载环境变量
  const env = loadFrontendEnv();
  if (!env) {
    return false;
  }
  
  console.log('📋 环境变量检查:');
  console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL || '❌ 未设置');
  console.log('VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 
    (env.VITE_SUPABASE_ANON_KEY.includes('your_') ? '❌ 占位符' : '✅ 已设置') : '❌ 未设置');
  
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY.includes('your_')) {
    console.log('\n❌ 环境变量配置不完整，无法测试连接');
    console.log('\n📝 需要配置:');
    console.log('1. 访问 https://supabase.com/dashboard/project/vcgythhenulnwuindgyx/settings/api');
    console.log('2. 复制 anon public 密钥');
    console.log('3. 更新 ai-notebook/frontend/.env 文件中的 VITE_SUPABASE_ANON_KEY');
    return false;
  }
  
  try {
    // 创建Supabase客户端
    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    console.log('\n🔗 测试数据库连接...');
    
    // 测试数据库连接
    const { data: tables, error: tablesError } = await supabase
      .from('notes')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.log('❌ 数据库连接失败:', tablesError.message);
      return false;
    }
    
    console.log('✅ 数据库连接成功');
    console.log('📊 notes表记录数:', tables || 0);
    
    // 测试存储桶访问
    console.log('\n📁 测试存储桶访问...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ 存储桶访问失败:', bucketsError.message);
    } else {
      console.log('✅ 存储桶访问成功');
      console.log('📦 可用存储桶:', buckets.map(b => b.name).join(', '));
    }
    
    // 测试file_metadata表
    console.log('\n🗃️  测试file_metadata表...');
    const { data: fileMetadata, error: fileError } = await supabase
      .from('file_metadata')
      .select('count', { count: 'exact', head: true });
    
    if (fileError) {
      console.log('❌ file_metadata表访问失败:', fileError.message);
    } else {
      console.log('✅ file_metadata表访问成功');
      console.log('📄 文件记录数:', fileMetadata || 0);
    }
    
    console.log('\n🎉 前端Supabase连接测试完成!');
    console.log('✅ 前端可以正常连接到Supabase后端');
    
    return true;
    
  } catch (error) {
    console.log('❌ 连接测试失败:', error.message);
    return false;
  }
}

// 生成连接状态报告
function generateConnectionReport(success) {
  const report = {
    timestamp: new Date().toISOString(),
    frontend_supabase_connection: success,
    status: success ? 'ready' : 'needs_configuration',
    next_steps: success ? [
      '前端已成功连接到Supabase后端',
      '可以开始使用所有功能',
      '建议进行完整的功能测试'
    ] : [
      '配置Supabase ANON KEY',
      '更新Vercel环境变量',
      '重新部署前端项目'
    ]
  };
  
  console.log('\n📋 连接状态报告:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

// 主函数
async function main() {
  console.log('🚀 前端Supabase连接测试');
  console.log('时间:', new Date().toLocaleString());
  console.log('=' .repeat(60));
  
  const success = await testSupabaseConnection();
  const report = generateConnectionReport(success);
  
  if (success) {
    console.log('\n🎯 结论: 前端已准备好连接到Supabase后端!');
  } else {
    console.log('\n⚠️  结论: 前端需要完成Supabase配置才能正常工作');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSupabaseConnection, loadFrontendEnv };