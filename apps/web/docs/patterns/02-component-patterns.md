# Component Patterns

This document outlines standard component patterns and best practices for the Vextrus ERP frontend application.

## Component Architecture Patterns

### 1. Composition Pattern

Build complex UIs by composing smaller, reusable components.

```typescript
// ✅ Good: Composition
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <UserAvatar user={user} />
        <UserName user={user} />
      </CardHeader>
      <CardContent>
        <UserStats user={user} />
      </CardContent>
      <CardFooter>
        <UserActions user={user} />
      </CardFooter>
    </Card>
  )
}

// ❌ Avoid: Monolithic components
function UserCard({ user }: { user: User }) {
  return (
    <div>
      {/* All avatar logic inline */}
      {/* All name formatting inline */}
      {/* All stats calculation inline */}
      {/* All actions inline */}
    </div>
  )
}
```

### 2. Container/Presenter Pattern

Separate data fetching and logic (Container) from UI rendering (Presenter).

```typescript
// Container (Logic)
export function InvoiceListContainer() {
  const { data: invoices, isLoading, error } = useInvoices()

  if (isLoading) return <TableSkeleton />
  if (error) return <ErrorState error={error} />

  return <InvoiceListPresenter invoices={invoices} />
}

// Presenter (UI)
interface InvoiceListPresenterProps {
  invoices: Invoice[]
}

export function InvoiceListPresenter({ invoices }: InvoiceListPresenterProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invoices</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 3. Compound Components Pattern

Build components that work together seamlessly.

```typescript
// Compound component example
import { createContext, useContext, useState, ReactNode } from 'react'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

function TabList({ children }: { children: ReactNode }) {
  return <div className="flex border-b" role="tablist">{children}</div>
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const { activeTab, setActiveTab } = context

  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
      className={activeTab === value ? 'active' : ''}
    >
      {children}
    </button>
  )
}

function TabPanels({ children }: { children: ReactNode }) {
  return <div className="mt-4">{children}</div>
}

function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used within Tabs')

  if (context.activeTab !== value) return null

  return <div role="tabpanel">{children}</div>
}

// Export compound components
Tabs.List = TabList
Tabs.Tab = Tab
Tabs.Panels = TabPanels
Tabs.Panel = TabPanel

export { Tabs }

// Usage
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panels>
    <Tabs.Panel value="profile">
      <ProfileContent />
    </Tabs.Panel>
    <Tabs.Panel value="settings">
      <SettingsContent />
    </Tabs.Panel>
  </Tabs.Panels>
</Tabs>
```

### 4. Render Props Pattern

Share code between components using a prop whose value is a function.

```typescript
interface DataFetcherProps<T> {
  url: string
  children: (data: T | null, isLoading: boolean, error: Error | null) => ReactNode
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setIsLoading(false)
      })
      .catch((error) => {
        setError(error)
        setIsLoading(false)
      })
  }, [url])

  return <>{children(data, isLoading, error)}</>
}

// Usage
<DataFetcher<Invoice[]> url="/api/invoices">
  {(data, isLoading, error) => {
    if (isLoading) return <Spinner />
    if (error) return <ErrorMessage error={error} />
    return <InvoiceList invoices={data} />
  }}
</DataFetcher>
```

### 5. Higher-Order Component (HOC) Pattern

Add functionality to existing components.

```typescript
// HOC for authentication
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuthComponent(props: P) {
    const { user, isLoading } = useAuth()

    if (isLoading) return <PageLoading />
    if (!user) {
      redirect('/login')
      return null
    }

    return <Component {...props} />
  }
}

// Usage
const ProtectedDashboard = withAuth(Dashboard)
```

## Component Organization Patterns

### Single Responsibility

Each component should have one clear purpose:

```typescript
// ✅ Good: Single responsibility
function UserAvatar({ user }: { user: User }) {
  return (
    <img
      src={user.avatar}
      alt={user.name}
      className="h-10 w-10 rounded-full"
    />
  )
}

function UserName({ user }: { user: User }) {
  return <span className="font-medium">{user.name}</span>
}

function UserRole({ user }: { user: User }) {
  return <span className="text-sm text-gray-500">{user.role}</span>
}

// ❌ Avoid: Multiple responsibilities
function UserInfo({ user }: { user: User }) {
  // Handles avatar, name, role, stats, actions...
}
```

### Component Size

Keep components small and focused:

- **Small**: < 100 lines (most components)
- **Medium**: 100-200 lines (acceptable)
- **Large**: > 200 lines (should be split)

```typescript
// ✅ Good: Small, focused component
function InvoiceStatus({ status }: { status: string }) {
  const statusConfig = {
    paid: { color: 'green', label: 'Paid' },
    pending: { color: 'yellow', label: 'Pending' },
    overdue: { color: 'red', label: 'Overdue' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`badge badge-${config.color}`}>
      {config.label}
    </span>
  )
}
```

## Props Patterns

### Props Interface

Always define explicit prop types:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onClick?: () => void
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onClick,
  children,
}: ButtonProps) {
  // Implementation
}
```

