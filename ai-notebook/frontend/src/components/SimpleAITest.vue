<template>
  <div class="simple-ai-test">
    <h2>简化AI助手测试</h2>
    
    <!-- 基本按钮测试 -->
    <div class="test-section">
      <h3>基本按钮测试</h3>
      <button @click="testClick" class="test-btn">测试点击</button>
      <button @click="toggleSidebar" class="test-btn">切换侧边栏</button>
      <p>点击次数: {{ clickCount }}</p>
      <p>侧边栏状态: {{ sidebarCollapsed ? '折叠' : '展开' }}</p>
    </div>
    
    <!-- 输入测试 -->
    <div class="test-section">
      <h3>输入测试</h3>
      <input v-model="testMessage" placeholder="输入测试消息" class="test-input" />
      <button @click="sendTestMessage" class="test-btn">发送消息</button>
      <p>当前消息: {{ testMessage }}</p>
      <div v-if="messages.length > 0">
        <h4>消息列表:</h4>
        <ul>
          <li v-for="(msg, index) in messages" :key="index">{{ msg }}</li>
        </ul>
      </div>
    </div>
    
    <!-- AI服务测试 -->
    <div class="test-section">
      <h3>AI服务测试</h3>
      <button @click="testAIConnection" class="test-btn">测试AI连接</button>
      <button @click="testTopicsAPI" class="test-btn">测试话题API</button>
      <div v-if="aiTestResult" class="result">
        <h4>AI测试结果:</h4>
        <pre>{{ aiTestResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import aiService from '../services/aiService'

// 响应式数据
const clickCount = ref(0)
const sidebarCollapsed = ref(false)
const testMessage = ref('')
const messages = ref([])
const aiTestResult = ref('')

// 基本功能测试
const testClick = () => {
  clickCount.value++
  console.log('测试点击，当前次数:', clickCount.value)
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  console.log('侧边栏状态:', sidebarCollapsed.value)
}

const sendTestMessage = () => {
  if (testMessage.value.trim()) {
    messages.value.push(testMessage.value)
    console.log('发送消息:', testMessage.value)
    testMessage.value = ''
  }
}

// AI服务测试
const testAIConnection = async () => {
  try {
    console.log('开始测试AI连接...')
    const response = await fetch('/api/ai/test')
    const data = await response.json()
    aiTestResult.value = JSON.stringify(data, null, 2)
    console.log('AI连接测试成功:', data)
  } catch (error) {
    aiTestResult.value = `错误: ${error.message}`
    console.error('AI连接测试失败:', error)
  }
}

const testTopicsAPI = async () => {
  try {
    console.log('开始测试话题API...')
    const response = await aiService.getTopics()
    aiTestResult.value = JSON.stringify(response, null, 2)
    console.log('话题API测试成功:', response)
  } catch (error) {
    aiTestResult.value = `错误: ${error.message}`
    console.error('话题API测试失败:', error)
  }
}
</script>

<style scoped>
.simple-ai-test {
  padding: 20px;
  background: #1a1a1a;
  color: white;
  min-height: 100vh;
}

.test-section {
  margin: 20px 0;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
}

.test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:hover {
  background: #0056b3;
}

.test-input {
  padding: 8px;
  margin: 10px 5px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #333;
  color: white;
  width: 200px;
}

.result {
  margin: 10px 0;
  padding: 10px;
  background: #333;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

h2, h3, h4 {
  color: #fff;
}

ul {
  list-style-type: disc;
  margin-left: 20px;
}
</style>