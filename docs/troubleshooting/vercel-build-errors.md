# Vercel 构建错误修复指南

## 错误描述
```
sh: line 1: vite: command not found
Error: Command "npm run vercel-build" exited with 127
```

## 问题分析
这个错误表明 Vite 没有被正确安装或找不到。主要原因：
1. 前端目录的 `node_modules` 没有安装
2. `package.json` 中缺少 Vite 依赖
3. 构建脚本路径问题

## 解决方案

### 方案 1: 修复 package.json 构建脚本

1. **检查根目录 package.json**
   ```json
   {
     "scripts": {
       "vercel-build": "cd ai-notebook/frontend && npm install && npm run build"
     }
   }
   ```

2. **确保前端 package.json 包含 Vite**
   ```json
   {
     "devDependencies": {
       "vite": "^5.0.0",
       "@vitejs/plugin-react": "^4.0.0"
     }
   }
   ```

### 方案 2: 使用 Vercel 配置文件

1. **更新 vercel.json**
   ```json
   {
     "buildCommand": "cd ai-notebook/frontend && npm install && npm run build",
     "outputDirectory": "ai-notebook/frontend/dist",
     "installCommand": "npm install && cd ai-notebook/frontend && npm install"
   }
   ```

### 方案 3: 修改项目结构

1. **在根目录创建统一的 package.json**
   ```json
   {
     "name": "ai-notebook-fullstack",
     "scripts": {
       "install:frontend": "cd ai-notebook/frontend && npm install",
       "build:frontend": "cd ai-notebook/frontend && npm run build",
       "vercel-build": "npm run install:frontend && npm run build:frontend"
     }
   }
   ```

## 立即修复步骤

### 步骤 1: 更新根目录 package.json
```bash
# 在项目根目录
npm init -y
```

### 步骤 2: 添加构建脚本
```json
{
  "scripts": {
    "vercel-build": "cd ai-notebook/frontend && npm ci && npm run build"
  }
}
```

### 步骤 3: 确保前端依赖完整
```bash
cd ai-notebook/frontend
npm install
```

### 步骤 4: 本地测试构建
```bash
# 在根目录
npm run vercel-build
```

### 步骤 5: 重新部署
```bash
git add .
git commit -m "fix: 修复 Vercel 构建错误"
git push
```

## Vercel 项目设置检查

1. **Build Command**: 留空或设置为 `npm run vercel-build`
2. **Output Directory**: `ai-notebook/frontend/dist`
3. **Install Command**: `npm install`
4. **Root Directory**: `.` (项目根目录)

## 环境变量确认
确保以下环境变量已正确配置：
- `VITE_SUPABASE_URL`: `https://gqkpjqjqvqjqjqjqvqjq.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaXBqcWpxdnFqcWpxanF2cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NjI0NzQsImV4cCI6MjA1MTIzODQ3NH0.Ej7zQOQOQOQOQOQOQOQOQOQOQOQOQOQOQOQOQOQ`

## 常见问题

### Q: 为什么会出现 "vite: command not found"？
A: Vite 没有在正确的目录中安装，或者构建脚本没有先安装依赖。

### Q: 如何确保构建成功？
A: 本地运行 `npm run vercel-build` 测试，确保没有错误。

### Q: 构建后找不到文件？
A: 检查 `outputDirectory` 设置是否指向正确的 `dist` 目录。

## 验证清单
- [ ] 根目录 package.json 包含正确的构建脚本
- [ ] 前端目录有完整的 package.json 和依赖
- [ ] 本地构建测试成功
- [ ] Vercel 项目设置正确
- [ ] 环境变量配置完整
- [ ] 重新部署成功

## 下一步
构建成功后，访问部署的 URL 测试应用功能，确保 Supabase 连接正常工作。