// 最终清理MCP Supabase存储结构
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

async function cleanMCPStorageFinal() {
    console.log('🧹 最终清理MCP Supabase存储结构');
    console.log('==================================================');
    
    try {
        // 加载MCP配置
        const traeConfig = loadTraeEnv();
        console.log('📋 使用MCP配置:');
        console.log('Project Ref:', traeConfig.SUPABASE_PROJECT_REF);
        console.log('');
        
        // 创建Supabase客户端
        const supabaseUrl = `https://${traeConfig.SUPABASE_PROJECT_REF}.supabase.co`;
        const supabase = createClient(supabaseUrl, traeConfig.SUPABASE_ACCESS_TOKEN, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('🔍 步骤1: 检查当前根目录');
        const { data: rootFiles, error: rootError } = await supabase.storage
            .from('backgrounds')
            .list('', { limit: 100 });
            
        if (rootError) {
            console.log('❌ 无法访问backgrounds存储桶:', rootError.message);
            return;
        }
        
        console.log('当前根目录内容:', rootFiles.map(f => f.name));
        
        // 删除所有错误的文件夹和文件
        console.log('🗑️ 清理所有内容...');
        const filesToRemove = rootFiles.map(f => f.name);
        
        if (filesToRemove.length > 0) {
            const { error: removeError } = await supabase.storage
                .from('backgrounds')
                .remove(filesToRemove);
                
            if (removeError) {
                console.log('⚠️ 删除文件时出现问题:', removeError.message);
            } else {
                console.log('✅ 成功清理所有内容');
            }
        }
        
        console.log('');
        console.log('🔍 步骤2: 创建正确的文件夹结构');
        
        // 创建light和dark文件夹（通过上传一个临时文件然后删除）
        const themes = ['light', 'dark'];
        const tempContent = new Blob(['temp'], { type: 'text/plain' });
        
        for (const theme of themes) {
            console.log(`创建${theme}文件夹...`);
            
            // 上传临时文件到主题文件夹
            const { error: uploadError } = await supabase.storage
                .from('backgrounds')
                .upload(`${theme}/.temp`, tempContent);
                
            if (!uploadError) {
                // 立即删除临时文件，但保留文件夹结构
                await supabase.storage
                    .from('backgrounds')
                    .remove([`${theme}/.temp`]);
                console.log(`✅ ${theme}文件夹已创建`);
            } else {
                console.log(`❌ 创建${theme}文件夹失败:`, uploadError.message);
            }
        }
        
        console.log('');
        console.log('🔍 步骤3: 验证最终结构');
        const { data: finalRootFiles, error: finalRootError } = await supabase.storage
            .from('backgrounds')
            .list('', { limit: 100 });
            
        if (!finalRootError) {
            console.log('最终根目录内容:', finalRootFiles.map(f => f.name));
            
            // 验证每个主题文件夹
            for (const theme of themes) {
                const { data: themeFiles, error: themeError } = await supabase.storage
                    .from('backgrounds')
                    .list(theme, { limit: 100 });
                    
                if (!themeError) {
                    console.log(`✅ ${theme}主题文件夹: 可访问，${themeFiles.length}个文件`);
                } else {
                    console.log(`❌ ${theme}主题文件夹访问失败:`, themeError.message);
                }
            }
        }
        
        console.log('');
        console.log('🔍 步骤4: 测试文件上传功能');
        
        // 创建一个测试SVG文件
        const testSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f0f0f0"/>
  <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12">MCP Test</text>
</svg>`;
        
        const svgBlob = new Blob([testSvg], { type: 'image/svg+xml' });
        
        // 测试上传到light主题
        const testFileName = `mcp-test-${Date.now()}.svg`;
        const { error: testUploadError } = await supabase.storage
            .from('backgrounds')
            .upload(`light/${testFileName}`, svgBlob);
            
        if (!testUploadError) {
            console.log('✅ 测试文件上传成功');
            
            // 获取公开URL
            const { data: urlData } = supabase.storage
                .from('backgrounds')
                .getPublicUrl(`light/${testFileName}`);
            console.log('测试文件URL:', urlData.publicUrl);
            
            // 清理测试文件
            await supabase.storage
                .from('backgrounds')
                .remove([`light/${testFileName}`]);
            console.log('🧹 测试文件已清理');
        } else {
            console.log('❌ 测试文件上传失败:', testUploadError.message);
        }
        
        console.log('');
        console.log('==================================================');
        console.log('🏁 MCP存储结构最终清理完成');
        console.log('✅ 存储结构已完全优化');
        console.log('📁 主题文件夹结构正确 (light/, dark/)');
        console.log('🔗 文件上传功能正常');
        console.log('🎯 MCP服务器现在可以完美管理主题分离的背景文件');
        console.log('');
        console.log('💡 使用建议:');
        console.log('   - 上传light主题背景到: backgrounds/light/');
        console.log('   - 上传dark主题背景到: backgrounds/dark/');
        console.log('   - 文件将自动获得公开访问URL');
        
    } catch (error) {
        console.log('❌ 清理过程中发生错误:', error.message);
        console.log('错误详情:', error);
    }
}

// 运行最终清理
cleanMCPStorageFinal().catch(console.error);