# AI智能笔记本 🤖📝

一个集成了人工智能功能的现代化笔记应用，支持智能文本处理、待办事项管理、音频分析等功能。采用赛博朋克风格设计，为用户提供未来感十足的智能工作体验。

## ✨ 核心功能

### 📝 智能笔记系统
- **富文本编辑器**：支持Markdown语法，实时预览和格式化
- **AI文本增强**：智能总结、扩展、改写和多语言翻译
- **智能搜索**：基于语义的AI增强搜索，支持笔记和待办事项联合搜索
- **自动保存**：实时保存，防止数据丢失，可配置保存间隔
- **标签管理**：支持笔记分类和标签系统
- **历史记录**：完整的编辑历史和版本管理

### ✅ 智能待办管理
- **任务创建**：快速创建和管理待办事项，支持描述和截止日期
- **AI生成**：根据文本描述自动生成结构化待办事项
- **优先级管理**：支持高、中、低三级优先级分类
- **分类系统**：工作、个人、学习、健康等多种分类
- **状态跟踪**：完成状态追踪、统计和进度可视化
- **批量操作**：支持批量标记完成、删除和分类管理
- **智能排序**：按优先级、截止日期和创建时间智能排序

### 🍅 番茄时钟专注系统
- **专属沉浸式界面**：全屏无干扰的番茄时钟页面，赛博朋克风格设计
- **任务关联专注**：直接从待办事项启动专注模式，自动关联任务
- **可定制时间周期**：自由设定工作、短休息、长休息时长
- **发光环形进度条**：科技感十足的视觉反馈，实时显示时间进度
- **智能提醒系统**：科技音效 + 桌面通知双重提醒
- **生产力统计**：实时显示今日完成的番茄钟数量和历史记录
- **自动周期切换**：工作-休息智能循环，支持长短休息模式

### 🤖 全局AI助手
- **浮动助手球**：可拖拽的AI助手界面，支持最小化和展开
- **智能对话**：随时随地与AI进行自然语言对话
- **权限控制**：可配置AI文件操作权限，确保安全性
- **多模型支持**：支持OpenRouter、Moonshot等多种AI服务提供商
- **上下文感知**：理解当前工作内容，提供相关建议

### ⚙️ 个性化设置
- **主题系统**：深色/浅色主题切换，赛博朋克风格界面
- **语言支持**：中文/英文双语界面，实时切换
- **字体配置**：多种字体选择（Orbitron、Fira Code、系统默认）
- **AI配置**：多提供商API密钥管理，模型选择和连接状态
- **通知设置**：桌面通知和提示音开关
- **数据管理**：数据导出、备份和清理功能
- **权限管理**：AI功能权限细粒度控制

## 🚀 技术栈

### 前端技术
- **Vue 3** + **TypeScript** - 现代化响应式前端框架
- **Composition API** - Vue 3最新API，更好的逻辑复用
- **Vite** - 极速构建工具，热重载开发体验
- **Tailwind CSS** - 实用优先的CSS框架，赛博朋克风格定制
- **Pinia** - 轻量级状态管理库
- **Axios** - HTTP客户端，API通信

### 后端技术
- **Flask** - 轻量级Python Web框架
- **SQLAlchemy** - 强大的ORM数据库操作
- **SQLite** - 轻量级嵌入式数据库
- **Flask-CORS** - 跨域资源共享支持
- **Werkzeug** - WSGI工具库

### AI集成
- **OpenRouter API** - 多模型AI服务聚合平台
- **Moonshot API** - Kimi智能助手服务
- **OpenAI Whisper** - 语音转文字服务
- **多模型支持** - GPT-5、Claude、Deepseek、Gemini等

## 🚀 快速开始

> 📖 **详细设置指南**: 查看 [SETUP_GUIDE.md](./SETUP_GUIDE.md) 获取完整的安装和配置说明

### 环境要求
- Python 3.8+
- Node.js 16+ (推荐 18+)
- npm 或 yarn
- 支持的操作系统：Windows, macOS, Linux

### 后端设置

1. 进入后端目录：
```bash
cd ai-notebook/backend
```

2. 创建虚拟环境：
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/Mac:
source venv/bin/activate
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Windows (CMD):
venv\Scripts\activate.bat
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 配置环境变量：
```bash
# 创建 .env 文件
echo "SECRET_KEY=your_secret_key_here" > .env
echo "OPENROUTER_API_KEY=your_openrouter_api_key_here" >> .env
echo "MOONSHOT_API_KEY=your_moonshot_api_key_here" >> .env
echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
```

