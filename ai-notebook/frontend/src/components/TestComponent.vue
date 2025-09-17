<template>
  <div class="test-component">
    <h2>Vue组件测试</h2>
    <p>计数器: {{ count }}</p>
    <button @click="increment" class="test-btn">点击增加</button>
    <button @click="testAlert" class="test-btn">测试弹窗</button>
    <input v-model="message" placeholder="输入测试消息" class="test-input" />
    <p>输入内容: {{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
const message = ref('')

const increment = () => {
  count.value++
  console.log('计数器增加到:', count.value)
}

const testAlert = () => {
  alert('Vue组件工作正常！')
  console.log('测试弹窗被触发')
}
</script>

<style scoped>
.test-component {
  padding: 20px;
  background: var(--theme-surface);
  border-radius: 8px;
  margin: 20px;
}

.test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 5px;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:hover {
  background: #0056b3;
}

.test-input {
  padding: 8px;
  margin: 10px 0;
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  width: 200px;
}
</style>