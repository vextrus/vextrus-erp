# Vextrus ERP - Frontend Pattern Library

Welcome to the Vextrus ERP Frontend Pattern Library. This comprehensive guide documents all development patterns, best practices, and conventions for building consistent, maintainable, and accessible features.

## 📚 Table of Contents

1. [Project Structure](./01-project-structure.md)
2. [Component Patterns](./02-component-patterns.md)
3. [Custom Hooks](./03-custom-hooks.md)
4. [Form Patterns](./04-form-patterns.md)
5. [State Management](./05-state-management.md)
6. [Error Handling](./06-error-handling.md)
7. [Loading States](./07-loading-states.md)
8. [Accessibility](./08-accessibility.md)
9. [Performance](./09-performance.md)

## 🎯 Purpose

This pattern library serves as:

- **Reference Guide**: Standardized patterns for common tasks
- **Onboarding Resource**: Quick ramp-up for new developers
- **Decision Framework**: Established conventions to reduce decision fatigue
- **Quality Baseline**: Best practices for consistent code quality

## 🚀 Quick Start

### New to the Project?

1. Start with [Project Structure](./01-project-structure.md) to understand how code is organized
2. Review [Component Patterns](./02-component-patterns.md) for building UI components
3. Check [Custom Hooks](./03-custom-hooks.md) for available reusable hooks
4. Explore other patterns as needed

### Building a Feature?

**For a new form:**
→ See [Form Patterns](./04-form-patterns.md)

**For data fetching:**
→ See [State Management](./05-state-management.md)

**For handling errors:**
→ See [Error Handling](./06-error-handling.md)

**For loading states:**
→ See [Loading States](./07-loading-states.md)

**For accessibility:**
→ See [Accessibility](./08-accessibility.md)

**For performance:**
→ See [Performance](./09-performance.md)

## 🛠️ Technology Stack

### Core Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)

### State Management

- **UI State**: Zustand
- **Server State**: TanStack Query
- **Form State**: React Hook Form + Zod
- **URL State**: Next.js Router (useSearchParams)

### Testing

- **Unit Tests**: Vitest
- **E2E Tests**: Playwright
- **Component Testing**: Storybook

## 📂 Code Organization

```
apps/web/src/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # Base components (shadcn/ui)
│   ├── features/           # Feature-specific components
│   ├── layouts/            # Layout components
│   └── errors/             # Error boundaries
├── lib/
│   ├── hooks/              # Custom hooks
│   ├── store/              # Zustand stores
│   ├── utils/              # Utility functions
│   └── validation/         # Zod schemas
├── types/                  # TypeScript types
└── styles/                 # Global styles
```

See [Project Structure](./01-project-structure.md) for details.

## 🎨 Available Components

### UI Components (shadcn/ui)

Base components built with Radix UI primitives and Tailwind CSS:

- Button, Input, Card, Badge, Avatar
- Select, Checkbox, Radio, Switch
- Dialog, Sheet, Popover, Dropdown
- Table, Skeleton, Spinner
- And more...

### Feature Components

Domain-specific components for ERP functionality:

- `BasicFormExample` - Simple form pattern
- `MultiStepFormExample` - Multi-step form pattern
- `ErrorBoundary` - Error catching component
- `PageLoading`, `TableSkeleton`, `CardSkeleton` - Loading states

## 🪝 Available Hooks

### Custom Hooks

Located in `src/lib/hooks/`:

- `useLocalStorage` - Sync state with localStorage
- `useDebounce` - Debounce value changes
- `useMediaQuery` - Detect media query matches
- `useToggle` - Boolean state management
- `useCopyToClipboard` - Copy text to clipboard
- `useClickOutside` - Detect outside clicks

See [Custom Hooks](./03-custom-hooks.md) for usage examples.

## 🗃️ State Management Strategy

Different state types require different solutions:

| State Type | Solution | Use Case |
|------------|----------|----------|
| **UI State** | Zustand | Sidebar, modals, theme |
| **Server State** | TanStack Query | API data, caching |
| **Form State** | React Hook Form | Forms, validation |
| **URL State** | Next.js Router | Filters, pagination |

See [State Management](./05-state-management.md) for patterns.

## 📝 Form Handling

Standard form pattern using React Hook Form + Zod:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      {/* More fields... */}
    </form>
  )
}
```

See [Form Patterns](./04-form-patterns.md) for comprehensive guide.

## 🚨 Error Handling

Comprehensive error handling strategy:

```typescript
// Component errors
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// API errors
const { data, error, isError } = useQuery({...})
if (isError) return <ErrorState error={error} />

// Form errors
setError('fieldName', { message: 'Error message' })
```

See [Error Handling](./06-error-handling.md) for patterns.

## ⏳ Loading States

Consistent loading indicators:

```typescript
import {
  PageLoading,
  TableSkeleton,
  CardSkeleton,
} from '@/components/features/shared/loading/LoadingStates'

