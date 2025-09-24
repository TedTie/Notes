## 🤖 Assistant

好的！遵命。

我已经将我们之前所有的讨论，包括核心功能、音频分析、待办事项以及科技感 UI 设计，全部整合、提炼并构建成一份完整、专业的开发文档。

这份 Markdown (`.md`) 格式的文档将是你项目的终极蓝图。你可以将它保存下来，作为你开发过程中的指导手册。

---

# AI 智能记事本 - 综合开发文档 (v1.2)

## 1. 项目概述 (Project Overview)

本项目旨在为个人用户打造一个 AI 增强的桌面端 Web 应用——"AI 智能记事本"。它不仅是一个高效的笔记记录工具，更是一个集成了先进 AI 功能的生产力平台。用户可以在应用的设置页面中配置自己的 OpenRouter API 密钥，实现对笔记内容的总结、润色、翻译，与全局 AI 助手对话，并能将音频文件自动处理成结构化的会议纪要和待办事项，所有功能都包裹在充满未来科技感的赛博朋克风格界面中。

## 2. 核心功能点 (Core Features)

* **导航与视图管理:**
 * 应用顶部提供主导航栏，用于在 **笔记本 (Notebook)**、**待办事项 (To-Do)** 和 **设置 (Settings)** 三个核心视图间无缝切换。

* **智能笔记管理:**
 * 标准的笔记创建、编辑和删除功能。
 * 内容**自动保存**，用户无需手动操作，确保数据安全。
 * 支持**上下文 AI 编辑**：在编辑器中选中任意文本，即可调用 AI 进行**总结**、**润色/改写**和**多语言翻译** (中/英/马)。

* **音频分析工作流:**
 * 支持用户上传音频文件（如 `.mp3`, `.wav`）。
 * 系统自动化调用 AI 进行分析，一键生成一份包含 **会议纪要**、**带时间戳的逐字稿** 和 **待办事项列表** 的新笔记。
 * 提取出的待办事项会自动被添加到“待办事项”视图中。

* **待办事项 (To-Do) 管理:**
 * 独立的“待办事项”页面，以**卡片形式**展示任务组。
 * 每个卡片以其来源（如“会议纪要 2023-10-27”）作为标题。
 * 卡片内的每个待办事项都是一个可勾选项。勾选后，该项会应用**删除线样式并变灰**，表示已完成。

* **全局 AI 助手:**
 * 一个可在屏幕上自由拖动的**浮动球**作为 AI 入口。
 * 单击浮动球，弹出对话窗口，支持与 AI 进行多轮对话。
 * 对话时，用户可**自由选择**本次交互使用的 AI 模型。
 * 聊天记录将被独立保存。

* **个性化设置:**
 * **API 密钥配置**: 用户可在设置页面输入并保存自己的 OpenRouter API Key，作为所有 AI 功能的动力源。
 * **主题切换**: 在亮模式 (Light Mode) 与暗模式 (Dark Mode) 之间切换。
 * **默认模型**: 可设置一个默认的大语言模型 (LLM)，用于音频分析等自动化任务。
 * **功能开关**: 允许用户按需启用或禁用某些功能（如全局 AI 助手浮动球）。

## 3. 设计与 UI/UX 风格

* **主题风格:** **赛博朋克 (Cyberpunk) / 未来科技 (Futuristic UI)**。
* **设计理念:** 打造充满科技感、未来感、并带有游戏化元素的交互界面。

