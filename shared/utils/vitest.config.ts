import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        '**/*.spec.ts',
        '**/*.interface.ts',
        '**/*.types.ts',
        '**/index.ts'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    setupFiles: []
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@vextrus/kernel': path.resolve(__dirname, '../kernel/src')
    }
  }
});