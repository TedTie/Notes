// 语言配置
const translations = {
  'zh-CN': {
    // 通用
    'save': '保存',
    'cancel': '取消',
    'delete': '删除',
    'edit': '编辑',
    'create': '创建',
    'search': '搜索',
    'settings': '设置',
    'help': '帮助',
    'loading': '加载中...',
    'processing': '处理中...',
    'success': '成功',
    'error': '错误',
    'warning': '警告',
    'info': '提示',
    'confirm': '确认',
    'close': '关闭',
    'back': '返回',
    'next': '下一步',
    'previous': '上一步',
    'finish': '完成',
    
    // 导航和页面标题
    'notes': '智能笔记',
    'todos': '待办事项',
    'audio': '音频分析',
    'settings': '系统设置',
    'ai_assistant': 'AI智能助手',
    'workspace': 'AI工作空间',
    'future_tech': '未来科技',
    'smart_experience': '智能体验',
    
    // 加载屏幕
    'loading_title': 'AI工作空间',
    'loading_subtitle': '未来科技，智能体验',
    'loading_message': '正在加载您的AI助手...',
    
    // 笔记相关
    'note_title': '笔记标题',
    'note_content': '笔记内容',
    'create_note': '创建新笔记',
    'update_note': '更新笔记',
    'delete_note': '删除笔记',
    'no_notes': '暂无笔记',
    'note_created': '笔记创建成功',
    'note_updated': '笔记更新成功',
    'note_deleted': '笔记删除成功',
    'note_empty': '笔记内容为空',
    'note_placeholder': '开始记录您的想法...',
    'ai_assisted_writing': 'AI辅助写作',
    'smart_suggestions': '智能建议',
    'format_text': '格式化文本',
    
    // 待办事项
    'todo_title': '待办标题',
    'todo_description': '待办描述',
    'create_todo': '创建新待办',
    'mark_complete': '标记为已完成',
    'mark_incomplete': '标记为未完成',
    'priority': '优先级',
    'category': '分类',
    'due_date': '截止日期',
    'no_todos': '暂无待办事项',
    'todo_created': '待办创建成功',
    'todo_updated': '待办更新成功',
    'todo_deleted': '待办删除成功',
    'high_priority': '高优先级',
    'medium_priority': '中优先级',
    'low_priority': '低优先级',
    'all_categories': '全部分类',
    'work': '工作',
    'personal': '个人',
    'study': '学习',
    'health': '健康',
    'other': '其他',
    
    // 音频分析
    'audio_analysis': '音频分析',
    'upload_audio': '上传音频文件',
    'drag_drop_audio': '拖拽音频文件到此处',
    'or_click_to_upload': '或点击上传',
    'supported_formats': '支持格式：MP3, WAV, M4A, FLAC',
    'max_file_size': '最大文件大小：50MB',
    'transcribe_audio': '转录音频',
    'transcript': '转录文本',
    'analyze_content': '分析内容',
    'audio_file': '音频文件',
    'duration': '时长',
    'processing': '处理中',
    'processing_audio': '正在处理音频...',
    'transcription_complete': '转录完成',
    'analysis_complete': '分析完成',
    'download_transcript': '下载转录文本',
    'copy_transcript': '复制转录文本',
    
    // 设置相关
    'general_settings': '通用设置',
    'appearance_settings': '外观设置',
    'ai_settings': 'AI设置',
    'data_management': '数据管理',
    'language': '语言',
    'theme': '主题',
    'font_size': '字体大小',
    'font_family': '字体族',
    'auto_save': '自动保存',
    'enable_auto_save': '启用自动保存',
    'auto_save_interval': '自动保存间隔（秒）',
    'auto_save_enabled': '自动保存已启用',
    'auto_saving': '正在保存...',
    'auto_saved': '已自动保存',
    'auto_save_error': '保存失败',
    'just_now': '刚刚',
    'minutes_ago': '{0}分钟前',
    'hours_ago': '{0}小时前',
    'notifications': '通知',
    'enable_notifications': '启用桌面通知',
    'sounds': '声音',
    'enable_sounds': '启用提示音',
    'save_settings': '保存设置',
     'reset_settings': '重置设置',
     'settings_saved': '设置已保存',
     'settings_saved_success': '设置保存成功',
     'settings_save_failed': '设置保存失败',
     'settings_reset_success': '设置已重置',
     'reset_options': '重置选项',
     'factory_reset': '恢复出厂设置',
     'reset_to_original_success': '已恢复到保存前的设置',
      'no_original_settings': '没有可恢复的原始设置',
     'confirm_factory_reset': '确定要恢复出厂设置吗？这将清除所有自定义配置，此操作不可撤销！',
     'factory_reset_success': '已恢复出厂设置',
     'factory_reset_failed': '恢复出厂设置失败',
     'general': '通用',
    'appearance': '外观',
    'ai': 'AI',
    'data': '数据',
    
    // 主题设置
    'dark_theme': '深色主题',
    'light_theme': '浅色主题',
    'auto_theme': '跟随系统',
    'cyberpunk_style': '赛博朋克风格的深色界面',
    'bright_clean_style': '简洁明亮的浅色界面',
    'system_auto_style': '根据系统设置自动切换',
    
    // 字体设置
    'orbitron_font': 'Orbitron (赛博朋克)',
    'fira_code_font': 'Fira Code (编程字体)',
    'system_font': '系统默认',
    
    // AI设置
    'ai_provider': 'AI提供商',
    'api_key': 'API密钥',
    'model': '模型',
    'connect': '连接',
    'disconnect': '断开连接',
    'test_connection': '测试连接',
    'connection_success': '连接成功',
    'connection_failed': '连接失败',
    'openrouter_provider': 'OpenRouter',

    'gpt5_model': 'GPT-5 Chat',
    'claude_model': 'Claude Sonnet 4',
    'deepseek_model': 'Deepseek',
    'gemini_model': 'Gemini',
    'provider_description': '支持多种AI模型的统一接口',

    'current_ai': '当前活跃AI',
    'using_provider': '当前使用',
    'set_as_default': '设为默认',
    
    // 数据管理
    'export_data': '导出数据',
    'import_data': '导入数据',
    'clear_data': '清除数据',
    'data_exported': '数据已导出',
    'data_cleared': '数据已清除',
    'confirm_clear': '确定要清除所有数据吗？此操作不可恢复！',
    'backup_file': '备份文件',
    'last_export': '最后导出',
    'never_exported': '从未',
    'export_all_data': '导出所有数据',
    'danger_zone': '危险区域',
    'clear_all_data': '清除所有数据',
    
    // 通知消息
    'operation_success': '操作成功',
    'operation_failed': '操作失败',
    'loading_data': '正在加载数据...',
    'saving_data': '正在保存数据...',
    'data_loaded': '数据加载完成',
    'data_saved': '数据保存完成',
    'api_key_required': '请先输入API密钥',
    'invalid_input': '输入无效',
    'network_error': '网络错误',
    'server_error': '服务器错误',
    
    // 帮助和关于
    'help_docs': '帮助文档',
    'github_repo': 'GitHub仓库',
    'about_app': '关于应用',
    'app_name': 'AI智能笔记本',
    'app_version': '版本 1.0.0',
    'app_description': '一个集成了先进AI功能的现代化笔记应用，支持智能写作辅助、智能待办管理和音频内容分析，为您的工作和学习提供全方位的智能支持。',
    'developer': '开发者',
    'tech_stack': '技术栈',
    'license': '许可证',
    'mit_license': 'MIT许可证',
    
    // 新增翻译键
    'confirm_delete_note': '确定要删除这条笔记吗？',
    'confirm_delete_todo': '确定要删除这个待办事项吗？',
    'select_audio_file': '请选择音频文件',
    'file_size_limit': '文件大小不能超过50MB',
    'copied_to_clipboard': '已复制到剪贴板',
    'note_deleted_success': '笔记删除成功！',
    'create_note_failed': '创建笔记失败，请检查网络连接',
    'no_matching_notes': '未找到匹配的笔记',
    'create_first_note': '暂无笔记，点击 ➕ 创建第一条笔记',
    'start_writing_placeholder': '开始写作你的想法...',
    'search_notes_placeholder': '搜索笔记...',
    'note_title_placeholder': '输入笔记标题...',
    'start_writing_content_placeholder': '开始写作...',
    'untitled_note': '无标题笔记',
    'smart_search': '智能搜索',
    'ai_helper': 'AI助手',
    'life': '生活',
    'project': '项目',
    
    // 主题和界面设置
    'dark_theme_cyber': '赛博朋克风格的深色界面',
    'light_theme_clean': '简洁明亮的浅色界面',
    'auto_theme_system': '根据系统设置自动切换',
    'orbitron_font_cyber': 'Orbitron (赛博朋克)',
    'fira_code_programming': 'Fira Code (编程字体)',
    'system_font_default': '系统默认',
    'openrouter_provider_desc': '支持多种AI模型的统一接口',

    'confirm_clear_data': '确定要清除所有数据吗？此操作不可恢复！',
    'api_connection_success': 'API连接成功',
    'api_disconnection_success': 'API已断开连接',
    'settings_reset_success': '设置已重置',
    'settings_save_success': '设置保存成功',
    'loading_text': '加载中...',
    'all_categories': '全部分类',
    'pending_todos': '待完成',
    'completed_todos': '已完成',
    'chinese_simplified': '简体中文',
    'english': 'English',
    'characters': '字符',
    'start_your_creation': '开始你的创作',
    'select_note_or_create_new': '选择一条笔记开始编辑，或创建全新的内容',
    
    // Todo List specific translations
    'total_tasks': '总计任务',
    'pending': '待完成',
    'completed': '已完成',
    'completion_rate': '完成率',
    'create_new_task': '创建新任务',
    'add_your_todos': '添加你的待办事项',
    'enter_task_title': '输入任务标题',
    'add_task_description_optional': '添加任务描述（可选）',
    'add_task': '添加任务',
    'ai_smart_generate': 'AI智能生成',
    'ai_smart_assistant': 'AI智能助手',
    'let_ai_help_plan_tasks': '让AI帮你规划任务',
    'describe_your_tasks_or_goals': '描述你想要完成的任务或目标',
    'example_prepare_presentation': '例如：为下周的项目演示做准备，包括PPT制作、数据整理等',
    'generating': '生成中',
    'generate_tasks': '生成任务',
    'clear': '清空',
    'ai_generated_todos': 'AI生成的待办事项',
    'all_categories': '所有分类',
    'no_tasks': '暂无任务',
    'add_new_todo_start_manage': '添加一个新的待办事项开始管理你的任务',
    'create_first_task': '创建第一个任务',
    'delete_task': '删除任务',
    'start_focus_session': '开始专注',
    
    // Error messages
    'create_todo_failed': '创建待办事项失败，请重试',
    'ai_generation_failed': 'AI生成待办事项失败，请重试',
    'add_todo_failed': '添加待办事项失败，请重试',
    'update_todo_failed': '更新待办事项失败，请重试',
    'delete_todo_failed': '删除待办事项失败，请重试',
    'confirm_delete_todo': '确定要删除这个待办事项吗？',
    
    // 设置页面专用
    'system_settings': '系统设置',
    'configure_ai_notebook': '配置您的AI笔记本',
    'language_region': '语言和地区',
    'interface_language': '界面语言',
    'auto_save': '自动保存',
    'enable_auto_save': '启用自动保存',
    'auto_save_interval_seconds': '自动保存间隔（秒）',
    'notification_settings': '通知设置',
    'enable_desktop_notifications': '启用桌面通知',
    'enable_sound_effects': '启用提示音',
    'theme_selection': '主题选择',
    'font_settings': '字体设置',
    'font_family': '字体族',
    'font_size_px': '字体大小: {size}px',
    'api_key': 'API密钥',
    'enter_api_key_placeholder': '请输入{provider}的API密钥',
    'ai_model': 'AI模型',
    'connect_api': '连接API',
    'disconnect_api': '断开连接',
    'currently_using': '当前使用',
    'set_as_default': '设为默认',
    'current_active_ai': '当前活跃AI',
    'model_colon': '模型: {model}',
    'data_export': '数据导出',
    'export_all_data_info': '导出您的所有数据，包括笔记、待办事项和设置配置。数据将以JSON格式保存，便于备份和迁移。',
    'export_data_btn': '导出数据',
    'last_export_never': '最后导出: 从未',
    'danger_zone': '危险区域',
    'clear_all_data_warning': '此操作将永久删除您的所有笔记、待办事项、音频分析记录和设置配置。此操作无法撤销，请谨慎操作。',
    'clear_all_data_btn': '清除所有数据',
    'ai_smart_notebook': 'AI智能笔记本',
    'version': '版本',
    'app_description_full': '一个集成了先进AI功能的现代化笔记应用，支持智能写作辅助、智能待办管理和音频内容分析，为您的工作和学习提供全方位的智能支持。',
    'developer': '开发者',
    'tech_stack': '技术栈',
    'license': '许可证',
    'help_docs': '帮助文档',
    'github_repo': 'GitHub仓库',
    'settings_reset': '重置设置',
    'settings_save': '保存设置',
    'loading_failed': '加载设置失败',
    'saving_failed': '保存设置失败',
    'resetting_failed': '重置设置失败',
    'data_export_failed': '数据导出失败',
    'data_clear_failed': '数据清除失败',
    'api_key_required_first': '请先输入API密钥',
    'api_test_failed': 'API测试失败',
    'connected': '已连接',
    'disconnected': '未连接',
    'connecting': '连接中...',
    'resetting': '重置中...',
    'saving': '保存中...',
    
    // 背景管理相关
    'confirm_delete_background': '确定要删除这个背景文件吗？',
    'background_delete_success': '背景文件删除成功',
    'background_delete_failed': '删除背景文件失败',
    'background_save_success': '背景设置保存成功',
    'background_save_failed': '保存背景设置失败',
    'file_upload_failed': '文件上传失败',
    'delete_failed': '删除失败',
    'save_failed': '保存失败'
  },
  
  'en-US': {
    // Common
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'create': 'Create',
    'search': 'Search',
    'settings': 'Settings',
    'help': 'Help',
    'loading': 'Loading...',
    'processing': 'Processing...',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    'info': 'Info',
    'confirm': 'Confirm',
    'close': 'Close',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'finish': 'Finish',
    
    // Navigation and page titles
    'notes': 'Smart Notes',
    'todos': 'Todo List',
    'audio': 'Audio Analysis',
    'settings': 'System Settings',
    'ai_assistant': 'AI Smart Assistant',
    'workspace': 'AI Workspace',
    'future_tech': 'Future Technology',
    'smart_experience': 'Smart Experience',
    
    // Loading screen
    'loading_title': 'AI Workspace',
    'loading_subtitle': 'Future Technology, Smart Experience',
    'loading_message': 'Loading your AI assistant...',
    
    // Notes
    'note_title': 'Note Title',
    'note_content': 'Note Content',
    'create_note': 'Create New Note',
    'update_note': 'Update Note',
    'delete_note': 'Delete Note',
    'no_notes': 'No notes yet',
    'note_created': 'Note created successfully',
    'note_updated': 'Note updated successfully',
    'note_deleted': 'Note deleted successfully',
    'note_empty': 'Note content is empty',
    'note_placeholder': 'Start recording your thoughts...',
    'ai_assisted_writing': 'AI-Assisted Writing',
    'smart_suggestions': 'Smart Suggestions',
    'format_text': 'Format Text',
    
    // Todos
    'todo_title': 'Todo Title',
    'todo_description': 'Todo Description',
    'create_todo': 'Create New Todo',
    'mark_complete': 'Mark as Complete',
    'mark_incomplete': 'Mark as Incomplete',
    'priority': 'Priority',
    'category': 'Category',
    'due_date': 'Due Date',
    'no_todos': 'No todos yet',
    'todo_created': 'Todo created successfully',
    'todo_updated': 'Todo updated successfully',
    'todo_deleted': 'Todo deleted successfully',
    'high_priority': 'High Priority',
    'medium_priority': 'Medium Priority',
    'low_priority': 'Low Priority',
    'all_categories': 'All Categories',
    'work': 'Work',
    'personal': 'Personal',
    'study': 'Study',
    'health': 'Health',
    'other': 'Other',
    
    // Audio analysis
    'audio_analysis': 'Audio Analysis',
    'upload_audio': 'Upload Audio File',
    'drag_drop_audio': 'Drag and drop audio files here',
    'or_click_to_upload': 'or click to upload',
    'supported_formats': 'Supported formats: MP3, WAV, M4A, FLAC',
    'max_file_size': 'Max file size: 50MB',
    'transcribe_audio': 'Transcribe Audio',
    'transcript': 'Transcript',
    'analyze_content': 'Analyze Content',
    'audio_file': 'Audio File',
    'duration': 'Duration',
    'processing': 'Processing',
    'processing_audio': 'Processing audio...',
    'transcription_complete': 'Transcription complete',
    'analysis_complete': 'Analysis complete',
    'download_transcript': 'Download transcript',
    'copy_transcript': 'Copy transcript',
    
    // Audio analysis results
    'audio.results.transcription.title': 'Transcription Results',
    'audio.results.transcription.filename': 'transcription',
    'audio.results.analysis.title': 'AI Analysis Results',
    'audio.results.analysis.subtitle': 'AI-powered insights from your audio content',
    'audio.results.analysis.filename': 'analysis_report',
    'audio.results.summary.title': 'Summary',
    'audio.results.keywords.title': 'Keywords',
    'audio.results.actionItems.title': 'Action Items',
    'audio.results.actionItems.addToTodo': 'Add to Todo',
    'audio.results.actionItems.category': 'AI Generated',
    'audio.results.sentiment.title': 'Sentiment Analysis',
    'audio.results.sentiment.positive': 'Positive',
    'audio.results.sentiment.negative': 'Negative',
    'audio.results.sentiment.neutral': 'Neutral',
    'audio.results.sentiment.mixed': 'Mixed',
    'audio.results.sentiment.unknown': 'Unknown',
    'audio.results.meetingNotes.title': 'Meeting Notes',
    'audio.results.meetingNotes.saveAsNote': 'Save as Note',
    'audio.results.meetingNotes.saveSuccess': 'Meeting notes saved successfully!',
    'audio.results.meetingNotes.saveFailed': 'Failed to save meeting notes',
    'audio.results.actions.title': 'Actions',
    'audio.results.actions.subtitle': 'Export, share, or start a new analysis',
    'audio.results.actions.downloadTranscription': 'Download Transcript',
    'audio.results.actions.downloadAnalysis': 'Download Analysis',
    'audio.results.actions.shareResults': 'Share Results',
    'audio.results.actions.newAnalysis': 'New Analysis',
    'audio.results.share.title': 'Audio Analysis',
    'audio.results.share.summary': 'Summary',
    'audio.results.share.keywords': 'Keywords',
    'audio.results.share.shareTitle': 'Audio Analysis Results',
    'audio.results.note.title': 'Audio Analysis',
    'audio.results.note.category': 'Audio Analysis',
    'audio.results.note.transcription': 'Transcription',
    'audio.results.note.summary': 'Summary',
    'audio.results.note.keywords': 'Keywords',
    'audio.results.note.actionItems': 'Action Items',
    'audio.results.note.sentiment': 'Sentiment',
    'audio.results.note.meetingNotes': 'Meeting Notes',
    
    // Audio processing steps
    'audio.processing.title': 'Processing Audio',
    'audio.processing.subtitle': 'Please wait while we analyze your audio',
    'audio.processing.steps.upload.title': 'Uploading',
    'audio.processing.steps.upload.description': 'Uploading audio file to server',
    'audio.processing.steps.transcription.title': 'Transcription',
    'audio.processing.steps.transcription.description': 'Converting speech to text',
    'audio.processing.steps.analysis.title': 'Analysis',
    'audio.processing.steps.analysis.description': 'Analyzing content with AI',
    'audio.processing.steps.report.title': 'Report',
    'audio.processing.steps.report.description': 'Generating comprehensive report',
    
    // Audio validation
    'audio.validation.invalidFileType': 'Please select a valid audio file',
    'audio.validation.fileSizeLimit': 'File size cannot exceed 50MB',
    
    // Audio errors
    'audio.errors.uploadFailed': 'Failed to upload audio file',
    'audio.errors.transcriptionFailed': 'Failed to transcribe audio',
    'audio.errors.analysisFailed': 'Failed to analyze audio',
    'audio.errors.analysisFailedWithMessage': 'Analysis failed: {message}',
    
    // Audio history
    'audio.history.title': 'Analysis History',
    'audio.history.deleteConfirm': 'Are you sure you want to delete this analysis?',
    'audio.history.deleteFailed': 'Failed to delete analysis',
    'audio.history.empty.title': 'No Analysis History',
    'audio.history.empty.subtitle': 'Upload and analyze your first audio file to see it here',
    
    // Audio workflow
    'audio.analysis.workflow.title': 'Audio Analysis Workflow',
    'audio.analysis.workflow.subtitle': 'Upload, transcribe, and analyze audio content with AI',
    
    // Audio upload
    'audio.upload.drag.title': 'Drag & Drop Audio Files',
    'audio.upload.drag.subtitle': 'Supports MP3, WAV, M4A, FLAC - Max 50MB',
    'audio.upload.selectFile': 'Select File',
    'audio.upload.clear': 'Clear',
    
    // Settings
    'general_settings': 'General Settings',
    'appearance_settings': 'Appearance Settings',
    'ai_settings': 'AI Settings',
    'data_management': 'Data Management',
    'language': 'Language',
    'theme': 'Theme',
    'font_size': 'Font Size',
    'font_family': 'Font Family',
    'auto_save': 'Auto Save',
    'enable_auto_save': 'Enable Auto Save',
    'auto_save_interval': 'Auto Save Interval (seconds)',
    'auto_save_enabled': 'Auto Save Enabled',
    'auto_saving': 'Saving...',
    'auto_saved': 'Auto Saved',
    'auto_save_error': 'Save Failed',
    'just_now': 'Just now',
    'minutes_ago': '{0} minutes ago',
    'hours_ago': '{0} hours ago',
    'notifications': 'Notifications',
    'enable_notifications': 'Enable Desktop Notifications',
    'sounds': 'Sounds',
    'enable_sounds': 'Enable Sound Effects',
    'save_settings': 'Save Settings',
    'reset_settings': 'Reset Settings',
    'settings_saved': 'Settings saved',
    'settings_saved_success': 'Settings saved successfully',
    'settings_save_failed': 'Failed to save settings',
    'settings_reset': 'Settings reset',
    'reset_options': 'Reset Options',
    'factory_reset': 'Factory Reset',
    'reset_to_original_success': 'Settings restored to pre-save state',
    'no_original_settings': 'No original settings to restore',
    'confirm_factory_reset': 'Are you sure you want to restore factory settings? This will clear all custom configurations and cannot be undone!',
    'factory_reset_success': 'Factory settings restored successfully',
    'factory_reset_failed': 'Failed to restore factory settings',
    'general': 'General',
    'appearance': 'Appearance',
    'ai': 'AI',
    'data': 'Data',
    
    // Theme settings
    'dark_theme': 'Dark Theme',
    'light_theme': 'Light Theme',
    'auto_theme': 'Auto System',
    'cyberpunk_style': 'Cyberpunk-style dark interface',
    'bright_clean_style': 'Bright and clean light interface',
    'system_auto_style': 'Automatically switch based on system settings',
    
    // Font settings
    'orbitron_font': 'Orbitron (Cyberpunk)',
    'fira_code_font': 'Fira Code (Programming Font)',
    'system_font': 'System Default',
    
    // AI settings
    'ai_provider': 'AI Provider',
    'api_key': 'API Key',
    'model': 'Model',
    'connect': 'Connect',
    'disconnect': 'Disconnect',
    'test_connection': 'Test Connection',
    'connection_success': 'Connection successful',
    'connection_failed': 'Connection failed',
    'openrouter_provider': 'OpenRouter',

    'gpt5_model': 'GPT-5 Chat',
    'claude_model': 'Claude Sonnet 4',
    'deepseek_model': 'Deepseek',
    'gemini_model': 'Gemini',
    'provider_description': 'Unified interface supporting multiple AI models',

    'current_ai': 'Current Active AI',
    'using_provider': 'Currently Using',
    'set_as_default': 'Set as Default',
    
    // Data management
    'export_data': 'Export Data',
    'import_data': 'Import Data',
    'clear_data': 'Clear Data',
    'data_exported': 'Data exported',
    'data_cleared': 'Data cleared',
    'confirm_clear': 'Are you sure you want to clear all data? This cannot be undone!',
    'backup_file': 'Backup File',
    'last_export': 'Last Export',
    'never_exported': 'Never',
    'export_all_data': 'Export All Data',
    'danger_zone': 'Danger Zone',
    'clear_all_data': 'Clear All Data',
    
    // Notification messages
    'operation_success': 'Operation successful',
    'operation_failed': 'Operation failed',
    'loading_data': 'Loading data...',
    'saving_data': 'Saving data...',
    'data_loaded': 'Data loaded',
    'data_saved': 'Data saved',
    'api_key_required': 'Please enter API key first',
    'invalid_input': 'Invalid input',
    'network_error': 'Network error',
    'server_error': 'Server error',
    
    // Help and about
    'help_docs': 'Help Documentation',
    'github_repo': 'GitHub Repository',
    'about_app': 'About App',
    'app_name': 'AI Smart Notebook',
    'app_version': 'Version 1.0.0',
    'app_description': 'A modern note-taking app with advanced AI capabilities, supporting intelligent writing assistance, smart todo management, and audio content analysis, providing comprehensive intelligent support for your work and study.',
    'developer': 'Developer',
    'tech_stack': 'Tech Stack',
    'license': 'License',
    'mit_license': 'MIT License',
    
    // 主题和界面设置
    'dark_theme_cyber': 'Cyberpunk-style dark interface',
    'light_theme_clean': 'Bright and clean light interface',
    'auto_theme_system': 'Automatically switch based on system settings',
    'orbitron_font_cyber': 'Orbitron (Cyberpunk)',
    'fira_code_programming': 'Fira Code (Programming Font)',
    'system_font_default': 'System Default',
    'openrouter_provider_desc': 'Unified interface supporting multiple AI models',

    
    // Audio analysis results
    'audio.results.transcription.title': 'Transcription Results',
    'audio.results.transcription.filename': 'transcription',
    'audio.results.analysis.title': 'AI Analysis Results',
    'audio.results.analysis.subtitle': 'AI-powered insights from your audio content',
    'audio.results.analysis.filename': 'analysis_report',
    'audio.results.summary.title': 'Summary',
    'audio.results.keywords.title': 'Keywords',
    'audio.results.actionItems.title': 'Action Items',
    'audio.results.actionItems.addToTodo': 'Add to Todo',
    'audio.results.actionItems.category': 'AI Generated',
    'audio.results.sentiment.title': 'Sentiment Analysis',
    'audio.results.sentiment.positive': 'Positive',
    'audio.results.sentiment.negative': 'Negative',
    'audio.results.sentiment.neutral': 'Neutral',
    'audio.results.sentiment.mixed': 'Mixed',
    'audio.results.sentiment.unknown': 'Unknown',
    'audio.results.meetingNotes.title': 'Meeting Notes',
    'audio.results.meetingNotes.saveAsNote': 'Save as Note',
    'audio.results.meetingNotes.saveSuccess': 'Meeting notes saved successfully!',
    'audio.results.meetingNotes.saveFailed': 'Failed to save meeting notes',
    'audio.results.actions.title': 'Actions',
    'audio.results.actions.subtitle': 'Export, share, or start a new analysis',
    'audio.results.actions.downloadTranscription': 'Download Transcript',
    'audio.results.actions.downloadAnalysis': 'Download Analysis',
    'audio.results.actions.shareResults': 'Share Results',
    'audio.results.actions.newAnalysis': 'New Analysis',
    'audio.results.share.title': 'Audio Analysis',
    'audio.results.share.summary': 'Summary',
    'audio.results.share.keywords': 'Keywords',
    'audio.results.share.shareTitle': 'Audio Analysis Results',
    'audio.results.note.title': 'Audio Analysis',
    'audio.results.note.category': 'Audio Analysis',
    'audio.results.note.transcription': 'Transcription',
    'audio.results.note.summary': 'Summary',
    'audio.results.note.keywords': 'Keywords',
    'audio.results.note.actionItems': 'Action Items',
    'audio.results.note.sentiment': 'Sentiment',
    'audio.results.note.meetingNotes': 'Meeting Notes',
    
    // Audio processing steps
    'audio.processing.title': 'Processing Audio',
    'audio.processing.subtitle': 'Please wait while we analyze your audio',
    'audio.processing.steps.upload.title': 'Uploading',
    'audio.processing.steps.upload.description': 'Uploading audio file to server',
    'audio.processing.steps.transcription.title': 'Transcription',
    'audio.processing.steps.transcription.description': 'Converting speech to text',
    'audio.processing.steps.analysis.title': 'Analysis',
    'audio.processing.steps.analysis.description': 'Analyzing content with AI',
    'audio.processing.steps.report.title': 'Report',
    'audio.processing.steps.report.description': 'Generating comprehensive report',
    
    // Audio validation
    'audio.validation.invalidFileType': 'Please select a valid audio file',
    'audio.validation.fileSizeLimit': 'File size cannot exceed 50MB',
    
    // Audio errors
    'audio.errors.uploadFailed': 'Failed to upload audio file',
    'audio.errors.transcriptionFailed': 'Failed to transcribe audio',
    'audio.errors.analysisFailed': 'Failed to analyze audio',
    'audio.errors.analysisFailedWithMessage': 'Analysis failed: {message}',
    
    // Audio history
    'audio.history.title': 'Analysis History',
    'audio.history.deleteConfirm': 'Are you sure you want to delete this analysis?',
    'audio.history.deleteFailed': 'Failed to delete analysis',
    'audio.history.empty.title': 'No Analysis History',
    'audio.history.empty.subtitle': 'Upload and analyze your first audio file to see it here',
    
    // Audio workflow
    'audio.analysis.workflow.title': 'Audio Analysis Workflow',
    'audio.analysis.workflow.subtitle': 'Upload, transcribe, and analyze audio content with AI',
    
    // Audio upload
    'audio.upload.drag.title': 'Drag & Drop Audio Files',
    'audio.upload.drag.subtitle': 'Supports MP3, WAV, M4A, FLAC - Max 50MB',
    'audio.upload.selectFile': 'Select File',
    'audio.upload.clear': 'Clear',
    
    // New translations
    'confirm_delete_note': 'Are you sure you want to delete this note?',
    'confirm_delete_todo': 'Are you sure you want to delete this todo item?',
    'select_audio_file': 'Please select an audio file',
    'file_size_limit': 'File size cannot exceed 50MB',
    'copied_to_clipboard': 'Copied to clipboard',
    'note_deleted_success': 'Note deleted successfully!',
    'create_note_failed': 'Failed to create note, please check network connection',
    'no_matching_notes': 'No matching notes found',
    'create_first_note': 'No notes yet, click ➕ to create your first note',
    'start_writing_placeholder': 'Start writing your thoughts...',
    'search_notes_placeholder': 'Search notes...',
    'note_title_placeholder': 'Enter note title...',
    'start_writing_content_placeholder': 'Start writing...',
    'untitled_note': 'Untitled Note',
    'smart_search': 'Smart Search',
    'ai_helper': 'AI Helper',
    'life': 'Life',
    'project': 'Project',
    'characters': 'characters',
    'start_your_creation': 'Start Your Creation',
    'select_note_or_create_new': 'Select a note to start editing, or create new content',
    
    // Todo List specific translations
    'total_tasks': 'Total Tasks',
    'pending': 'Pending',
    'completed': 'Completed',
    'completion_rate': 'Completion Rate',
    'create_new_task': 'Create New Task',
    'add_your_todos': 'Add Your Todos',
    'enter_task_title': 'Enter Task Title',
    'add_task_description_optional': 'Add Task Description (Optional)',
    'add_task': 'Add Task',
    'ai_smart_generate': 'AI Smart Generate',
    'ai_smart_assistant': 'AI Smart Assistant',
    'let_ai_help_plan_tasks': 'Let AI Help Plan Tasks',
    'describe_your_tasks_or_goals': 'Describe the tasks or goals you want to complete',
    'example_prepare_presentation': 'Example: Prepare for next week\'s project presentation, including PPT creation and data organization',
    'generating': 'Generating',
    'generate_tasks': 'Generate Tasks',
    'clear': 'Clear',
    'ai_generated_todos': 'AI Generated Todos',
    'all_categories': 'All Categories',
    'no_tasks': 'No Tasks',
    'add_new_todo_start_manage': 'Add a new todo to start managing your tasks',
    'create_first_task': 'Create First Task',
    'delete_task': 'Delete Task',
    'start_focus_session': 'Start Focus',
    
    // Error messages
    'create_todo_failed': 'Failed to create todo, please try again',
    'ai_generation_failed': 'AI failed to generate todos, please try again',
    'add_todo_failed': 'Failed to add todo, please try again',
    'update_todo_failed': 'Failed to update todo, please try again',
    'delete_todo_failed': 'Failed to delete todo, please try again',
    'confirm_delete_todo': 'Are you sure you want to delete this todo item?',
    
    // Language names
    'chinese_simplified': '简体中文',
    'english': 'English',
    
    // 背景管理相关
    'confirm_delete_background': 'Are you sure you want to delete this background file?',
    'background_delete_success': 'Background file deleted successfully',
    'background_delete_failed': 'Failed to delete background file',
    'background_save_success': 'Background settings saved successfully',
    'background_save_failed': 'Failed to save background settings',
    'file_upload_failed': 'File upload failed',
    'delete_failed': 'Delete failed',
    'save_failed': 'Save failed'
  }
};

class LanguageService {
  constructor() {
    this.currentLanguage = 'zh-CN';
    this.translations = translations;
    this.listeners = new Set();
    this.init();
  }

  init() {
    // 从全局设置加载语言
    const savedLang = localStorage.getItem('app-language') || 'zh-CN';
    this.setLanguage(savedLang);
  }

  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language ${lang} not found, using zh-CN`);
      lang = 'zh-CN';
    }
    
    this.currentLanguage = lang;
    localStorage.setItem('app-language', lang);
    
    // 更新HTML lang属性
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-language', lang);
    
    // 通知所有监听器
    this.notifyListeners();
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(key, fallback = key) {
    const translation = this.translations[this.currentLanguage];
    return translation[key] || fallback;
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage));
  }

  getAvailableLanguages() {
    return [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'en-US', label: 'English' }
    ];
  }
}

// 全局语言服务实例
const languageService = new LanguageService();

export default languageService;

// 辅助函数
export const t = (key, fallback) => languageService.t(key, fallback);