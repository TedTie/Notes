const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
// 使用 Supabase 连接字符串格式
// 密码中的@符号需要URL编码为%40
const client = new Client({
  connectionString: 'postgresql://postgres.vcgythhenulnwuindgyx:tie%40951029@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeMigration(filePath) {
  try {
    console.log(`Executing migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`✅ Migration completed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error executing migration ${filePath}:`, error.message);
    throw error;
  }
}

async function runMigrations() {
  try {
    await client.connect();
    console.log('🔗 Connected to Supabase database');

    // Execute migrations in order
    const migrations = [
      'supabase-migration/01-create-tables.sql',
      'supabase-migration/02-setup-rls.sql',
      'supabase-migration/03-setup-storage.sql'
    ];

    for (const migration of migrations) {
      const filePath = path.join(__dirname, migration);
      if (fs.existsSync(filePath)) {
        await executeMigration(filePath);
      } else {
        console.warn(`⚠️  Migration file not found: ${filePath}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migrations
runMigrations();