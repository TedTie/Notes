# 你的 Vercel 环境变量配置（具体值）

## 🚀 快速配置指南

### 第一步：登录 Vercel
1. 打开 [https://vercel.com](https://vercel.com)
2. 用 GitHub 账号登录

### 第二步：找到你的项目
1. 在 Vercel 控制台找到你的项目
2. 点击项目名称进入项目页面
3. 点击顶部的 "Settings" 选项卡
4. 在左侧菜单点击 "Environment Variables"

### 第三步：添加环境变量

#### 环境变量 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://vcgythhenulnwuindgyx.supabase.co`
- **Environments**: 全选（Production, Preview, Development）

#### 环境变量 2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnV1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzE0NzQsImV4cCI6MjA1MTMwNzQ3NH0.Zt8vGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJN`
- **Environments**: 全选（Production, Preview, Development）

## 📋 详细操作步骤

### 步骤 1: 添加第一个环境变量
1. 点击 "Add New" 按钮
2. 在 "Name" 输入框中输入：`VITE_SUPABASE_URL`
3. 在 "Value" 输入框中复制粘贴：
   ```
   https://vcgythhenulnwuindgyx.supabase.co
   ```
4. 在 "Environments" 部分，勾选所有三个选项：
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. 点击 "Save" 按钮

### 步骤 2: 添加第二个环境变量
1. 再次点击 "Add New" 按钮
2. 在 "Name" 输入框中输入：`VITE_SUPABASE_ANON_KEY`
3. 在 "Value" 输入框中复制粘贴：
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnV1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzE0NzQsImV4cCI6MjA1MTMwNzQ3NH0.Zt8vGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJN
   ```
4. 在 "Environments" 部分，勾选所有三个选项：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. 点击 "Save" 按钮

### 步骤 3: 重新部署
1. 回到项目主页（点击项目名称）
2. 点击 "Deployments" 选项卡
3. 找到最新的部署记录
4. 点击右侧的三个点菜单 "⋯"
5. 选择 "Redeploy"
6. 在弹出的确认框中点击 "Redeploy"

### 步骤 4: 验证配置
1. 等待部署完成（1-3分钟）
2. 部署成功后，点击 "Visit" 按钮
3. 检查网站是否正常加载
4. 按 F12 打开开发者工具，查看 Console 是否有错误

## ✅ 配置检查清单

配置完成后，在 Vercel 的 Environment Variables 页面应该看到：

- [ ] `VITE_SUPABASE_URL` = `https://vcgythhenulnwuindgyx.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] 两个变量都选择了所有环境（Production, Preview, Development）
- [ ] 项目已重新部署
- [ ] 网站可以正常访问

## 🔧 如果遇到问题

### 问题：环境变量添加后不生效
**解决方案**：
1. 确认变量名称完全正确（注意大小写）
2. 确认选择了所有环境
3. 必须重新部署项目才能生效

### 问题：网站显示连接错误
**解决方案**：
1. 检查 Supabase URL 是否正确
2. 检查 Anon Key 是否完整（很长的字符串）
3. 在浏览器开发者工具查看具体错误信息

### 问题：找不到项目设置
**解决方案**：
1. 确认已经登录 Vercel
2. 确认项目已经导入到 Vercel
3. 点击项目名称进入项目详情页

## 📞 需要帮助？

如果按照以上步骤操作后仍有问题，请告诉我：
1. 在哪一步遇到了困难
2. 看到了什么错误信息
3. 截图发给我，我可以帮你分析

配置成功后，你的 AI 笔记应用就可以在 Vercel 上正常运行了！🎉