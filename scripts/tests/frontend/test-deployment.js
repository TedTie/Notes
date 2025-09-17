// AI Notebook 部署测试脚本
// 使用方法: node test-deployment.js <your-vercel-url>

const https = require('https');
const http = require('http');
const url = require('url');

// 获取命令行参数
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('❌ 请提供部署的 URL');
    console.log('使用方法: node test-deployment.js https://your-app.vercel.app');
    process.exit(1);
}

const baseUrl = args[0];
console.log('🧪 开始测试部署:', baseUrl);
console.log('==============================');

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 测试函数
function runTest(testName, testFn) {
    totalTests++;
    console.log(`\n🔍 测试: ${testName}`);
    
    return testFn()
        .then(() => {
            console.log(`✅ ${testName} - 通过`);
            passedTests++;
        })
        .catch((error) => {
            console.log(`❌ ${testName} - 失败:`, error.message);
            failedTests++;
        });
}

// HTTP 请求函数
function makeRequest(testUrl, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(testUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.path,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000
        };
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('请求超时'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// 测试用例
async function testHomePage() {
    const response = await makeRequest(baseUrl);
    
    if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}`);
    }
    
    if (!response.body.includes('AI Notebook') && !response.body.includes('<!DOCTYPE html>')) {
        throw new Error('页面内容不正确');
    }
}

async function testStaticAssets() {
    const response = await makeRequest(`${baseUrl}/assets/`);
    
    // 静态资源可能返回 404 或重定向，这是正常的
    if (response.statusCode >= 500) {
        throw new Error(`服务器错误: HTTP ${response.statusCode}`);
    }
}

async function testSPARouting() {
    const response = await makeRequest(`${baseUrl}/notes`);
    
    if (response.statusCode !== 200) {
        throw new Error(`SPA 路由失败: HTTP ${response.statusCode}`);
    }
    
    if (!response.body.includes('<!DOCTYPE html>')) {
        throw new Error('SPA 路由返回内容不正确');
    }
}

async function testSecurityHeaders() {
    const response = await makeRequest(baseUrl);
    
    const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => 
        !response.headers[header] && !response.headers[header.toLowerCase()]
    );
    
    if (missingHeaders.length > 0) {
        throw new Error(`缺少安全头: ${missingHeaders.join(', ')}`);
    }
}

async function testResponseTime() {
    const startTime = Date.now();
    await makeRequest(baseUrl);
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 5000) {
        throw new Error(`响应时间过长: ${responseTime}ms`);
    }
    
    console.log(`   📊 响应时间: ${responseTime}ms`);
}

async function testHTTPS() {
    if (!baseUrl.startsWith('https://')) {
        throw new Error('未使用 HTTPS');
    }
}

async function testEnvironmentVariables() {
    const response = await makeRequest(baseUrl);
    
    // 检查是否包含环境变量的占位符（不应该出现在生产环境）
    if (response.body.includes('your_supabase_project_url') || 
        response.body.includes('your_supabase_anon_key')) {
        throw new Error('检测到未配置的环境变量');
    }
}

async function testMobileResponsive() {
    const response = await makeRequest(baseUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        }
    });
    
    if (response.statusCode !== 200) {
        throw new Error(`移动端访问失败: HTTP ${response.statusCode}`);
    }
    
    if (!response.body.includes('viewport')) {
        throw new Error('缺少移动端视口配置');
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始运行部署测试...');
    
    await runTest('主页访问', testHomePage);
    await runTest('静态资源', testStaticAssets);
    await runTest('SPA 路由', testSPARouting);
    await runTest('安全头配置', testSecurityHeaders);
    await runTest('响应时间', testResponseTime);
    await runTest('HTTPS 配置', testHTTPS);
    await runTest('环境变量配置', testEnvironmentVariables);
    await runTest('移动端响应式', testMobileResponsive);
    
    // 显示测试结果
    console.log('\n==============================');
    console.log('📊 测试结果统计:');
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   ✅ 通过: ${passedTests}`);
    console.log(`   ❌ 失败: ${failedTests}`);
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`   📈 成功率: ${successRate}%`);
    
    if (failedTests === 0) {
        console.log('\n🎉 所有测试通过！部署成功！');
        console.log('\n📋 下一步:');
        console.log('1. 配置 Supabase 数据库');
        console.log('2. 测试应用功能');
        console.log('3. 设置监控和备份');
    } else {
        console.log('\n⚠️  部分测试失败，请检查配置');
        console.log('\n🔧 建议:');
        console.log('1. 检查 Vercel 部署日志');
        console.log('2. 验证环境变量配置');
        console.log('3. 查看 DEPLOYMENT_GUIDE.md');
        process.exit(1);
    }
}

// 错误处理
process.on('unhandledRejection', (error) => {
    console.log('\n❌ 未处理的错误:', error.message);
    process.exit(1);
});

// 运行测试
runAllTests().catch((error) => {
    console.log('\n❌ 测试运行失败:', error.message);
    process.exit(1);
});