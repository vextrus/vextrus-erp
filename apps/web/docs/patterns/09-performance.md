# Performance Patterns

This document outlines performance optimization patterns for the Vextrus ERP application.

## React Performance

### 1. React.memo

Prevent unnecessary re-renders for components with same props.

```typescript
import { memo } from 'react'

// ✅ Good: Memoize expensive component
export const ProductCard = memo(function ProductCard({ product }: Props) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{formatCurrency(product.price)}</p>
    </div>
  )
})

// Custom comparison function
export const UserCard = memo(
  function UserCard({ user }: Props) {
    return <div>{user.name}</div>
  },
  (prevProps, nextProps) => {
    // Only re-render if user.id changed
    return prevProps.user.id === nextProps.user.id
  }
)
```

### 2. useMemo

Memoize expensive calculations.

```typescript
import { useMemo } from 'react'

function DataTable({ data, filters }: Props) {
  // ✅ Good: Memoize expensive filtering and sorting
  const filteredAndSortedData = useMemo(() => {
    return data
      .filter((item) => matchesFilters(item, filters))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, filters])

  return (
    <table>
      {filteredAndSortedData.map((item) => (
        <TableRow key={item.id} item={item} />
      ))}
    </table>
  )
}

// ❌ Avoid: Recalculating on every render
function DataTable({ data, filters }: Props) {
  const filteredAndSortedData = data
    .filter((item) => matchesFilters(item, filters))
    .sort((a, b) => a.name.localeCompare(b.name))

  return <table>{/* ... */}</table>
}
```

### 3. useCallback

Memoize callback functions to prevent child re-renders.

```typescript
import { useCallback } from 'react'

function ProductList({ products }: Props) {
  // ✅ Good: Memoize callback
  const handleProductClick = useCallback((productId: string) => {
    console.log('Product clicked:', productId)
    router.push(`/products/${productId}`)
  }, [router])

  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={handleProductClick}
        />
      ))}
    </div>
  )
}

// ❌ Avoid: New function on every render
function ProductList({ products }: Props) {
  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={(id) => console.log(id)} // New function every render
        />
      ))}
    </div>
  )
}
```

### 4. Virtualization

Render only visible items in long lists.

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  })

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Code Splitting

### 1. Dynamic Imports

```typescript
import dynamic from 'next/dynamic'

// ✅ Good: Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false, // Don't render on server
})

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart data={data} />
    </div>
  )
}
```

### 2. Route-Based Code Splitting

Next.js automatically code-splits by route:

```typescript
// app/dashboard/page.tsx - Separate bundle
export default function DashboardPage() {
  return <Dashboard />
}

// app/invoices/page.tsx - Separate bundle
export default function InvoicesPage() {
  return <Invoices />
}
```

### 3. Component-Level Code Splitting

```typescript
import { lazy, Suspense } from 'react'

const AdminPanel = lazy(() => import('./AdminPanel'))
const UserDashboard = lazy(() => import('./UserDashboard'))

function App() {
  const { user } = useAuth()

  return (
    <Suspense fallback={<PageLoading />}>
      {user.isAdmin ? <AdminPanel /> : <UserDashboard />}
    </Suspense>
  )
}
```

## Image Optimization

### 1. Next.js Image Component

```typescript
import Image from 'next/image'

// ✅ Good: Optimized images
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={300}
  priority // Above the fold
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Responsive images
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover' }}
/>
```

### 2. Lazy Loading Images

```typescript
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={300}
  loading="lazy" // Default behavior
/>
```

## Data Fetching Optimization

### 1. Parallel Queries

```typescript
// ✅ Good: Fetch in parallel
function Dashboard() {
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const invoices = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices })
  const products = useQuery({ queryKey: ['products'], queryFn: fetchProducts })

  // All queries run in parallel
}

// ❌ Avoid: Sequential queries
function Dashboard() {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    enabled: !!users, // Waits for users to complete
  })
}
```

### 2. Prefetching

```typescript
function InvoiceList() {
  const queryClient = useQueryClient()

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  })

  // Prefetch invoice details on hover
  const handleMouseEnter = (invoiceId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['invoice', invoiceId],
      queryFn: () => fetchInvoice(invoiceId),
    })
  }

  return (
    <div>
      {invoices.map((invoice) => (
        <div key={invoice.id} onMouseEnter={() => handleMouseEnter(invoice.id)}>
          {invoice.number}
        </div>
      ))}
    </div>
  )
}
```

