import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  external: [
    '@nestjs/common',
    '@nestjs/cqrs'
  ],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node20';
  },
  tsconfig: './tsconfig.json'
});