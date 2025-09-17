-- 修复notes表结构 - 添加缺失的列
-- 请在Supabase SQL编辑器中执行以下语句

-- 1. 添加category列
ALTER TABLE notes ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. 添加tags列
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3. 添加is_favorite列
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 4. 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 测试插入数据
INSERT INTO notes (title, content, category, tags, is_favorite)
VALUES ('测试笔记', '这是一个测试笔记', 'test', ARRAY['测试', 'Supabase'], false)
RETURNING *;

-- 6. 清理测试数据（可选）
-- DELETE FROM notes WHERE title = '测试笔记';