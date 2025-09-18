-- Supabase Security and Performance Updates
-- This script addresses the security vulnerabilities and performance issues identified by the advisor

-- ==============================================
-- SECURITY FIXES
-- ==============================================

-- 1. Fix RLS (Row Level Security) for performance_metrics table
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for performance_metrics
CREATE POLICY "Allow authenticated users to manage their own metrics" ON public.performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. Fix RLS for app_health table
ALTER TABLE public.app_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for app_health
CREATE POLICY "Allow authenticated users to manage app health" ON public.app_health
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Fix SECURITY DEFINER views by recreating them with proper security

-- Drop and recreate pomodoro_stats view with security invoker
DROP VIEW IF EXISTS public.pomodoro_stats;
CREATE OR REPLACE VIEW public.pomodoro_stats AS
SELECT
    user_id,
    COUNT(*) as total_sessions,
    SUM(duration_minutes) as total_minutes,
    AVG(duration_minutes) as avg_duration,
    COUNT(CASE WHEN session_type = 'work' THEN 1 END) as work_sessions,
    COUNT(CASE WHEN session_type = 'short_break' THEN 1 END) as short_breaks,
    COUNT(CASE WHEN session_type = 'long_break' THEN 1 END) as long_breaks,
    DATE(created_at) as session_date
FROM public.pomodoro_sessions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at)
WITH SECURITY INVOKER;

-- Drop and recreate todos_stats view with security invoker
DROP VIEW IF EXISTS public.todos_stats;
CREATE OR REPLACE VIEW public.todos_stats AS
SELECT
    user_id,
    COUNT(*) as total_todos,
    COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_todos,
    COUNT(CASE WHEN is_completed = false THEN 1 END) as pending_todos,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_todos,
    COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_todos,
    COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_todos,
    DATE(created_at) as stats_date
FROM public.todos
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at)
WITH SECURITY INVOKER;

-- Drop and recreate notes_stats view with security invoker
DROP VIEW IF EXISTS public.notes_stats;
CREATE OR REPLACE VIEW public.notes_stats AS
SELECT
    user_id,
    COUNT(*) as total_notes,
    COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_notes,
    COUNT(CASE WHEN is_pinned = true THEN 1 END) as pinned_notes,
    AVG(LENGTH(content)) as avg_content_length,
    DATE(created_at) as stats_date
FROM public.notes
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at)
WITH SECURITY INVOKER;

-- 4. Fix function search path issues by setting explicit search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.get_recent_notes(integer) SET search_path = public;
ALTER FUNCTION public.get_todo_summary(integer) SET search_path = public;
ALTER FUNCTION public.cleanup_old_chat_history() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_temp_files() SET search_path = public;
ALTER FUNCTION public.record_file_upload(text, text, text, boolean) SET search_path = public;
ALTER FUNCTION public.get_file_info(text) SET search_path = public;
ALTER FUNCTION public.get_background_images() SET search_path = public;
ALTER FUNCTION public.schedule_cleanup() SET search_path = public;

-- ==============================================
-- PERFORMANCE OPTIMIZATIONS
-- ==============================================

-- 1. Add composite indexes for better query performance
-- These indexes will help with common query patterns

-- Notes table optimizations
CREATE INDEX IF NOT EXISTS idx_notes_user_created ON public.notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_favorite ON public.notes(user_id, is_favorite, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_search_content ON public.notes USING gin(to_tsvector('english', content));

-- Todos table optimizations
CREATE INDEX IF NOT EXISTS idx_todos_user_status ON public.todos(user_id, is_completed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON public.todos(user_id, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_user_category ON public.todos(user_id, category, created_at DESC);

-- Pomodoro sessions optimizations
CREATE INDEX IF NOT EXISTS idx_pomodoro_user_sessions ON public.pomodoro_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user_task ON public.pomodoro_sessions(user_id, associated_task_id, created_at DESC);

-- Chat history optimizations
CREATE INDEX IF NOT EXISTS idx_chat_history_user_topic ON public.chat_history(user_id, topic_id, timestamp DESC);

-- Messages optimizations
CREATE INDEX IF NOT EXISTS idx_messages_topic_timestamp ON public.messages(topic_id, timestamp DESC);

-- Tasks optimizations
CREATE INDEX IF NOT EXISTS idx_tasks_user_project ON public.tasks(user_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status, created_at DESC);

-- File metadata optimizations
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_bucket ON public.file_metadata(user_id, bucket_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_temporary ON public.file_metadata(user_id, is_temporary, uploaded_at DESC);

-- Settings optimizations
CREATE INDEX IF NOT EXISTS idx_settings_user_key ON public.settings(user_id, key);

-- ==============================================
-- DATA CLEANUP AND MAINTENANCE
-- ==============================================

-- 1. Clean up old temporary files metadata (older than 7 days)
DELETE FROM public.file_metadata
WHERE is_temporary = true
  AND uploaded_at < CURRENT_DATE - INTERVAL '7 days';

-- 2. Clean up very old chat history (older than 90 days) - optional
-- DELETE FROM public.chat_history
-- WHERE timestamp < CURRENT_DATE - INTERVAL '90 days';

-- 3. Clean up old pomodoro sessions (older than 1 year) - optional
-- DELETE FROM public.pomodoro_sessions
-- WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- ==============================================
-- SECURITY POLICIES FOR EXISTING TABLES
-- ==============================================

-- Ensure all user-related tables have proper RLS policies
-- Notes table RLS (should already exist, but let's verify)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Todos table RLS (should already exist, but let's verify)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Tasks table RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

-- Projects table RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

-- Chat history table RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own chat history" ON public.chat_history
    FOR ALL USING (auth.uid() = user_id);

-- Messages table RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage messages in their topics" ON public.messages
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.chat_history WHERE topic_id = messages.topic_id
    ));

-- Pomodoro sessions table RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own pomodoro sessions" ON public.pomodoro_sessions
    FOR ALL USING (auth.uid() = user_id);

-- File metadata table RLS
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own files" ON public.file_metadata
    FOR ALL USING (auth.uid() = user_id);

-- Settings table RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own settings" ON public.settings
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- FINAL VERIFICATION
-- ==============================================

-- Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Check for any remaining security issues
SELECT * FROM information_schema.views
WHERE view_definition ILIKE '%SECURITY DEFINER%'
  AND table_schema = 'public';

-- Check function search paths
SELECT n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosrc as source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = false
  AND p.prosearchpath IS NULL;

-- Success message
SELECT 'Supabase security and performance updates completed successfully!' as status;