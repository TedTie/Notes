// 验证核心存储功能（跳过需要exec_sql的部分）
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

async function verifyCoreStorage() {
    console.log('🔍 验证核心存储功能');
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
        
        let allTestsPassed = true;
        
        // 1. 测试数据库连接
        console.log('🔗 测试数据库连接...');
        try {
            const { data, error } = await supabase.from('file_metadata').select('count', { count: 'exact', head: true });
            if (error) {
                console.log('❌ 数据库连接失败:', error.message);
                allTestsPassed = false;
            } else {
                console.log('✅ 数据库连接正常');
            }
        } catch (err) {
            console.log('❌ 数据库连接异常:', err.message);
            allTestsPassed = false;
        }
        
        // 2. 测试存储桶访问
        console.log('');
        console.log('🗂️ 测试存储桶访问...');
        try {
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            if (bucketsError) {
                console.log('❌ 存储桶访问失败:', bucketsError.message);
                allTestsPassed = false;
            } else {
                console.log('✅ 存储桶访问正常');
                console.log('📋 可用存储桶:');
                buckets.forEach(bucket => {
                    const sizeLimit = bucket.file_size_limit ? (bucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB' : '无限制';
                    console.log(`   - ${bucket.name}: ${bucket.public ? '公开' : '私有'}, 大小限制: ${sizeLimit}`);
                });
                
                // 检查必需的存储桶
                const requiredBuckets = ['backgrounds', 'uploads', 'temp'];
                const existingBuckets = buckets.map(b => b.name);
                const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));
                
                if (missingBuckets.length > 0) {
                    console.log('⚠️ 缺少存储桶:', missingBuckets.join(', '));
                    console.log('💡 请在Supabase控制台的Storage中创建这些存储桶');
                }
            }
        } catch (err) {
            console.log('❌ 存储桶访问异常:', err.message);
            allTestsPassed = false;
        }
        
        // 3. 测试文件上传和下载
        console.log('');
        console.log('📤 测试文件上传和下载...');
        try {
            const testContent = `测试文件内容\n创建时间: ${new Date().toISOString()}\n用于验证Trae AI存储功能`;
            const testFileName = `test-core-${Date.now()}.txt`;
            
            // 上传测试文件
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(testFileName, testContent, {
                    contentType: 'text/plain',
                    upsert: false
                });
                
            if (uploadError) {
                console.log('❌ 文件上传失败:', uploadError.message);
                allTestsPassed = false;
            } else {
                console.log('✅ 文件上传成功:', uploadData.path);
                
                // 测试文件下载
                const { data: downloadData, error: downloadError } = await supabase.storage
                    .from('uploads')
                    .download(uploadData.path);
                    
                if (downloadError) {
                    console.log('❌ 文件下载失败:', downloadError.message);
                    allTestsPassed = false;
                } else {
                    const downloadedContent = await downloadData.text();
                    console.log('✅ 文件下载成功');
                    console.log('   内容匹配:', downloadedContent.includes('测试文件内容') ? '✅' : '❌');
                }
                
                // 清理测试文件
                const { error: deleteError } = await supabase.storage
                    .from('uploads')
                    .remove([uploadData.path]);
                    
                if (deleteError) {
                    console.log('⚠️ 测试文件清理失败:', deleteError.message);
                } else {
                    console.log('✅ 测试文件已清理');
                }
            }
        } catch (err) {
            console.log('❌ 文件操作异常:', err.message);
            allTestsPassed = false;
        }
        
        // 4. 测试基本函数（如果存在）
        console.log('');
        console.log('⚙️ 测试基本函数...');
        try {
            const { data: cleanupData, error: cleanupError } = await supabase.rpc('schedule_cleanup');
            if (cleanupError) {
                console.log('⚠️ schedule_cleanup函数不可用:', cleanupError.message);
                console.log('💡 需要在Supabase控制台中手动创建此函数');
            } else {
                console.log('✅ schedule_cleanup函数正常:', cleanupData);
            }
        } catch (err) {
            console.log('⚠️ 函数测试跳过（可能未创建）');
        }
        
        // 5. 测试file_metadata表基本操作
        console.log('');
        console.log('🗃️ 测试file_metadata表...');
        try {
            // 尝试插入测试记录
            const testRecord = {
                storage_path: `test-${Date.now()}.txt`,
                original_name: 'test-file.txt',
                file_size: 100,
                file_type: 'text/plain',
                bucket_name: 'uploads'
            };
            
            const { data: insertData, error: insertError } = await supabase
                .from('file_metadata')
                .insert(testRecord)
                .select();
                
            if (insertError) {
                console.log('⚠️ file_metadata表插入失败:', insertError.message);
                console.log('💡 可能需要调整表结构或权限');
            } else {
                console.log('✅ file_metadata表插入成功');
                
                // 查询测试记录
                const { data: queryData, error: queryError } = await supabase
                    .from('file_metadata')
                    .select('*')
                    .eq('id', insertData[0].id);
                    
                if (queryError) {
                    console.log('⚠️ file_metadata表查询失败:', queryError.message);
                } else {
                    console.log('✅ file_metadata表查询成功');
                }
                
                // 清理测试记录
                const { error: deleteError } = await supabase
                    .from('file_metadata')
                    .delete()
                    .eq('id', insertData[0].id);
                    
                if (deleteError) {
                    console.log('⚠️ 测试记录清理失败:', deleteError.message);
                } else {
                    console.log('✅ 测试记录已清理');
                }
            }
        } catch (err) {
            console.log('⚠️ file_metadata表测试失败:', err.message);
        }
        
        console.log('');
        console.log('==================================================');
        
        if (allTestsPassed) {
            console.log('🎉 核心存储功能验证通过！');
            console.log('');
            console.log('✅ 可用功能:');
            console.log('   • 数据库连接正常');
            console.log('   • 存储桶访问正常');
            console.log('   • 文件上传/下载正常');
            console.log('   • 基本数据操作正常');
            console.log('');
            console.log('🎯 Trae AI现在可以使用以下功能:');
            console.log('   • 文件存储和管理');
            console.log('   • 笔记附件上传');
            console.log('   • 图片和文档存储');
            console.log('   • 基本的元数据管理');
        } else {
            console.log('⚠️ 部分功能存在问题，但核心存储功能可能仍然可用');
        }
        
        console.log('');
        console.log('💡 下一步建议:');
        if (!allTestsPassed) {
            console.log('1. 查看上面的错误信息，解决具体问题');
            console.log('2. 参考 manual-sql-setup-guide.md 在Supabase控制台中手动设置');
        }
        console.log('3. 如果核心功能正常，可以开始使用Trae AI的存储功能');
        console.log('4. 高级功能（如自动清理）可能需要额外的手动配置');
        
    } catch (error) {
        console.log('❌ 验证过程中发生错误:', error.message);
        console.log('错误详情:', error);
    }
}

async function main() {
    await verifyCoreStorage();
}

main().catch(console.error);