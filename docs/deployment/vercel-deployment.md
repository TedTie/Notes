# Vercel 部署指南

本指南将帮助您通过 GitHub 将 AI Notebook 项目部署到 Vercel。

## 📋 部署前准备

### 1. GitHub 仓库准备
- 确保您的项目已推送到 GitHub 仓库
- 项目结构应包含 `ai-notebook/frontend` 和 `ai-notebook/backend` 目录

### 2. Vercel 账户设置
- 注册 [Vercel](https://vercel.com) 账户
- 连接您的 GitHub 账户到 Vercel

## 🚀 部署步骤

### 方式一：一体化部署（推荐）

1. **登录 Vercel 控制台**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"

2. **导入 GitHub 仓库**
   - 选择您的 AI Notebook 仓库
   - 点击 "Import"

3. **配置项目**
   ```
   Project Name: ai-notebook
   Framework Preset: Other
   Root Directory: (留空，使用根目录)
   Build Command: (自动检测)
   Output Directory: (自动检测)
   Install Command: (自动检测)
   ```

4. **设置环境变量**
   在 Vercel 项目设置中添加：
   ```
   FLASK_ENV=production
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=your-database-url
   MOONSHOT_API_KEY=your-moonshot-api-key
   ENCRYPTION_KEY=your-encryption-key
   ENABLE_LOG_FILTERING=True
   ENABLE_RATE_LIMITING=True
   ```
   
   **注意**: OpenRouter API密钥请在应用的设置页面中配置，无需在环境变量中设置。

5. **部署应用**
   - 点击 "Deploy" 开始部署
   - Vercel 会自动构建前端并部署后端 API
   - 等待构建完成

### 方式二：分离部署

如果您需要分别部署前后端，可以按照以下步骤：

#### 步骤 1: 部署前端应用

1. **创建前端项目**
   ```
   Project Name: ai-notebook-frontend
   Framework Preset: Vite
   Root Directory: ai-notebook/frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

2. **设置环境变量**
   ```
   VITE_API_BASE_URL=https://your-backend-domain.vercel.app
   ```

#### 步骤 2: 部署后端应用

1. **创建后端项目**
   ```
   Project Name: ai-notebook-backend
   Framework Preset: Other
   Root Directory: ai-notebook/backend
   ```

2. **设置后端环境变量**
   ```
   FLASK_ENV=production
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=your-database-url
   MOONSHOT_API_KEY=your-moonshot-api-key
   ENCRYPTION_KEY=your-encryption-key
   ENABLE_LOG_FILTERING=True
   ENABLE_RATE_LIMITING=True
   ```

## 🔧 数据库配置

### 推荐：使用 PostgreSQL

1. **选择数据库服务**
   - [Supabase](https://supabase.com) (推荐)
   - [PlanetScale](https://planetscale.com)
   - [Railway](https://railway.app)

2. **获取数据库连接字符串**
   ```
   postgresql://username:password@hostname:port/database
   ```

3. **更新后端环境变量**
   - 在 Vercel 后端项目中设置 `DATABASE_URL`

## 🤖 自动化部署 (可选)

### 使用 GitHub Actions

项目已包含 `.github/workflows/deploy.yml` 文件，需要设置以下 GitHub Secrets：

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID_FRONTEND=frontend-project-id
VERCEL_PROJECT_ID_BACKEND=backend-project-id
```

### 获取 Vercel 配置信息

1. **Vercel Token**
   - 访问 [Vercel Settings](https://vercel.com/account/tokens)
   - 创建新的 Token

2. **Organization ID**
   - 在 Vercel 团队设置中找到

3. **Project ID**
   - 在每个项目的设置页面中找到

## 🔍 故障排除

### 常见问题

1. **404 NOT_FOUND 错误**
   - **症状**: 部署后访问网站显示404错误
   - **原因**: 路由配置或构建输出路径问题
   - **解决方案**:
     ```bash
     # 1. 检查构建是否成功
     # 在Vercel控制台查看构建日志
     
     # 2. 验证API端点
     curl https://your-domain.vercel.app/api/health
     
     # 3. 检查前端资源
     # 确保dist目录包含index.html
     ```

2. **构建失败**
   - 检查 `package.json` 和 `requirements.txt` 是否正确
   - 确认所有依赖项都已列出

3. **API 连接失败**
   - 检查前端的 `VITE_API_BASE_URL` 配置
   - 确认后端 CORS 设置包含前端域名
   - 测试健康检查端点: `/api/health`

4. **数据库连接问题**
   - 验证 `DATABASE_URL` 格式是否正确
   - 确认数据库服务器允许外部连接

5. **环境变量问题**
   - 在 Vercel 项目设置中检查所有环境变量
   - 确保敏感信息（如 API 密钥）已正确设置

### 调试技巧

1. **验证后端API**:
   ```bash
   # 访问健康检查端点
   curl https://your-domain.vercel.app/api/health
   
   # 应该返回:
   # {"status": "ok", "message": "AI Notebook Backend is running"}
   ```

2. **检查前端构建**:
   - 确保`ai-notebook/frontend/dist/index.html`存在
   - 验证静态资源路径正确

3. **查看Vercel日志**:
   - 在Vercel控制台查看Functions日志
   - 检查构建过程中的错误信息

4. **查看构建日志**
   - 在 Vercel 控制台查看详细的构建和部署日志

5. **测试 API 端点**
   - 使用浏览器或 Postman 测试后端 API
   - 检查 `/api/health` 端点是否正常响应

6. **检查网络请求**
   - 使用浏览器开发者工具检查前端的网络请求
   - 确认 API 调用是否成功

## 📝 部署后检查清单

- [ ] 前端应用可以正常访问
- [ ] 后端 API 响应正常
- [ ] 数据库连接成功
- [ ] AI 功能正常工作
- [ ] 文件上传功能正常
- [ ] 所有页面和功能都可以访问

## 🔗 有用链接

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Python 运行时](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Flask 部署最佳实践](https://flask.palletsprojects.com/en/2.3.x/deploying/)

---

如果您在部署过程中遇到问题，请检查 Vercel 的构建日志和错误信息，或参考上述故障排除部分。