const { Client } = require('pg');
require('dotenv').config();

// 测试不同的连接方式
async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // 数据库连接配置
  // 使用环境变量中的正确密码
  const dbPassword = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || 'tie@951029');
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'vcgythhenulnwuindgyx';
  
  // 方法1: 使用连接字符串
  const client1 = new Client({
    connectionString: `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('\n📡 Attempting connection with connection string...');
    await client1.connect();
    console.log('✅ Connected successfully!');
    
    // 测试简单查询
    const result = await client1.query('SELECT version();');
    console.log('📊 Database version:', result.rows[0].version);
    
    // 检查现有表
    const tables = await client1.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📋 Existing tables:', tables.rows.map(r => r.table_name));
    
    await client1.end();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      severity: error.severity,
      detail: error.detail
    });
  }
}

testConnection();