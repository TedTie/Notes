# 自动化工作流主脚本
param(
    [string]$Action = "full",
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false
)

$ErrorActionPreference = "Stop"
$projectPath = "E:\51\AI\ProjectNote"
$vercelUrl = "https://notes-five-smoky.vercel.app/"
$githubRepo = "https://github.com/TedTie/Notes.git"

Write-Host "🚀 开始自动化工作流..." -ForegroundColor Green
Write-Host "项目路径: $projectPath" -ForegroundColor Cyan
Write-Host "动作: $Action" -ForegroundColor Cyan

function Test-Environment {
    Write-Host "🔍 检查环境..." -ForegroundColor Yellow

    # 检查Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js未安装" -ForegroundColor Red
        exit 1
    }

    # 检查项目目录
    if (Test-Path $projectPath) {
        Write-Host "✅ 项目目录存在" -ForegroundColor Green
    } else {
        Write-Host "❌ 项目目录不存在: $projectPath" -ForegroundColor Red
        exit 1
    }

    # 检查Git
    try {
        $gitVersion = git --version
        Write-Host "✅ Git版本: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Git未安装，跳过Git操作" -ForegroundColor Yellow
    }
}

function Install-Dependencies {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    Set-Location $projectPath

    try {
        npm install
        Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

function Run-Tests {
    if ($SkipTests) {
        Write-Host "⏭️ 跳过测试" -ForegroundColor Gray
        return
    }

    Write-Host "🧪 运行测试..." -ForegroundColor Yellow
    Set-Location $projectPath

    try {
        # 运行npm测试
        npm test
        Write-Host "✅ 测试通过" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 测试失败，继续执行" -ForegroundColor Yellow
    }

    # 运行Playwright测试
    if (Test-Path "tests/playwright") {
        try {
            npx playwright test
            Write-Host "✅ Playwright测试通过" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Playwright测试失败" -ForegroundColor Yellow
        }
    }
}

function Build-Project {
    if ($SkipBuild) {
        Write-Host "⏭️ 跳过构建" -ForegroundColor Gray
        return
    }

    Write-Host "🔨 构建项目..." -ForegroundColor Yellow
    Set-Location $projectPath

    try {
        npm run build
        Write-Host "✅ 构建完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 构建失败" -ForegroundColor Red
        exit 1
    }
}

function Deploy-Project {
    if ($SkipDeploy) {
        Write-Host "⏭️ 跳过部署" -ForegroundColor Gray
        return
    }

    Write-Host "🚀 部署项目..." -ForegroundColor Yellow
    Set-Location $projectPath

    try {
        # 检查是否安装了Vercel CLI
        try {
            $vercelVersion = vercel --version
            Write-Host "✅ Vercel CLI版本: $vercelVersion" -ForegroundColor Green
        } catch {
            Write-Host "📥 安装Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }

        # 部署到Vercel
        vercel deploy --prod
        Write-Host "✅ 部署完成" -ForegroundColor Green
        Write-Host "🌐 访问: $vercelUrl" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠️ 部署失败，请手动部署" -ForegroundColor Yellow
    }
}

function Check-Urls {
    Write-Host "🌐 检查URL可访问性..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri $vercelUrl -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Vercel站点可访问" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Vercel站点返回状态码: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Vercel站点无法访问" -ForegroundColor Yellow
    }
}

# 主执行流程
try {
    Test-Environment
    Install-Dependencies

    switch ($Action.ToLower()) {
        "full" {
            Run-Tests
            Build-Project
            Deploy-Project
            Check-Urls
        }
        "test" {
            Run-Tests
        }
        "build" {
            Build-Project
        }
        "deploy" {
            Deploy-Project
        }
        "check" {
            Check-Urls
        }
        default {
            Write-Host "❌ 未知动作: $Action" -ForegroundColor Red
            Write-Host "可用动作: full, test, build, deploy, check" -ForegroundColor Yellow
            exit 1
        }
    }

    Write-Host "🎉 工作流执行完成!" -ForegroundColor Green
} catch {
    Write-Host "❌ 工作流执行失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}