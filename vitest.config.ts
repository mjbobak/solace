import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./jest.setup.js'],
    globals: true,
    include: ['src/__tests__/**/*.test.{ts,tsx}'], // New centralized pattern only
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'json', 'html'],
      reportsDirectory: 'coverage',
      // include all source files for more accurate metrics (optional)
      all: false,
    },
  },
});
