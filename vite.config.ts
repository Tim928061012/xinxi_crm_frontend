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
    // 使用默认的 HMR 配置，避免在浏览器中出现对 http://0.0.0.0:3000/ 的轮询请求
    // 仅在需要跨设备调试时再按需配置 hmr.host
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
