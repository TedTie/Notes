// 调试Supabase连接问题
const { Client } = require('pg');

// 从.env文件读取配置
require('dotenv').config();

// 从环境变量获取配置
const projectRef = process.env.SUPABASE_PROJECT_REF || 'vcgythhenulnwuindgyx';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'tie@951029';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgyNjA0NywiZXhwIjoyMDczNDAyMDQ3fQ.abniAxY_nB9EtPL4cOaxwV390ToIgzXSMySFvmHbXB4';
const projectName = process.env.PROJECT_NAME || 'ProjectNote';

// 测试不同的连接配置
const testConfigurations = [
    {
        name: 'Service Role Key 连接 (端口 6543)',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRoleKey)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
    },
    {
        name: 'Service Role Key 直连 (端口 5432)',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRoleKey)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
    },
    {
        name: '标准连接 (端口 6543) - 原密码',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(accessToken)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
    },
    {
        name: 'Service Role Key 不带项目引用',
        connectionString: `postgresql://postgres:${encodeURIComponent(serviceRoleKey)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
    },
    {
        name: '当前配置（端口5432）',
        connectionString: 'postgresql://postgres.vcgythhenulnwuindgyx:tie%40951029@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
    },
    {
        name: '简化用户名（端口6543）',
        connectionString: 'postgresql://postgres:tie%40951029@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
    }
];

async function testConnection(config) {
    console.log(`\n🔍 测试: ${config.name}`);
    console.log(`连接字符串: ${config.connectionString.replace(/:([^@]+)@/, ':***@')}`);
    
    const client = new Client({
        connectionString: config.connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ 连接成功！');
        
        // 测试简单查询
        const result = await client.query('SELECT 1 as test');
        console.log('✅ 查询测试成功:', result.rows[0]);
        
        await client.end();
        return true;
    } catch (error) {
        console.log('❌ 连接失败:', error.message);
        console.log('错误代码:', error.code);
        await client.end().catch(() => {});
        return false;
    }
}

async function debugConnection() {
    console.log('🔧 Supabase连接调试工具');
    console.log('='.repeat(50));
    
    console.log('\n📋 环境变量检查:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL || '未设置');
    console.log('SUPABASE_PROJECT_REF:', process.env.SUPABASE_PROJECT_REF || '未设置');
    console.log('SUPABASE_ACCESS_TOKEN:', process.env.SUPABASE_ACCESS_TOKEN ? '已设置' : '未设置');
    console.log('Project Ref:', projectRef);
    console.log('Access Token:', accessToken ? '***已设置***' : '未设置');
    console.log('Service Role Key:', serviceRoleKey ? '***已设置***' : '未设置');
    console.log('Project Name:', projectName);
    
    let successCount = 0;
    
    for (const config of testConfigurations) {
        const success = await testConnection(config);
        if (success) {
            successCount++;
            console.log('🎉 找到可用的连接配置！');
            break; // 找到第一个成功的配置就停止
        }
        
        // 等待一秒再测试下一个配置
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(50));
    if (successCount > 0) {
        console.log('✅ 调试完成：找到可用的连接配置');
    } else {
        console.log('❌ 调试完成：所有配置都失败');
        console.log('\n💡 建议:');
        console.log('1. 检查Supabase项目是否处于活跃状态');
        console.log('2. 验证项目引用ID是否正确');
        console.log('3. 确认数据库密码是否正确');
        console.log('4. 检查项目是否已暂停或删除');
        console.log('5. 尝试从Supabase Dashboard重新获取连接信息');
    }
}

// 运行调试
debugConnection().catch(console.error);