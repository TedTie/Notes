# AI Notebook 项目

一个基于 Vue.js 和 Python Flask 的智能笔记应用，支持 AI 对话、主题切换、背景管理等功能。

## 项目结构

```
ProjectNote/
├── ai-notebook/                    # 主应用目录
│   ├── frontend/                   # Vue.js 前端
│   ├── backend/                    # Python Flask 后端
│   └── README.md                   # 主应用说明文档
├── docs/                           # 项目文档
│   ├── deployment/                 # 部署相关文档
│   │   ├── auto-deploy.md         # 自动部署指南
│   │   ├── deployment-guide.md    # 部署指南
│   │   ├── git-supabase-deployment.md # Git和Supabase部署指南
│   │   ├── vercel-deployment.md   # Vercel部署文档
│   │   ├── vercel-fullstack-deployment.md # Vercel全栈部署
│   │   └── vercel-supabase-env-setup.md # Vercel Supabase环境设置
│   ├── setup/                     # 设置和配置文档
│   │   ├── setup-guide.md         # 设置指南
│   │   ├── quick-start.md         # 快速开始指南
│   │   └── manual-sql-setup.md   # 手动SQL设置指南
│   ├── troubleshooting/           # 故障排除文档
│   │   ├── file-upload-errors.md # 文件上传错误解决方案
│   │   ├── supabase-errors.md    # Supabase错误修复
│   │   ├── vercel-build-errors.md # Vercel构建错误修复
│   │   ├── vercel-file-upload-errors.md # Vercel文件上传错误修复
│   │   ├── vercel-security-errors.md # Vercel安全检查点解决方案
│   │   └── reports/               # 修复报告
│   │       ├── sql-execution-fix.md # SQL执行修复报告
│   │       ├── mcp-server-verification.md # MCP服务器验证报告
│   │       └── sync-status.md    # 同步状态报告
│   ├── configuration/             # 配置状态文档
│   │   ├── vercel-env-config.md  # Vercel环境配置详情
│   │   ├── vercel-frontend-config.md # Vercel前端配置状态
│   │   └── vercel-config-test.md # Vercel配置测试
│   └── development/               # 开发相关文档
│       ├── 开发规划文档.md        # 开发规划
│       ├── 番茄时钟.md            # 番茄时钟功能
│       ├── 项目管理.md            # 项目管理
│       └── project-notes.md       # 项目笔记
├── scripts/                       # 脚本目录
│   ├── deployment/                # 部署脚本
│   │   └── deploy.ps1            # PowerShell部署脚本
│   ├── tests/                     # 测试脚本
│   │   ├── connection/            # 连接测试
│   │   ├── storage/               # 存储测试
│   │   ├── frontend/              # 前端测试
│   │   └── mcp/                   # MCP测试
│   ├── fixes/                     # 修复脚本
│   │   ├── database/              # 数据库修复
│   │   ├── storage/               # 存储修复
│   │   └── mcp/                   # MCP修复
│   └── utilities/                 # 工具脚本
│       ├── migration/             # 迁移脚本
│       ├── sync/                  # 同步脚本
│       └── verification/          # 验证脚本
├── supabase-migration/            # Supabase迁移文件
├── supabase/                      # Supabase配置
├── .github/                       # GitHub Actions
└── DOCUMENT_ORGANIZATION_PLAN.md  # 文档整理方案
```

## 快速开始

1. **环境设置**：参考 [docs/setup/setup-guide.md](docs/setup/setup-guide.md)
2. **快速启动**：参考 [docs/setup/quick-start.md](docs/setup/quick-start.md)
3. **部署指南**：参考 [docs/deployment/](docs/deployment/) 目录下的相关文档

## 主要功能

- 🤖 AI 对话功能
- 📝 智能笔记管理
- 🎨 主题切换（浅色/深色）
- 🖼️ 背景图片管理
- 📱 响应式设计
- ☁️ 云端同步（Supabase）

## 技术栈

### 前端
- Vue.js 3
- Vite
- Tailwind CSS
- TypeScript

### 后端
- Python Flask
- SQLAlchemy
- Supabase

### 部署
- Vercel (前端)
- Railway/Heroku (后端)
- Supabase (数据库和存储)

## 开发指南

### 本地开发

```bash
# 前端开发
cd ai-notebook/frontend
npm install
npm run dev

# 后端开发
cd ai-notebook/backend
pip install -r requirements.txt
python app.py
```

### 测试

项目包含完整的测试脚本，位于 `scripts/tests/` 目录：

- **连接测试**：`scripts/tests/connection/`
- **存储测试**：`scripts/tests/storage/`
- **前端测试**：`scripts/tests/frontend/`
- **MCP测试**：`scripts/tests/mcp/`

### 部署

使用 `scripts/deployment/deploy.ps1` 进行自动化部署，或参考 `docs/deployment/` 目录下的详细部署指南。

## 故障排除

如果遇到问题，请查看 [docs/troubleshooting/](docs/troubleshooting/) 目录下的相关文档：

- 文件上传问题
- Supabase 连接问题
- Vercel 部署问题
- 构建错误解决方案

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请创建 Issue 或联系项目维护者。