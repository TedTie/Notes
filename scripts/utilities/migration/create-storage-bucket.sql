-- 创建Supabase存储桶的SQL脚本
-- 适用于Supabase SQL Editor

-- 1. 创建backgrounds存储桶（背景图片）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'backgrounds',
    'backgrounds', 
    true,  -- 公开访问
    5242880,  -- 5MB文件大小限制
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 创建uploads存储桶（用户上传文件）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'uploads',
    'uploads',
    false,  -- 私有访问
    10485760,  -- 10MB文件大小限制
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- 3. 创建temp存储桶（临时文件）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp',
    'temp',
    false,  -- 私有访问
    20971520,  -- 20MB文件大小限制
    NULL  -- 允许所有文件类型
)
ON CONFLICT (id) DO NOTHING;

-- 4. 为backgrounds存储桶设置RLS策略
-- 允许公开查看背景图片
CREATE POLICY "Public read access for backgrounds" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'backgrounds');

-- 允许公开上传背景图片
CREATE POLICY "Public upload access for backgrounds" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'backgrounds');

-- 允许公开删除背景图片
CREATE POLICY "Public delete access for backgrounds" 
ON storage.objects 
FOR DELETE 
TO public 
USING (bucket_id = 'backgrounds');

-- 允许公开更新背景图片
CREATE POLICY "Public update access for backgrounds" 
ON storage.objects 
FOR UPDATE 
TO public 
USING (bucket_id = 'backgrounds')
WITH CHECK (bucket_id = 'backgrounds');

-- 5. 为uploads存储桶设置RLS策略
-- 允许公开上传文件
CREATE POLICY "Public upload access for uploads" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'uploads');

-- 允许公开查看上传的文件
CREATE POLICY "Public read access for uploads" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'uploads');

-- 允许公开删除上传的文件
CREATE POLICY "Public delete access for uploads" 
ON storage.objects 
FOR DELETE 
TO public 
USING (bucket_id = 'uploads');

-- 6. 为temp存储桶设置RLS策略
-- 允许公开上传临时文件
CREATE POLICY "Public upload access for temp" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'temp');

-- 允许公开查看临时文件
CREATE POLICY "Public read access for temp" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'temp');

-- 允许公开删除临时文件
CREATE POLICY "Public delete access for temp" 
ON storage.objects 
FOR DELETE 
TO public 
USING (bucket_id = 'temp');

-- 7. 验证存储桶创建
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id IN ('backgrounds', 'uploads', 'temp')
ORDER BY created_at;

-- 8. 验证RLS策略创建
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;