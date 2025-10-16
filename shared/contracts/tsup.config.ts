import { defineConfig } from 'tsup';

export default defineConfig([
  // Main bundle with all exports
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: false,
    outDir: 'dist',
    bundle: false, // Don't bundle to avoid module resolution issues
    external: [
      'class-transformer',
      'class-validator'
    ],
    esbuildOptions(options) {
      options.platform = 'node';
      options.target = 'node20';
      options.treeShaking = false;
      options.keepNames = true;
      options.packages = 'external';
    },
    tsconfig: './tsconfig.json'
  },
  // Individual files for direct imports
  {
    entry: [
      'src/auth/auth.contracts.ts',
      'src/events/event.contracts.ts', 
      'src/errors/error.contracts.ts',
      'src/api/request-response.dto.ts',
      'src/integration/index.ts',
      'src/integration/service-registry.interface.ts',
      'src/integration/service-discovery.interface.ts', 
      'src/integration/health-check.interface.ts',
      'src/integration/metrics-provider.interface.ts',
      'src/events/domain-event.interface.ts',
      'src/events/integration-event.interface.ts',
      'src/events/event-standards.ts',
      'src/api/pagination.dto.ts',
      'src/api/api-versioning.interface.ts',
      'src/errors/business-exception.ts',
      'src/errors/error-codes.ts'
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean so we don't remove the main bundle
    treeshake: false,
    outDir: 'dist',
    bundle: false,
    external: [
      'class-transformer',
      'class-validator'
    ],
    esbuildOptions(options) {
      options.platform = 'node';
      options.target = 'node20';
      options.treeShaking = false;
      options.keepNames = true;
      options.packages = 'external';
    },
    tsconfig: './tsconfig.json'
  }
]);