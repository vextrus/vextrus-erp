# Project Structure Conventions

This document outlines the standard project structure and organization patterns for the Vextrus ERP frontend application.

## Overview

The Vextrus ERP frontend follows a feature-based organization pattern with clear separation of concerns. This structure promotes:

- **Scalability**: Easy to add new features without restructuring
- **Maintainability**: Clear separation of concerns
- **Discoverability**: Logical organization makes code easy to find
- **Testability**: Co-location of tests with implementation

## Directory Structure

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Route group: Auth-protected routes
│   │   │   ├── dashboard/
│   │   │   ├── finance/
│   │   │   └── inventory/
│   │   ├── (public)/                 # Route group: Public routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   └── graphql/
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Homepage
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── finance/              # Finance module components
│   │   │   │   ├── InvoiceList.tsx
│   │   │   │   ├── InvoiceForm.tsx
│   │   │   │   └── ...
│   │   │   ├── inventory/            # Inventory module components
│   │   │   │   ├── StockList.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   └── ...
│   │   │   └── shared/               # Shared feature components
│   │   │       ├── forms/
│   │   │       ├── loading/
│   │   │       └── ...
│   │   │
│   │   ├── layouts/                  # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── ...
│   │   │
│   │   └── errors/                   # Error components
│   │       ├── ErrorBoundary.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── index.ts
│   │   │   └── ...
│   │   │
│   │   ├── store/                    # Global state (Zustand)
│   │   │   ├── app-store.ts
│   │   │   ├── user-store.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── cn.ts
│   │   │   ├── formatters.ts
│   │   │   ├── accessibility.ts
│   │   │   └── ...
│   │   │
│   │   ├── validation/               # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── finance.ts
│   │   │   └── ...
│   │   │
│   │   ├── apollo/                   # GraphQL client (future)
│   │   │   ├── client.ts
│   │   │   ├── queries/
│   │   │   └── mutations/
│   │   │
│   │   └── constants/                # Constants and enums
│   │       ├── api.ts
│   │       ├── routes.ts
│   │       └── ...
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── models/                   # Domain models
│   │   │   ├── user.ts
│   │   │   ├── invoice.ts
│   │   │   └── ...
│   │   ├── api.ts                    # API types
│   │   └── global.d.ts               # Global type declarations
│   │
│   ├── styles/                       # Global styles
│   │   ├── globals.css
│   │   └── themes/
│   │
│   └── test/                         # Test utilities and setup
│       ├── setup.ts
│       ├── utils.tsx
│       └── mocks/
│
├── test-e2e/                         # E2E tests
│   ├── example.spec.ts
│   └── ...
│
├── docs/                             # Documentation
│   └── patterns/                     # Pattern library
│
├── public/                           # Static assets
│   ├── images/
│   └── icons/
│
├── .storybook/                       # Storybook configuration
├── playwright.config.ts              # Playwright E2E config
├── vitest.config.ts                  # Vitest config
└── package.json
```

## Component Colocation Pattern

For complex features, use colocation to keep related files together:

```
features/finance/invoices/
├── components/
│   ├── InvoiceList.tsx
│   ├── InvoiceList.test.tsx
│   ├── InvoiceList.stories.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoiceForm.test.tsx
│   ├── InvoiceForm.stories.tsx
│   └── index.ts
├── hooks/
│   ├── useInvoices.ts
│   └── useInvoiceForm.ts
├── types.ts
├── constants.ts
├── validation.ts
└── index.ts
```

## Naming Conventions

### Files and Folders

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `UserProfile.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| Route folders | kebab-case | `user-profile/` |
| Component folders | PascalCase | `UserProfile/` |

### Variables and Functions

```typescript
// Components: PascalCase
export function UserProfile() { }

// Hooks: camelCase with use prefix
export function useAuth() { }

// Utility functions: camelCase
export function formatCurrency(amount: number) { }

// Constants: UPPER_SNAKE_CASE
export const API_BASE_URL = 'https://api.example.com'

// Types/Interfaces: PascalCase
export interface UserProfile { }
export type UserId = string

// Enums: PascalCase with UPPER_SNAKE_CASE values
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
```

## Import Organization

Organize imports in the following order:

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'

// 3. Relative imports
import { InvoiceRow } from './InvoiceRow'
import type { Invoice } from '../types'

// 4. Styles
import styles from './InvoiceList.module.css'
```

## File Organization Best Practices

### 1. Keep Files Small

- **Components**: < 300 lines (ideally < 200)
- **Hooks**: < 100 lines
- **Utils**: < 150 lines

If files grow larger, consider splitting into smaller modules.

### 2. One Component Per File

Each component should have its own file:

```typescript
// ✅ Good
// UserCard.tsx
export function UserCard() { }

// ❌ Avoid
// Users.tsx
export function UserCard() { }
export function UserList() { }
export function UserProfile() { }
```

### 3. Index Files for Clean Exports

Use `index.ts` files to create clean public APIs:

```typescript
// components/features/finance/index.ts
export { InvoiceList } from './InvoiceList'
export { InvoiceForm } from './InvoiceForm'
export { InvoiceDetail } from './InvoiceDetail'

// Usage elsewhere
import { InvoiceList, InvoiceForm } from '@/components/features/finance'
```

### 4. Separate Business Logic from UI

```typescript
// ✅ Good: Separated concerns
// hooks/useInvoiceData.ts
export function useInvoiceData() {
  // Business logic here
}

// components/InvoiceList.tsx
export function InvoiceList() {
  const { invoices } = useInvoiceData()
  // UI rendering here
}

// ❌ Avoid: Mixed concerns
export function InvoiceList() {
  // Business logic mixed with UI
}
```

## Module Boundaries

### Feature Isolation

Features should be self-contained and not directly import from other features:

```typescript
// ❌ Bad: Direct feature-to-feature import
import { InvoiceUtils } from '@/components/features/finance/utils'

// ✅ Good: Use shared utilities
import { calculateTotal } from '@/lib/utils/calculations'
```

### Shared Code

Code used by multiple features should be extracted to shared locations:

- **Components**: `components/features/shared/`
- **Hooks**: `lib/hooks/`
- **Utils**: `lib/utils/`
- **Types**: `types/`

## Route Structure

### App Router Organization

```
app/
├── (auth)/                    # Protected routes group
│   ├── layout.tsx             # Auth layout wrapper
│   ├── dashboard/
│   │   └── page.tsx
│   ├── finance/
│   │   ├── page.tsx           # Finance dashboard
│   │   ├── invoices/
│   │   │   ├── page.tsx       # Invoice list
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # New invoice
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Invoice detail
│   │   │       └── edit/
│   │   │           └── page.tsx # Edit invoice
│   │   └── ...
│   └── ...
│
└── (public)/                  # Public routes group
    ├── layout.tsx             # Public layout wrapper
    ├── login/
    │   └── page.tsx
    └── register/
        └── page.tsx
```

## Testing Structure

Tests are colocated with their source files:

```
components/ui/Button/
├── Button.tsx                 # Component
├── Button.test.tsx            # Unit tests
├── Button.stories.tsx         # Storybook stories
└── index.ts                   # Exports
```

## Summary

**Key Principles:**

1. **Feature-based organization** - Group by feature, not file type
2. **Colocation** - Keep related files close together
3. **Clear naming** - Consistent naming conventions
4. **Module boundaries** - Respect feature isolation
5. **Scalability** - Structure supports growth

**Quick Reference:**

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `PascalCase.ts` or `types.ts`
- Folders: `kebab-case/` or `PascalCase/`

This structure provides a solid foundation for building and scaling the Vextrus ERP frontend application.
