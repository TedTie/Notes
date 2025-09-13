import os
import requests
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class AIResponse:
    """AI响应数据类"""
    content: str
    usage: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    error: Optional[str] = None

class OpenRouterClient:
    """OpenRouter API客户端"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {self.api_key}' if self.api_key else '',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'AI Notebook'
        }
    
    def chat_completion(self, 
                       messages: List[Dict[str, str]], 
                       model: str = "anthropic/claude-3-haiku",
                       max_tokens: int = 1000,
                       temperature: float = 0.7) -> AIResponse:
        """发送聊天Completed请求"""
        
        # 如果没有API密钥，返回模拟响应
        if not self.api_key:
            return self._get_mock_response(messages)
        
        try:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            print(f"[DEBUG] Making API request to: {self.base_url}/chat/completions")
            print(f"[DEBUG] Authorization header: {self.headers.get('Authorization', 'NOT SET')}")
            print(f"[DEBUG] API Key length: {len(self.api_key) if self.api_key else 0}")
            print(f"[DEBUG] Payload model: {payload['model']}")
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response text: {response.text[:200]}...")
            
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                usage = data.get('usage', {})
                
                return AIResponse(
                    content=content,
                    usage=usage,
                    model=model
                )
            else:
                error_msg = f"API Request Failed: {response.status_code} - {response.text}"
                return AIResponse(
                    content="",
                    error=error_msg
                )
                
        except requests.exceptions.RequestException as e:
            return AIResponse(
                content="",
                error=f"Network Request Error: {str(e)}"
            )
        except Exception as e:
            return AIResponse(
                content="",
                error=f"Unknown Error: {str(e)}"
            )
    
    def _get_mock_response(self, messages: List[Dict[str, str]]) -> AIResponse:
        """获取模拟AI响应（当没有API密钥时使用）"""
        
        last_message = messages[-1]['content'].lower() if messages else ""
        
        # 根据消息内容返回不同的模拟响应
        if "项目规划" in last_message or "project planning" in last_message:
            content = self._get_project_planning_response()
        elif "任务增强" in last_message or "task enhance" in last_message:
            content = self._get_task_enhancement_response()
        elif "分解" in last_message or "breakdown" in last_message:
            content = self._get_task_breakdown_response()
        else:
            content = self._get_general_response()
        
        return AIResponse(
            content=content,
            model="mock-model",
            usage={"prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300}
        )
    
    def _get_project_planning_response(self) -> str:
        """项目规划模拟响应"""
        return json.dumps({
            "project_analysis": {
                "complexity": "中等",
                "estimated_duration": "2-4周",
                "key_challenges": [
                    "需求分析和架构设计",
                    "技术选型和环境搭建",
                    "核心功能开发和测试",
                    "用户体验优化"
                ]
            },
            "suggested_tasks": [
                {
                    "title": "需求分析和技术调研",
                    "description": "详细分析项目需求，调研相关技术方案，制定技术架构",
                    "priority": "high",
                    "estimated_time": "3-5天",
                    "dependencies": []
                },
                {
                    "title": "环境搭建和基础框架",
                    "description": "搭建开发环境，创建项目基础框架和目录结构",
                    "priority": "high",
                    "estimated_time": "1-2天",
                    "dependencies": ["需求分析和技术调研"]
                },
                {
                    "title": "核心功能模块开发",
                    "description": "开发项目的核心功能模块，实现主要业务逻辑",
                    "priority": "high",
                    "estimated_time": "1-2周",
                    "dependencies": ["环境搭建和基础框架"]
                },
                {
                    "title": "用户界面设计和实现",
                    "description": "设计用户界面，实现前端交互功能",
                    "priority": "medium",
                    "estimated_time": "3-5天",
                    "dependencies": ["核心功能模块开发"]
                },
                {
                    "title": "测试和优化",
                    "description": "进行功能测试、性能优化和bugRepair",
                    "priority": "medium",
                    "estimated_time": "2-3天",
                    "dependencies": ["用户界面设计和实现"]
                }
            ],
            "milestones": [
                {
                    "name": "项目启动",
                    "description": "Completed需求分析和环境搭建",
                    "target_date": "第1周"
                },
                {
                    "name": "核心功能Completed",
                    "description": "主要功能模块开发Completed",
                    "target_date": "第3周"
                },
                {
                    "name": "项目交付",
                    "description": "Completed测试和优化，项目可交付",
                    "target_date": "第4周"
                }
            ],
            "recommendations": [
                "建议采用敏捷开发方法，分阶段迭代",
                "重视代码质量和文档编写",
                "定期进行代码审查和测试",
                "保持与团队成员的良好沟通"
            ]
        }, ensure_ascii=False, indent=2)
    
    def _get_task_enhancement_response(self) -> str:
        """任务增强模拟响应"""
        return json.dumps({
            "enhanced_description": "这是一个经过AI优化的任务描述。任务已被细化为更具体的步骤，包含了实施建议和最佳实践。建议采用系统性的方法来Completed，确保每个步骤都有明确的目标和验收标准。",
            "subtasks": [
                {
                    "title": "准备阶段",
                    "description": "收集必要的资源和工具，制定详细的实施计划",
                    "estimated_time": "30分钟"
                },
                {
                    "title": "执行阶段",
                    "description": "按照计划执行主要工作内容，注意质量控制",
                    "estimated_time": "2小时"
                },
                {
                    "title": "验证阶段",
                    "description": "检查工作成果，确保符合预期要求",
                    "estimated_time": "30分钟"
                }
            ],
            "estimated_time": "3小时",
            "difficulty": "中等",
            "implementation_tips": [
                "建议分阶段Completed，避免一次性处理过多内容",
                "在Started前确保所有依赖条件都已满足",
                "定期Save工作进度，避免意外丢失",
                "遇到问题时及时寻求帮助或查阅文档"
            ],
            "resources": [
                {
                    "type": "📚 文档",
                    "name": "最佳实践指南",
                    "description": "相关领域的最佳实践和经验总结"
                },
                {
                    "type": "🛠️ 工具",
                    "name": "开发工具",
                    "description": "推荐使用的开发工具和环境"
                }
            ]
        }, ensure_ascii=False, indent=2)
    
    def _get_task_breakdown_response(self) -> str:
        """任务分解模拟响应"""
        return json.dumps({
            "breakdown_analysis": {
                "complexity": "中等",
                "estimated_total_time": "4-6小时",
                "recommended_approach": "分阶段执行"
            },
            "subtasks": [
                {
                    "title": "需求分析",
                    "description": "分析具体需求和约束条件",
                    "priority": "high",
                    "estimated_time": "1小时"
                },
                {
                    "title": "方案设计",
                    "description": "设计实施方案和技术路线",
                    "priority": "high",
                    "estimated_time": "1.5小时"
                },
                {
                    "title": "具体实施",
                    "description": "按照方案进行具体实施",
                    "priority": "high",
                    "estimated_time": "2-3小时"
                },
                {
                    "title": "测试验证",
                    "description": "测试实施结果，验证是否符合要求",
                    "priority": "medium",
                    "estimated_time": "30分钟"
                }
            ]
        }, ensure_ascii=False, indent=2)
    
    def _get_general_response(self) -> str:
        """通用模拟响应"""
        return "这是一个AI生成的响应。由于当前使用的是模拟模式，实际的AI功能需要Configuration有效的API密钥。您可以在环境变量中SettingsOPENROUTER_API_KEY来启用真实的AI功能。"

# 创建全局客户端实例
ai_client = OpenRouterClient()

# 便捷函数
def get_ai_response(prompt: str, context: str = "") -> AIResponse:
    """获取AI响应的便捷函数"""
    messages = []
    
    if context:
        messages.append({
            "role": "system",
            "content": context
        })
    
    messages.append({
        "role": "user",
        "content": prompt
    })
    
    return ai_client.chat_completion(messages)

def enhance_task_with_ai(task_title: str, task_description: str = "", additional_context: str = "") -> AIResponse:
    """使用AI增强任务"""
    prompt = f"""
