# Supabase SQL手动设置指南

由于service_role密钥无法直接执行某些DDL语句，需要在Supabase控制台中手动执行以下SQL语句。

## 🔧 操作步骤

### 1. 打开Supabase控制台
1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择项目：`vcgythhenulnwuindgyx`
4. 点击左侧菜单中的 **SQL Editor**

### 2. 执行以下SQL语句

请按顺序复制并执行以下SQL语句：

#### 步骤1：创建exec_sql函数
```sql
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- 执行动态SQL
    EXECUTE sql_query;
    
    -- 返回成功消息
    RETURN 'SQL executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        -- 返回错误信息
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤2：确保file_metadata表存在并具有正确结构
```sql
CREATE TABLE IF NOT EXISTS file_metadata (
    id SERIAL PRIMARY KEY,
    storage_path TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_temporary BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    metadata JSONB DEFAULT '{}'
);
```

#### 步骤3：启用行级安全性
```sql
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
```

#### 步骤4：创建RLS策略
```sql
CREATE POLICY IF NOT EXISTS "Allow all operations on file_metadata" 
ON file_metadata 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

#### 步骤5：创建索引
```sql
CREATE INDEX IF NOT EXISTS idx_file_metadata_bucket_name ON file_metadata(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_at ON file_metadata(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_expires_at ON file_metadata(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_metadata_is_temporary ON file_metadata(is_temporary) WHERE is_temporary = true;
```

#### 步骤6：授予权限
```sql
GRANT ALL ON file_metadata TO anon, authenticated;
GRANT USAGE ON SEQUENCE file_metadata_id_seq TO anon, authenticated;
```

#### 步骤7：创建清理函数
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_temp_files()
RETURNS INTEGER AS $$
DECLARE
    expired_file RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- 查找过期的临时文件
    FOR expired_file IN 
        SELECT storage_path, bucket_name 
        FROM file_metadata 
        WHERE is_temporary = true 
        AND expires_at < NOW()
    LOOP
        -- 从存储中删除文件
        DELETE FROM storage.objects 
        WHERE bucket_id = expired_file.bucket_name 
        AND name = expired_file.storage_path;
        
        -- 从元数据表中删除记录
        DELETE FROM file_metadata 
        WHERE storage_path = expired_file.storage_path;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤8：创建手动清理触发函数
```sql
CREATE OR REPLACE FUNCTION schedule_cleanup()
RETURNS TEXT AS $$
DECLARE
    cleanup_result INTEGER;
BEGIN
    SELECT cleanup_expired_temp_files() INTO cleanup_result;
    RETURN 'Cleaned up ' || cleanup_result || ' expired temporary files';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤9：创建文件上传记录函数
```sql
CREATE OR REPLACE FUNCTION record_file_upload(
    p_storage_path TEXT,
    p_original_name TEXT,
    p_file_size BIGINT,
    p_file_type TEXT,
    p_bucket_name TEXT,
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
        file_type,
        bucket_name,
        is_temporary,
        expires_at,
        metadata
    ) VALUES (
        p_storage_path,
        p_original_name,
        p_file_size,
        p_file_type,
        p_bucket_name,
        p_is_temporary,
        expires_time,
        p_metadata
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤10：创建获取文件信息函数
```sql
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
        'file_type', file_type,
        'bucket_name', bucket_name,
        'uploaded_at', uploaded_at,
        'is_temporary', is_temporary,
        'expires_at', expires_at,
        'metadata', metadata
    ) INTO file_info
    FROM file_metadata
    WHERE storage_path = p_storage_path;
    
    RETURN file_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤11：创建获取背景图片函数
```sql
CREATE OR REPLACE FUNCTION get_background_images(p_limit INTEGER DEFAULT 10)
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
            'metadata', metadata
        )
    ) INTO images
    FROM (
        SELECT *
        FROM file_metadata
        WHERE bucket_name = 'backgrounds'
        ORDER BY uploaded_at DESC
        LIMIT p_limit
    ) AS limited_results;
    
    RETURN COALESCE(images, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔍 验证设置

执行完所有SQL语句后，可以运行以下查询来验证设置：

```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables WHERE table_name = 'file_metadata';

-- 检查函数是否存在
SELECT proname FROM pg_proc WHERE proname IN ('exec_sql', 'cleanup_expired_temp_files', 'schedule_cleanup', 'record_file_upload', 'get_file_info', 'get_background_images');

-- 测试清理函数
SELECT schedule_cleanup();

-- 测试背景图片函数
SELECT get_background_images(5);
```

## ⚠️ 注意事项

1. **权限**：确保您有足够的权限在Supabase项目中执行这些SQL语句
2. **顺序**：请按照给定的顺序执行SQL语句
3. **错误处理**：如果某个语句执行失败，请检查错误信息并根据需要调整
4. **存储桶**：确保存储桶（backgrounds、uploads、temp）已经在Storage中创建

## 🎯 完成后的功能

设置完成后，您将拥有：
- ✅ 完整的文件元数据管理
- ✅ 自动临时文件清理
- ✅ 文件上传记录功能
- ✅ 背景图片管理
- ✅ 完整的数据库函数支持

执行完成后，请运行验证脚本确认所有功能正常工作。