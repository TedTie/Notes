# 故障排除指南

## 🔧 常见问题解决

### 1. 项目无法启动
**症状**: `npm run dev` 报错
**解决**:
```bash
# 1. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 2. 检查环境变量
cat .env

# 3. 检查端口占用
netstat -ano | findstr :3000
```

### 2. Playwright测试失败
**症状**: `npx playwright test` 报错
**解决**:
```bash
# 1. 重新安装浏览器
npx playwright install

# 2. 检查测试配置
cat tests/playwright/playwright.config.js

# 3. 单独运行测试
npx playwright test tests/playwright/basic.test.js
```

### 3. Vercel部署失败
**症状**: `vercel deploy` 报错
**解决**:
```bash
# 1. 检查Vercel配置
cat vercel.json

# 2. 检查环境变量
vercel env list

# 3. 重新登录Vercel
vercel logout
vercel login
```

### 4. Supabase连接失败
**症状**: 数据库连接错误
**解决**:
```bash
# 1. 检查Supabase配置
cat .env | grep SUPABASE

# 2. 检查网络连接
curl -I https://vcgythhenulnwuindgyx.supabase.co

# 3. 重新生成密钥
# 登录Supabase控制台重新生成
```

### 5. Git操作失败
**症状**: git push/pull 报错
**解决**:
```bash
# 1. 检查Git配置
git config --list

# 2. 检查远程仓库
git remote -v

# 3. 强制同步
git fetch origin
git reset --hard origin/main
```

## 🚨 紧急情况处理

### 完全重置项目
```bash
cd E:\51\AI
rm -rf ProjectNote
git clone https://github.com/TedTie/Notes.git ProjectNote
cd ProjectNote
npm install
npx playwright install
```

### 备份重要数据
```bash
# 备份数据库（如果适用）
# 备份环境变量
cp .env .env.backup
# 备份配置文件
cp -r .claude .claude.backup
```

## 📞 联系支持

### 获取帮助
1. **GitHub Issues**: https://github.com/TedTie/Notes/issues
2. **Vercel Support**: https://vercel.com/support
3. **Supabase Support**: https://supabase.com/support

### 提供信息
报告问题时请包含：
- 错误信息截图
- 操作步骤
- 环境信息（Node.js版本、npm版本）
- 相关配置文件内容

## 🎯 预防措施

### 定期维护
```bash
# 每周运行一次
node scripts/check-env.js
npm audit
npm outdated
```

### 最佳实践
1. **定期提交代码**: 避免大量未提交更改
2. **测试环境**: 生产环境前先测试
3. **备份配置**: 重要配置定期备份
4. **监控日志**: 定期查看应用日志

## 🔍 诊断工具

### 系统信息
```bash
node --version
npm --version
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
```

### 网络诊断
```bash
ping google.com
curl -I https://notes-five-smoky.vercel.app/
curl -I https://github.com/TedTie/Notes.git
```

### 依赖检查
```bash
npm list --depth=0
npm audit
```