import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // jspdf-autotable alias removed — package's exports.import field already
  // maps to dist/jspdf.plugin.autotable.mjs. The alias caused Vite to try
  // resolving ./dist/jspdf.plugin.autotable.mjs via the exports map,
  // which doesn't expose that path — producing a 500 on the dev server.
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
  },
  build: {
    chunkSizeWarningLimit: 1200, // AG-Grid is ~1.1MB — suppress warning
    rollupOptions: {
      output: {
        manualChunks(id) {
          // AG-Grid is the heaviest dependency — split community and react
          if (id.includes('ag-grid-community')) {
            return 'vendor-ag-grid-community';
          }
          if (id.includes('ag-grid-react')) {
            return 'vendor-ag-grid-react';
          }
          // PDF generation
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf';
          }
          // Charting libraries
          if (id.includes('chart.js') || id.includes('recharts') || id.includes('react-chartjs-2')) {
            return 'vendor-charts';
          }
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // Routing
          if (id.includes('react-router-dom') || id.includes('react-router')) {
            return 'vendor-router';
          }
          // Query / data fetching
          if (id.includes('@tanstack') || id.includes('axios')) {
            return 'vendor-data';
          }
          // Other large deps
          if (id.includes('node_modules/') && (id.includes('date-fns') || id.includes('zod') || id.includes('react-hot-toast'))) {
            return 'vendor-misc';
          }
        }
      }
    }
  }
})

