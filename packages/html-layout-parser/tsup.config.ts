import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry (auto-detect environment)
  {
    entry: {
      'index': 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: false,
    outDir: 'dist',
    external: ['fs', 'path', 'module', 'fs/promises'],
    esbuildOptions(options) {
      options.platform = 'neutral';
    },
  },
  // Web environment entry
  {
    entry: {
      'web': 'src/web.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: false,
    outDir: 'dist',
    external: [],
    esbuildOptions(options) {
      options.platform = 'browser';
    },
  },
  // Worker environment entry
  {
    entry: {
      'worker': 'src/worker.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: false,
    outDir: 'dist',
    external: [],
    esbuildOptions(options) {
      options.platform = 'browser';
    },
  },
  // Node.js environment entry
  {
    entry: {
      'node': 'src/node.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: false,
    outDir: 'dist',
    external: ['fs', 'path', 'module', 'fs/promises'],
    esbuildOptions(options) {
      options.platform = 'node';
    },
  },
]);
