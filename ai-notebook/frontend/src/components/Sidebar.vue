<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  collapsed: boolean
  currentView: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  setView: [view: string]
  toggle: []
}>()

const menuItems = [
  { id: 'notes', icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>', label: '智能笔记', shortcut: 'Ctrl+1' },
        { id: 'todos', icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>', label: '待办事项', shortcut: 'Ctrl+2' },
        { id: 'ai', icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>', label: 'AI助手', shortcut: 'Ctrl+3' },
  { id: 'audio', icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>', label: '音频分析', shortcut: 'Ctrl+4' },
  { id: 'settings', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', label: '设置', shortcut: 'Ctrl+,' },
]

const sidebarWidth = computed(() => props.collapsed ? 'w-16' : 'w-64')
</script>

<template>
  <aside :class="[sidebarWidth, 'bg-cyber-gray/20 backdrop-blur-sm border-r border-cyber-primary/30 transition-all duration-300 flex flex-col relative', 'before:absolute before:inset-0 before:bg-gradient-to-b before:from-cyber-primary/5 before:to-transparent before:pointer-events-none', 'sidebar']">
    <!-- Logo区域 -->
    <div class="p-4 border-b border-cyber-primary/30">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-lg flex items-center justify-center text-cyber-dark font-bold">
          AI
        </div>
        <Transition name="fade">
          <div v-if="!collapsed" class="flex flex-col">
            <span class="font-bold text-sm text-glow">AI Notepad</span>
            <span class="text-xs text-cyber-primary/60">智能记事本</span>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.id">
          <button
            @click="emit('setView', item.id)"
            :class="[
              'w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group relative overflow-hidden',
              'hover:bg-cyber-primary/20 hover:border-glow hover:scale-105',
              currentView === item.id 
                ? 'bg-cyber-primary/30 border border-cyber-primary shadow-neon-sm text-glow animate-shimmer' 
                : 'border border-transparent'
            ]"
          >
            <span class="text-xl flex-shrink-0" v-html="item.icon"></span>
            <Transition name="fade">
              <div v-if="!collapsed" class="flex-1 text-left">
                <div class="font-medium">{{ item.label }}</div>
                <div class="text-xs text-cyber-primary/50">{{ item.shortcut }}</div>
              </div>
            </Transition>
          </button>
        </li>
      </ul>
    </nav>

    <!-- 底部信息 -->
    <div class="p-4 border-t border-cyber-primary/30">
      <Transition name="fade">
        <div v-if="!collapsed" class="space-y-2">
          <!-- 存储使用情况 -->
          <div class="text-xs text-cyber-primary/60">
            <div class="flex justify-between mb-1">
              <span>存储使用</span>
              <span>2.3GB / 5GB</span>
            </div>
            <div class="w-full bg-cyber-dark rounded-full h-1">
              <div class="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-1 rounded-full" style="width: 46%"></div>
            </div>
          </div>
          
          <!-- 版本信息 -->
          <div class="text-xs text-cyber-primary/40 text-center">
            v1.0.0-beta
          </div>
        </div>
      </Transition>
      
      <!-- 折叠按钮 -->
      <button
        @click="emit('toggle')"
        class="w-full mt-2 p-2 hover:bg-cyber-primary/20 rounded transition-colors flex items-center justify-center"
      >
        <svg 
          :class="['w-4 h-4 transition-transform duration-200', collapsed ? 'rotate-180' : '']"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>