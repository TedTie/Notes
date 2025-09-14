-- ProjectNotes Supabase Storage 配置
-- 为背景图片和其他文件上传功能配置存储桶

-- 创建背景图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'backgrounds',
    'backgrounds',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 创建用户上传文件存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'uploads',
    'uploads',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/json']
);

-- 创建临时文件存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp',
    'temp',
    false,
    20971520, -- 20MB limit
    NULL -- 允许所有文件类型
);

-- 为backgrounds存储桶创建RLS策略
-- 允许所有人查看背景图片
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'backgrounds');

-- 允许所有人上传背景图片（在生产环境中您可能需要限制这个权限）
CREATE POLICY "Allow background upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'backgrounds');

-- 允许所有人删除背景图片（在生产环境中您可能需要限制这个权限）
CREATE POLICY "Allow background delete" ON storage.objects FOR DELETE USING (bucket_id = 'backgrounds');

-- 为uploads存储桶创建RLS策略
-- 允许所有人上传文件
CREATE POLICY "Allow file upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- 允许所有人查看上传的文件
CREATE POLICY "Allow file access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- 允许所有人删除上传的文件
CREATE POLICY "Allow file delete" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');

-- 为temp存储桶创建RLS策略
-- 允许临时文件的所有操作
CREATE POLICY "Allow temp file operations" ON storage.objects FOR ALL USING (bucket_id = 'temp');

-- 创建文件管理相关的表
-- 文件元数据表
CREATE TABLE file_metadata (
    id SERIAL PRIMARY KEY,
    storage_path TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    bucket_id TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_temporary BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- 为file_metadata表启用RLS
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- 创建file_metadata表的RLS策略
CREATE POLICY "Allow all operations on file_metadata" ON file_metadata
    FOR ALL USING (true) WITH CHECK (true);

-- 创建索引
CREATE INDEX idx_file_metadata_bucket_id ON file_metadata(bucket_id);
CREATE INDEX idx_file_metadata_uploaded_at ON file_metadata(uploaded_at DESC);
CREATE INDEX idx_file_metadata_expires_at ON file_metadata(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_file_metadata_is_temporary ON file_metadata(is_temporary) WHERE is_temporary = true;

-- 创建清理过期临时文件的函数
CREATE OR REPLACE FUNCTION cleanup_expired_temp_files()
RETURNS INTEGER AS $$
DECLARE
    expired_file RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- 查找过期的临时文件
    FOR expired_file IN 
        SELECT storage_path, bucket_id 
        FROM file_metadata 
        WHERE is_temporary = true 
        AND expires_at < NOW()
    LOOP
        -- 从存储中删除文件
        DELETE FROM storage.objects 
        WHERE bucket_id = expired_file.bucket_id 
        AND name = expired_file.storage_path;
        
        -- 从元数据表中删除记录
        DELETE FROM file_metadata 
        WHERE storage_path = expired_file.storage_path;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建文件上传记录函数
CREATE OR REPLACE FUNCTION record_file_upload(
    p_storage_path TEXT,
    p_original_name TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT,
    p_bucket_id TEXT,
    p_is_temporary BOOLEAN DEFAULT FALSE,
    p_expires_hours INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
    expires_time TIMESTAMPTZ;
BEGIN
    -- 计算过期时间
    IF p_is_temporary AND p_expires_hours IS NOT NULL THEN
        expires_time := NOW() + INTERVAL '1 hour' * p_expires_hours;
    END IF;
    
    -- 插入文件元数据
    INSERT INTO file_metadata (
        storage_path,
        original_name,
        file_size,
        mime_type,
        bucket_id,
        is_temporary,
        expires_at,
        metadata
    ) VALUES (
        p_storage_path,
        p_original_name,
        p_file_size,
        p_mime_type,
        p_bucket_id,
        p_is_temporary,
        expires_time,
        p_metadata
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取文件信息的函数
CREATE OR REPLACE FUNCTION get_file_info(p_storage_path TEXT)
RETURNS JSON AS $$
DECLARE
    file_info JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'storage_path', storage_path,
        'original_name', original_name,
        'file_size', file_size,
        'mime_type', mime_type,
        'bucket_id', bucket_id,
        'uploaded_at', uploaded_at,
        'is_temporary', is_temporary,
        'expires_at', expires_at,
        'metadata', metadata,
        'public_url', CASE 
            WHEN bucket_id = 'backgrounds' THEN 
                'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/' || bucket_id || '/' || storage_path
            ELSE NULL
        END
    ) INTO file_info
    FROM file_metadata
    WHERE storage_path = p_storage_path;
    
    RETURN file_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取背景图片列表的函数
CREATE OR REPLACE FUNCTION get_background_images(p_theme TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    images JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', original_name,
            'path', storage_path,
            'size', file_size,
            'uploaded_at', uploaded_at,
            'theme', COALESCE(metadata->>'theme', 'light'),
            'url', 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/backgrounds/' || storage_path
        )
    ) INTO images
    FROM file_metadata
    WHERE bucket_id = 'backgrounds'
    AND (p_theme IS NULL OR metadata->>'theme' = p_theme)
    ORDER BY uploaded_at DESC;
    
    RETURN COALESCE(images, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建定期清理任务的触发器
-- 注意：这需要pg_cron扩展，如果Supabase不支持，可以通过应用层定期调用
/*
-- 如果支持pg_cron，可以启用以下代码
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每小时清理一次过期的临时文件
SELECT cron.schedule('cleanup-temp-files', '0 * * * *', 'SELECT cleanup_expired_temp_files();');
*/

-- 创建手动触发清理的函数（推荐在应用层定期调用）
CREATE OR REPLACE FUNCTION schedule_cleanup()
RETURNS TEXT AS $$
DECLARE
    cleanup_result INTEGER;
BEGIN
    SELECT cleanup_expired_temp_files() INTO cleanup_result;
    RETURN 'Cleaned up ' || cleanup_result || ' expired temporary files';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予必要的权限
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON file_metadata TO anon, authenticated;
GRANT USAGE ON SEQUENCE file_metadata_id_seq TO anon, authenticated;

-- 插入一些示例背景图片记录（可选）
-- 注意：这些是示例记录，实际文件需要手动上传到存储桶
/*
INSERT INTO file_metadata (storage_path, original_name, file_size, mime_type, bucket_id, metadata) VALUES
('light/default-light.jpg', 'default-light.jpg', 1024000, 'image/jpeg', 'backgrounds', '{"theme": "light", "default": true}'),
('dark/default-dark.jpg', 'default-dark.jpg', 1024000, 'image/jpeg', 'backgrounds', '{"theme": "dark", "default": true}'),
('light/nature-1.jpg', 'nature-1.jpg', 2048000, 'image/jpeg', 'backgrounds', '{"theme": "light", "category": "nature"}'),
('dark/space-1.jpg', 'space-1.jpg', 2048000, 'image/jpeg', 'backgrounds', '{"theme": "dark", "category": "space"}');
*/

-- 完成存储配置
COMMENT ON SCHEMA storage IS 'ProjectNotes AI笔记应用存储配置 - 背景图片和文件上传';