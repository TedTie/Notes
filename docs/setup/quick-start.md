# 🚀 AI Notebook 快速部署指南

这是一个简化的部署指南，帮助您在 30 分钟内完成 AI Notebook 的完整部署。

## 📋 准备工作

### 必需账户
- [Supabase](https://supabase.com) 账户（免费）
- [Vercel](https://vercel.com) 账户（免费）
- [GitHub](https://github.com) 账户（免费）

### 本地环境
- Node.js 16+ 
- Git
- 代码编辑器

## ⚡ 5 分钟快速部署

### 第 1 步：克隆项目

```bash
git clone <your-repo-url>
cd ProjectNote
```

### 第 2 步：运行自动部署脚本

```powershell
# Windows PowerShell
.\deploy.ps1
```

```bash
# macOS/Linux
chmod +x deploy.sh
./deploy.sh
```

### 第 3 步：配置 Supabase

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 复制项目 URL 和 API Key
4. 在 SQL Editor 中执行：
   ```sql
   -- 复制粘贴 supabase-migration/01-create-tables.sql 内容
   -- 复制粘贴 supabase-migration/02-setup-rls.sql 内容  
   -- 复制粘贴 supabase-migration/03-setup-storage.sql 内容
   ```

### 第 4 步：配置 Vercel 环境变量

1. 访问 Vercel 项目设置
2. 添加环境变量：
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. 重新部署

### 第 5 步：测试部署

```bash
node test-deployment.js https://your-app.vercel.app
```

## 🎯 核心功能验证

访问您的部署网站，测试以下功能：

- [ ] ✏️ 创建和编辑笔记
- [ ] ✅ 添加待办事项
- [ ] 💬 聊天历史记录
- [ ] 📁 项目管理
- [ ] 🍅 番茄钟计时
- [ ] 🖼️ 背景图片上传
- [ ] 🌓 主题切换
- [ ] ⚡ 实时同步

## 🔧 常见问题

### Q: 部署失败怎么办？
A: 检查 Vercel 部署日志，确认环境变量配置正确。

### Q: 数据库连接失败？
A: 验证 Supabase URL 和 API Key 是否正确配置。

### Q: 文件上传不工作？
A: 确认已执行 `03-setup-storage.sql` 脚本。

### Q: 实时功能不工作？
A: 检查 Supabase Realtime 是否启用。

## 📞 获取帮助

- 📖 详细指南：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 🐛 问题反馈：GitHub Issues
- 📧 技术支持：查看项目文档

## 🎉 部署成功！

恭喜！您的 AI Notebook 现在已经在云端运行了。

**下一步：**
- 🔒 配置备份策略
- 📊 设置监控告警
- 🚀 邀请团队成员
- 📱 安装 PWA 应用

---

💡 **提示**：保存好您的 Supabase 和 Vercel 登录信息，以便后续管理和维护。