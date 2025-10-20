/**
 * GraphQL Code Generator Configuration
 *
 * Generates TypeScript types from GraphQL schema and operations
 *
 * Run: pnpm codegen
 * Watch: pnpm codegen:watch
 *
 * Output:
 * - src/lib/graphql/generated/ - Generated types and hooks
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  documents: [
    'src/**/*.{graphql,gql}',
    'src/**/*.{ts,tsx}',
  ],
  ignoreNoDocuments: true, // Don't error if no documents found yet
  generates: {
    './src/lib/graphql/generated/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        useTypeImports: true,
      },
      plugins: [],
      presetConfig: {
        fragmentMasking: false, // Disable fragment masking for simpler types
        gqlTagName: 'gql',
      },
    },
    './src/lib/graphql/generated/types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        skipTypename: false,
        useTypeImports: true,
        dedupeFragments: true,
        preResolveTypes: true,
        // Bangladesh-specific scalars
        scalars: {
          DateTime: 'string',
          Date: 'string',
          UUID: 'string',
          BigInt: 'string',
          Decimal: 'string',
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
