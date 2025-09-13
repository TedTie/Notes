# 🚀 AI智能笔记本 - 安装配置指南

## 📋 系统要求

### 基础环境
- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 版本 16.0 或更高
- **Python**: 版本 3.8 或更高
- **内存**: 至少 4GB RAM
- **存储**: 至少 2GB 可用空间

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📦 快速安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-notebook
```

### 2. 后端设置

#### 安装Python依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 环境变量配置（可选）

**重要说明**: AI API密钥推荐在应用启动后通过设置页面配置，无需在此设置。

创建 `.env` 文件（可选）：
```bash
# 仅配置基础设置，AI密钥在应用内配置
echo "SECRET_KEY=your_secret_key_here" > .env
```

完整的 `.env` 文件示例（可选配置）：
```env
# 基础配置
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# 数据库配置
DATABASE_URL=sqlite:///ai_notebook.db

# 文件上传配置
MAX_CONTENT_LENGTH=16777216  # 16MB
UPLOAD_FOLDER=uploads

# 开发模式
FLASK_ENV=development
DEBUG=True

# AI服务配置（不推荐，建议在应用内配置）
# OPENROUTER_API_KEY=your_openrouter_api_key_here
# MOONSHOT_API_KEY=your_moonshot_api_key_here
```

#### 初始化数据库
```bash
python app.py
```

### 3. 前端设置

#### 安装Node.js依赖
```bash
cd frontend
npm install
```

#### 启动开发服务器
```bash
npm run dev
```

### 4. 启动应用

#### 启动后端服务
```bash
cd backend
python app.py
```
后端服务将在 `http://localhost:5000` 启动

#### 启动前端服务
```bash
cd frontend
npm run dev
```
前端服务将在 `http://localhost:5173` 启动

## 🔧 详细配置

### AI服务配置

**推荐配置方式**: 应用内动态配置

#### OpenRouter API（推荐）
1. 访问 [OpenRouter](https://openrouter.ai/) 注册账户
2. 获取API密钥
3. **在应用设置页面配置**：
   - 启动应用后，进入"设置" → "AI配置"
   - 输入OpenRouter API密钥
   - 点击"测试连接"验证
   - 配置立即生效，无需重启

#### Moonshot API
1. 访问 [Moonshot](https://platform.moonshot.cn/) 注册账户
2. 获取API密钥
3. **在应用设置页面配置**：
   - 在"AI配置"中选择Moonshot提供商
   - 输入API密钥并测试连接
   - 适合中文处理场景

#### 配置优势
- ✅ **即时生效**: 无需重启应用
- ✅ **安全存储**: 密钥加密保存在数据库
- ✅ **连接测试**: 内置验证功能
- ✅ **友好界面**: 可视化配置管理
- ✅ **动态切换**: 随时更换API密钥

### 数据库配置

#### SQLite（默认）
- 无需额外配置
- 数据库文件自动创建在 `backend/ai_notebook.db`

#### PostgreSQL（生产环境推荐）
```env
DATABASE_URL=postgresql://username:password@localhost:5432/ai_notebook
```

#### MySQL
```env
DATABASE_URL=mysql://username:password@localhost:3306/ai_notebook
```

### 文件上传配置

#### 背景图片上传
- 支持格式: JPG, PNG, GIF, WebP
- 最大文件大小: 16MB
- 存储路径: `backend/uploads/backgrounds/`

#### 安全设置
- 文件类型验证
- 文件大小限制
- 路径遍历防护

## 🌐 生产环境部署

### 使用Docker（推荐）

#### 1. 构建镜像
```bash
# 构建后端镜像
cd backend
docker build -t ai-notebook-backend .

# 构建前端镜像
cd frontend
npm run build
docker build -t ai-notebook-frontend .
```

#### 2. 使用Docker Compose
```yaml
version: '3.8'
services:
  backend:
    image: ai-notebook-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/ai_notebook
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db

  frontend:
    image: ai-notebook-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=ai_notebook
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 手动部署

#### 后端部署
```bash
# 安装生产依赖
pip install gunicorn

# 启动生产服务器
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### 前端部署
```bash
# 构建生产版本
npm run build

# 使用Nginx服务静态文件
sudo cp -r dist/* /var/www/html/
```

## 🔍 故障排除

### 常见问题

#### 1. 端口冲突
**问题**: `Error: listen EADDRINUSE: address already in use :::5000`
**解决**: 更改端口或停止占用端口的进程
```bash
# 查找占用端口的进程
lsof -i :5000
# 或在Windows上
netstat -ano | findstr :5000

# 杀死进程
kill -9 <PID>
```

#### 2. 依赖安装失败
**问题**: `npm install` 或 `pip install` 失败
**解决**: 
```bash
# 清理缓存
npm cache clean --force
pip cache purge

# 使用国内镜像
npm config set registry https://registry.npmmirror.com/
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

#### 3. AI API调用失败
**问题**: AI助手无响应或报错
**解决**: 
1. 检查API密钥是否正确
2. 确认网络连接
3. 查看API配额是否用完
4. 检查后端日志

#### 4. 数据库连接失败
**问题**: 无法连接数据库
**解决**: 
1. 检查数据库服务是否启动
2. 验证连接字符串
3. 确认用户权限
4. 检查防火墙设置

### 日志查看

#### 后端日志
```bash
cd backend
tail -f logs/app.log
```

#### 前端日志
- 打开浏览器开发者工具
- 查看Console标签页

## 📊 性能优化

### 前端优化
- 启用Gzip压缩
- 配置CDN
- 图片懒加载
- 代码分割

### 后端优化
- 数据库索引优化
- Redis缓存
- API响应压缩
- 连接池配置

## 🔒 安全建议

### 生产环境安全
1. **更改默认密钥**: 生成强随机密钥
2. **HTTPS配置**: 使用SSL证书
3. **防火墙设置**: 限制不必要的端口访问
4. **定期备份**: 自动化数据库备份
5. **更新依赖**: 定期更新安全补丁

### API安全
- 使用环境变量存储敏感信息
- 实施速率限制
- 输入验证和清理
- CORS配置

## 📞 技术支持

### 获取帮助
- 查看项目文档
- 搜索已知问题
- 提交Issue报告

### 开发者资源
- [Vue.js 官方文档](https://vuejs.org/)
- [Flask 官方文档](https://flask.palletsprojects.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

---

**🎉 恭喜！您已成功配置AI智能笔记本应用！**

*如有任何问题，请参考故障排除部分或联系技术支持。*