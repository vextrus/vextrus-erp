# Loading States

This document outlines patterns for handling loading states in the Vextrus ERP application.

## Available Loading Components

See `src/components/features/shared/loading/LoadingStates.tsx` for implementations.

### 1. PageLoading

Full-page loading indicator.

```typescript
import { PageLoading } from '@/components/features/shared/loading/LoadingStates'

function Page() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) return <PageLoading />

  return <div>{/* Content */}</div>
}
```

### 2. TableSkeleton

Skeleton loader for tables.

```typescript
import { TableSkeleton } from '@/components/features/shared/loading/LoadingStates'

function DataTable() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) return <TableSkeleton rows={10} />

  return <table>{/* Table content */}</table>
}
```

### 3. CardSkeleton

Skeleton loader for card components.

```typescript
import { CardSkeleton } from '@/components/features/shared/loading/LoadingStates'

function DashboardCard() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) return <CardSkeleton />

  return <Card>{/* Card content */}</Card>
}
```

### 4. ListSkeleton

Skeleton loader for lists.

```typescript
import { ListSkeleton } from '@/components/features/shared/loading/LoadingStates'

function UserList() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) return <ListSkeleton items={5} />

  return <ul>{/* List items */}</ul>
}
```

### 5. FormSkeleton

Skeleton loader for forms.

```typescript
import { FormSkeleton } from '@/components/features/shared/loading/LoadingStates'

function EditForm() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) return <FormSkeleton fields={6} />

  return <form>{/* Form fields */}</form>
}
```

## Loading Patterns

### 1. Initial Page Load

```typescript
function Page() {
  const { data, isLoading, error } = useQuery(...)

  if (isLoading) return <PageLoading />
  if (error) return <ErrorState error={error} />

  return <div>{/* Render data */}</div>
}
```

### 2. Component-Level Loading

```typescript
function UserCard({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId)

  if (isLoading) {
    return <CardSkeleton />
  }

  return (
    <Card>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </Card>
  )
}
```

### 3. Inline Loading (Spinners)

```typescript
import { Spinner } from '@/components/ui/spinner'

function SearchInput() {
  const [query, setQuery] = useState('')
  const { data, isLoading } = useSearch(query)

  return (
    <div className="relative">
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {isLoading && (
        <Spinner size="sm" className="absolute right-2 top-2" />
      )}
    </div>
  )
}
```

### 4. Button Loading States

```typescript
function SubmitButton() {
  const { mutate, isPending } = useMutation(...)

  return (
    <Button
      onClick={() => mutate(data)}
      disabled={isPending}
    >
      {isPending && <Spinner size="sm" className="mr-2" />}
      {isPending ? 'Saving...' : 'Save'}
    </Button>
  )
}
```

### 5. Suspense Boundaries

```typescript
import { Suspense } from 'react'

function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <DataComponent />
    </Suspense>
  )
}

// DataComponent can use React.use() or throw promises
```

## Skeleton Patterns

### Custom Skeletons

```typescript
import { Skeleton } from '@/components/ui/skeleton'

function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full" /> {/* Image */}
      <Skeleton className="h-6 w-3/4" />  {/* Title */}
      <Skeleton className="h-4 w-1/2" />  {/* Price */}
      <Skeleton className="h-10 w-full" /> {/* Button */}
    </div>
  )
}
```

### Progressive Loading

```typescript
function ProductList() {
  const { data, isLoading, isFetching } = useQuery(...)

  return (
    <div>
      {/* Show loading indicator while refetching */}
      {isFetching && <LinearProgress />}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
```

## TanStack Query Loading States

### All Loading States

```typescript
function DataComponent() {
  const {
    data,
    isLoading,     // Initial load
    isFetching,    // Any fetch (including background)
    isRefetching,  // Background refetch
    isPaused,      // Network offline
    isError,
    error,
  } = useQuery(...)

  // Initial loading
  if (isLoading) return <Skeleton />

  // Error state
  if (isError) return <ErrorState error={error} />

  return (
    <div>
      {/* Show indicator during background refetch */}
      {isRefetching && <RefetchIndicator />}

      {/* Show offline indicator */}
      {isPaused && <OfflineIndicator />}

      {/* Render data */}
      <DataView data={data} />
    </div>
  )
}
```