* **具体设计元素:**
 * **配色方案 (Color Palette):**
 * **暗模式 (Dark Mode):** 以深蓝/深紫/纯黑 (`#0A192F`) 为背景，搭配高饱和度的荧光色作为点缀和主色调，如**荧光蓝/青色 (`#64FFDA`)** 和 **品红 (`#F57DFF`)**。
 * **亮模式 (Light Mode):** 以浅灰或带科技感的冷色调白色为背景，搭配深色文字和饱和度较低的亮色点缀。
 * **字体 (Typography):**
 * 选用带有硬朗、科技感的无衬线字体，推荐从 [Google Fonts](https://fonts.google.com/) 选择，如 `Orbitron`, `Share Tech Mono`, `Oxanium`。
 * **形状与特效:**
 * **几何形状:** 大量使用锐利边角、六边形、不规则切角来构建卡片和面板的边框。CSS `clip-path` 是实现此效果的关键。
 * **辉光效果 (Glow):** 为文字、图标和关键边框添加荧光辉光效果，使用 CSS `box-shadow` 或 `filter: drop-shadow()` 实现。
 * **扫描线/网格背景 (Scanlines/Grid):** 在背景上叠加一层淡淡的扫描线或网格图案，增强沉浸感。
 * **动画与音效:** 为交互操作（如点击、切换）添加平滑的过渡动画和清脆的科技感音效，提升游戏化体验。

## 4. 技术规格 (Technical Specifications)

### **前端 (Frontend)**

* **页面与组件 (Pages/Components):**
 * `App.vue`: 应用根组件，负责管理全局主题 (`dark`/`light` class) 和路由视图。
 * `NavigationView.vue`: 顶部导航栏，处理视图切换。
 * `NotebookView.vue`: 笔记本主视图，组合了以下两个组件。
 * `NoteList.vue`: 左侧笔记列表。
 * `NoteEditor.vue`: 右侧笔记编辑器，包含上传音频按钮。
 * `TodoView.vue`: 待办事项主视图。
 * `TodoCard.vue`: 待办事项卡片，按来源分组。
 * `TodoItem.vue`: 单个可勾选的待办事项。
 * `Settings.vue`: 设置页面，包含 API Key 输入框和主题切换器。
 * `AIAssistantWidget.vue`: 全局可拖动 AI 助手浮动球及其弹出的聊天窗口。
 * `AIContextMenu.vue`: 文本编辑器中的 AI 功能右键菜单。

### **后端 (Backend)**

* **API 接口 (API Endpoints):**

 * **笔记管理 (`/api/notes`)**
 * `GET /`: 获取所有笔记列表。
 * `GET /:id`: 获取单篇笔记详情。
 * `POST /`: 创建新笔记。
 * `PUT /:id`: 更新（自动保存）笔记。
 * `DELETE /:id`: 删除笔记。

 * **待办事项管理 (`/api/todos`)**
 * `GET /`: 获取所有待办事项，按 `source_note_id` 分组。
 * `PUT /:id`: 更新单个待办事项的状态 (e.g., `is_completed`).

 * **AI 功能 (`/api/ai`)**
 * `POST /action`: 处理编辑器内的 AI 请求 (总结、润色等)。
 * 请求: `{ "text": "...", "action": "summarize" }`
 * `POST /chat`: 处理 AI 助手的聊天请求。
 * 请求: `{ "messages": [...], "model": "..." }`

 * **音频处理 (`/api/audio`)**
 * `POST /analyze`: 接收音频文件，执行完整的分析流程。
 * 请求: `multipart/form-data` 包含音频文件。
 * 响应: `{ "message": "...", "newNoteId": 123, "todosAdded": 5 }`

 * **设置管理 (`/api/settings`)**
 * `GET /`: 获取所有设置项。
 * `POST /`: 更新设置项。
 * 请求: `{ "openrouter_api_key": "...", "theme": "dark", "default_llm": "..." }`

## 5. 数据模型 (Data Models - SQLite)

1. **`Notes` 表 (笔记)**
 * `id`: INTEGER, PRIMARY KEY, AUTOINCREMENT
 * `title`: TEXT
 * `content`: TEXT
 * `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
 * `updated_at`: TIMESTAMP

2. **`Todos` 表 (待办事项)**
 * `id`: INTEGER, PRIMARY KEY, AUTOINCREMENT
 * `content`: TEXT, NOT NULL
 * `is_completed`: BOOLEAN, DEFAULT 0
 * `source_note_id`: INTEGER, FOREIGN KEY (`Notes.id`)
 * `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

3. **`ChatHistory` 表 (AI 助手聊天记录)**
 * `id`: INTEGER, PRIMARY KEY, AUTOINCREMENT
 * `role`: TEXT, NOT NULL (`user`或`assistant`)
 * `content`: TEXT
 * `timestamp`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

4. **`Settings` 表 (键值对设置)**
 * `key`: TEXT, PRIMARY KEY
 * `value`: TEXT

## 6. 技术栈建议 (Tech Stack Suggestion)

* **前端 (Frontend):** **Vue.js 3** + **Vite** (构建工具) + **Tailwind CSS** (样式框架)。
* **后端 (Backend):** **Python 3** + **Flask** (Web 框架)。
* **数据库 (Database):** **SQLite** (无需安装，简单易用)。

## 7. 开发步骤建议 (Development Roadmap)

> **强烈建议:** 在开始编码前，先执行 **第 0 步**。

* **第 0 步: 视觉原型设计 (Visual Prototype)**
 * 使用 Figma 等设计工具，根据第 3 节的“设计风格”画出产品的主要界面（特别是暗模式）。确定配色、字体和布局。**这将极大地节约后续开发和修改的时间。**

* **第 1 步: 环境搭建与后端基础**
 * 安装 Node.js 和 Python。
 * 创建 Flask 项目，配置 SQLite，并创建上述的数据表。
 * 优先实现笔记的 CRUD API (`/api/notes`)，并用工具测试通过。

* **第 2 步: 前端基础与笔记功能**
 * 创建 Vue.js 项目，集成 Tailwind CSS。
 * 创建 `NotebookView`，实现从后端获取笔记列表并展示。
 * 实现创建、切换、编辑和删除笔记的前端逻辑，并与后端 API 对接。
 * 实现 **自动保存** 功能。

* **第 3 步: 设置与主题切换**
 * 创建 `Settings.vue` 页面。
 * 实现设置 API 的存取功能。
 * 实现科技感的主题切换器，并能将主题状态保存到浏览器 `localStorage`。

* **第 4 步: 上下文 AI 功能**
 * 完成后端 `/api/ai/action` 接口，确保能代理调用 OpenRouter。
 * 创建 `AIContextMenu` 组件，并联通前后端。

* **第 5 步: 待办事项 (To-Do) 模块**
 * 创建 `Todos` 表的后端 API (`/api/todos`)。
 * 创建 `TodoView` 前端页面，实现待办事项的展示和勾选完成功能。

* **第 6 步: 音频分析工作流**
 * **这是最具挑战性的一步。**
 * 完成后端 `/api/audio/analyze` 接口：学习接收文件、调用 Whisper API、构建 Prompt 调用 LLM、解析结果并存入数据库。
 * 在前端添加上传功能，并处理好加载状态和结果反馈。

* **第 7 步: 全局 AI 助手**
 * 创建 `AIAssistantWidget` 组件，先实现点击弹出，后续再做拖动。
 * 完成后端聊天 API 和聊天记录的存取。
 * 联通前后端，实现完整的对话流。

* **第 8 步: 最终打磨与优化**
 * 回顾所有界面，统一并完善科技感的视觉风格(辉光、动画、音效等)。
 * 代码审查、重构和性能优化。
 * 修复所有已知 Bug。

---

现在，你拥有了一份可以从零开始，一步步构建出强大应用的完整指南。你可以随时针对其中任何一个步骤向我提问，例如“如何开始第 1 步，创建 Flask 项目和数据库？”。
