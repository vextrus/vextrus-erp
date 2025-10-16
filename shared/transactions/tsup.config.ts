import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,  // Temporarily disable declaration generation due to type errors
  bundle: false,  // Disable bundling to avoid module resolution issues
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false,  // Disable tree shaking when not bundling
  outDir: 'dist',
  external: [
    '@event-driven-io/emmett',
    '@event-driven-io/emmett-postgresql',
    '@vextrus/kernel',
    '@vextrus/utils',
    '@vextrus/contracts',
    '@opentelemetry/api',
    'pg',
    'uuid',
    'decimal.js'
  ],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node20';
  },
  tsconfig: './tsconfig.json'
});