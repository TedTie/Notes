# Vercel Security Checkpoint 解决方案

## 问题描述
你遇到了 "Vercel Security Checkpoint" 页面，这是 Vercel 的安全检查机制。

## 解决方案

### 方法 1: 等待并刷新
1. 等待 5-10 秒让页面自动加载完成
2. 如果页面没有自动跳转，手动刷新页面（按 F5 或 Ctrl+R）
3. 重复 2-3 次直到进入正常页面

### 方法 2: 清除浏览器缓存
1. 按 `Ctrl + Shift + Delete` 打开清除数据窗口
2. 选择 "缓存的图片和文件"
3. 点击 "清除数据"
4. 重新访问 Vercel 网站

### 方法 3: 使用无痕模式
1. 按 `Ctrl + Shift + N` 打开无痕窗口
2. 在无痕窗口中访问 [https://vercel.com](https://vercel.com)
3. 登录你的账号

### 方法 4: 更换网络
1. 如果使用 WiFi，尝试切换到手机热点
2. 或者使用 VPN 更换 IP 地址
3. 重新访问 Vercel

### 方法 5: 使用不同浏览器
1. 如果使用 Chrome，尝试 Firefox 或 Edge
2. 确保浏览器是最新版本

## 替代方案：使用 Vercel CLI

如果网页版一直无法访问，可以使用命令行工具：

### 安装 Vercel CLI
```bash
npm install -g vercel
```

### 登录 Vercel
```bash
vercel login
```

### 部署项目
```bash
cd ai-notebook/frontend
vercel
```

### 设置环境变量
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 环境变量值

当系统提示输入环境变量值时，使用以下值：

**VITE_SUPABASE_URL**:
```
https://vcgythhenulnwuindgyx.supabase.co
```

**VITE_SUPABASE_ANON_KEY**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3l0aGhlbnVsbnV1aW5kZ3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzE0NzQsImV4cCI6MjA1MTMwNzQ3NH0.Zt8vGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJNJGJN
```

## 常见原因

1. **地理位置限制**: 某些地区可能触发安全检查
2. **网络环境**: 公司网络或特殊网络环境
3. **浏览器问题**: 缓存或扩展程序冲突
4. **频繁访问**: 短时间内多次访问触发保护

## 如果问题持续

1. 联系 Vercel 支持: [https://vercel.com/help](https://vercel.com/help)
2. 使用 Vercel CLI 作为替代方案
3. 尝试在不同时间段访问

## 下一步

一旦成功进入 Vercel 控制台，按照之前的配置指南继续设置环境变量。如果需要帮助，请告诉我你使用了哪种方法解决了问题！