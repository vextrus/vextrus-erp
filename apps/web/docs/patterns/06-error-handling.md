# Error Handling Patterns

This document outlines error handling strategies and patterns for the Vextrus ERP application.

## Error Boundary

Use ErrorBoundary to catch React component errors.

### Basic Usage

```typescript
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  )
}
```

### With Custom Fallback

```typescript
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### Nested Boundaries

```typescript
function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <Layout>
        <ErrorBoundary fallback={<PageError />}>
          <Page />
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  )
}
```

## API Error Handling

### Fetch Wrapper

```typescript
class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function fetchAPI<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new APIError(
        response.status,
        response.statusText,
        error.message || 'An error occurred'
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new Error('Network error')
  }
}

// Usage
try {
  const data = await fetchAPI<Invoice>('/api/invoices/123')
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 404) {
      // Handle not found
    } else if (error.status === 401) {
      // Handle unauthorized
    }
  }
}
```

### TanStack Query Error Handling

```typescript
function InvoiceList() {
  const { data, error, isError } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error instanceof APIError && error.status === 404) {
        return false
      }
      // Retry other errors up to 3 times
      return failureCount < 3
    },
  })

  if (isError) {
    if (error instanceof APIError) {
      if (error.status === 404) {
        return <NotFound />
      }
      if (error.status === 403) {
        return <Forbidden />
      }
    }
    return <ErrorState error={error} />
  }

  return <div>{/* Render data */}</div>
}
```

### Global Error Handler

```typescript
// In QueryClientProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error)

        // Show global notification
        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Error',
          message: error.message,
        })
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error)

        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Error',
          message: error.message,
        })
      },
    },
  },
})
```

## Form Error Handling

### Validation Errors

```typescript
const { setError } = useForm()

async function onSubmit(data: FormData) {
  try {
    await submitForm(data)
  } catch (error) {
    if (error.field) {
      // Field-specific error
      setError(error.field, {
        type: 'manual',
        message: error.message,
      })
    } else {
      // Form-level error
      setError('root', {
        type: 'manual',
        message: error.message,
      })
    }
  }
}
```

### Server Validation Errors

```typescript
type ValidationErrors = Record<string, string>

async function onSubmit(data: FormData) {
  try {
    await submitForm(data)
  } catch (error) {
    if (error.validationErrors) {
      // Set multiple field errors
      Object.entries(error.validationErrors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message })
      })
    }
  }
}
```

## Error Display Components

### Error State Component

```typescript
interface ErrorStateProps {
  error: Error
  retry?: () => void
}

export function ErrorState({ error, retry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}
```

### Not Found Component

```typescript
export function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/">Go Home</Link>
    </div>
  )
}
```

### Permission Denied

```typescript
export function Forbidden() {
  return (
    <div className="forbidden">
      <h1>403</h1>
      <p>You don't have permission to access this resource.</p>
      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  )
}
```

## Error Logging

### Client-Side Logging

```typescript
export function logError(
  error: Error,
  errorInfo?: React.ErrorInfo,
  context?: Record<string, any>
) {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    errorInfo,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  })

  // Send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { contexts: { react: errorInfo } })
  // }
}
```

### Error Boundary with Logging

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, errorInfo, {
      component: 'ErrorBoundary',
    })
  }
}
```

## Error Types

### Custom Error Classes

```typescript
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}
```

### Type Guards

```typescript
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

// Usage
try {
  await submitForm(data)
} catch (error) {
  if (isValidationError(error)) {
    setError(error.field, { message: error.message })
  } else if (isAPIError(error)) {
    if (error.status === 401) {
      redirectToLogin()
    }
  }
}
```

## Best Practices

### 1. Fail Gracefully

```typescript
// ✅ Good: Show error state, allow retry
function DataComponent() {
  const { data, error, refetch } = useQuery(...)

  if (error) {
    return <ErrorState error={error} retry={refetch} />
  }

  return <div>{/* Render data */}</div>
}

// ❌ Avoid: App crashes
function DataComponent() {
  const { data } = useQuery(...)
  return <div>{data.map(...)}</div> // Crashes if data is undefined
}
```

### 2. Specific Error Messages

```typescript
// ✅ Good: Specific, actionable message
"Email address is already registered. Try logging in instead."

// ❌ Avoid: Vague message
"An error occurred."
```

### 3. User-Friendly Errors

```typescript
// ✅ Good: User-friendly message
function getErrorMessage(error: Error): string {
  if (isAPIError(error)) {
    switch (error.status) {
      case 404:
        return 'The item you're looking for doesn't exist.'
      case 403:
        return 'You don't have permission to do that.'
      case 500:
        return 'Something went wrong on our end. We're working on it.'
      default:
        return error.message
    }
  }
  return 'An unexpected error occurred. Please try again.'
}
```

### 4. Error Recovery

```typescript
// Provide recovery actions
<ErrorState
  error={error}
  retry={refetch}
  actions={[
    { label: 'Go Home', onClick: () => router.push('/') },
    { label: 'Contact Support', onClick: () => openSupport() },
  ]}
/>
```

### 5. Loading and Error States

```typescript
function DataComponent() {
  const { data, isLoading, error } = useQuery(...)

  // Handle all states
  if (isLoading) return <Skeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return <EmptyState />

  return <div>{/* Render data */}</div>
}
```

## Summary

**Error Handling Strategies:**

1. **ErrorBoundary** - Catch React component errors
2. **API Error Wrapper** - Standardize API error handling
3. **TanStack Query** - Built-in error handling for queries
4. **Form Errors** - Field-level and form-level errors
5. **Error Logging** - Track errors for debugging

**Best Practices:**
- ✅ Fail gracefully
- ✅ Show specific, actionable error messages
- ✅ Provide retry/recovery options
- ✅ Log errors for debugging
- ✅ Handle all states (loading, error, empty, success)

**Quick Reference:**

```typescript
// Component errors
<ErrorBoundary><Component /></ErrorBoundary>

// API errors
const { data, error } = useQuery({ ... })
if (error) return <ErrorState error={error} />

// Form errors
setError('field', { message: 'Error message' })
```
