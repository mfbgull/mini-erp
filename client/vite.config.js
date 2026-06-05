import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // listen on 0.0.0.0 (external access)
    port: 3010,
    // Force HMR to use localhost so Firefox can connect via WebSocket
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3010
    },
    // SECURITY: Restrict allowed hosts in production via env var
    // In dev, allow localhost. In production, should be set explicitly.
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',')
      : true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3011',
        changeOrigin: true
      }
    }
  }
})

