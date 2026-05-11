import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    host: '0.0.0.0',
    port: 2000,
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true
      }
    }
  }
})
