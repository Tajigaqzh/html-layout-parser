import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // Property tests may take longer
    include: ['src/**/*.test.ts'],
  },
});
