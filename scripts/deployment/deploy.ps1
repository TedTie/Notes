# AI Notebook 自动部署脚本
# 使用方法: .\deploy.ps1

Write-Host "🚀 AI Notebook 自动部署脚本" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# 检查必要的工具
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

Write-Host "📋 检查环境依赖..." -ForegroundColor Yellow

# 检查 Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 npm
if (-not (Test-Command "npm")) {
    Write-Host "❌ 未找到 npm，请先安装 npm" -ForegroundColor Red
    exit 1
}

# 检查 Vercel CLI
if (-not (Test-Command "vercel")) {
    Write-Host "⚠️  未找到 Vercel CLI，正在安装..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Vercel CLI 安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 环境检查完成" -ForegroundColor Green

# 进入前端目录
$frontendPath = "ai-notebook\frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ 未找到前端目录: $frontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath
Write-Host "📁 进入前端目录: $frontendPath" -ForegroundColor Blue

# 安装依赖
Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}

# 检查环境变量文件
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  未找到 .env.local 文件" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Write-Host "📋 发现 .env.example 文件，正在复制..." -ForegroundColor Blue
        Copy-Item ".env.example" ".env.local"
        
        Write-Host "" -ForegroundColor White
        Write-Host "🔧 请编辑 .env.local 文件并填入您的 Supabase 配置:" -ForegroundColor Cyan
        Write-Host "   - VITE_SUPABASE_URL=https://your-project-ref.supabase.co" -ForegroundColor White
        Write-Host "   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        
        $continue = Read-Host "配置完成后按 Enter 继续，或输入 'exit' 退出"
        if ($continue -eq "exit") {
            Write-Host "👋 部署已取消" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "❌ 未找到环境变量配置文件" -ForegroundColor Red
        exit 1
    }
}

# 构建项目
Write-Host "🔨 构建前端项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 项目构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 项目构建成功" -ForegroundColor Green

# 部署到 Vercel
Write-Host "🌐 部署到 Vercel..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "请按照 Vercel CLI 的提示进行操作:" -ForegroundColor Cyan
Write-Host "1. 选择或创建 Vercel 项目" -ForegroundColor White
Write-Host "2. 确认项目设置" -ForegroundColor White
Write-Host "3. 等待部署完成" -ForegroundColor White
Write-Host "" -ForegroundColor White

vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel 部署失败" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# 显示后续步骤
Write-Host "📋 后续步骤:" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "1. 🗄️  配置 Supabase 数据库:" -ForegroundColor Yellow
Write-Host "   - 访问 https://supabase.com" -ForegroundColor White
Write-Host "   - 创建新项目" -ForegroundColor White
Write-Host "   - 在 SQL Editor 中执行 supabase-migration/ 目录下的 SQL 文件" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "2. 🔧 配置 Vercel 环境变量:" -ForegroundColor Yellow
Write-Host "   - 访问 Vercel 项目设置" -ForegroundColor White
Write-Host "   - 添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "   - 重新部署项目" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "3. 🧪 测试功能:" -ForegroundColor Yellow
Write-Host "   - 访问部署的网站" -ForegroundColor White
Write-Host "   - 测试笔记、待办事项等功能" -ForegroundColor White
Write-Host "   - 验证文件上传和实时同步" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "📚 详细部署指南请查看: DEPLOYMENT_GUIDE.md" -ForegroundColor Blue
Write-Host "" -ForegroundColor White

# 返回原目录
Set-Location ..\..
Write-Host "✅ 部署脚本执行完成" -ForegroundColor Green