### Placeholder Data

Keep showing previous data while refetching:

```typescript
import { keepPreviousData } from '@tanstack/react-query'

function PaginatedList({ page }: { page: number }) {
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['items', page],
    queryFn: () => fetchItems(page),
    placeholderData: keepPreviousData,
  })

  if (isLoading) return <Skeleton />

  return (
    <div>
      <div className={isPlaceholderData ? 'opacity-50' : ''}>
        {data.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>

      <Button disabled={isPlaceholderData}>Next Page</Button>
    </div>
  )
}
```

### Stale While Revalidate

```typescript
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Data is considered fresh for 5 minutes
// After that, it's marked as stale but still shown
// Background refetch happens automatically
```

## Optimistic Updates

Show immediate feedback before server response:

```typescript
function TodoList() {
  const queryClient = useQueryClient()

  const { mutate: addTodo } = useMutation({
    mutationFn: createTodo,

    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos'])

      // Optimistically update
      queryClient.setQueryData(['todos'], (old) => [...old, newTodo])

      // Return context with snapshot
      return { previousTodos }
    },

    // Rollback on error
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos)
    },

    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      <button onClick={() => addTodo(newTodo)}>
        Add Todo (Instant Feedback)
      </button>
    </div>
  )
}
```

## Loading UI Best Practices

### 1. Match Content Layout

Skeleton should match the layout of actual content:

```typescript
// ✅ Good: Skeleton matches content structure
function ProductCardSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="h-20 w-20 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  return (
    <div className="flex gap-4">
      <img src={product.image} className="h-20 w-20 rounded" />
      <div className="flex-1">
        <h3>{product.name}</h3>
        <p>{product.price}</p>
      </div>
    </div>
  )
}
```

### 2. Avoid Layout Shift

Prevent content from jumping when loading completes:

```typescript
// ✅ Good: Reserve space while loading
<div className="h-96"> {/* Fixed height */}
  {isLoading ? <Skeleton className="h-full" /> : <Content />}
</div>

// ❌ Avoid: Layout shifts
{isLoading ? <Spinner /> : <Content />}
```

### 3. Progressive Enhancement

Show content as it loads:

```typescript
function Dashboard() {
  const stats = useQuery({ queryKey: ['stats'] })
  const recent = useQuery({ queryKey: ['recent'] })

  return (
    <div>
      {/* Show stats immediately when ready */}
      {stats.isLoading ? <CardSkeleton /> : <StatsCard data={stats.data} />}

      {/* Recent activity can load independently */}
      {recent.isLoading ? <ListSkeleton /> : <RecentActivity data={recent.data} />}
    </div>
  )
}
```

### 4. Meaningful Loading Messages

```typescript
// ✅ Good: Contextual messages
<PageLoading message="Loading your invoices..." />
<Button loading>Saving changes...</Button>

// ❌ Avoid: Generic messages everywhere
<PageLoading message="Loading..." />
```

### 5. Loading Time Thresholds

Only show loading indicators after a delay to avoid flashing:

```typescript
function useDelayedLoading(isLoading: boolean, delay: number = 200) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), delay)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [isLoading, delay])

  return showLoading
}

// Usage
function Component() {
  const { isLoading } = useQuery(...)
  const showLoading = useDelayedLoading(isLoading)

  if (showLoading) return <Skeleton />

  return <Content />
}
```

## Summary

**Loading Components:**
- `PageLoading` - Full page
- `TableSkeleton` - Tables
- `CardSkeleton` - Cards
- `ListSkeleton` - Lists
- `FormSkeleton` - Forms
- `Spinner` - Inline loading

**Best Practices:**
1. ✅ Match content layout
2. ✅ Avoid layout shift
3. ✅ Progressive enhancement
4. ✅ Meaningful messages
5. ✅ Delay loading indicators
6. ✅ Use placeholderData for pagination
7. ✅ Optimistic updates for instant feedback

**Quick Reference:**

```typescript
// Component loading
if (isLoading) return <Skeleton />

// Button loading
<Button disabled={isPending}>
  {isPending && <Spinner />}
  {isPending ? 'Saving...' : 'Save'}
</Button>

// Background refetch indicator
{isRefetching && <LinearProgress />}
```
