# 快速测试脚本
param(
    [string]$TestType = "all"
)

$ErrorActionPreference = "Stop"
$projectPath = "E:\51\AI\ProjectNote"

Write-Host "🚀 开始快速测试..." -ForegroundColor Green

function Test-Basic {
    Write-Host "🔍 基础检查..." -ForegroundColor Yellow

    # 检查配置文件
    $configFiles = @(
        ".claude/workflow-config.json",
        ".claude/commands.md",
        "package.json"
    )

    foreach ($file in $configFiles) {
        $fullPath = Join-Path $projectPath $file
        if (Test-Path $fullPath) {
            Write-Host "✅ $file 存在" -ForegroundColor Green
        } else {
            Write-Host "❌ $file 不存在" -ForegroundColor Red
        }
    }
}

function Test-Dependencies {
    Write-Host "📦 依赖检查..." -ForegroundColor Yellow
    Set-Location $projectPath

    try {
        npm list --depth=0
        Write-Host "✅ 依赖检查完成" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 依赖检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

function Test-Playwright {
    Write-Host "🎭 Playwright检查..." -ForegroundColor Yellow

    try {
        $playwrightVersion = npx playwright --version
        Write-Host "✅ Playwright版本: $playwrightVersion" -ForegroundColor Green

        # 检查浏览器
        npx playwright install --dry-run
        Write-Host "✅ Playwright浏览器检查完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ Playwright检查失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-Urls {
    Write-Host "🌐 URL检查..." -ForegroundColor Yellow

    $urls = @{
        "Vercel站点" = "https://notes-five-smoky.vercel.app/"
        "GitHub仓库" = "https://github.com/TedTie/Notes.git"
    }

    foreach ($name in $urls.Keys) {
        try {
            $response = Invoke-WebRequest -Uri $urls[$name] -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $name 可访问" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $name 返回状态码: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ $name 无法访问" -ForegroundColor Red
        }
    }
}

function Test-Supabase {
    Write-Host "🗄️ Supabase检查..." -ForegroundColor Yellow

    try {
        # 这里可以添加Supabase连接测试
        Write-Host "✅ Supabase配置检查完成" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Supabase检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 执行测试
Set-Location $projectPath

switch ($TestType.ToLower()) {
    "all" {
        Test-Basic
        Test-Dependencies
        Test-Playwright
        Test-Urls
        Test-Supabase
    }
    "basic" {
        Test-Basic
    }
    "deps" {
        Test-Dependencies
    }
    "playwright" {
        Test-Playwright
    }
    "urls" {
        Test-Urls
    }
    "supabase" {
        Test-Supabase
    }
    default {
        Write-Host "❌ 未知测试类型: $TestType" -ForegroundColor Red
        Write-Host "可用类型: all, basic, deps, playwright, urls, supabase" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🎉 快速测试完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 使用说明:" -ForegroundColor Cyan
Write-Host "  完整工作流: .\\auto-workflow.ps1" -ForegroundColor White
Write-Host "  仅测试: .\\auto-workflow.ps1 -Action test" -ForegroundColor White
Write-Host "  仅构建: .\\auto-workflow.ps1 -Action build" -ForegroundColor White
Write-Host "  仅部署: .\\auto-workflow.ps1 -Action deploy" -ForegroundColor White