import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// These plugins are only for playground development/debugging
// Users don't need them!
import { logSaverPlugin } from './vite-plugins/log-saver'
import { wasmLoaderPlugin } from './vite-plugins/wasm-loader'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    // Development/debugging plugins - users don't need these
    logSaverPlugin(), 
    wasmLoaderPlugin()
  ],
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
  // This is what users actually need:
  optimizeDeps: {
    exclude: [
      'html-layout-parser',
      'html-layout-parser/web',
      'html-layout-parser/node', 
      'html-layout-parser/worker'
    ]
  },
  assetsInclude: ['**/*.wasm']
})
