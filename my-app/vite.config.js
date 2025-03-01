import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine base URL based on deployment environment
let base = '/'

if (process.env.DEPLOYMENT_ENV === 'tomcat') {
  base = '/visualizer/'
} else if (process.env.DEPLOYMENT_ENV === 'openshift') {
  // For OpenShift, use the BASE_PATH environment variable or default to '/'
  base = process.env.BASE_PATH || '/'
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: base
})