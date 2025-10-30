/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'auth-service',
      testMatch: ['<rootDir>/services/auth/**/*.spec.ts'],
      preset: './jest.config.base.js',
      rootDir: '.',
    },
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/shared/**/*.spec.ts'],
      preset: './jest.config.base.js',
      rootDir: '.',
    },
    {
      displayName: 'web-app',
      testMatch: ['<rootDir>/apps/web/**/*.spec.ts', '<rootDir>/apps/web/**/*.spec.tsx'],
      preset: './jest.config.base.js',
      testEnvironment: 'jsdom',
      rootDir: '.',
    },
  ],
  
  // Global coverage collection
  collectCoverage: process.env.CI === 'true',
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Coverage thresholds for entire monorepo
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};