// Full page
if (isLoading) return <PageLoading />

// Table
if (isLoading) return <TableSkeleton rows={10} />

// Card
if (isLoading) return <CardSkeleton />
```

See [Loading States](./07-loading-states.md) for patterns.

## ♿ Accessibility

WCAG 2.1 AA compliance patterns:

```typescript
// Keyboard accessible
<button onClick={...}>Click me</button>

// ARIA labels
<button aria-label="Close dialog">
  <X aria-hidden="true" />
</button>

// Semantic HTML
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

See [Accessibility](./08-accessibility.md) for comprehensive guide.

## ⚡ Performance

Optimization patterns:

```typescript
// Memoization
export const Card = memo(CardComponent)
const sorted = useMemo(() => data.sort(...), [data])
const handleClick = useCallback(() => {...}, [])

// Code splitting
const Chart = dynamic(() => import('./Chart'))

// Image optimization
<Image src="..." width={400} height={300} />
```

See [Performance](./09-performance.md) for strategies.

## 🎯 Development Workflow

### Starting New Work

1. Check current patterns for similar implementations
2. Follow established conventions
3. Use available components and hooks
4. Test accessibility and performance
5. Document new patterns if needed

### Code Review Checklist

- [ ] Follows established patterns
- [ ] TypeScript types defined
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Accessibility tested
- [ ] Performance considered
- [ ] Tests written
- [ ] Documentation updated

## 📖 Pattern Categories

### Foundational Patterns

Essential patterns every developer should know:

1. **[Project Structure](./01-project-structure.md)** - How code is organized
2. **[Component Patterns](./02-component-patterns.md)** - Building UI components
3. **[Custom Hooks](./03-custom-hooks.md)** - Reusable logic

### Implementation Patterns

Patterns for specific features:

4. **[Form Patterns](./04-form-patterns.md)** - Form handling and validation
5. **[State Management](./05-state-management.md)** - State strategies
6. **[Error Handling](./06-error-handling.md)** - Error management
7. **[Loading States](./07-loading-states.md)** - Loading indicators

### Quality Patterns

Patterns for quality and UX:

8. **[Accessibility](./08-accessibility.md)** - A11y compliance
9. **[Performance](./09-performance.md)** - Optimization strategies

## 🔍 Finding Patterns

### By Task

**"I need to create a form"**
→ [Form Patterns](./04-form-patterns.md)

**"I need to fetch data"**
→ [State Management](./05-state-management.md) (TanStack Query section)

**"I need to show loading state"**
→ [Loading States](./07-loading-states.md)

**"I need to handle errors"**
→ [Error Handling](./06-error-handling.md)

**"I need to make it accessible"**
→ [Accessibility](./08-accessibility.md)

**"I need to optimize performance"**
→ [Performance](./09-performance.md)

### By Component

**Button, Input, Card, etc.**
→ Check `src/components/ui/`

**Forms**
→ Check `src/components/features/shared/forms/`

**Loading States**
→ Check `src/components/features/shared/loading/`

**Error Boundaries**
→ Check `src/components/errors/`

### By Hook

**useLocalStorage, useDebounce, etc.**
→ Check `src/lib/hooks/` and [Custom Hooks](./03-custom-hooks.md)

## 🤝 Contributing to Patterns

### When to Add a Pattern

Add a new pattern when you:

1. Solve a problem that will recur
2. Find a better approach than existing patterns
3. Implement a feature that others will need

### How to Add a Pattern

1. Document the pattern in the appropriate guide
2. Provide code examples
3. Explain when to use it
4. Include best practices
5. Update this README if needed

### Pattern Quality

Good patterns are:

- **Clear**: Easy to understand and follow
- **Practical**: Solves real problems
- **Tested**: Proven to work well
- **Documented**: Well-explained with examples
- **Consistent**: Aligns with existing patterns

## 📊 Pattern Maturity

Patterns evolve over time. Here's how to understand pattern status:

- **Established**: Widely used, battle-tested, recommended
- **Recommended**: Good practices, actively used
- **Experimental**: New approaches, use with caution
- **Deprecated**: Old patterns, migrate away

Most patterns in this library are **Established** or **Recommended**.

## 🎓 Learning Resources

### Internal Resources

- Component Storybook: `pnpm storybook`
- Type definitions: `src/types/`
- Example implementations: `src/components/features/shared/`

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

## 📞 Getting Help

**Pattern not clear?** Open an issue or ask in team chat

**Pattern doesn't fit your use case?** Discuss with the team

**Found a better approach?** Propose a pattern update

## 🎉 Summary

This pattern library provides:

✅ Standardized approaches to common tasks
✅ Reusable components and hooks
✅ Best practices for quality and accessibility
✅ Performance optimization strategies
✅ Comprehensive examples and documentation

**Goal**: Enable developers to build features consistently, efficiently, and with high quality.

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Status**: Production Ready
