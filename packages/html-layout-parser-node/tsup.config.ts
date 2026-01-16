import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  external: ['fs', 'path', 'module', 'fs/promises'],
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
