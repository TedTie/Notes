# Git推送和Supabase更新简化指南

## 📋 预配置信息（请先准备好这些信息）

### 必需信息（请替换为你的项目信息）
```
项目路径: [你的项目根目录路径，例如: E:\MyProject]
Supabase项目ID: [你的Supabase项目引用ID，在项目设置中查看]
Supabase项目URL: [你的Supabase项目URL，格式: https://your-project-ref.supabase.co]
```

### 环境检查（复制粘贴运行）
```bash
# 检查是否在正确目录（替换为你的项目路径）
cd [你的项目路径]
pwd

# 检查工具版本
git --version
node --version
npm --version
```

## 🚀 核心操作步骤（按顺序执行）

### 步骤1: 检查文件状态
```bash
# 查看有哪些文件被修改了
git status
```

### 步骤2: 添加所有更改
```bash
# 添加所有修改的文件
git add .
```

### 步骤3: 提交更改
```bash
# 提交更改（请修改引号内的描述）
git commit -m "更新项目功能和文档"
```

### 步骤4: 推送到GitHub
```bash
# 推送到远程仓库
git push
```

### 步骤5: 更新Supabase
```bash
# 链接Supabase项目（替换为你的项目ID）
npx supabase link --project-ref [你的Supabase项目ID]

# 推送数据库更改
npx supabase db push
```

## 🔧 一键执行脚本（全部复制粘贴）

```bash
# 切换到项目目录（替换为你的项目路径）
cd [你的项目路径]

# 检查状态
echo "=== 检查文件状态 ==="
git status

# 添加所有更改
echo "=== 添加文件 ==="
git add .

# 提交（请修改提交信息）
echo "=== 提交更改 ==="
git commit -m "feat: 更新项目功能和修复问题"

# 推送到GitHub
echo "=== 推送到GitHub ==="
git push

# 更新Supabase
echo "=== 更新Supabase ==="
npx supabase link --project-ref [你的Supabase项目ID]
npx supabase db push

echo "=== 完成！ ==="
```

## ❌ 常见错误解决

### 错误1: 推送被拒绝
```bash
# 先拉取远程更改
git pull origin main
# 然后重新推送
git push
```

### 错误2: Supabase连接失败
```bash
# 重新链接项目（替换为你的项目ID）
npx supabase link --project-ref [你的Supabase项目ID]
```

### 错误3: 权限问题
```bash
# 设置访问令牌（Windows PowerShell）
$env:SUPABASE_ACCESS_TOKEN="your-access-token"
```

## 📝 给ClaudeCode的指令模板

```
请帮我执行Git推送和Supabase更新操作：

项目路径: [替换为你的项目路径]
Supabase项目ID: [替换为你的Supabase项目ID]

请按以下步骤执行：
1. 检查git状态
2. 添加所有更改的文件
3. 提交更改（提交信息：[在这里写你的更改描述]）
4. 推送到GitHub
5. 链接并更新Supabase数据库

如果遇到错误，请按照文档中的错误解决方案处理。
```

## ✅ 成功标志

看到以下输出表示操作成功：
- Git推送: `Total X (delta Y), reused 0 (delta 0)`
- Supabase: `Finished supabase db push.`

---

**注意**: 每次修改代码后都需要执行这些步骤来同步更改。