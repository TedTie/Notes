// 测试MCP服务器和数据库连接
const { Client } = require('pg');
require('dotenv').config();

// 数据库连接配置
// 使用环境变量中的正确密码
const dbPassword = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || 'tie@951029');
const projectRef = process.env.SUPABASE_PROJECT_REF || 'vcgythhenulnwuindgyx';

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

// 备用连接字符串（端口5432）
const alternativeConnectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

async function testDatabaseConnection() {
    // 首先尝试主连接字符串
    let client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('正在连接数据库（端口6543）...');
        await client.connect();
        console.log('✅ 数据库连接成功（端口6543）');
    } catch (error) {
        console.log('❌ 端口6543连接失败，尝试端口5432...');
        console.log('错误信息:', error.message);
        
        // 尝试备用连接字符串
        await client.end().catch(() => {}); // 关闭之前的连接
        client = new Client({
            connectionString: alternativeConnectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });
        
        try {
            console.log('正在连接数据库（端口5432）...');
            await client.connect();
            console.log('✅ 数据库连接成功（端口5432）');
        } catch (altError) {
            console.log('❌ 端口5432连接也失败');
            throw altError;
        }
    }

    try {

        // 测试基本查询
        console.log('\n测试基本查询...');
        const versionResult = await client.query('SELECT version()');
        console.log('✅ PostgreSQL版本:', versionResult.rows[0].version.substring(0, 50) + '...');

        // 检查表是否存在
        console.log('\n检查数据库表...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('✅ 找到以下表:');
            tablesResult.rows.forEach(row => {
                console.log('  -', row.table_name);
            });
        } else {
            console.log('⚠️  未找到任何表');
        }

        // 检查存储桶
        console.log('\n检查存储桶...');
        try {
            const bucketsResult = await client.query(`
                SELECT id, name, public 
                FROM storage.buckets 
                ORDER BY name
            `);
            
            if (bucketsResult.rows.length > 0) {
                console.log('✅ 找到以下存储桶:');
                bucketsResult.rows.forEach(row => {
                    console.log(`  - ${row.name} (${row.public ? '公开' : '私有'})`);
                });
            } else {
                console.log('⚠️  未找到任何存储桶');
            }
        } catch (storageError) {
            console.log('⚠️  存储桶查询失败:', storageError.message);
        }

        // 检查RLS策略
        console.log('\n检查RLS策略...');
        try {
            const policiesResult = await client.query(`
                SELECT schemaname, tablename, policyname, permissive
                FROM pg_policies 
                WHERE schemaname IN ('public', 'storage')
                ORDER BY schemaname, tablename, policyname
            `);
            
            if (policiesResult.rows.length > 0) {
                console.log('✅ 找到以下RLS策略:');
                policiesResult.rows.forEach(row => {
                    console.log(`  - ${row.schemaname}.${row.tablename}: ${row.policyname}`);
                });
            } else {
                console.log('⚠️  未找到任何RLS策略');
            }
        } catch (rlsError) {
            console.log('⚠️  RLS策略查询失败:', rlsError.message);
        }

        console.log('\n🎉 数据库连接测试完成!');
        
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.error('错误代码:', error.code);
        if (error.code === 'XX000') {
            console.log('\n💡 提示: "Tenant or user not found" 错误通常表示:');
            console.log('   1. 项目引用 (project-ref) 不正确');
            console.log('   2. 数据库密码不正确');
            console.log('   3. 项目可能已暂停或删除');
            console.log('   4. 连接字符串格式有误');
        }
    } finally {
        await client.end();
    }
}

// 运行测试
testDatabaseConnection().catch(console.error);