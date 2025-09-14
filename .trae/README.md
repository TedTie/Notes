# ProjectNotes Supabase MCP Configuration

这是 ProjectNotes 项目的专属 Supabase MCP (Model Context Protocol) 配置。

## 📁 配置文件说明

### `mcp.json`
项目级 MCP 服务器配置文件，包含：
- 服务器名称：`supabase-projectnotes`
- Supabase 项目引用：`vcgythhenulnwuindgyx`
- 读写模式配置（默认移除了 `--read-only` 参数）

### `env`
项目环境变量文件，包含：
- `SUPABASE_ACCESS_TOKEN`：Supabase 访问令牌
- `SUPABASE_PROJECT_REF`：项目引用ID
- `PROJECT_NAME`：项目名称
- `MCP_SERVER_MODE`：服务器模式

### `start-mcp.ps1`
PowerShell 启动脚本，用于：
- 加载环境变量
- 启动 MCP 服务器
- 错误处理和日志输出

## 🚀 使用方法

### 在 Trae AI 中使用
1. 确保 `.trae/mcp.json` 配置文件存在
2. Trae AI 会自动检测并加载项目级 MCP 配置
3. 可以直接与 Supabase 数据库交互

### 手动启动 MCP 服务器
```powershell
# 在项目根目录执行
.trae\start-mcp.ps1
```

### 在其他 AI 工具中使用

#### Cursor
1. 复制 `mcp.json` 内容到 `.cursor/mcp.json`
2. 重启 Cursor

#### VS Code (Copilot)
1. 复制 `mcp.json` 内容到 `.vscode/mcp.json`
2. 启动 MCP 服务器

## 🔒 安全注意事项

1. **不要提交敏感信息**：
   - 将 `.trae/env` 添加到 `.gitignore`
   - 访问令牌应保密

2. **权限控制**：
   - 当前配置为读写模式
   - 如需只读模式，在 `mcp.json` 的 `args` 中添加 `"--read-only"`

3. **令牌管理**：
   - 定期轮换访问令牌
   - 使用最小权限原则

## 🛠️ 故障排除

### 常见问题

1. **MCP 服务器无法启动**
   - 检查网络连接
   - 验证访问令牌有效性
   - 确认项目引用正确

2. **权限错误**
   - 检查 Supabase 项目权限
   - 验证访问令牌权限范围

3. **配置不生效**
   - 重启 AI 工具
   - 检查配置文件语法
   - 查看错误日志

## 📊 项目信息

- **项目名称**：ProjectNotes
- **Supabase 项目**：vcgythhenulnwuindgyx
- **配置模式**：读写模式
- **作用范围**：仅当前项目

## 🔄 更新配置

如需修改配置：
1. 编辑对应的配置文件
2. 重启 MCP 服务器或 AI 工具
3. 验证新配置是否生效

---

*此配置仅在当前项目中生效，不会影响其他项目的 MCP 设置。*