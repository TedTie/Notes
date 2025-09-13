# Vercel 配置测试指南

## 本地测试

### 1. 前端构建测试

```bash
cd ai-notebook/frontend
npm run build
```

✅ **状态**: 构建成功，生成了 `dist` 目录

### 2. 后端API测试

确保后端正在运行：
```bash
cd ai-notebook/backend
python app.py
```

测试API端点：
- http://localhost:5000/api/health
- http://localhost:5000/api/notes
- http://localhost:5000/api/settings

### 3. 前端开发服务器测试

```bash
cd ai-notebook/frontend
npm run dev
```

访问 http://localhost:5173 确保：
- 前端正常加载
- 能够连接到后端API
- 所有功能正常工作

## Vercel 部署测试清单

### 部署前检查

- [ ] 根目录 `vercel.json` 配置正确
- [ ] 后端 `api/index.py` 正确导入主应用
- [ ] 前端构建成功（`npm run build`）
- [ ] 所有环境变量已配置

### 部署后验证

访问你的 Vercel 域名并测试：

1. **前端页面**
   - [ ] `https://your-app.vercel.app` - 主页加载正常
   - [ ] 所有路由正常工作
   - [ ] 静态资源加载正常

2. **后端API**
   - [ ] `https://your-app.vercel.app/api/health` - 返回健康状态
   - [ ] `https://your-app.vercel.app/api/notes` - 笔记API工作
   - [ ] `https://your-app.vercel.app/api/settings` - 设置API工作

3. **前后端集成**
   - [ ] 前端能成功调用后端API
   - [ ] 数据正常保存和读取
   - [ ] 错误处理正常工作

## 配置文件总结

### 根目录 vercel.json
```json
{
  "version": 2,
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
      "src": "/api",
      "dest": "/ai-notebook/backend/api/index.py"
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json))",
      "dest": "/ai-notebook/frontend/dist/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/ai-notebook/frontend/dist/index.html"
    }
  ],
  "buildCommand": "cd ai-notebook/frontend && npm install && npm run build",
  "installCommand": "cd ai-notebook/backend && pip install -r requirements.txt",
  "outputDirectory": "ai-notebook/frontend/dist"
}
```

### 后端入口 api/index.py
```python
# Vercel部署入口文件
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app

app = create_app()
```

### 前端API配置
```javascript
const API_CONFIG = {
  BASE_URL: import.meta.env.PROD ? 
    (import.meta.env.VITE_API_URL || '') : 
    'http://localhost:5000',
  API_BASE_URL: import.meta.env.PROD ? 
    (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api') : 
    'http://localhost:5000/api',
  DEMO_MODE: import.meta.env.PROD && !import.meta.env.VITE_API_URL
}
```

## 关键优势

1. **单域名部署**: 前后端在同一个域名下，无需CORS配置
2. **自动路由**: API请求自动路由到后端，静态文件路由到前端
3. **环境自适应**: 开发环境和生产环境自动使用正确的API地址
4. **简化配置**: 最小化的配置文件，易于维护
5. **演示模式**: 支持纯前端演示模式，提供良好的用户体验

## 故障排除

如果遇到问题，请检查：

1. **构建失败**: 检查依赖安装和构建命令
2. **API 404**: 确认后端入口文件正确导入主应用
3. **路由问题**: 检查 vercel.json 中的路由配置
4. **环境变量**: 确认所有必需的环境变量已设置

现在你的项目已经配置好了，可以在 Vercel 上进行全栈部署！