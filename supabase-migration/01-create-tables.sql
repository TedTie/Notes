-- ProjectNotes Supabase Database Schema
-- 完整的数据库表结构迁移脚本

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 笔记表 (Notes)
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 待办事项表 (Todos)
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50) DEFAULT '默认',
    due_date TIMESTAMPTZ,
    source_note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 聊天历史表 (Chat History)
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 设置表 (Settings)
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'boolean', 'integer', 'float', 'json', 'encrypted')),
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 话题表 (Topics)
CREATE TABLE topics (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 消息表 (Messages)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 项目表 (Projects)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 任务表 (Tasks)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 番茄钟会话表 (Pomodoro Sessions)
CREATE TABLE pomodoro_sessions (
    id SERIAL PRIMARY KEY,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER NOT NULL,
    associated_task_id INTEGER REFERENCES todos(id) ON DELETE SET NULL,
    session_type VARCHAR(20) DEFAULT 'work' CHECK (session_type IN ('work', 'short_break', 'long_break'))
);

-- 创建索引以提高查询性能
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
CREATE INDEX idx_todos_is_completed ON todos(is_completed);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_category ON todos(category);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp DESC);
CREATE INDEX idx_messages_topic_id ON messages(topic_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_pomodoro_sessions_completed_at ON pomodoro_sessions(completed_at DESC);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新时间戳的表创建触发器
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认设置数据
INSERT INTO settings (key, value, setting_type) VALUES
('theme', 'auto', 'string'),
('language', 'zh-CN', 'string'),
('font_family', 'system-ui', 'string'),
('auto_save', 'true', 'boolean'),
('pomodoro_work_duration', '25', 'integer'),
('pomodoro_short_break', '5', 'integer'),
('pomodoro_long_break', '15', 'integer'),
('pomodoro_sessions_until_long_break', '4', 'integer'),
('ai_provider', 'openrouter', 'string'),
('ai_model', 'deepseek/deepseek-chat-v3.1:free', 'string'),
('ai_max_tokens', '1000', 'integer'),
('ai_temperature', '0.7', 'string')
ON CONFLICT (key) DO NOTHING;

-- 创建RLS策略的准备（后续步骤会详细配置）
COMMENT ON TABLE notes IS 'AI笔记应用的笔记表';
COMMENT ON TABLE todos IS 'AI笔记应用的待办事项表';
COMMENT ON TABLE chat_history IS 'AI聊天历史记录表';
COMMENT ON TABLE settings IS 'AI笔记应用的设置表';
COMMENT ON TABLE topics IS 'AI聊天话题表';
COMMENT ON TABLE messages IS 'AI聊天消息表';
COMMENT ON TABLE projects IS 'AI笔记应用的项目表';
COMMENT ON TABLE tasks IS 'AI笔记应用的任务表';
COMMENT ON TABLE pomodoro_sessions IS 'AI笔记应用的番茄钟会话表';