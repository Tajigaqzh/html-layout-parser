import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  outDir: 'dist',
  external: [],
  esbuildOptions(options) {
    options.platform = 'browser';
  },
});
