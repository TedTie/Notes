#!/usr/bin/env node

/**
 * 一键部署脚本
 * 自动执行构建、环境变量配置和部署流程
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
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[步骤 ${step}] ${message}`, 'cyan');
}

// 执行命令并处理错误
function runCommand(command, cwd = process.cwd(), description = '') {
  try {
    log(`执行: ${command}`, 'blue');
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`${description}失败: ${error.message}`, 'red');
    return false;
  }
}

// 检查必要文件
function checkRequiredFiles() {
  const requiredFiles = [
    'vercel.json',
    'ai-notebook/frontend/package.json',
    'ai-notebook/backend/requirements.txt',
    'ai-notebook/backend/.env'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`错误: 缺少必要文件 ${file}`, 'red');
      return false;
    }
  }
  return true;
}

// 构建前端
function buildFrontend() {
  logStep(2, '构建前端项目');
  const frontendPath = path.join(process.cwd(), 'ai-notebook/frontend');
  
  if (!runCommand('npm ci', frontendPath, '安装前端依赖')) {
    return false;
  }
  
  if (!runCommand('npm run build', frontendPath, '构建前端')) {
    return false;
  }
  
  log('前端构建完成！', 'green');
  return true;
}

// 测试后端
function testBackend() {
  logStep(3, '测试后端项目');
  const backendPath = path.join(process.cwd(), 'ai-notebook/backend');
  
  if (!runCommand('pip install -r requirements.txt', backendPath, '安装后端依赖')) {
    return false;
  }
  
  if (!runCommand('python -c "from app import create_app; app = create_app(); print(\'Backend test successful\')"', backendPath, '测试后端')) {
    return false;
  }
  
  log('后端测试通过！', 'green');
  return true;
}

// 部署到Vercel
function deployToVercel() {
  logStep(4, '部署到Vercel');
  
  // 检查是否已登录Vercel
  try {
    execSync('vercel whoami', { stdio: 'ignore' });
  } catch (error) {
    log('请先登录Vercel: vercel login', 'yellow');
    if (!runCommand('vercel login', process.cwd(), 'Vercel登录')) {
      return false;
    }
  }
  
  // 部署
  if (!runCommand('vercel --prod', process.cwd(), '部署项目')) {
    return false;
  }
  
  log('部署完成！', 'green');
  return true;
}

// 主函数
function main() {
  log('=== AI Notebook 一键部署工具 ===', 'green');
  log('此工具将自动完成前后端构建和部署流程\n', 'yellow');
  
  logStep(1, '检查项目文件');
  if (!checkRequiredFiles()) {
    log('项目文件检查失败，请确保所有必要文件存在', 'red');
    process.exit(1);
  }
  log('项目文件检查通过！', 'green');
  
  // 构建前端
  if (!buildFrontend()) {
    log('前端构建失败，部署终止', 'red');
    process.exit(1);
  }
  
  // 测试后端
  if (!testBackend()) {
    log('后端测试失败，部署终止', 'red');
    process.exit(1);
  }
  
  // 部署
  if (!deployToVercel()) {
    log('部署失败', 'red');
    process.exit(1);
  }
  
  log('\n🎉 部署成功完成！', 'green');
  log('\n后续步骤：', 'cyan');
  log('1. 访问Vercel控制台查看部署状态', 'blue');
  log('2. 配置自定义域名（可选）', 'blue');
  log('3. 设置环境变量（如果尚未设置）', 'blue');
  log('\n使用 npm run setup-env 来自动配置环境变量', 'yellow');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main, buildFrontend, testBackend, deployToVercel };