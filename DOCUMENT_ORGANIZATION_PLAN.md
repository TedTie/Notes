# 项目文档整理方案

## 当前文档分析

### 1. 部署相关文档 (7个)
- `AUTO_DEPLOY_GUIDE.md` - 自动部署指南
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `GIT_SUPABASE_DEPLOYMENT_GUIDE.md` - Git和Supabase部署指南
- `VERCEL_DEPLOYMENT.md` - Vercel部署文档
- `VERCEL_FULLSTACK_DEPLOYMENT.md` - Vercel全栈部署文档
- `vercel-supabase-env-setup-guide.md` - Vercel Supabase环境设置指南
- `deploy.ps1` - 部署脚本

### 2. 设置和配置文档 (4个)
- `SETUP_GUIDE.md` - 设置指南
- `QUICK_START.md` - 快速开始指南
- `manual-sql-setup-guide.md` - 手动SQL设置指南
- `ProjectNote.md` - 项目笔记

### 3. 错误修复和故障排除文档 (8个)
- `file-upload-501-error-solution.md` - 文件上传501错误解决方案
- `supabase-anon-key-error-fix.md` - Supabase匿名密钥错误修复
- `vercel-build-error-fix.md` - Vercel构建错误修复
- `vercel-file-upload-error-fix.md` - Vercel文件上传错误修复
- `vercel-security-checkpoint-solution.md` - Vercel安全检查点解决方案
- `sql-execution-fix-report.md` - SQL执行修复报告
- `mcp-server-verification-report.md` - MCP服务器验证报告
- `sync-status-report.md` - 同步状态报告

### 4. 配置状态文档 (3个)
- `vercel-env-config-specific.md` - Vercel环境配置详情
- `vercel-frontend-config-status.md` - Vercel前端配置状态
- `test_vercel_config.md` - Vercel配置测试

### 5. 测试脚本 (20个)
- `test-*.js` - 各种测试脚本
- `check-*.js` - 检查脚本
- `verify-*.js` - 验证脚本

### 6. 修复和维护脚本 (10个)
- `fix-*.js` - 修复脚本
- `clean-*.js` - 清理脚本
- `migrate-*.js` - 迁移脚本
- `sync-*.js` - 同步脚本

### 7. 开发文档 (3个)
- `开发规划文档.md` - 开发规划
- `番茄时钟.md` - 番茄时钟功能
- `项目管理.md` - 项目管理

## 整理方案

### 新的目录结构

```
ProjectNote/
├── docs/                           # 文档目录
│   ├── deployment/                 # 部署相关文档
│   │   ├── auto-deploy.md
│   │   ├── deployment-guide.md
│   │   ├── git-supabase-deployment.md
│   │   ├── vercel-deployment.md
│   │   ├── vercel-fullstack-deployment.md
│   │   └── vercel-supabase-env-setup.md
│   ├── setup/                      # 设置和配置文档
│   │   ├── setup-guide.md
│   │   ├── quick-start.md
│   │   └── manual-sql-setup.md
│   ├── troubleshooting/            # 故障排除文档
│   │   ├── file-upload-errors.md
│   │   ├── supabase-errors.md
│   │   ├── vercel-errors.md
│   │   └── reports/
│   │       ├── sql-execution-fix.md
│   │       ├── mcp-server-verification.md
│   │       └── sync-status.md
│   ├── configuration/              # 配置状态文档
│   │   ├── vercel-env-config.md
│   │   ├── vercel-frontend-config.md
│   │   └── vercel-config-test.md
│   └── development/                # 开发相关文档
│       ├── 开发规划文档.md
│       ├── 番茄时钟.md
│       ├── 项目管理.md
│       └── project-notes.md
├── scripts/                        # 脚本目录
│   ├── deployment/                 # 部署脚本
│   │   └── deploy.ps1
│   ├── tests/                      # 测试脚本
│   │   ├── connection/
│   │   ├── storage/
│   │   ├── frontend/
│   │   └── mcp/
│   ├── fixes/                      # 修复脚本
│   │   ├── database/
│   │   ├── storage/
│   │   └── mcp/
│   └── utilities/                  # 工具脚本
│       ├── migration/
│       ├── sync/
│       └── verification/
└── ai-notebook/                    # 主项目目录
    ├── frontend/
    ├── backend/
    └── docs/                       # 项目特定文档
```

## 整理步骤

1. **创建目录结构**
   - 创建 `docs/` 主文档目录
   - 创建 `scripts/` 主脚本目录
   - 创建相应的子目录

2. **移动文档文件**
   - 按类别移动文档到对应目录
   - 重命名文件使其更简洁统一

3. **移动脚本文件**
   - 按功能分类移动脚本
   - 保持脚本的可执行性

4. **清理根目录**
   - 移除临时文件
   - 保留必要的配置文件

5. **更新引用**
   - 更新README中的文档链接
   - 更新脚本中的路径引用

## 预期效果

- 根目录更加整洁
- 文档分类清晰，易于查找
- 脚本按功能组织，便于维护
- 提高项目的可维护性和可读性