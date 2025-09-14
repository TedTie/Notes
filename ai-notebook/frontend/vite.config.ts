import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    port: 5173,
    host: true
    // 移除API代理，在Vercel部署时使用Supabase服务
  },
  build: {
    outDir: 'dist'
  }
})
