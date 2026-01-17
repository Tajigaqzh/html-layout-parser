import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { logSaverPlugin } from './vite-plugins/log-saver'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), logSaverPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    fs: {
      // Allow serving files from parent directory (for wasm-output)
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['html_layout_parser.js']
  }
})