请为以下任务提供AI增强建议：

任务标题：{task_title}
任务描述：{task_description or '无'}
补充Info：{additional_context or '无'}

请提供以下内容的JSON格式响应：
1. enhanced_description: 优化后的任务描述
2. subtasks: 子任务列表，每个包含title、description、estimated_time
3. estimated_time: 总预估时间
4. difficulty: 难度等级（简单/中等/困难）
5. implementation_tips: 实施建议列表
6. resources: 推荐资源列表，每个包含type、name、description

请确保响应是有效的JSON格式。
"""
    
    context = "你是一个专业的项目管理和任务规划助手，擅长将复杂任务分解为可管理的子任务，并提供实用的实施建议。"
    
    return get_ai_response(prompt, context)

def plan_project_with_ai(project_title: str, project_description: str = "", requirements: str = "") -> AIResponse:
    """使用AI进行项目规划"""
    prompt = f"""
请为以下项目提供AI规划建议：

项目标题：{project_title}
项目描述：{project_description or '无'}
具体要求：{requirements or '无'}

请提供以下内容的JSON格式响应：
1. project_analysis: 项目分析，包含complexity、estimated_duration、key_challenges
2. suggested_tasks: 建议任务列表，每个包含title、description、priority、estimated_time、dependencies
3. milestones: 里程碑列表，每个包含name、description、target_date
4. recommendations: 建议列表

请确保响应是有效的JSON格式。
"""
    
    context = "你是一个经验丰富的项目经理，擅长项目规划、任务分解和风险评估。"
    
    return get_ai_response(prompt, context)