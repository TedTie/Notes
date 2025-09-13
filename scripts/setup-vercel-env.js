#!/usr/bin/env node

/**
 * Vercel环境变量自动配置脚本
 * 使用此脚本可以自动设置所有必需的环境变量，无需手动配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查是否安装了Vercel CLI
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 安装Vercel CLI
function installVercelCLI() {
  log('正在安装Vercel CLI...', 'yellow');
  try {
    execSync('npm install -g vercel@latest', { stdio: 'inherit' });
    log('Vercel CLI安装成功！', 'green');
  } catch (error) {
    log('Vercel CLI安装失败，请手动安装：npm install -g vercel@latest', 'red');
    process.exit(1);
  }
}

// 读取.env文件
function readEnvFile() {
  const envPath = path.join(__dirname, '../ai-notebook/backend/.env');
  if (!fs.existsSync(envPath)) {
    log('未找到.env文件，请先创建.env文件', 'red');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

// 设置Vercel环境变量
function setVercelEnvVar(key, value, environment = 'production') {
  try {
    const command = `vercel env add ${key} ${environment}`;
    log(`设置环境变量: ${key}`, 'blue');
    
    // 使用echo传递值以避免特殊字符问题
    execSync(`echo "${value}" | ${command}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`设置环境变量 ${key} 失败: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
function main() {
  log('=== Vercel环境变量自动配置工具 ===', 'green');
  
  // 检查Vercel CLI
  if (!checkVercelCLI()) {
    installVercelCLI();
  }
  
  // 读取环境变量
  const envVars = readEnvFile();
  if (!envVars) {
    process.exit(1);
  }
  
  // 需要设置的环境变量列表（不包括AI API密钥，因为它们在应用内动态配置）
  const requiredEnvVars = [
    'DATABASE_URL'
  ];
  
  log('\n开始设置环境变量...', 'yellow');
  
  let successCount = 0;
  requiredEnvVars.forEach(key => {
    if (envVars[key]) {
      if (setVercelEnvVar(key, envVars[key])) {
        successCount++;
      }
    } else {
      log(`警告: 在.env文件中未找到 ${key}`, 'yellow');
    }
  });
  
  log(`\n环境变量设置完成！成功设置 ${successCount}/${requiredEnvVars.length} 个变量`, 'green');
  
  if (successCount === requiredEnvVars.length) {
    log('\n所有环境变量设置成功！现在可以部署项目了。', 'green');
    log('运行以下命令部署：', 'blue');
    log('vercel --prod', 'blue');
  } else {
    log('\n部分环境变量设置失败，请检查并手动设置。', 'yellow');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main, setVercelEnvVar, readEnvFile };