# State Management Patterns

This document outlines state management strategies for different types of state in the Vextrus ERP application.

## State Categories

### 1. UI State (Zustand)

**What**: Local UI state like modals, sidebars, theme preferences.

**When to use**:
- Sidebar open/closed state
- Modal visibility
- Theme preferences
- Notification state
- User preferences

**Example**: See `src/lib/store/app-store.ts`

```typescript
import { useAppStore } from '@/lib/store/app-store'

function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <div className={sidebarOpen ? 'open' : 'closed'}>
      <button onClick={toggleSidebar}>Toggle</button>
    </div>
  )
}
```

### 2. Server State (TanStack Query)

**What**: Data fetched from APIs - caching, synchronization, background updates.

**When to use**:
- API data (invoices, users, products)
- Cached server data
- Background refetching
- Optimistic updates

**Example**:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetching data
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
}

// Using the hook
function InvoiceList() {
  const { data: invoices, isLoading, error } = useInvoices()

  if (isLoading) return <Spinner />
  if (error) return <Error />

  return <div>{/* Render invoices */}</div>
}

// Mutations
export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoice: NewInvoice) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice),
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
```

### 3. Form State (React Hook Form)

**What**: Form data, validation, submission state.

**When to use**:
- Form fields
- Validation errors
- Submission state
- Field-level state

**Example**: See [Form Patterns](./04-form-patterns.md)

### 4. URL State (Next.js Router)

**What**: Search params, filters, pagination state.

**When to use**:
- Filters
- Pagination
- Search queries
- Shareable state

**Example**:

```typescript
import { useSearchParams, useRouter } from 'next/navigation'

function DataTable() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page = Number(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  return <div>{/* Table with pagination */}</div>
}
```

## Zustand Patterns

### Creating a Store

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface StoreState {
  // State
  count: number
  user: User | null

  // Actions
  increment: () => void
  decrement: () => void
  setUser: (user: User) => void
}

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        count: 0,
        user: null,

        // Actions
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
        setUser: (user) => set({ user }),
      }),
      {
        name: 'my-store',
        // Only persist certain fields
        partialize: (state) => ({
          user: state.user,
        }),
      }
    ),
    {
      name: 'my-store-devtools',
    }
  )
)
```

### Using Stores

```typescript
// Select specific state
function Counter() {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)

  return <button onClick={increment}>Count: {count}</button>
}

// Select multiple values
function UserInfo() {
  const { user, setUser } = useStore((state) => ({
    user: state.user,
    setUser: state.setUser,
  }))

  return <div>{user?.name}</div>
}
```

### Store Slices

For large stores, use slices:

```typescript
interface UISlice {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

interface UserSlice {
  user: User | null
  setUser: (user: User) => void
}

type StoreState = UISlice & UserSlice

const createUISlice = (set): UISlice => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
})

const createUserSlice = (set): UserSlice => ({
  user: null,
  setUser: (user) => set({ user }),
})

export const useStore = create<StoreState>()((...a) => ({
  ...createUISlice(...a),
  ...createUserSlice(...a),
}))
```

## TanStack Query Patterns

### Query Configuration

```typescript
// Global defaults (in QueryClientProvider)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
})
```

### Query Keys

```typescript
// Query key factory
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: string) => [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

// Usage
useQuery({
  queryKey: invoiceKeys.list(filters),
  queryFn: () => fetchInvoices(filters),
})

useQuery({
  queryKey: invoiceKeys.detail(id),
  queryFn: () => fetchInvoice(id),
})
```

### Mutations with Optimistic Updates

```typescript
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoice: Invoice) => updateInvoice(invoice),

    // Optimistic update
    onMutate: async (newInvoice) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invoiceKeys.detail(newInvoice.id) })

      // Snapshot previous value
      const previousInvoice = queryClient.getQueryData(
        invoiceKeys.detail(newInvoice.id)
      )

      // Optimistically update
      queryClient.setQueryData(
        invoiceKeys.detail(newInvoice.id),
        newInvoice
      )

      // Return context with snapshot
      return { previousInvoice }
    },

    // Rollback on error
    onError: (err, newInvoice, context) => {
      queryClient.setQueryData(
        invoiceKeys.detail(newInvoice.id),
        context.previousInvoice
      )
    },

    // Refetch after success or error
    onSettled: (newInvoice) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(newInvoice.id)
      })
    },
  })
}
```

### Dependent Queries

```typescript
function UserPosts({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!user, // Only run if user exists
  })

  return <div>{/* Render posts */}</div>
}
```

### Parallel Queries

```typescript
function Dashboard() {
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const invoices = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices })
  const products = useQuery({ queryKey: ['products'], queryFn: fetchProducts })

  if (users.isLoading || invoices.isLoading || products.isLoading) {
    return <Spinner />
  }

  return <div>{/* Render dashboard */}</div>
}
```

### Paginated Queries

```typescript
function PaginatedList({ page }: { page: number }) {
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => fetchInvoices(page),
    placeholderData: keepPreviousData, // Keep previous data while fetching
  })

  return (
    <div>
      {data.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)}
      <button disabled={isPlaceholderData}>Next Page</button>
    </div>
  )
}
```

### Infinite Queries

```typescript
function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['invoices'],
    queryFn: ({ pageParam = 0 }) => fetchInvoices(pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    initialPageParam: 0,
  })

  return (
    <div>
      {data.pages.map((page) =>
        page.items.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))
      )}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  )
}
```

## State Selection Best Practices

### Zustand Selectors

```typescript
// ✅ Good: Select only what you need
const count = useStore((state) => state.count)

// ❌ Avoid: Selecting entire state causes unnecessary re-renders
const state = useStore()
```

### Equality Checks

```typescript
import { shallow } from 'zustand/shallow'

// For objects/arrays
const { count, user } = useStore(
  (state) => ({ count: state.count, user: state.user }),
  shallow
)
```

## Summary

**State Types:**

| Type | Library | Use Case |
|------|---------|----------|
| UI State | Zustand | Sidebar, modals, theme |
| Server State | TanStack Query | API data, caching |
| Form State | React Hook Form | Forms, validation |
| URL State | Next.js Router | Filters, pagination |

**Quick Reference:**

```typescript
// UI State
const { sidebarOpen } = useAppStore()

// Server State
const { data, isLoading } = useQuery({
  queryKey: ['invoices'],
  queryFn: fetchInvoices,
})

// Form State
const { register, handleSubmit } = useForm()

// URL State
const searchParams = useSearchParams()
const page = searchParams.get('page')
```

**Best Practices:**
1. ✅ Choose the right state type
2. ✅ Use selectors to avoid unnecessary re-renders
3. ✅ Persist only necessary state
4. ✅ Use query keys consistently
5. ✅ Handle loading and error states