注意：
- `SECRET_KEY`: Flask应用密钥，用于会话加密
- `OPENROUTER_API_KEY`: OpenRouter AI服务API密钥（推荐）
- `MOONSHOT_API_KEY`: Moonshot AI服务API密钥
- `OPENAI_API_KEY`: OpenAI API密钥
- 至少需要配置一个AI服务的API密钥才能使用AI功能

5. 启动后端服务：
```bash
python app.py
```

### 前端设置

1. 进入前端目录：
```bash
cd ai-notebook/frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 访问应用：
打开浏览器访问 `http://localhost:5173`

注意：Vite开发服务器默认运行在5173端口。后端已配置CORS支持3000和5173端口，确保前后端通信正常。

## 🎯 使用指南

### 基础操作
1. **创建笔记**：点击侧边栏的"智能笔记"，使用富文本编辑器开始编写
2. **AI文本处理**：选中文本后使用AI功能进行总结、改写、翻译等操作
3. **待办管理**：在"待办事项"页面创建任务，设置优先级和分类
4. **AI生成待办**：描述目标让AI自动生成结构化待办事项
5. **番茄时钟专注**：从待办事项启动专注模式或直接进入番茄时钟页面
6. **AI助手对话**：点击浮动助手球进行智能对话

### 高级功能
- **智能搜索**：启用AI增强搜索，支持语义理解和跨内容搜索
- **批量操作**：支持待办事项的批量标记、删除和分类
- **番茄时钟定制**：自定义工作、休息时长，个性化专注体验
- **生产力统计**：查看番茄钟完成数据，分析专注效率趋势
- **数据导出**：一键导出所有笔记、待办和设置数据
- **权限控制**：在设置中管理AI功能权限和安全选项
- **多语言界面**：中英文界面实时切换
- **主题定制**：赛博朋克深色主题和简洁浅色主题

## 🔧 配置说明

### AI服务配置
1. **OpenRouter配置**（推荐）：
   - 注册OpenRouter账号获取API密钥
   - 在设置页面输入API密钥并连接
   - 支持GPT-5、Claude、Deepseek等多种模型

2. **Moonshot配置**：
   - 获取Moonshot API密钥
   - 在设置页面配置Kimi模型
   - 适合中文处理和国内网络环境

3. **环境变量配置**（可选）：
   ```bash
   # 在backend/.env文件中设置
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   MOONSHOT_API_KEY=sk-xxxxx
   OPENAI_API_KEY=sk-xxxxx
   ```

### 数据库配置
- **默认数据库**：SQLite（`backend/ai_notebook.db`）
- **数据持久化**：所有数据本地存储，支持备份
- **扩展支持**：可迁移到PostgreSQL或MySQL

### 安全配置
- **AI权限控制**：可在设置中禁用AI文件操作功能
- **数据隔离**：本地数据存储，不上传到云端
- **API密钥安全**：密钥加密存储，界面脱敏显示

## 📁 项目结构

```
ai-notebook/
├── backend/                 # Flask后端服务
│   ├── app.py              # 主应用入口，CORS配置
│   ├── models.py           # SQLAlchemy数据模型
│   ├── routes/             # API路由模块
│   │   ├── notes.py        # 笔记CRUD、搜索API
│   │   ├── todos.py        # 待办事项管理API
│   │   ├── pomodoro.py     # 番茄时钟会话API
│   │   ├── ai.py           # AI对话、文本处理API
│   │   ├── settings.py     # 系统设置管理API
│   │   └── backgrounds.py  # 背景主题API
│   ├── utils/              # 工具函数库
│   ├── uploads/            # 文件上传目录
│   ├── instance/           # 数据库实例目录
│   ├── requirements.txt    # Python依赖清单
│   └── .env               # 环境变量配置
├── frontend/               # Vue.js前端应用
│   ├── src/
│   │   ├── components/     # Vue组件库
│   │   │   ├── NoteEditor.vue      # 笔记编辑器
│   │   │   ├── TodoList.vue        # 待办事项列表
│   │   │   ├── PomodoroView.vue    # 番茄时钟页面
│   │   │   ├── TimerDisplay.vue    # 环形计时器组件
│   │   │   ├── Settings.vue        # 设置页面
│   │   │   ├── SmartSearch.vue     # 智能搜索
│   │   │   ├── AIEnhancedEditor.vue # AI增强编辑器
│   │   │   └── FloatingAIAssistant.vue # 浮动AI助手
│   │   ├── services/       # API服务层
│   │   │   ├── notesService.js     # 笔记服务
│   │   │   ├── todosService.js     # 待办服务
│   │   │   ├── pomodoroService.js  # 番茄时钟服务
│   │   │   ├── aiService.js        # AI服务
│   │   │   ├── settingsService.js  # 设置服务
│   │   │   └── languageService.js  # 多语言服务
│   │   ├── stores/         # Pinia状态管理
│   │   ├── styles/         # 样式文件（赛博朋克主题）
│   │   └── composables/    # Vue组合式函数
│   ├── package.json        # Node.js依赖
│   ├── vite.config.ts      # Vite构建配置
│   └── tailwind.config.js  # Tailwind CSS配置
├── SETUP_GUIDE.md          # 详细安装指南
└── README.md               # 项目说明文档
```

