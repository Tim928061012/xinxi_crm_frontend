import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 开发环境代理配置
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 如果需要重写路径，可以取消下面的注释
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
