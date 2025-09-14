# Vercel 配置 Supabase 环境变量详细指南

## 前提条件
- 已有 Vercel 账号
- 已有 Supabase 项目
- 前端项目已推送到 GitHub

## 第一步：登录 Vercel 控制台

1. 打开浏览器，访问 [https://vercel.com](https://vercel.com)
2. 点击右上角 "Login" 按钮
3. 使用 GitHub 账号登录（推荐）或其他方式登录

## 第二步：导入项目到 Vercel

1. 登录后，点击 "New Project" 按钮
2. 选择 "Import Git Repository"
3. 找到你的 GitHub 仓库（ProjectNote）
4. 点击 "Import" 按钮
5. 在项目配置页面：
   - **Project Name**: 可以保持默认或修改为 `ai-notebook-frontend`
   - **Framework Preset**: 选择 "Vite"
   - **Root Directory**: 设置为 `ai-notebook/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## 第三步：配置环境变量

### 3.1 进入项目设置
1. 项目导入成功后，点击项目名称进入项目详情页
2. 点击顶部导航栏的 "Settings" 选项卡
3. 在左侧菜单中点击 "Environment Variables"

### 3.2 添加 Supabase 环境变量

需要添加以下环境变量：

#### 变量 1: VITE_SUPABASE_URL
1. 点击 "Add New" 按钮
2. **Name**: 输入 `VITE_SUPABASE_URL`
3. **Value**: 输入你的 Supabase URL
   ```
   https://你的项目ID.supabase.co
   ```
4. **Environments**: 选择 "Production", "Preview", "Development" (全选)
5. 点击 "Save" 按钮

#### 变量 2: VITE_SUPABASE_ANON_KEY
1. 再次点击 "Add New" 按钮
2. **Name**: 输入 `VITE_SUPABASE_ANON_KEY`
3. **Value**: 输入你的 Supabase Anon Key（公开密钥）
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. **Environments**: 选择 "Production", "Preview", "Development" (全选)
5. 点击 "Save" 按钮

## 第四步：获取 Supabase 配置信息

如果你不确定 Supabase 的 URL 和 Key，按以下步骤获取：

### 4.1 登录 Supabase
1. 访问 [https://supabase.com](https://supabase.com)
2. 登录你的账号
3. 选择你的项目

### 4.2 获取配置信息
1. 在项目控制台，点击左侧菜单的 "Settings"
2. 点击 "API" 选项卡
3. 你会看到：
   - **Project URL**: 这就是 `VITE_SUPABASE_URL`
   - **Project API keys** 部分的 "anon public": 这就是 `VITE_SUPABASE_ANON_KEY`

## 第五步：重新部署项目

1. 回到 Vercel 项目页面
2. 点击 "Deployments" 选项卡
3. 点击最新部署右侧的三个点菜单
4. 选择 "Redeploy"
5. 确认重新部署

## 第六步：验证部署

1. 等待部署完成（通常需要 1-3 分钟）
2. 部署成功后，点击 "Visit" 按钮访问你的网站
3. 检查网站是否正常工作
4. 打开浏览器开发者工具（F12），查看 Console 是否有错误

## 常见问题解决

### 问题 1: 环境变量不生效
**解决方案**: 
- 确保环境变量名称完全正确（区分大小写）
- 确保选择了正确的环境（Production, Preview, Development）
- 重新部署项目

### 问题 2: Supabase 连接失败
**解决方案**:
- 检查 Supabase URL 格式是否正确
- 确认 Anon Key 是否完整（通常很长）
- 检查 Supabase 项目是否处于活跃状态

### 问题 3: 部署失败
**解决方案**:
- 检查 package.json 中的构建脚本
- 确认项目根目录设置正确
- 查看部署日志中的具体错误信息

## 环境变量检查清单

在 Vercel 项目设置中，确认以下环境变量已正确配置：

- [ ] `VITE_SUPABASE_URL` - Supabase 项目 URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase 公开密钥
- [ ] 所有环境变量都选择了 Production, Preview, Development
- [ ] 项目已重新部署
- [ ] 网站可以正常访问

## 下一步

配置完成后，你的前端应用就可以：
- 连接到 Supabase 数据库
- 使用用户认证功能
- 访问存储桶中的文件
- 执行数据库查询

如果遇到任何问题，可以查看 Vercel 的部署日志或浏览器控制台的错误信息来排查问题。