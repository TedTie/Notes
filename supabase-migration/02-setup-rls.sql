-- ProjectNotes Supabase Row Level Security (RLS) 配置
-- 为所有表启用RLS并创建安全策略

-- 启用所有表的RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- 由于这是单用户应用，我们创建允许所有操作的策略
-- 在生产环境中，您可能需要根据实际需求调整这些策略

-- Notes表策略
CREATE POLICY "Allow all operations on notes" ON notes
    FOR ALL USING (true) WITH CHECK (true);

-- Todos表策略
CREATE POLICY "Allow all operations on todos" ON todos
    FOR ALL USING (true) WITH CHECK (true);

-- Chat History表策略
CREATE POLICY "Allow all operations on chat_history" ON chat_history
    FOR ALL USING (true) WITH CHECK (true);

-- Settings表策略
CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true) WITH CHECK (true);

-- Topics表策略
CREATE POLICY "Allow all operations on topics" ON topics
    FOR ALL USING (true) WITH CHECK (true);

-- Messages表策略
CREATE POLICY "Allow all operations on messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);

-- Projects表策略
CREATE POLICY "Allow all operations on projects" ON projects
    FOR ALL USING (true) WITH CHECK (true);

-- Tasks表策略
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL USING (true) WITH CHECK (true);

-- Pomodoro Sessions表策略
CREATE POLICY "Allow all operations on pomodoro_sessions" ON pomodoro_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- 创建用于API访问的服务角色策略
-- 这些策略允许服务角色（service_role）绕过RLS
CREATE POLICY "Service role bypass RLS on notes" ON notes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on todos" ON todos
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on chat_history" ON chat_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on settings" ON settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on topics" ON topics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on messages" ON messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on projects" ON projects
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on tasks" ON tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass RLS on pomodoro_sessions" ON pomodoro_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 如果您将来需要实现用户认证，可以使用以下模板策略：
/*
-- 基于用户认证的策略示例（当前注释掉）
CREATE POLICY "Users can only access their own notes" ON notes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 首先需要为表添加user_id列：
-- ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE todos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- 等等...
*/

-- 创建实时订阅的发布
-- 这允许前端实时接收数据库变更
-- 检查发布是否已存在，如果不存在则创建
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    END IF;
END $$;

-- 为实时功能启用表
-- 安全地添加表到发布，避免重复添加错误
DO $$
DECLARE
    table_names TEXT[] := ARRAY['notes', 'todos', 'chat_history', 'settings', 'topics', 'messages', 'projects', 'tasks', 'pomodoro_sessions'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- 检查表是否已经在发布中
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
        END IF;
    END LOOP;
END $$;

-- 创建一些有用的视图
-- 笔记统计视图
CREATE VIEW notes_stats AS
SELECT 
    COUNT(*) as total_notes,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as notes_this_week,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as notes_this_month
FROM notes;

-- 待办事项统计视图
CREATE VIEW todos_stats AS
SELECT 
    COUNT(*) as total_todos,
    COUNT(CASE WHEN is_completed = false THEN 1 END) as pending_todos,
    COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_todos,
    COUNT(CASE WHEN due_date < NOW() AND is_completed = false THEN 1 END) as overdue_todos
FROM todos;

-- 番茄钟统计视图
CREATE VIEW pomodoro_stats AS
SELECT 
    COUNT(*) as total_sessions,
    SUM(duration_minutes) as total_minutes,
    COUNT(CASE WHEN completed_at >= CURRENT_DATE THEN 1 END) as sessions_today,
    COUNT(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as sessions_this_week
FROM pomodoro_sessions
WHERE session_type = 'work';

-- 注意：视图不支持RLS策略，访问控制通过底层表的RLS策略实现
-- 视图会自动继承底层表的安全策略

-- 创建一些有用的函数
-- 获取最近的笔记
CREATE OR REPLACE FUNCTION get_recent_notes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id INTEGER,
    title VARCHAR(200),
    content TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.title, n.content, n.created_at, n.updated_at
    FROM notes n
    ORDER BY n.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取待办事项统计
CREATE OR REPLACE FUNCTION get_todo_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'completed', COUNT(CASE WHEN is_completed = true THEN 1 END),
        'pending', COUNT(CASE WHEN is_completed = false THEN 1 END),
        'overdue', COUNT(CASE WHEN due_date < NOW() AND is_completed = false THEN 1 END),
        'by_priority', json_build_object(
            'high', COUNT(CASE WHEN priority = 'high' AND is_completed = false THEN 1 END),
            'medium', COUNT(CASE WHEN priority = 'medium' AND is_completed = false THEN 1 END),
            'low', COUNT(CASE WHEN priority = 'low' AND is_completed = false THEN 1 END)
        )
    ) INTO result
    FROM todos;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 清理旧的聊天历史（可选）
CREATE OR REPLACE FUNCTION cleanup_old_chat_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_history 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予必要的权限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 完成RLS配置
COMMENT ON SCHEMA public IS 'ProjectNotes AI笔记应用数据库 - RLS已配置';