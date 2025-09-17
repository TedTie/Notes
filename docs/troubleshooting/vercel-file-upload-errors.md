# Vercel 文件上传错误修复指南

## 错误描述
```
Failed to load resource: the server responded with a status of 501
[FRONTEND] Upload response status: 501
[FRONTEND] Upload failed: 501 - {"error":"File upload requires persistent storage","message":"Background upload not supported in Vercel environment"}
文件上传失败: Error: 上传失败
加载背景文件失败: TypeError: q.map is not a function
```

## 问题分析

### 主要问题
1. **501 错误**: Vercel 无服务器环境不支持持久化文件存储
2. **后端上传限制**: Vercel Functions 不支持长时间运行的文件上传任务
3. **存储架构问题**: 当前应用试图使用本地文件系统存储，但 Vercel 是无状态环境

### 根本原因
Vercel 是无服务器平台，每次请求都在独立的容器中运行，无法保存文件到本地磁盘。

## 解决方案

### 方案 1: 使用 Supabase Storage (推荐)

#### 1.1 配置 Supabase Storage
```sql
-- 在 Supabase SQL Editor 中执行
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');
```

#### 1.2 创建存储桶
```javascript
// 在 Supabase Dashboard > Storage 中创建 bucket
// 或使用 JavaScript
const { data, error } = await supabase.storage
  .createBucket('uploads', {
    public: true,
    allowedMimeTypes: ['image/*', 'application/pdf']
  });
```

#### 1.3 修改前端上传代码
```javascript
// 替换原有的文件上传逻辑
async function uploadFile(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (error) throw error;

    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 方案 2: 使用 Vercel Blob Storage

#### 2.1 安装依赖
```bash
npm install @vercel/blob
```

#### 2.2 配置环境变量
```env
BLOB_READ_WRITE_TOKEN=your_blob_token
```

#### 2.3 创建上传 API
```javascript
// api/upload.js
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const filename = searchParams.get('filename');

    const blob = await put(filename, req.body, {
      access: 'public',
    });

    return res.json(blob);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## 立即修复步骤 (使用 Supabase)

### 步骤 1: 检查 Supabase 配置
```javascript
// 确保 Supabase 客户端正确配置
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
```

### 步骤 2: 创建 Storage Bucket
1. 登录 Supabase Dashboard
2. 进入 Storage 页面
3. 点击 "New bucket"
4. 名称: `uploads`
5. 设置为 Public
6. 点击 "Create bucket"

### 步骤 3: 设置 Storage 策略
```sql
-- 在 Supabase SQL Editor 执行
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');
```

### 步骤 4: 修改前端代码
找到文件上传相关的代码，替换为 Supabase Storage API 调用。

### 步骤 5: 测试上传功能
```javascript
// 测试代码
async function testUpload() {
  const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
  const result = await uploadFile(testFile);
  console.log('Upload result:', result);
}
```

## 环境变量检查
确保以下环境变量在 Vercel 中正确配置：
```env
VITE_SUPABASE_URL=https://gqkpjqjqvqjqjqjqvqjq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 常见问题

### Q: 为什么会出现 501 错误？
A: Vercel 无服务器环境不支持持久化文件存储，需要使用外部存储服务。

### Q: Supabase Storage 是否免费？
A: Supabase 提供 1GB 免费存储空间，超出部分按使用量计费。

### Q: 如何处理大文件上传？
A: 使用分片上传或压缩文件，Supabase 支持最大 50MB 的文件。

### Q: 上传的文件如何管理？
A: 可以在 Supabase Dashboard 的 Storage 页面管理文件，或通过 API 删除。

## 验证清单
- [ ] Supabase Storage bucket 已创建
- [ ] Storage 策略已正确设置
- [ ] 前端代码已更新为使用 Supabase Storage
- [ ] 环境变量在 Vercel 中正确配置
- [ ] 本地测试上传功能正常
- [ ] 部署后测试上传功能正常

## 下一步
1. 实施 Supabase Storage 解决方案
2. 测试文件上传功能
3. 优化用户体验（进度条、错误处理）
4. 考虑添加文件类型和大小限制

这个解决方案将彻底解决 Vercel 环境中的文件上传问题！