import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Performance: disable sourcemaps in production (~30% smaller output)
    sourcemap: false,
    // Performance: modern target enables smaller, faster output
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core framework — cached long-term, rarely changes
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          // UI utilities — medium change frequency
          ui: ['lucide-react', 'sonner', 'react-hook-form', 'zod'],
          // Performance: recharts is ~300KB+ — isolate into its own chunk
          // so pages that don't use charts never download it
          charts: ['recharts'],
          // Performance: i18n loaded once, cached separately
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
})
