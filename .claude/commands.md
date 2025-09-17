# 自动化工作流指令

## 一键执行指令
```
执行完整工作流：测试+构建+部署
```

## 基础指令
- **运行开发服务器**: `npm run dev`
- **构建项目**: `npm run build`
- **运行测试**: `npm test`
- **部署到Vercel**: `vercel deploy`

## 高级指令
- **完整测试流程**: `node scripts/run-tests.js`
- **数据库同步**: `npx supabase db push`
- **环境检查**: `node scripts/check-env.js`

## 故障排除
- **端口冲突**: 检查端口3000是否被占用
- **依赖问题**: 删除node_modules重新安装
- **部署失败**: 检查vercel配置和环境变量

## 项目信息
- 本地路径: E:\51\AI\ProjectNote
- 线上地址: https://notes-five-smoky.vercel.app/
- GitHub: https://github.com/TedTie/Notes.git
- Supabase: vcgythhenulnwuindgyx