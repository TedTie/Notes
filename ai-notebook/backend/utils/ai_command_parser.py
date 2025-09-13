from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass

class CommandType(Enum):
    READ_FILE = "read_file"
    WRITE_FILE = "write_file"
    CREATE_FILE = "create_file"
    DELETE_FILE = "delete_file"
    LIST_DIRECTORY = "list_directory"
    MODIFY_FILE = "modify_file"
    # 笔记操作
    CREATE_NOTE = "create_note"
    EDIT_NOTE = "edit_note"
    DELETE_NOTE = "delete_note"
    SEARCH_NOTE = "search_note"
    LIST_NOTES = "list_notes"
    # 待办事项操作
    CREATE_TODO = "create_todo"
    COMPLETE_TODO = "complete_todo"
    DELETE_TODO = "delete_todo"
    LIST_TODOS = "list_todos"
    GENERATE_TODOS = "generate_todos"
    # Settings操作
    CHANGE_THEME = "change_theme"
    CHANGE_LANGUAGE = "change_language"
    UPDATE_SETTINGS = "update_settings"
    VIEW_SETTINGS = "view_settings"
    UNKNOWN = "unknown"

@dataclass
class ParsedCommand:
    command_type: CommandType
    file_path: Optional[str] = None
    content: Optional[str] = None
    confidence: float = 0.0
    raw_text: str = ""

