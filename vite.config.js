import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'vendor-react'
          }
          if (id.includes('lucide-react') || id.includes('react-icons')) {
            return 'vendor-icons'
          }
          if (id.includes('axios')) {
            return 'vendor-axios'
          }
          return 'vendor'
        },
      },
    },
  },
})
