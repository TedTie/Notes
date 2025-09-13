import openai
import os
from typing import Dict, List, Any, Optional
import json
import logging
from datetime import datetime

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
        self.logger = logging.getLogger(__name__)
    
    def test_connection(self) -> Dict[str, Any]:
        """测试AI连接"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": "Hello, this is a connection test."}
                ],
                max_tokens=10
            )
            return {
                'success': True,
                'message': 'AI连接正常',
                'model': 'gpt-3.5-turbo',
                'response': response.choices[0].message.content
            }
        except Exception as e:
            self.logger.error(f"AI Connection Test Failed: {str(e)}")
            return {
                'success': False,
                'message': f'AI connection failed: {str(e)}'
            }
    
    def chat(self, messages: List[Dict[str, str]], model: str = "gpt-3.5-turbo") -> Dict[str, Any]:
        """AI聊天"""
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            return {
                'success': True,
                'response': response.choices[0].message.content,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                }
            }
        except Exception as e:
            self.logger.error(f"AI Chat Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def analyze_text(self, text: str, analysis_type: str) -> Dict[str, Any]:
        """文本分析"""
        prompts = {
            'summary': f"请为以下文本生成简洁的摘要：\n\n{text}",
            'keywords': f"请从以下文本中提取5-10个关键词，用逗号分隔：\n\n{text}",
            'sentiment': f"请分析以下文本的情感倾向（积极/消极/中性），并简要说明原因：\n\n{text}",
            'structure': f"请分析以下文本的结构和逻辑，提供改进建议：\n\n{text}"
        }
        
        if analysis_type not in prompts:
            return {
                'success': False,
                'error': f'Unsupported Analysis Type: {analysis_type}'
            }
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompts[analysis_type]}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return {
                'success': True,
                'analysis_type': analysis_type,
                'result': response.choices[0].message.content
            }
        except Exception as e:
            self.logger.error(f"文本分析Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_todos_from_text(self, text: str) -> Dict[str, Any]:
        """从文本生成待办事项"""
        prompt = f"""请从以下文本中提取可执行的待办事项，以JSON格式返回：
        
文本内容：
{text}

请返回格式如下的JSON：
{{
    "todos": [
        {{
            "content": "待办事项内容",
            "priority": "high/medium/low",
            "category": "分类"
        }}
    ]
}}

如果没有明确的待办事项，请返回空数组。"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            result_text = response.choices[0].message.content
            
            # 尝试解析JSON
            try:
                result_json = json.loads(result_text)
                return {
                    'success': True,
                    'todos': result_json.get('todos', [])
                }
            except json.JSONDecodeError:
                # 如果JSON解析Failed，返回原始文本
                return {
                    'success': True,
                    'todos': [],
                    'raw_response': result_text
                }
                
        except Exception as e:
            self.logger.error(f"生成待办事项Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def improve_content(self, content: str, improvement_type: str) -> Dict[str, Any]:
        """内容改进"""
        prompts = {
            'general': f"请改进以下内容，使其更加清晰、准确和易读：\n\n{content}",
            'grammar': f"请检查并修正以下内容的语法Error：\n\n{content}",
            'structure': f"请重新组织以下内容的结构，使其逻辑更清晰：\n\n{content}",
            'expand': f"请扩展以下内容，添加更多细节和说明：\n\n{content}"
        }
        
        if improvement_type not in prompts:
            return {
                'success': False,
                'error': f'Not Supported的改进类型: {improvement_type}'
            }
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompts[improvement_type]}
                ],
                max_tokens=1000,
                temperature=0.5
            )
            
            return {
                'success': True,
                'improvement_type': improvement_type,
                'improved_content': response.choices[0].message.content
            }
        except Exception as e:
            self.logger.error(f"内容改进Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def smart_search(self, query: str, content_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """AI增强的智能搜索"""
        if not content_list:
            return {
                'success': True,
                'results': []
            }
        
        # 构建搜索上下文
        content_text = "\n\n".join([
            f"ID: {item.get('id', 'N/A')}\n标题: {item.get('title', 'N/A')}\n内容: {item.get('content', 'N/A')}"
            for item in content_list[:20]  # 限制数量避免token过多
        ])
        
        prompt = f"""基于以下内容，找出与查询最相关的项目。请返回JSON格式的结果：

查询: {query}

内容列表:
{content_text}

请返回格式如下的JSON：
{{
    "results": [
        {{
            "id": "项目ID",
            "relevance_score": 0.95,
            "reason": "相关性说明"
        }}
    ]
}}

按相关性从高到低排序，最多返回5个结果。"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            result_text = response.choices[0].message.content
            
            try:
                result_json = json.loads(result_text)
                return {
                    'success': True,
                    'results': result_json.get('results', [])
                }
            except json.JSONDecodeError:
                return {
                    'success': True,
                    'results': [],
                    'raw_response': result_text
                }
                
        except Exception as e:
            self.logger.error(f"智能搜索Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def transcribe_audio(self, audio_file_path: str) -> Dict[str, Any]:
        """音频转录"""
        try:
            with open(audio_file_path, 'rb') as audio_file:
                response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            return {
                'success': True,
                'transcription': response
            }
        except Exception as e:
            self.logger.error(f"音频转录Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def analyze_audio_content(self, transcription: str, analysis_type: str) -> Dict[str, Any]:
        """分析音频内容"""
        prompts = {
            'summary': f"请为以下音频转录内容生成简洁的摘要：\n\n{transcription}",
            'keywords': f"请从以下音频转录内容中提取关键词：\n\n{transcription}",
            'action_items': f"请从以下音频转录内容中提取行动项目和待办事项：\n\n{transcription}",
            'sentiment': f"请分析以下音频转录内容的情感倾向：\n\n{transcription}",
            'meeting_notes': f"请将以下音频转录内容整理成会议纪要格式：\n\n{transcription}"
        }
        
        if analysis_type not in prompts:
            return {
                'success': False,
                'error': f'Unsupported Analysis Type: {analysis_type}'
            }
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompts[analysis_type]}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            return {
                'success': True,
                'analysis_type': analysis_type,
                'result': response.choices[0].message.content
            }
        except Exception as e:
            self.logger.error(f"音频内容分析Failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

# 全局AI服务实例
ai_service = AIService()