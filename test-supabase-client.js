// 测试Supabase JavaScript客户端连接
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase配置
const supabaseUrl = 'https://vcgythhenulnwuindgyx.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnd1aW5kZ3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgyNjA0NywiZXhwIjoyMDczNDAyMDQ3fQ.abniAxY_nB9EtPL4cOaxwV390ToIgzXSMySFvmHbXB4';
const anonKey = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_d7659ca2145afbab323db89849ae9b3ed22c92d8';

console.log('🔧 Supabase JavaScript客户端测试');
console.log('==================================================');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey ? '***已设置***' : '未设置');
console.log('Anon Key:', anonKey ? '***已设置***' : '未设置');
console.log('');

async function testSupabaseClient() {
    try {
        console.log('🔍 测试1: 使用Service Role Key创建客户端');
        const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        // 测试基本连接
        console.log('📡 测试Service Role客户端连接...');
        const { data: serviceData, error: serviceError } = await supabaseService
            .from('notes')
            .select('count', { count: 'exact', head: true });
            
        if (serviceError) {
            console.log('❌ Service Role连接失败:', serviceError.message);
            console.log('错误详情:', serviceError);
        } else {
            console.log('✅ Service Role连接成功!');
            console.log('数据库响应:', serviceData);
        }
        
        console.log('');
        
        console.log('🔍 测试2: 使用Anon Key创建客户端');
        const supabaseAnon = createClient(supabaseUrl, anonKey);
        
        console.log('📡 测试Anon客户端连接...');
        const { data: anonData, error: anonError } = await supabaseAnon
            .from('notes')
            .select('count', { count: 'exact', head: true });
            
        if (anonError) {
            console.log('❌ Anon连接失败:', anonError.message);
            console.log('错误详情:', anonError);
        } else {
            console.log('✅ Anon连接成功!');
            console.log('数据库响应:', anonData);
        }
        
        console.log('');
        
        // 测试存储桶访问
        console.log('🔍 测试3: 存储桶访问');
        const { data: buckets, error: bucketsError } = await supabaseService.storage.listBuckets();
        
        if (bucketsError) {
            console.log('❌ 存储桶访问失败:', bucketsError.message);
        } else {
            console.log('✅ 存储桶访问成功!');
            console.log('可用存储桶:', buckets.map(b => b.name));
        }
        
        console.log('');
        
        // 测试RPC调用
        console.log('🔍 测试4: RPC函数调用');
        const { data: rpcData, error: rpcError } = await supabaseService
            .rpc('get_background_images');
            
        if (rpcError) {
            console.log('❌ RPC调用失败:', rpcError.message);
            console.log('这可能是因为函数不存在，这是正常的');
        } else {
            console.log('✅ RPC调用成功!');
            console.log('RPC响应:', rpcData);
        }
        
    } catch (error) {
        console.log('❌ 测试过程中发生错误:', error.message);
        console.log('错误详情:', error);
    }
}

async function testProjectStatus() {
    console.log('🔍 测试5: 项目状态检查');
    
    try {
        // 尝试访问项目的健康检查端点
        const healthUrl = `${supabaseUrl}/rest/v1/`;
        console.log('📡 检查项目健康状态:', healthUrl);
        
        const response = await fetch(healthUrl, {
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`
            }
        });
        
        console.log('HTTP状态码:', response.status);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            console.log('✅ 项目状态正常');
        } else {
            console.log('❌ 项目可能存在问题');
            const errorText = await response.text();
            console.log('错误响应:', errorText);
        }
        
    } catch (error) {
        console.log('❌ 项目状态检查失败:', error.message);
    }
}

async function main() {
    await testSupabaseClient();
    console.log('==================================================');
    await testProjectStatus();
    console.log('==================================================');
    console.log('🏁 测试完成');
}

main().catch(console.error);