## 🔄 功能状态

### ✅ 已完成功能
- [x] **笔记系统**：完整的CRUD操作、自动保存、标签管理
- [x] **待办管理**：创建、编辑、删除、优先级、分类、状态跟踪
- [x] **番茄时钟**：专注计时、任务关联、环形进度条、统计追踪
- [x] **AI助手**：多模型支持、智能对话、权限控制
- [x] **智能搜索**：AI增强搜索、跨内容搜索、搜索建议
- [x] **设置系统**：主题切换、语言切换、字体配置、API管理
- [x] **数据管理**：导出备份、数据清理、设置重置
- [x] **用户界面**：响应式设计、赛博朋克主题、多语言支持
- [x] **安全功能**：AI权限控制、数据本地化、API密钥保护

### 🚧 开发中功能
- [ ] **数据同步**：云端备份、多设备同步
- [ ] **插件系统**：第三方扩展支持
- [ ] **协作功能**：多用户共享、实时协作
- [ ] **高级统计**：番茄时钟数据可视化、效率分析

### 🎯 计划功能
- [ ] **移动端适配**：PWA支持、移动端优化
- [ ] **离线模式**：本地AI模型、离线使用
- [ ] **高级分析**：数据可视化、使用统计
- [ ] **自动化工具**：定时任务、智能提醒

## ⚠️ 开发注意事项

### Vue组件开发规范
- 使用Vue 3 Composition API和`<script setup>`语法
- 组件状态管理使用Pinia，避免prop drilling
- 开关组件使用`:checked`绑定而非`v-model`，通过toggle函数控制
- 异步操作统一使用try-catch错误处理

### API设计原则
- RESTful API设计，统一的响应格式
- 错误处理返回详细错误信息和状态码
- 数据验证在前后端同时进行
- API密钥等敏感信息加密存储

### 安全考虑
- AI功能权限可配置，默认安全模式
- 用户数据本地存储，不上传云端
- API调用频率限制和错误重试机制
- 输入验证和XSS防护

## 🚀 部署说明

### 开发环境
```bash
# 克隆项目
git clone <repository-url>
cd ai-notebook

# 后端启动
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# 前端启动（新终端）
cd frontend
npm install
npm run dev
```

### 生产环境
```bash
# 前端构建
cd frontend
npm run build

# 后端生产配置
cd backend
export FLASK_ENV=production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🤝 贡献指南

1. **Fork项目** - 创建你的项目副本
2. **创建分支** - `git checkout -b feature/新功能`
3. **编写代码** - 遵循项目代码规范
4. **测试功能** - 确保新功能正常工作
5. **提交代码** - `git commit -m '添加新功能: 功能描述'`
6. **推送分支** - `git push origin feature/新功能`
7. **创建PR** - 提交Pull Request

### 代码规范
- **前端**：使用ESLint和Prettier格式化
- **后端**：遵循PEP 8 Python代码规范
- **提交信息**：使用语义化提交信息
- **文档**：更新相关文档和注释

## 📄 许可证

本项目采用 **MIT许可证** - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

### 技术栈
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Flask](https://flask.palletsprojects.com/) - 轻量级Python Web框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL工具包

### AI服务
- [OpenRouter](https://openrouter.ai/) - 多模型AI服务聚合平台
- [Moonshot AI](https://www.moonshot.cn/) - Kimi智能助手
- [OpenAI](https://openai.com/) - GPT系列模型和Whisper

### 开源社区
感谢所有为开源项目贡献的开发者们！

## 📞 支持与反馈

### 获取帮助
- 📖 **文档**：查看 [SETUP_GUIDE.md](./SETUP_GUIDE.md) 获取详细设置指南
- 🐛 **问题反馈**：在GitHub Issues中报告bug
- 💡 **功能建议**：提交Feature Request
- 📧 **技术支持**：通过Issues获取技术支持

### 项目状态
- 🔄 **活跃开发中** - 定期更新和功能增强
- 🛡️ **稳定版本** - 核心功能已完成并测试
- 🚀 **持续改进** - 根据用户反馈不断优化

---

**🎉 开始你的AI智能笔记之旅！**

*让AI成为你的智能工作伙伴，提升创作效率，释放无限可能！*