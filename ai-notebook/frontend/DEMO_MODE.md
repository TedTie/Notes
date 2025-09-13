# 演示模式配置说明

## 概述

演示模式允许前端应用在没有后端服务器的情况下运行，提供友好的用户体验和功能展示。

## 配置方法

### 1. 环境变量配置

在部署环境中设置以下环境变量：

```bash
# 启用演示模式（当后端不可用时）
VITE_API_URL=  # 留空或不设置
```

### 2. Vercel 部署配置

在 Vercel 项目设置中添加环境变量：
- `VITE_API_URL`: 留空（不设置值）

## 演示模式功能

### 自动检测
- 当 `VITE_API_URL` 未设置或为空时，自动启用演示模式
- 显示演示模式横幅提示用户当前状态

### 友好错误处理
- API 调用失败时显示友好提示而非 404 错误
- 提供模拟数据以展示界面功能
- 本地设置更改仍然有效（仅限前端）

### 功能限制提示
- 首次使用功能时显示演示模式通知
- 避免重复显示相同功能的通知
- 提示用户如何获得完整功能

## 支持的功能

### 完全支持
- 主题切换（深色/浅色）
- 语言切换（中文/英文）
- 界面布局和导航
- 前端设置更改

### 演示模式
- 设置管理（本地存储）
- 笔记功能（界面展示）
- 背景管理（界面展示）
- AI 功能（界面展示）

### 不可用功能
- 数据持久化
- 文件上传
- AI API 调用
- 后端数据同步

## 用户体验

### 演示横幅
- 页面顶部显示橙色演示模式横幅
- 可以手动关闭横幅
- 清晰说明当前为演示版本

### 通知系统
- 功能限制时显示友好提示
- 避免技术性错误信息
- 引导用户了解完整功能

## 开发者说明

### 添加新功能的演示模式支持

1. 在 `demoModeService.js` 中添加模拟数据
2. 在相关服务中检查 `demoModeService.isDemo()`
3. 提供友好的演示模式响应

### 示例代码

```javascript
import demoModeService from './demoModeService.js'

// 在 API 调用前检查演示模式
if (demoModeService.isDemo()) {
  const demoResponse = demoModeService.getDemoResponse('/api/endpoint')
  return demoResponse
}

// 正常 API 调用
try {
  const response = await fetch('/api/endpoint')
  // ...
} catch (error) {
  // 在演示模式下提供备用响应
  if (demoModeService.isDemo()) {
    demoModeService.showDemoNotification('feature')
    return demoModeService.getDemoResponse('/api/endpoint')
  }
  throw error
}
```

## 部署检查清单

- [ ] 确认 `VITE_API_URL` 环境变量配置
- [ ] 验证演示横幅正常显示
- [ ] 测试主要功能的演示模式响应
- [ ] 确认通知系统工作正常
- [ ] 验证设置更改在前端正常工作

## 故障排除

### 演示模式未启用
- 检查 `VITE_API_URL` 环境变量是否正确设置
- 确认构建时环境变量已正确注入

### 仍然显示 404 错误
- 检查相关服务是否已添加演示模式支持
- 确认 `demoModeService` 正确导入和使用

### 演示横幅不显示
- 检查 `API_CONFIG.DEMO_MODE` 是否正确设置
- 确认 Vue 组件中的条件渲染逻辑