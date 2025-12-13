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
    host: '0.0.0.0', // 允许局域网访问
    port: 3000,
    strictPort: true, // 固定端口，避免端口被占用自动递增导致访问不到
    hmr: {
      host: process.env.HOST || '0.0.0.0',
      protocol: 'http',
      port: 3000
    },
    origin: process.env.HOST ? `http://${process.env.HOST}:3000` : undefined,
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
