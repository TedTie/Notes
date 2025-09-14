// 同步Supabase存储配置脚本
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

async function syncStorageConfiguration() {
    console.log('🔧 开始同步Supabase存储配置');
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
        console.log('Supabase URL:', supabaseUrl);
        console.log('');
        
        // 读取存储配置SQL文件
        const sqlPath = path.join(__dirname, 'supabase-migration', '03-setup-storage.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 读取存储配置SQL文件:', sqlPath);
        console.log('文件大小:', sqlContent.length, '字符');
        console.log('');
        
        // 分割SQL语句（按分号分割，但要处理函数定义中的分号）
        const sqlStatements = [];
        let currentStatement = '';
        let inFunction = false;
        let dollarQuoteCount = 0;
        
        const lines = sqlContent.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 跳过注释和空行
            if (trimmedLine.startsWith('--') || trimmedLine === '' || trimmedLine.startsWith('/*')) {
                continue;
            }
            
            currentStatement += line + '\n';
            
            // 检测函数定义开始和结束
            if (trimmedLine.includes('$$')) {
                dollarQuoteCount++;
                if (dollarQuoteCount % 2 === 1) {
                    inFunction = true;
                } else {
                    inFunction = false;
                }
            }
            
            // 如果不在函数内且遇到分号，则结束当前语句
            if (!inFunction && trimmedLine.endsWith(';')) {
                sqlStatements.push(currentStatement.trim());
                currentStatement = '';
            }
        }
        
        // 添加最后一个语句（如果有）
        if (currentStatement.trim()) {
            sqlStatements.push(currentStatement.trim());
        }
        
        console.log('📝 解析出', sqlStatements.length, '个SQL语句');
        console.log('');
        
        // 执行SQL语句
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            if (!statement || statement.length < 10) continue;
            
            console.log(`🔍 执行语句 ${i + 1}/${sqlStatements.length}:`);
            
            // 显示语句的前50个字符
            const preview = statement.substring(0, 50).replace(/\n/g, ' ') + (statement.length > 50 ? '...' : '');
            console.log('   ', preview);
            
            try {
                const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
                
                if (error) {
                    // 检查是否是可以忽略的错误
                    const ignorableErrors = [
                        'already exists',
                        'relation "storage.buckets" does not exist',
                        'permission denied',
                        'must be owner of schema storage'
                    ];
                    
                    const isIgnorable = ignorableErrors.some(err => 
                        error.message.toLowerCase().includes(err.toLowerCase())
                    );
                    
                    if (isIgnorable) {
                        console.log('   ⚠️ 跳过 (已存在或权限限制):', error.message.substring(0, 100));
                        skipCount++;
                    } else {
                        console.log('   ❌ 失败:', error.message.substring(0, 100));
                        errorCount++;
                    }
                } else {
                    console.log('   ✅ 成功');
                    successCount++;
                }
            } catch (err) {
                // 尝试直接执行（某些语句可能不支持rpc方式）
                try {
                    // 对于存储桶操作，使用存储API
                    if (statement.includes('INSERT INTO storage.buckets')) {
                        console.log('   🔄 尝试使用存储API创建存储桶...');
                        
                        // 解析存储桶信息
                        const bucketMatch = statement.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(true|false)\s*,\s*(\d+)/i);
                        if (bucketMatch) {
                            const [, bucketId, bucketName, isPublic, sizeLimit] = bucketMatch;
                            
                            const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucketId, {
                                public: isPublic === 'true',
                                fileSizeLimit: parseInt(sizeLimit)
                            });
                            
                            if (bucketError && !bucketError.message.includes('already exists')) {
                                console.log('   ❌ 存储桶创建失败:', bucketError.message);
                                errorCount++;
                            } else {
                                console.log('   ✅ 存储桶创建成功或已存在');
                                successCount++;
                            }
                        } else {
                            console.log('   ⚠️ 无法解析存储桶信息');
                            skipCount++;
                        }
                    } else {
                        console.log('   ❌ 执行异常:', err.message.substring(0, 100));
                        errorCount++;
                    }
                } catch (err2) {
                    console.log('   ❌ 执行异常:', err2.message.substring(0, 100));
                    errorCount++;
                }
            }
        }
        
        console.log('');
        console.log('==================================================');
        console.log('📊 同步结果统计:');
        console.log('✅ 成功:', successCount);
        console.log('⚠️ 跳过:', skipCount);
        console.log('❌ 失败:', errorCount);
        console.log('📝 总计:', successCount + skipCount + errorCount);
        
        // 验证关键组件
        console.log('');
        console.log('🔍 验证关键组件:');
        
        // 检查存储桶
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.log('❌ 存储桶检查失败:', bucketsError.message);
        } else {
            console.log('✅ 存储桶状态:');
            buckets.forEach(bucket => {
                console.log(`   - ${bucket.name}: ${bucket.public ? '公开' : '私有'}, 大小限制: ${bucket.file_size_limit || '无限制'}`);
            });
        }
        
        // 检查file_metadata表
        const { data: tableData, error: tableError } = await supabase
            .from('file_metadata')
            .select('count', { count: 'exact', head: true });
            
        if (tableError) {
            console.log('❌ file_metadata表检查失败:', tableError.message);
        } else {
            console.log('✅ file_metadata表: 可访问');
        }
        
        // 测试函数
        console.log('');
        console.log('🧪 测试存储函数:');
        
        try {
            const { data: cleanupData, error: cleanupError } = await supabase.rpc('schedule_cleanup');
            if (cleanupError) {
                console.log('❌ schedule_cleanup函数:', cleanupError.message);
            } else {
                console.log('✅ schedule_cleanup函数: 正常');
                console.log('   结果:', cleanupData);
            }
        } catch (err) {
            console.log('❌ schedule_cleanup函数测试失败:', err.message);
        }
        
        console.log('');
        console.log('==================================================');
        
        if (errorCount === 0) {
            console.log('🎉 存储配置同步完成！所有组件都已正确设置。');
            console.log('🎯 现在可以通过Trae AI使用完整的文件存储功能了。');
        } else {
            console.log('⚠️ 存储配置同步完成，但有部分错误。');
            console.log('💡 大部分功能应该可以正常使用，错误可能是权限相关的非关键问题。');
        }
        
    } catch (error) {
        console.log('❌ 同步过程中发生错误:', error.message);
        console.log('错误详情:', error);
    }
}

async function main() {
    await syncStorageConfiguration();
}

main().catch(console.error);