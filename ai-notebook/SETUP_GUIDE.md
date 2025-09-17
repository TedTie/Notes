# AI智能笔记本 - 详细设置指南

## 📋 目录

1. [环境要求](#环境要求)
2. [后端设置](#后端设置)
3. [前端设置](#前端设置)
4. [AI服务配置](#ai服务配置)
5. [主题和背景设置](#主题和背景设置)
6. [常见问题](#常见问题)
7. [故障排除](#故障排除)

## 🔧 环境要求

### 系统要求
- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Python**: 3.8 或更高版本
- **Node.js**: 16.0 或更高版本（推荐 18.x LTS）
- **npm**: 8.0 或更高版本
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 硬件要求
- **内存**: 最少 4GB RAM（推荐 8GB+）
- **存储**: 至少 2GB 可用空间
- **网络**: 稳定的互联网连接（用于AI服务）

## 🐍 后端设置

### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-notebook
```

### 2. 进入后端目录
```bash
cd backend
```

### 3. 创建Python虚拟环境

#### Windows (PowerShell)
```powershell
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\Activate.ps1

# 如果遇到执行策略错误，运行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Windows (CMD)
```cmd
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate.bat
```

#### macOS/Linux
```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate
```

### 4. 安装Python依赖
```bash
# 确保虚拟环境已激活
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. 环境变量配置（可选）

创建 `.env` 文件（基于 `.env.example`）：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# Flask应用配置
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
FLASK_DEBUG=True

# 数据库配置（可选，默认使用SQLite）
DATABASE_URL=sqlite:///ai_notebook.db

# 上传文件配置
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
```

**重要说明**：
- `SECRET_KEY`: Flask应用密钥，用于会话加密（可选，有默认值）
- **AI API密钥**: 无需在此配置，可在应用启动后通过设置页面动态配置

### 6. 初始化数据库
```bash
# 启动应用时会自动创建数据库表
python app.py
```

### 7. 启动后端服务
```bash
python app.py
```

成功启动后，你应该看到：
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

## 🌐 前端设置

### 1. 进入前端目录
```bash
# 在新的终端窗口中
cd ai-notebook/frontend
```

### 2. 安装Node.js依赖
```bash
npm install

# 或者使用yarn
yarn install
```

### 3. 环境变量配置（可选）

创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# API基础URL
VITE_API_BASE_URL=http://localhost:5000

# 开发模式配置
VITE_DEV_MODE=true
```

### 4. 启动开发服务器
```bash
npm run dev

# 或者使用yarn
yarn dev
```

成功启动后，你应该看到：
```
  Local:   http://localhost:5173/
  Network: use --host to expose
```

### 5. 访问应用
打开浏览器访问 `http://localhost:5173`

## 🤖 AI服务配置

### 支持的AI服务提供商

1. **OpenRouter** (推荐)
   - 支持多种模型：GPT-4, Claude, Gemini等
   - 官网：https://openrouter.ai/
   - 获取API密钥：注册账户后在Keys页面生成

2. **Moonshot AI**
   - Kimi智能助手服务
   - 官网：https://www.moonshot.cn/
   - 获取API密钥：注册开发者账户

3. **OpenAI**
   - GPT系列模型和Whisper
   - 官网：https://openai.com/
   - 获取API密钥：OpenAI开发者平台

### 在应用中配置AI服务

1. 启动应用后，点击右上角的设置图标
2. 进入「AI配置」标签页
3. 选择AI服务提供商
4. 输入对应的API密钥
5. 选择要使用的模型
6. 点击「测试连接」验证配置
7. 保存设置

### AI功能权限设置

在设置页面的「权限管理」部分，你可以控制：
- AI文件操作权限
- AI网络搜索功能
- AI对话历史记录
- AI功能使用频率限制

## 🎨 主题和背景设置

### 主题切换

1. **全局主题切换**：点击顶部导航栏的主题切换按钮
2. **设置页面切换**：在设置页面的「外观设置」中选择主题
3. **支持的主题**：
   - 深色主题（默认）
   - 浅色主题
   - 自动主题（跟随系统）

### 自定义背景

1. 进入设置页面 → 外观设置 → 背景管理
2. 选择对应的主题标签页（浅色/深色）
3. 点击上传区域选择背景图片
4. 支持格式：JPG, PNG, WebP
5. 建议尺寸：1920x1080 或更高
6. 文件大小：不超过 16MB

### 背景调试工具

在设置页面的背景管理部分，点击「Debug」按钮可以：
- 查看当前背景文件列表
- 测试背景加载功能
- 检查主题关联设置
- 重新加载背景配置

## ❓ 常见问题

### Q: 后端启动失败，提示端口被占用
**A**: 检查5000端口是否被其他程序占用：
```bash
# Windows
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000
```

可以修改端口：
```python
# 在app.py中修改
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Q: 前端无法连接到后端API
**A**: 检查以下几点：
1. 后端服务是否正常运行
2. 前端`.env`文件中的API地址是否正确
3. 浏览器控制台是否有CORS错误
4. 防火墙是否阻止了连接

### Q: AI功能无法使用
**A**: 确认以下配置：
1. API密钥是否正确输入
2. 网络连接是否正常
3. API服务商是否有使用限制
4. 在设置页面测试连接状态

### Q: 主题切换不生效
**A**: 尝试以下解决方案：
1. 刷新页面
2. 清除浏览器缓存
3. 检查浏览器控制台是否有错误
4. 确认CSS文件加载正常

### Q: 背景图片无法显示
**A**: 检查以下问题：
1. 图片格式是否支持（JPG/PNG/WebP）
2. 文件大小是否超过限制
3. 图片是否损坏
4. 使用背景调试工具检查状态

## 🔧 故障排除

### 后端问题诊断

1. **检查Python版本**：
```bash
python --version
# 应该显示 3.8 或更高版本
```

2. **检查虚拟环境**：
```bash
# 确认虚拟环境已激活
which python  # macOS/Linux
where python  # Windows
```

3. **检查依赖安装**：
```bash
pip list
# 确认所有requirements.txt中的包都已安装
```

4. **查看后端日志**：
```bash
# 启动时添加详细日志
FLASK_DEBUG=True python app.py
```

### 前端问题诊断

1. **检查Node.js版本**：
```bash
node --version
npm --version
```

2. **清除缓存**：
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

3. **检查构建**：
```bash
npm run build
# 查看是否有构建错误
```

4. **浏览器开发者工具**：
   - 打开F12开发者工具
   - 查看Console标签页的错误信息
   - 查看Network标签页的网络请求状态

### 数据库问题

1. **重置数据库**：
```bash
# 删除现有数据库文件
rm ai_notebook.db

# 重新启动应用，会自动创建新的数据库
python app.py
```

2. **检查数据库结构**：
```bash
python check_db.py
```

### 性能优化

1. **后端优化**：
   - 使用生产环境配置
   - 启用数据库连接池
   - 配置适当的日志级别

2. **前端优化**：
   - 构建生产版本：`npm run build`
   - 启用浏览器缓存
   - 压缩静态资源

## 📞 获取帮助

如果遇到本指南未涵盖的问题：

1. **查看项目文档**：README.md
2. **检查GitHub Issues**：搜索相似问题
3. **提交新Issue**：详细描述问题和环境信息
4. **社区支持**：参与项目讨论

---

**🎉 设置完成！开始享受AI智能笔记的强大功能吧！**