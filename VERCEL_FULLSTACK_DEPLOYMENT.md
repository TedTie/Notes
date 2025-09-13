# Vercel 全栈部署指南

本指南说明如何在 Vercel 上部署包含前端和后端的完整 AI Notebook 项目。

## 项目结构

```
ProjectNote/
├── vercel.json                 # 根目录Vercel配置（主配置）
├── ai-notebook/
│   ├── frontend/               # Vue.js前端应用
│   │   ├── src/
│   │   ├── dist/              # 构建输出目录
│   │   ├── package.json
│   │   └── vercel.json        # 前端特定配置（仅缓存头）
│   └── backend/               # Flask后端API
│       ├── api/
│       │   └── index.py       # Vercel入口文件
│       ├── app.py             # 主应用文件
│       ├── requirements.txt
│       └── vercel.json        # 后端特定配置
```

## 部署配置说明

### 1. 根目录配置 (vercel.json)

主配置文件负责：
- 构建前端 Vue.js 应用
- 部署后端 Python API
- 配置路由规则

关键配置：
```json
{
  "builds": [
    {
      "src": "ai-notebook/frontend/package.json",
      "use": "@vercel/node"
    },
    {
      "src": "ai-notebook/backend/api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/ai-notebook/backend/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/ai-notebook/frontend/dist/index.html"
    }
  ]
}
```

### 2. 后端入口文件 (ai-notebook/backend/api/index.py)

这个文件是 Vercel 部署 Python 应用的入口点：
```python
# 导入主应用
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app

# 创建应用实例
app = create_app()
```

### 3. 前端API配置

前端会自动检测环境：
- 开发环境：使用 `http://localhost:5000`
- 生产环境：使用相对路径 `/api`（同域名）

## 部署步骤

### 1. 准备项目

确保项目结构正确，所有配置文件已更新。

### 2. 连接到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库

### 3. 配置项目设置

在 Vercel 项目设置中：

**Root Directory**: 保持为根目录（不要设置为子目录）

**Build Settings**:
- Framework Preset: Other
- Build Command: `cd ai-notebook/frontend && npm install && npm run build`
- Output Directory: `ai-notebook/frontend/dist`
- Install Command: `cd ai-notebook/backend && pip install -r requirements.txt`

### 4. 环境变量设置

在 Vercel 项目设置的 Environment Variables 中添加：

```
FLASK_ENV=production
OPENROUTER_API_KEY=your_openrouter_api_key
MOONSHOT_API_KEY=your_moonshot_api_key
DATABASE_URL=your_database_url
```

**注意**: 不要设置 `VITE_API_URL`，让前端使用相对路径连接同域名下的后端。

### 5. 部署

点击 "Deploy" 开始部署。Vercel 会：
1. 安装后端 Python 依赖
2. 构建前端 Vue.js 应用
3. 部署前后端到同一个域名

## 验证部署

部署完成后，访问你的 Vercel 域名：

1. **前端**: `https://your-app.vercel.app` - 应该显示 Vue.js 应用
2. **后端API**: `https://your-app.vercel.app/api/health` - 应该返回健康检查信息
3. **API路由**: `https://your-app.vercel.app/api/notes` - 应该返回笔记API响应

## 故障排除

### 1. 构建失败

检查 Vercel 构建日志：
- 确保 `package.json` 和 `requirements.txt` 存在
- 检查依赖版本兼容性

### 2. API 404 错误

- 确保 `ai-notebook/backend/api/index.py` 正确导入主应用
- 检查路由配置是否正确

### 3. 前端无法连接后端

- 确保没有设置 `VITE_API_URL` 环境变量
- 检查前端是否使用相对路径 `/api`

### 4. 数据库连接问题

- 确保设置了正确的 `DATABASE_URL`
- 检查数据库服务是否可访问

## 本地开发

本地开发时，前后端分别运行：

```bash
# 后端
cd ai-notebook/backend
python app.py

# 前端
cd ai-notebook/frontend
npm run dev
```

前端会自动连接到 `http://localhost:5000` 的后端API。

## 注意事项

1. **单域名部署**: 前后端部署在同一个 Vercel 域名下
2. **无需CORS**: 由于同域名，无需复杂的CORS配置
3. **环境检测**: 前端自动检测环境并使用正确的API地址
4. **Serverless**: 后端运行在 Vercel 的 serverless 环境中
5. **静态资源**: 前端静态资源由 Vercel CDN 提供

这种配置确保了前后端的无缝集成，同时保持了开发和生产环境的一致性。