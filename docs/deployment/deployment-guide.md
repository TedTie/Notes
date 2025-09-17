# AI Notebook 完整部署指南

本指南将帮助您将 AI Notebook 项目部署到 Supabase（后端）+ Vercel（前端）的完整生产环境。

## 📋 部署概览

- **前端**: Vercel (React + Vite)
- **后端**: Supabase (PostgreSQL + Storage + Auth + Realtime)
- **数据库**: Supabase PostgreSQL
- **文件存储**: Supabase Storage
- **实时功能**: Supabase Realtime

## 🚀 第一步：Supabase 后端设置

### 1.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录以下信息：
   - Project URL: `https://your-project-ref.supabase.co`
   - API Key (anon public): `your_supabase_anon_key`

### 1.2 执行数据库迁移

在 Supabase SQL Editor 中依次执行以下文件：

```bash
# 1. 创建数据库表结构
supabase-migration/01-create-tables.sql

# 2. 设置行级安全策略
supabase-migration/02-setup-rls.sql

# 3. 配置文件存储
supabase-migration/03-setup-storage.sql
```

### 1.3 验证数据库设置

执行以下查询确认表已创建：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

应该看到以下表：
- notes
- todos
- chat_history
- settings
- topics
- messages
- projects
- tasks
- pomodoro_sessions

## 🌐 第二步：Vercel 前端部署

### 2.1 准备前端代码

1. 确保前端代码已更新为使用 Supabase：
   - `src/config/supabase.js` - Supabase 客户端配置
   - `src/services/supabaseService.js` - 数据服务层
   - `.env.example` - 环境变量模板

### 2.2 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 应用配置
VITE_APP_NAME=AI Notebook
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false

# 功能开关
VITE_ENABLE_REALTIME=true
VITE_ENABLE_CHAT_HISTORY=true
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_POMODORO=true
VITE_ENABLE_PROJECTS=true

# 主题配置
VITE_DEFAULT_THEME=light
VITE_ENABLE_THEME_SWITCHING=true

# 文件上传配置
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
```

### 2.3 部署到 Vercel

1. 连接 GitHub 仓库到 Vercel
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`
4. 部署项目

## 🔧 第三步：配置集成

### 3.1 更新前端 API 配置

确保 `src/config/api.js` 正确配置：

```javascript
const config = {
  development: {
    BASE_URL: 'http://localhost:5173',
    API_BASE_URL: 'http://localhost:5000'
  },
  production: {
    BASE_URL: 'https://your-vercel-app.vercel.app',
    API_BASE_URL: '/api' // 使用 Supabase 而不是传统 API
  }
};
```

### 3.2 测试 Supabase 连接

在浏览器控制台中测试：

```javascript
// 测试 Supabase 连接
import { supabase } from './src/config/supabase.js';

// 测试数据库连接
const { data, error } = await supabase.from('notes').select('*').limit(1);
console.log('Database test:', { data, error });

// 测试存储连接
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Storage buckets:', buckets);
```

## 📱 第四步：功能验证

### 4.1 核心功能测试

- [ ] 笔记创建、编辑、删除
- [ ] 待办事项管理
- [ ] 聊天历史记录
- [ ] 项目管理
- [ ] 番茄钟功能
- [ ] 文件上传（背景图片）
- [ ] 主题切换
- [ ] 实时同步

### 4.2 性能测试

- [ ] 页面加载速度
- [ ] 数据库查询性能
- [ ] 文件上传速度
- [ ] 实时更新延迟

## 🔒 第五步：安全配置

### 5.1 Supabase 安全设置

1. 检查 RLS 策略是否正确启用
2. 验证存储桶权限
3. 配置 CORS 设置
4. 设置 JWT 过期时间

### 5.2 Vercel 安全设置

1. 启用 HTTPS
2. 配置安全头
3. 设置环境变量保护
4. 启用 DDoS 保护

## 🚨 故障排除

### 常见问题

#### 1. Supabase 连接失败

```bash
# 检查环境变量
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 验证 URL 格式
curl https://your-project-ref.supabase.co/rest/v1/
```

#### 2. 数据库查询错误

- 检查 RLS 策略
- 验证表结构
- 查看 Supabase 日志

#### 3. 文件上传失败

- 检查存储桶配置
- 验证文件大小限制
- 查看存储权限

#### 4. 实时功能不工作

- 检查 Realtime 是否启用
- 验证订阅配置
- 查看网络连接

### 调试工具

```javascript
// 启用调试模式
localStorage.setItem('supabase.debug', 'true');

// 查看连接状态
console.log('Supabase client:', supabase);

// 监控实时连接
supabase.channel('debug').subscribe((status) => {
  console.log('Realtime status:', status);
});
```

## 📊 监控和维护

### 5.1 Supabase 监控

- 数据库性能指标
- API 请求统计
- 存储使用情况
- 实时连接数

### 5.2 Vercel 监控

- 部署状态
- 函数执行时间
- 带宽使用
- 错误率

## 🔄 更新和备份

### 6.1 数据备份

```sql
-- 导出数据
pg_dump -h db.your-project-ref.supabase.co -U postgres -d postgres > backup.sql

-- 恢复数据
psql -h db.your-project-ref.supabase.co -U postgres -d postgres < backup.sql
```

### 6.2 代码更新

1. 推送代码到 GitHub
2. Vercel 自动部署
3. 验证功能正常
4. 回滚（如需要）

## 📞 支持和资源

- [Supabase 文档](https://supabase.com/docs)
- [Vercel 文档](https://vercel.com/docs)
- [项目 GitHub 仓库](https://github.com/your-username/ai-notebook)

## 🎉 部署完成

恭喜！您已成功部署 AI Notebook 到生产环境。

**访问地址**: https://your-vercel-app.vercel.app

**管理面板**:
- Supabase: https://app.supabase.com/project/your-project-ref
- Vercel: https://vercel.com/dashboard

记得定期备份数据和监控系统性能！