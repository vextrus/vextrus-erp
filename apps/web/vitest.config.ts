import { defineConfig } from 'vitest/config'
import path from 'path'

// Check if browser mode is enabled via environment variable
const useBrowserMode = process.env.VITEST_BROWSER === 'true'

export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default

  return {
    plugins: [react()],
  test: {
    // Test environment - jsdom for fast unit tests, browser for integration tests
    environment: useBrowserMode ? undefined : 'jsdom',

    // Browser mode configuration (Playwright provider)
    ...(useBrowserMode && {
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: true,
        screenshotOnFailure: true,
      },
    }),

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.stories.tsx',
        '**/*.config.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },

    // Test files
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', '.storybook', 'e2e/**', 'test-e2e/**', 'playwright.config.ts'],

    // Timeouts (longer for browser mode)
    testTimeout: useBrowserMode ? 30000 : 10000,
    hookTimeout: useBrowserMode ? 30000 : 10000,
  },

  // Path resolution (match Next.js/TypeScript config)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  }
}})
