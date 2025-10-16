import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      incremental: false,
      composite: false
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/swagger',
    '@opentelemetry/api',
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/core',
    '@opentelemetry/exporter-metrics-otlp-grpc',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-metrics',
    '@opentelemetry/sdk-node',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/semantic-conventions',
    '@vextrus/kernel',
    'class-transformer',
    'class-validator',
    'date-fns',
    'date-fns-tz',
    'decimal.js',
    'i18next',
    'i18next-http-middleware',
    'ioredis',
    'rxjs'
  ],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node20';
  },
  tsconfig: './tsconfig.json'
});