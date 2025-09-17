# AI Notebook 自动化部署指南

## 🚀 一键部署概述

本项目已配置完整的自动化部署流程，支持前后端在一个项目中的自动部署，无需手动配置环境变量。

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- Python 3.9+
- Git
- Vercel账号

### 2. 项目结构
```
ai-notebook/
├── frontend/          # Vue.js前端
├── backend/           # Flask后端
├── scripts/           # 部署脚本
├── .github/workflows/ # GitHub Actions
├── vercel.json        # Vercel配置
└── package.json       # 项目配置
```

## 🔧 快速部署

### 方法一：使用部署脚本（推荐）

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   ```bash
   npm run setup-env
   ```
   > 此命令会自动读取 `ai-notebook/backend/.env` 文件并设置到Vercel

3. **一键部署**
   ```bash
   npm run deploy
   ```

### 方法二：手动部署

1. **登录Vercel**
   ```bash
   npm run vercel:login
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **部署到Vercel**
   ```bash
   npm run vercel:deploy
   ```

## 🔄 自动化CI/CD

### GitHub Actions自动部署

项目已配置GitHub Actions，当代码推送到main分支时会自动触发部署：

1. **设置GitHub Secrets**
   在GitHub仓库设置中添加以下Secrets：
   - `VERCEL_TOKEN`: Vercel API Token
   - `VERCEL_ORG_ID`: Vercel组织ID
   - `VERCEL_PROJECT_ID`: Vercel项目ID

2. **获取Vercel信息**
   ```bash
   # 获取Token
   vercel login
   
   # 获取项目信息
   vercel link
   cat .vercel/project.json
   ```

3. **推送代码自动部署**
   ```bash
   git add .
   git commit -m "feat: 更新功能"
   git push origin main
   ```

## 🌍 环境变量配置

### 部署时环境变量

在部署前，需要配置以下环境变量：

#### 必需的环境变量
- `VERCEL_TOKEN`: Vercel部署令牌
- `VERCEL_ORG_ID`: Vercel组织ID
- `VERCEL_PROJECT_ID`: Vercel项目ID

#### AI功能配置
**重要说明**: AI功能的API密钥无需在部署时配置，可以在应用部署后通过设置页面直接配置：
- OpenRouter API密钥：在应用设置页面的"AI配置"部分输入
- 其他AI服务密钥：同样在设置页面动态配置

### 自动配置（推荐）

使用自动化脚本配置：
```bash
npm run setup-env
```

### 手动配置

在Vercel控制台或使用CLI设置以下环境变量：

```bash
# 基础环境变量（可选，也可使用默认值）
vercel env add DATABASE_URL production  # 默认使用SQLite
```

**注意**: AI API密钥建议在应用部署后通过设置页面配置，这样更安全且便于管理。

### 环境变量说明

| 变量名 | 说明 | 是否必需 | 配置方式 |
|--------|------|----------|----------|
| VERCEL_TOKEN | Vercel部署令牌 | 是 | GitHub Secrets |
| VERCEL_ORG_ID | Vercel组织ID | 是 | GitHub Secrets |
| VERCEL_PROJECT_ID | Vercel项目ID | 是 | GitHub Secrets |
| DATABASE_URL | 数据库连接字符串 | 否 | 环境变量（默认SQLite）|
| OPENROUTER_API_KEY | OpenRouter AI服务密钥 | 否 | **应用内设置页面** |
| MOONSHOT_API_KEY | Moonshot AI服务密钥 | 否 | **应用内设置页面** |

## 🤖 AI功能配置指南

### 部署后AI配置步骤

1. **访问应用**: 部署完成后，访问你的Vercel应用URL
2. **进入设置页面**: 点击侧边栏的"设置"选项
3. **配置AI服务**: 在"AI配置"标签页中：
   - 输入OpenRouter API密钥
   - 选择默认AI模型
   - 点击"测试连接"验证配置
4. **保存设置**: 配置会自动保存并加密存储

### AI功能特点

- **动态配置**: 无需重新部署即可更改API密钥
- **安全存储**: API密钥在数据库中加密存储
- **即时生效**: 配置后立即可使用AI功能
- **友好提示**: 未配置时会显示配置指引

### 支持的AI服务

- **OpenRouter**: 支持GPT-5、Claude、Deepseek等多种模型
- **Moonshot**: 支持Kimi模型，适合中文处理
- **扩展性**: 架构支持添加更多AI服务提供商

## 🛠 可用脚本命令

| 命令 | 说明 |
|------|------|
| `npm run setup-env` | 自动配置Vercel环境变量 |
| `npm run deploy` | 一键部署到Vercel |
| `npm run build` | 构建前端项目 |
| `npm run dev:frontend` | 启动前端开发服务器 |
| `npm run dev:backend` | 启动后端开发服务器 |
| `npm run install:all` | 安装前后端所有依赖 |
| `npm run test:backend` | 测试后端应用 |
| `npm run vercel:dev` | 本地Vercel开发环境 |

## 🔍 故障排除

### 常见问题

1. **部署失败：环境变量未设置**
   ```bash
   # 检查环境变量
   vercel env ls
   
   # 重新设置环境变量
   npm run setup-env
   ```

2. **前端构建失败**
   ```bash
   # 清理并重新安装依赖
   cd ai-notebook/frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **后端API无法访问**
   - 检查 `vercel.json` 中的路由配置
   - 确认 `ai-notebook/backend/api/index.py` 文件存在
   - 检查Python依赖是否正确安装

4. **GitHub Actions部署失败**
   - 检查GitHub Secrets是否正确设置
   - 查看Actions日志获取详细错误信息
   - 确认Vercel Token有效且权限正确

### 调试命令

```bash
# 检查Vercel状态
vercel whoami
vercel projects ls

# 本地测试
vercel dev

# 查看部署日志
vercel logs
```

## 📚 部署架构

### Vercel配置说明

- **前端**: Vue.js应用，构建为静态文件
- **后端**: Flask应用，部署为Serverless函数
- **路由**: 自动处理API和静态资源路由
- **缓存**: 优化的静态资源缓存策略

### 文件结构

```
部署后的文件结构：
├── /api/*              → 后端API路由
├── /assets/*           → 前端静态资源
├── /*                  → 前端页面路由
```

## 🎯 最佳实践

1. **开发流程**
   - 本地开发使用 `npm run dev:frontend` 和 `npm run dev:backend`
   - 提交前使用 `npm run test:backend` 测试后端
   - 推送到main分支自动部署

2. **环境管理**
   - 开发环境使用 `.env` 文件
   - 生产环境使用Vercel环境变量
   - 敏感信息不要提交到Git

3. **监控和维护**
   - 定期检查Vercel部署日志
   - 监控API响应时间和错误率
   - 及时更新依赖包版本

## 🆘 获取帮助

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查Vercel控制台的部署日志
3. 查看GitHub Actions的执行日志
4. 确认所有环境变量正确设置

---

**🎉 恭喜！现在你可以享受完全自动化的部署体验了！**