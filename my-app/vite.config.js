import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use base URL based on deployment environment
const base = process.env.DEPLOYMENT_ENV === 'tomcat' ? '/visualizer/' : '/'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: base,
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  }
})