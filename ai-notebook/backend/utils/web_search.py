import requests
import json
from typing import List, Dict, Optional
from urllib.parse import quote
import time

class WebSearchTool:
    """网络搜索工具类"""
    
    def __init__(self):
        self.search_engines = {
            'duckduckgo': {
                'url': 'https://api.duckduckgo.com/',
                'params': {'format': 'json', 'no_html': '1', 'skip_disambig': '1'}
            },
            'serper': {
                'url': 'https://google.serper.dev/search',
                'headers': {'Content-Type': 'application/json'}
            }
        }
    
    def search_duckduckgo(self, query: str, max_results: int = 5) -> List[Dict]:
        """使用DuckDuckGo搜索"""
        try:
            # DuckDuckGo Instant Answer API
            url = self.search_engines['duckduckgo']['url']
            params = self.search_engines['duckduckgo']['params'].copy()
            params['q'] = query
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            # 处理即时答案
            if data.get('Abstract'):
                results.append({
                    'title': data.get('Heading', '即时答案'),
                    'snippet': data.get('Abstract', ''),
                    'url': data.get('AbstractURL', ''),
                    'source': 'DuckDuckGo Instant Answer'
                })
            
            # 处理相关Theme
            for topic in data.get('RelatedTopics', [])[:max_results-len(results)]:
                if isinstance(topic, dict) and topic.get('Text'):
                    results.append({
                        'title': topic.get('Text', '')[:100] + '...' if len(topic.get('Text', '')) > 100 else topic.get('Text', ''),
                        'snippet': topic.get('Text', ''),
                        'url': topic.get('FirstURL', ''),
                        'source': 'DuckDuckGo Related'
                    })
            
            return results[:max_results]
            
        except Exception as e:
            print(f"DuckDuckGo搜索Failed: {str(e)}")
            return []
    
    def search_serper(self, query: str, api_key: str, max_results: int = 5) -> List[Dict]:
        """使用Serper.dev搜索Google"""
        try:
            url = self.search_engines['serper']['url']
            headers = self.search_engines['serper']['headers'].copy()
            headers['X-API-KEY'] = api_key
            
            payload = {
                'q': query,
                'num': max_results
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            # 处理Search Results
            for item in data.get('organic', [])[:max_results]:
                results.append({
                    'title': item.get('title', ''),
                    'snippet': item.get('snippet', ''),
                    'url': item.get('link', ''),
                    'source': 'Google via Serper'
                })
            
            return results
            
        except Exception as e:
            print(f"Serper搜索Failed: {str(e)}")
            return []
    
    def search_web(self, query: str, search_engine: str = 'duckduckgo', 
                   api_key: Optional[str] = None, max_results: int = 5) -> Dict:
        """统一的网络搜索接口"""
        try:
            results = []
            
            if search_engine == 'duckduckgo':
                results = self.search_duckduckgo(query, max_results)
            elif search_engine == 'serper' and api_key:
                results = self.search_serper(query, api_key, max_results)
            else:
                return {
                    'success': False,
                    'error': f'Not Supported的搜索引擎: {search_engine} 或缺少API密钥'
                }
            
            if not results:
                # 如果主搜索引擎Failed，尝试备用搜索
                if search_engine != 'duckduckgo':
                    print(f"主搜索引擎Failed，尝试DuckDuckGo备用搜索")
                    results = self.search_duckduckgo(query, max_results)
            
            return {
                'success': True,
                'query': query,
                'results': results,
                'count': len(results),
                'search_engine': search_engine
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'搜索Failed: {str(e)}'
            }
    
    def format_search_results(self, search_data: Dict) -> str:
        """格式化Search Results为文本"""
        if not search_data.get('success'):
            return f"搜索Failed: {search_data.get('error', 'Unknown Error')}"
        
        results = search_data.get('results', [])
        if not results:
            return f"No relevant information found about '{search_data.get('query', '')}'."
        
        formatted_text = f"关于 '{search_data.get('query', '')}' 的Search Results:\n\n"
        
        for i, result in enumerate(results, 1):
            formatted_text += f"{i}. **{result.get('title', 'No Title')}**\n"
            formatted_text += f"   {result.get('snippet', 'No Description')}\n"
            if result.get('url'):
                formatted_text += f"   来源: {result.get('url')}\n"
            formatted_text += "\n"
        
        return formatted_text

# 创建全局搜索工具实例
web_search_tool = WebSearchTool()