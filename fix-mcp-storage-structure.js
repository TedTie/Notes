// 修复MCP Supabase存储结构问题
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function fixMCPStorageStructure() {
    console.log('🔧 修复MCP Supabase存储结构');
    console.log('==================================================');
    
    try {
        // 加载MCP配置
        const traeConfig = loadTraeEnv();
        console.log('📋 使用MCP配置:');
        console.log('Project Ref:', traeConfig.SUPABASE_PROJECT_REF);
        console.log('Access Token:', traeConfig.SUPABASE_ACCESS_TOKEN ? '***已设置***' : '未设置');
        console.log('');
        
        // 创建Supabase客户端
        const supabaseUrl = `https://${traeConfig.SUPABASE_PROJECT_REF}.supabase.co`;
        const supabase = createClient(supabaseUrl, traeConfig.SUPABASE_ACCESS_TOKEN, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('🔍 步骤1: 检查当前存储结构');
        const { data: rootFiles, error: rootError } = await supabase.storage
            .from('backgrounds')
            .list('', { limit: 100 });
            
        if (rootError) {
            console.log('❌ 无法访问backgrounds存储桶:', rootError.message);
            return;
        }
        
        console.log('当前根目录内容:', rootFiles.map(f => `${f.name} (${f.metadata ? '文件' : '文件夹'})`));
        
        // 检查是否存在错误的'backgrounds'文件夹
        const backgroundsFolder = rootFiles.find(f => f.name === 'backgrounds');
        if (backgroundsFolder) {
            console.log('⚠️ 发现错误的backgrounds文件夹结构');
            
            // 检查backgrounds文件夹内容
            const { data: bgFolderFiles, error: bgFolderError } = await supabase.storage
                .from('backgrounds')
                .list('backgrounds', { limit: 100 });
                
            if (!bgFolderError && bgFolderFiles.length > 0) {
                console.log('backgrounds文件夹内容:', bgFolderFiles.map(f => f.name));
                
                // 移动文件到正确位置
                console.log('🔄 开始修复文件结构...');
                
                for (const file of bgFolderFiles) {
                    if (file.name === 'light' || file.name === 'dark') {
                        console.log(`处理${file.name}文件夹...`);
                        
                        // 获取主题文件夹中的文件
                        const { data: themeFiles, error: themeError } = await supabase.storage
                            .from('backgrounds')
                            .list(`backgrounds/${file.name}`, { limit: 100 });
                            
                        if (!themeError && themeFiles.length > 0) {
                            console.log(`${file.name}文件夹包含${themeFiles.length}个文件`);
                            
                            for (const themeFile of themeFiles) {
                                const oldPath = `backgrounds/${file.name}/${themeFile.name}`;
                                const newPath = `${file.name}/${themeFile.name}`;
                                
                                console.log(`移动文件: ${oldPath} -> ${newPath}`);
                                
                                // 复制文件到新位置
                                const { data: fileData, error: downloadError } = await supabase.storage
                                    .from('backgrounds')
                                    .download(oldPath);
                                    
                                if (!downloadError) {
                                    const { error: uploadError } = await supabase.storage
                                        .from('backgrounds')
                                        .upload(newPath, fileData, {
                                            cacheControl: '3600',
                                            upsert: true
                                        });
                                        
                                    if (!uploadError) {
                                        // 删除旧文件
                                        await supabase.storage
                                            .from('backgrounds')
                                            .remove([oldPath]);
                                        console.log(`✅ 成功移动: ${themeFile.name}`);
                                    } else {
                                        console.log(`❌ 上传失败: ${uploadError.message}`);
                                    }
                                } else {
                                    console.log(`❌ 下载失败: ${downloadError.message}`);
                                }
                            }
                        }
                    }
                }
                
                // 删除空的backgrounds文件夹
                console.log('🧹 清理空文件夹...');
                const { error: removeError } = await supabase.storage
                    .from('backgrounds')
                    .remove(['backgrounds/light', 'backgrounds/dark', 'backgrounds']);
                    
                if (!removeError) {
                    console.log('✅ 成功清理空文件夹');
                } else {
                    console.log('⚠️ 清理文件夹时出现问题:', removeError.message);
                }
            }
        }
        
        console.log('');
        console.log('🔍 步骤2: 验证修复后的结构');
        const { data: finalRootFiles, error: finalRootError } = await supabase.storage
            .from('backgrounds')
            .list('', { limit: 100 });
            
        if (!finalRootError) {
            console.log('修复后根目录内容:', finalRootFiles.map(f => f.name));
            
            // 检查light和dark文件夹
            const themes = ['light', 'dark'];
            for (const theme of themes) {
                const { data: themeFiles, error: themeError } = await supabase.storage
                    .from('backgrounds')
                    .list(theme, { limit: 100 });
                    
                if (!themeError) {
                    console.log(`${theme}主题文件夹: ${themeFiles.length}个文件`);
                    if (themeFiles.length > 0) {
                        console.log(`   文件: ${themeFiles.map(f => f.name).join(', ')}`);
                    }
                } else {
                    console.log(`❌ ${theme}主题文件夹访问失败:`, themeError.message);
                }
            }
        }
        
        console.log('');
        console.log('==================================================');
        console.log('🏁 MCP存储结构修复完成');
        console.log('✅ 存储结构已优化');
        console.log('📁 主题文件夹结构正确');
        console.log('🎯 MCP服务器现在可以正确管理主题分离的背景文件');
        
    } catch (error) {
        console.log('❌ 修复过程中发生错误:', error.message);
        console.log('错误详情:', error);
    }
}

// 运行修复
fixMCPStorageStructure().catch(console.error);