### Props Destructuring

Destructure props in function signature for clarity:

```typescript
// ✅ Good: Destructured props
function UserCard({ user, showActions = true }: UserCardProps) {
  // Use user, showActions directly
}

// ❌ Avoid: Props object
function UserCard(props: UserCardProps) {
  // Use props.user, props.showActions
}
```

### Default Props

Use default values in destructuring:

```typescript
function Alert({
  variant = 'info',
  dismissible = true,
  children,
}: AlertProps) {
  // variant and dismissible have defaults
}
```

### Children Props

Use ReactNode type for children:

```typescript
interface CardProps {
  children: ReactNode
  className?: string
}

function Card({ children, className }: CardProps) {
  return <div className={cn('card', className)}>{children}</div>
}
```

## State Management Patterns

### Local vs Global State

```typescript
// ✅ Local state: Component-specific
function SearchInput() {
  const [query, setQuery] = useState('')
  // Only this component needs query
}

// ✅ Global state: Shared across components
function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  // Many components need sidebar state
}
```

### Derived State

Compute values from existing state instead of storing them:

```typescript
// ✅ Good: Derived state
function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length

  return (
    <div>
      <p>Total: {formatCurrency(totalAmount)}</p>
      <p>Paid: {paidCount}</p>
    </div>
  )
}

// ❌ Avoid: Storing derived state
function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [totalAmount, setTotalAmount] = useState(0)
  const [paidCount, setPaidCount] = useState(0)

  useEffect(() => {
    setTotalAmount(invoices.reduce((sum, inv) => sum + inv.amount, 0))
    setPaidCount(invoices.filter((inv) => inv.status === 'paid').length)
  }, [invoices])
}
```

## Event Handling Patterns

### Event Handlers

Name event handlers with `handle` prefix:

```typescript
function SearchInput() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={handleChange} />
      <button type="button" onClick={handleClear}>Clear</button>
      <button type="submit">Search</button>
    </form>
  )
}
```

### Callback Props

Name callback props with `on` prefix:

```typescript
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
  onSelect?: (userId: string) => void
}

function UserCard({ user, onEdit, onDelete, onSelect }: UserCardProps) {
  return (
    <Card>
      <button onClick={() => onEdit?.(user)}>Edit</button>
      <button onClick={() => onDelete?.(user.id)}>Delete</button>
      <button onClick={() => onSelect?.(user.id)}>Select</button>
    </Card>
  )
}
```

## Conditional Rendering Patterns

### Early Return

Handle edge cases early:

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId)

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState error={error} />
  if (!user) return <NotFound />

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

### Conditional JSX

Use appropriate patterns for conditional rendering:

```typescript
// Simple condition: &&
{isAdmin && <AdminPanel />}

// Either/or: ternary
{isLoading ? <Spinner /> : <Content />}

// Multiple conditions: early return or switch
function StatusBadge({ status }: { status: Status }) {
  switch (status) {
    case 'active':
      return <Badge color="green">Active</Badge>
    case 'pending':
      return <Badge color="yellow">Pending</Badge>
    case 'inactive':
      return <Badge color="gray">Inactive</Badge>
    default:
      return null
  }
}
```

## Performance Patterns

### React.memo

Memoize components that render often with same props:

```typescript
export const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
}: {
  data: ComplexData
}) {
  // Complex rendering logic
  return <div>{/* ... */}</div>
})
```

### useCallback

Memoize callbacks passed to child components:

```typescript
function ParentComponent() {
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id)
  }, [])

  return <ChildComponent onClick={handleClick} />
}
```

### useMemo

Memoize expensive calculations:

```typescript
function DataTable({ data }: { data: Item[] }) {
  const sortedData = useMemo(
    () => data.sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  )

  return <table>{/* Render sortedData */}</table>
}
```

## Summary

**Key Component Patterns:**

1. **Composition** - Build complex UIs from simple components
2. **Container/Presenter** - Separate logic from UI
3. **Compound Components** - Components that work together
4. **Single Responsibility** - One purpose per component
5. **Props Best Practices** - Clear interfaces and defaults

**Quick Checklist:**

- ✅ Component has single responsibility
- ✅ Props are explicitly typed
- ✅ Event handlers use `handle` prefix
- ✅ Callback props use `on` prefix
- ✅ Conditional rendering is clear
- ✅ Performance optimizations where needed
- ✅ Component is < 200 lines