### 3. Stale-While-Revalidate

```typescript
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
})

// Data is fresh for 5 minutes
// After 5 minutes, it's marked stale but still shown
// Background refetch happens automatically
```

### 4. Pagination

```typescript
import { keepPreviousData } from '@tanstack/react-query'

function PaginatedList({ page }: { page: number }) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['items', page],
    queryFn: () => fetchItems(page),
    placeholderData: keepPreviousData, // Keep showing old data while fetching
  })

  return (
    <div className={isPlaceholderData ? 'opacity-50' : ''}>
      {data.items.map((item) => <ItemCard key={item.id} item={item} />)}
    </div>
  )
}
```

## Bundle Size Optimization

### 1. Tree Shaking

```typescript
// ✅ Good: Named imports
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/formatters'

// ❌ Avoid: Barrel imports of large libraries
import * as _ from 'lodash' // Imports entire library
```

### 2. Analyze Bundle Size

```bash
# Next.js built-in analyzer
npm run build

# Or use webpack-bundle-analyzer
ANALYZE=true npm run build
```

### 3. Remove Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Remove unused packages
npm uninstall unused-package
```

## Rendering Optimization

### 1. Avoid Inline Objects/Arrays

```typescript
// ❌ Avoid: New object on every render
function Component() {
  return <Child style={{ color: 'red' }} />
}

// ✅ Good: Memoize or extract
const style = { color: 'red' }

function Component() {
  return <Child style={style} />
}
```

### 2. Lift State Up Carefully

```typescript
// ❌ Avoid: Parent re-renders on every input change
function Parent() {
  const [query, setQuery] = useState('')

  return (
    <div>
      <HeavyComponent1 />
      <HeavyComponent2 />
      <SearchInput value={query} onChange={setQuery} />
    </div>
  )
}

// ✅ Good: Isolate changing state
function Parent() {
  return (
    <div>
      <HeavyComponent1 />
      <HeavyComponent2 />
      <SearchContainer />
    </div>
  )
}

function SearchContainer() {
  const [query, setQuery] = useState('')
  return <SearchInput value={query} onChange={setQuery} />
}
```

### 3. Debounce Expensive Operations

```typescript
import { useDebounce } from '@/lib/hooks'

function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (debouncedQuery) {
      expensiveSearchOperation(debouncedQuery)
    }
  }, [debouncedQuery])

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

## Font Optimization

### 1. Next.js Font Optimization

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 2. Preload Critical Fonts

```typescript
// app/layout.tsx
export const metadata = {
  other: {
    'preload': '/fonts/custom-font.woff2',
  },
}
```

## Monitoring

### 1. Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 2. Performance Monitoring

```typescript
// Custom performance tracking
export function trackPerformance(metric: string, value: number) {
  // Send to analytics service
  console.log(`Performance: ${metric} = ${value}ms`)
}

// Usage
const startTime = performance.now()
await expensiveOperation()
const endTime = performance.now()
trackPerformance('expensive-operation', endTime - startTime)
```

## Performance Checklist

- [ ] Large lists use virtualization
- [ ] Heavy components use dynamic imports
- [ ] Images use Next.js Image component
- [ ] Unnecessary re-renders prevented with memo/useMemo/useCallback
- [ ] Data fetching uses caching and staleTime
- [ ] Bundle size analyzed and optimized
- [ ] Fonts optimized with next/font
- [ ] Web Vitals monitored
- [ ] No inline objects/arrays in render
- [ ] Debounce expensive operations

## Summary

**Key Strategies:**

1. **React Optimization**
   - `memo`, `useMemo`, `useCallback`
   - Virtualization for long lists

2. **Code Splitting**
   - Dynamic imports
   - Route-based splitting

3. **Data Fetching**
   - Parallel queries
   - Prefetching
   - Caching with staleTime

4. **Asset Optimization**
   - Next.js Image
   - Font optimization
   - Bundle analysis

**Quick Reference:**

```typescript
// Memoize component
export const Card = memo(CardComponent)

// Memoize calculation
const sorted = useMemo(() => data.sort(...), [data])

// Memoize callback
const handleClick = useCallback(() => {...}, [])

// Dynamic import
const Chart = dynamic(() => import('./Chart'))

// Optimized image
<Image src="..." width={400} height={300} />
```

**Target Metrics:**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms
