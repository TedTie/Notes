// 检查file_metadata表的实际结构
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 从.trae/env文件读取配置
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

async function checkTableStructure() {
    console.log('🔍 检查file_metadata表结构');
    console.log('==================================================');
    
    try {
        // 加载配置
        const traeConfig = loadTraeEnv();
        const supabaseUrl = `https://${traeConfig.SUPABASE_PROJECT_REF}.supabase.co`;
        const supabase = createClient(supabaseUrl, traeConfig.SUPABASE_ACCESS_TOKEN, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('📋 配置信息:');
        console.log('Project Ref:', traeConfig.SUPABASE_PROJECT_REF);
        console.log('');
        
        // 1. 检查表是否存在
        console.log('🔍 检查表是否存在...');
        const { data: tableExists, error: tableError } = await supabase
            .from('file_metadata')
            .select('*')
            .limit(1);
            
        if (tableError) {
            console.log('❌ file_metadata表不存在或无法访问:', tableError.message);
            console.log('');
            console.log('💡 建议: 在Supabase控制台中创建file_metadata表');
            console.log('参考: manual-sql-setup-guide.md');
            return;
        } else {
            console.log('✅ file_metadata表存在且可访问');
        }
        
        // 2. 尝试获取表结构信息
        console.log('');
        console.log('📋 获取表结构信息...');
        
        // 方法1: 尝试查询information_schema
        try {
            const { data: columns, error: colError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_name', 'file_metadata')
                .eq('table_schema', 'public')
                .order('ordinal_position');
                
            if (colError) {
                console.log('⚠️ 无法通过information_schema查询表结构:', colError.message);
            } else if (columns && columns.length > 0) {
                console.log('✅ 表结构信息:');
                columns.forEach(col => {
                    console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
                });
            } else {
                console.log('⚠️ 未找到表结构信息');
            }
        } catch (err) {
            console.log('⚠️ 查询表结构失败:', err.message);
        }
        
        // 3. 尝试插入测试数据来推断表结构
        console.log('');
        console.log('🧪 通过测试插入推断表结构...');
        
        const testCases = [
            {
                name: '原始结构（bucket_name）',
                data: {
                    storage_path: `test-structure-${Date.now()}-1.txt`,
                    original_name: 'test-file.txt',
                    file_size: 100,
                    file_type: 'text/plain',
                    bucket_name: 'uploads'
                }
            },
            {
                name: '修改结构（bucket_id）',
                data: {
                    storage_path: `test-structure-${Date.now()}-2.txt`,
                    original_name: 'test-file.txt',
                    file_size: 100,
                    mime_type: 'text/plain',
                    bucket_id: 'uploads'
                }
            },
            {
                name: '简化结构',
                data: {
                    storage_path: `test-structure-${Date.now()}-3.txt`,
                    original_name: 'test-file.txt',
                    file_size: 100
                }
            }
        ];
        
        let workingStructure = null;
        
        for (const testCase of testCases) {
            console.log(`   测试: ${testCase.name}`);
            
            try {
                const { data: insertData, error: insertError } = await supabase
                    .from('file_metadata')
                    .insert(testCase.data)
                    .select();
                    
                if (insertError) {
                    console.log(`   ❌ 失败: ${insertError.message}`);
                } else {
                    console.log(`   ✅ 成功: 插入ID ${insertData[0].id}`);
                    workingStructure = testCase;
                    
                    // 查询插入的数据以了解完整结构
                    const { data: queryData, error: queryError } = await supabase
                        .from('file_metadata')
                        .select('*')
                        .eq('id', insertData[0].id);
                        
                    if (!queryError && queryData && queryData.length > 0) {
                        console.log('   📋 实际数据结构:');
                        const record = queryData[0];
                        Object.keys(record).forEach(key => {
                            console.log(`      - ${key}: ${typeof record[key]} = ${record[key]}`);
                        });
                    }
                    
                    // 清理测试数据
                    await supabase
                        .from('file_metadata')
                        .delete()
                        .eq('id', insertData[0].id);
                        
                    break; // 找到工作的结构就停止
                }
            } catch (err) {
                console.log(`   ❌ 异常: ${err.message}`);
            }
        }
        
        console.log('');
        console.log('==================================================');
        
        if (workingStructure) {
            console.log('🎉 找到可用的表结构!');
            console.log('✅ 工作的结构:', workingStructure.name);
            console.log('');
            console.log('📝 建议的数据插入格式:');
            console.log(JSON.stringify(workingStructure.data, null, 2));
            
            // 生成适配的插入函数
            console.log('');
            console.log('💡 适配代码示例:');
            console.log('```javascript');
            console.log('// 适配的文件元数据插入');
            console.log('const insertFileMetadata = async (supabase, fileInfo) => {');
            console.log('    const record = {');
            Object.keys(workingStructure.data).forEach(key => {
                if (key === 'storage_path') {
                    console.log(`        ${key}: fileInfo.path,`);
                } else if (key === 'original_name') {
                    console.log(`        ${key}: fileInfo.name,`);
                } else if (key === 'file_size') {
                    console.log(`        ${key}: fileInfo.size,`);
                } else if (key === 'file_type' || key === 'mime_type') {
                    console.log(`        ${key}: fileInfo.type,`);
                } else if (key === 'bucket_name' || key === 'bucket_id') {
                    console.log(`        ${key}: fileInfo.bucket,`);
                } else {
                    console.log(`        ${key}: fileInfo.${key},`);
                }
            });
            console.log('    };');
            console.log('    ');
            console.log('    const { data, error } = await supabase');
            console.log('        .from(\'file_metadata\')');
            console.log('        .insert(record)');
            console.log('        .select();');
            console.log('    ');
            console.log('    return { data, error };');
            console.log('};');
            console.log('```');
        } else {
            console.log('❌ 未找到可用的表结构');
            console.log('');
            console.log('💡 建议:');
            console.log('1. 检查file_metadata表是否正确创建');
            console.log('2. 参考manual-sql-setup-guide.md重新创建表');
            console.log('3. 确认表的权限设置正确');
        }
        
    } catch (error) {
        console.log('❌ 检查过程中发生错误:', error.message);
        console.log('错误详情:', error);
    }
}

async function main() {
    await checkTableStructure();
}

main().catch(console.error);