class AICommandParser:
    def __init__(self):
        # 文件操作关键词
        self.read_keywords = ["读取", "查看", "打开", "显示", "read", "view", "open", "show"]
        self.write_keywords = ["写入", "Save", "修改", "更新", "write", "save", "modify", "update"]
        self.create_keywords = ["创建", "新建", "建立", "create", "new", "make"]
        self.delete_keywords = ["Delete", "移除", "清除", "delete", "remove", "clear"]
        self.list_keywords = ["列出", "显示目录", "查看目录", "list", "directory", "folder"]
        
        # 笔记操作关键词
        self.note_keywords = ["笔记", "note", "记录", "文档", "document"]
        self.note_create_keywords = ["创建笔记", "新建笔记", "写笔记", "create note", "new note", "write note"]
        self.note_edit_keywords = ["编辑笔记", "修改笔记", "更新笔记", "edit note", "modify note", "update note"]
        self.note_search_keywords = ["搜索笔记", "查找笔记", "search note", "find note"]
        self.note_list_keywords = ["所有笔记", "全部笔记", "我的笔记", "笔记列表", "all notes", "my notes", "note list", "show notes"]
        
        # 待办事项关键词
        self.todo_keywords = ["待办", "任务", "todo", "task", "待办事项"]
        self.todo_create_keywords = ["创建任务", "新建待办", "添加任务", "create task", "new todo", "add task"]
        self.todo_complete_keywords = ["Completed任务", "Completed待办", "标记Completed", "complete task", "finish todo", "mark done"]
        self.todo_generate_keywords = ["生成任务", "AI生成待办", "智能生成", "generate tasks", "ai generate"]
        self.todo_list_keywords = ["所有待办", "全部待办", "我的待办", "待办列表", "all todos", "my todos", "todo list", "show todos", "待办事项列表"]
        
        # Settings操作关键词
        self.settings_keywords = ["Settings", "Configuration", "settings", "config", "preferences"]
        self.theme_keywords = ["Theme", "theme", "外观", "appearance"]
        self.language_keywords = ["语言", "language", "语言Settings", "language setting"]
        self.dark_theme_keywords = ["Dark", "暗色", "黑色", "dark", "night"]
        self.light_theme_keywords = ["Light", "亮色", "白色", "light", "day"]
    
    def parse_command(self, text: str) -> ParsedCommand:
        """解析用户输入的命令"""
        text_lower = text.lower()
        
        # 检测命令类型
        command_type = self._detect_command_type(text_lower)
        
        # 提取文件路径
        file_path = self._extract_file_path(text)
        
        # 提取内容（对于写入操作）
        content = self._extract_content(text, command_type)
        
        # 计算置信度
        confidence = self._calculate_confidence(text_lower, command_type)
        
        return ParsedCommand(
            command_type=command_type,
            file_path=file_path,
            content=content,
            confidence=confidence,
            raw_text=text
        )
    
    def _detect_command_type(self, text: str) -> CommandType:
        """检测命令类型"""
        # 优先检测笔记操作
        if any(keyword in text for keyword in self.note_create_keywords):
            return CommandType.CREATE_NOTE
        elif any(keyword in text for keyword in self.note_edit_keywords):
            return CommandType.EDIT_NOTE
        elif any(keyword in text for keyword in self.note_search_keywords):
            return CommandType.SEARCH_NOTE
        elif any(keyword in text for keyword in self.note_keywords) and any(keyword in text for keyword in self.delete_keywords):
            return CommandType.DELETE_NOTE
        elif any(keyword in text for keyword in self.note_list_keywords):
            return CommandType.LIST_NOTES
        elif any(keyword in text for keyword in self.note_keywords) and any(keyword in text for keyword in self.list_keywords):
            return CommandType.LIST_NOTES
        
        # 检测待办事项操作
        elif any(keyword in text for keyword in self.todo_create_keywords):
            return CommandType.CREATE_TODO
        elif any(keyword in text for keyword in self.todo_complete_keywords):
            return CommandType.COMPLETE_TODO
        elif any(keyword in text for keyword in self.todo_generate_keywords):
            return CommandType.GENERATE_TODOS
        elif any(keyword in text for keyword in self.todo_keywords) and any(keyword in text for keyword in self.delete_keywords):
            return CommandType.DELETE_TODO
        elif any(keyword in text for keyword in self.todo_list_keywords):
            return CommandType.LIST_TODOS
        elif any(keyword in text for keyword in self.todo_keywords) and any(keyword in text for keyword in self.list_keywords):
            return CommandType.LIST_TODOS
        
        # 检测Settings操作
        elif any(keyword in text for keyword in self.theme_keywords):
            return CommandType.CHANGE_THEME
        elif any(keyword in text for keyword in self.language_keywords):
            return CommandType.CHANGE_LANGUAGE
        elif any(keyword in text for keyword in self.settings_keywords) and any(keyword in text for keyword in self.read_keywords):
            return CommandType.VIEW_SETTINGS
        elif any(keyword in text for keyword in self.settings_keywords):
            return CommandType.UPDATE_SETTINGS
        
        # 文件操作（保持原有逻辑）
        elif any(keyword in text for keyword in self.read_keywords):
            return CommandType.READ_FILE
        elif any(keyword in text for keyword in self.write_keywords):
            return CommandType.WRITE_FILE
        elif any(keyword in text for keyword in self.create_keywords):
            return CommandType.CREATE_FILE
        elif any(keyword in text for keyword in self.delete_keywords):
            return CommandType.DELETE_FILE
        elif any(keyword in text for keyword in self.list_keywords):
            return CommandType.LIST_DIRECTORY
        else:
            return CommandType.UNKNOWN
    
    def _extract_file_path(self, text: str) -> Optional[str]:
        """从文本中提取文件路径"""
        # 简单的文件路径提取
        words = text.split()
        for word in words:
            if '.' in word and ('/' in word or '\\' in word or word.endswith('.txt') or word.endswith('.py') or word.endswith('.js')):
                return word.strip('"\'')
        return None
    
    def _extract_content(self, text: str, command_type: CommandType) -> Optional[str]:
        """提取文件内容"""
        if command_type in [CommandType.WRITE_FILE, CommandType.CREATE_FILE]:
            # 简单的内容提取逻辑
            if '内容' in text:
                parts = text.split('内容')
                if len(parts) > 1:
                    return parts[1].strip()
            elif 'content' in text.lower():
                parts = text.lower().split('content')
                if len(parts) > 1:
                    return parts[1].strip()
        return None
    
    def _calculate_confidence(self, text: str, command_type: CommandType) -> float:
        """计算命令识别的置信度"""
        if command_type == CommandType.UNKNOWN:
            return 0.0
        
        # 基于关键词匹配数量计算置信度
        all_keywords = (self.read_keywords + self.write_keywords + 
                       self.create_keywords + self.delete_keywords + 
                       self.list_keywords)
        
        matched_keywords = sum(1 for keyword in all_keywords if keyword in text)
        return min(matched_keywords * 0.3, 1.0)
    
    def is_file_operation(self, text: str) -> bool:
        """判断是否为文件操作指令"""
        parsed = self.parse_command(text)
        return parsed.command_type != CommandType.UNKNOWN and parsed.confidence > 0.3
    
    def parse_instruction(self, text: str) -> ParsedCommand:
        """解析指令（parse_command的别名）"""
        return self.parse_command(text)
    
    def get_operation_summary(self, parsed_command: ParsedCommand) -> str:
        """获取操作摘要"""
        command_type = parsed_command.command_type
        file_path = parsed_command.file_path or "未知文件"
        
        if command_type == CommandType.READ_FILE:
            return f"读取文件: {file_path}"
        elif command_type == CommandType.WRITE_FILE:
            return f"写入文件: {file_path}"
        elif command_type == CommandType.CREATE_FILE:
            return f"创建文件: {file_path}"
        elif command_type == CommandType.DELETE_FILE:
            return f"Delete文件: {file_path}"
        elif command_type == CommandType.LIST_DIRECTORY:
            return f"列出目录: {file_path}"
        elif command_type == CommandType.MODIFY_FILE:
            return f"修改文件: {file_path}"
        else:
            return f"未知操作: {file_path}"
    
    def suggest_command(self, text: str) -> Dict[str, Any]:
        """为用户提供命令建议"""
        parsed = self.parse_command(text)
        
        suggestions = {
            'detected_command': parsed.command_type.value,
            'confidence': parsed.confidence,
            'file_path': parsed.file_path,
            'suggestions': []
        }
        
        if parsed.confidence < 0.5:
            suggestions['suggestions'].append("请提供更明确的文件操作指令")
        
        if not parsed.file_path:
            suggestions['suggestions'].append("请指定要操作的文件路径")
        
        return suggestions

# 创建全局解析器实例
command_parser = AICommandParser()