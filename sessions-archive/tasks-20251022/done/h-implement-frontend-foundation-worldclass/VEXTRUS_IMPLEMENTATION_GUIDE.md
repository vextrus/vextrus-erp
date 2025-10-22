# Vextrus Vision - Implementation Guide
## Practical Developer Guide for World-Class Frontend

**Version:** 1.0.0
**Last Updated:** 2025-09-30
**Target Audience:** Frontend Developers

---

## Quick Start

### Prerequisites
```bash
Node.js >= 18.17.0
pnpm >= 8.0.0
```

### Initial Setup

```bash
# Navigate to frontend workspace
cd apps/web

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Start development server
pnpm dev
```

### Project Structure
```
apps/web/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth layout group
│   ├── (dashboard)/       # Dashboard layout group
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Base UI components (Radix + custom)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── kpi-card.tsx
│   │   ├── revenue-chart.tsx
│   │   └── ...
│   └── layout/            # Layout components
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── ...
├── lib/
│   ├── apollo/            # Apollo Client setup
│   ├── utils.ts           # Utility functions
│   └── constants.ts       # Constants
├── styles/
│   └── globals.css        # Global styles + Tailwind
├── public/
│   ├── fonts/             # Custom fonts
│   └── images/
└── tailwind.config.ts     # Tailwind configuration
```

---

## Development Workflows

### Creating a New Component

1. **Start with Radix UI primitive (if applicable)**
```tsx
// components/ui/dropdown-menu.tsx
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
```

2. **Add Vextrus styling**
```tsx
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Content
    ref={ref}
    className={cn(
      // Glassmorphism
      'glass-light',
      // Spacing & layout
      'z-50 min-w-[8rem] overflow-hidden rounded-lg p-1',
      // Animation
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      className
    )}
    {...props}
  />
))
```

3. **Add Framer Motion for advanced interactions**
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

4. **Export from index**
```tsx
// components/ui/index.ts
export { Button } from './button'
export { Card, CardHeader, CardContent } from './card'
// ...
```

### Creating a Dashboard Page

```tsx
// app/(dashboard)/analytics/page.tsx
import { Suspense } from 'react'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { LoadingSkeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Analytics Dashboard | Vextrus ERP',
  description: 'Real-time analytics and insights',
}

export default async function AnalyticsPage() {
  // Server-side data fetching
  const kpiData = await fetchKPIData()

  return (
    <div className="container py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-neutral-500 mt-1">
          Real-time performance metrics and insights
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={kpiData.revenue}
          previousValue={kpiData.previousRevenue}
          format="currency"
          currency="BDT"
          realtime
          endpoint="kpi/revenue"
        />
        <KPICard
          title="Active Projects"
          value={kpiData.projects}
          previousValue={kpiData.previousProjects}
        />
        <KPICard
          title="Profit Margin"
          value={kpiData.margin}
          previousValue={kpiData.previousMargin}
          format="percentage"
        />
        <KPICard
          title="Client Satisfaction"
          value={kpiData.satisfaction}
          format="percentage"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
          <RecentTransactions />
        </Suspense>
      </div>
    </div>
  )
}
```

---

## Common Patterns & Recipes

### Pattern 1: Glassmorphic Card with Hover

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

<Card glass hover className="cursor-pointer">
  <CardHeader>
    <CardTitle>Project Alpha</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-neutral-500">
      Construction of 15-story commercial building
    </p>
  </CardContent>
</Card>
```

### Pattern 2: Form with Validation

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const invoiceSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.date(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

export function InvoiceForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
  })

  const onSubmit = async (data: InvoiceFormData) => {
    // Submit to API
    await createInvoice(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="clientName">
          Client Name
          <span className="text-error-500" aria-label="required">*</span>
        </Label>
        <Input
          id="clientName"
          {...register('clientName')}
          aria-invalid={!!errors.clientName}
          aria-describedby={errors.clientName ? 'clientName-error' : undefined}
        />
        {errors.clientName && (
          <p id="clientName-error" role="alert" className="text-sm text-error-500 mt-1">
            {errors.clientName.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="amount">Amount (BDT)</Label>
        <Input
          id="amount"
          type="number"
          {...register('amount', { valueAsNumber: true })}
          aria-invalid={!!errors.amount}
        />
        {errors.amount && (
          <p role="alert" className="text-sm text-error-500 mt-1">
            {errors.amount.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Create Invoice
      </Button>
    </form>
  )
}
```

### Pattern 3: Data Table with Sorting & Filtering

```tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

export function InvoicesTable() {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  })

  const columns = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Invoice #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'))
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'BDT',
        }).format(amount)
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status')
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'paid'
                ? 'bg-success-50 text-success-700'
                : status === 'pending'
                ? 'bg-warning-50 text-warning-700'
                : 'bg-error-50 text-error-700'
            }`}
          >
            {status}
          </span>
        )
      },
    },
  ]

  const table = useReactTable({
    data: invoices ?? [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search invoices..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### Pattern 4: Real-time WebSocket Updates

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/notifications`
    )

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data)

      // Add notification
      setNotifications((prev) => [notification, ...prev])

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        )
      }, 5000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`glass-medium p-4 rounded-lg border-l-4 ${
              notification.type === 'success'
                ? 'border-success-500'
                : notification.type === 'error'
                ? 'border-error-500'
                : notification.type === 'warning'
                ? 'border-warning-500'
                : 'border-info-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  {notification.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

### Pattern 5: Command Palette (Cmd+K)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  DashboardIcon,
  FileTextIcon,
  UsersIcon,
  SettingsIcon,
} from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigate = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="glass-medium rounded-lg shadow-2xl overflow-hidden">
          <Command.Input
            placeholder="Search or jump to..."
            className="w-full border-none bg-transparent px-4 py-3 text-base outline-none"
          />

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-6 text-center text-sm text-neutral-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs text-neutral-500 px-2 py-1.5">
              <Command.Item
                onSelect={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-white/10"
              >
                <DashboardIcon className="h-4 w-4" />
                Dashboard
                <Command.Shortcut className="ml-auto text-xs text-neutral-400">
                  ⌘D
                </Command.Shortcut>
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/invoices')}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-white/10"
              >
                <FileTextIcon className="h-4 w-4" />
                Invoices
                <Command.Shortcut className="ml-auto text-xs text-neutral-400">
                  ⌘I
                </Command.Shortcut>
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/clients')}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-white/10"
              >
                <UsersIcon className="h-4 w-4" />
                Clients
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/settings')}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-white/10"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
                <Command.Shortcut className="ml-auto text-xs text-neutral-400">
                  ⌘,
                </Command.Shortcut>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions" className="text-xs text-neutral-500 px-2 py-1.5 mt-2">
              <Command.Item className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-white/10">
                Create New Invoice
                <Command.Shortcut className="ml-auto text-xs text-neutral-400">
                  ⌘N
                </Command.Shortcut>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  )
}
```

---

## Apollo Client Integration

### Setup Apollo Client

```typescript
// lib/apollo/client.ts
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

// HTTP connection to the API Gateway
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
})

// WebSocket connection for subscriptions
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql',
          connectionParams: () => {
            const token = localStorage.getItem('authToken')
            const tenantId = localStorage.getItem('tenantId')
            return {
              authorization: token ? `Bearer ${token}` : '',
              'x-tenant-id': tenantId,
            }
          },
        })
      )
    : null

// Auth link to add headers
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken')
  const tenantId = localStorage.getItem('tenantId')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-tenant-id': tenantId || '',
      'x-correlation-id': generateCorrelationId(),
    },
  }
})

// Split based on operation type
const splitLink =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          )
        },
        wsLink,
        authLink.concat(httpLink)
      )
    : authLink.concat(httpLink)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge strategy for paginated queries
          invoices: {
            keyArgs: ['filters'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming]
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

### Apollo Provider

```tsx
// app/providers.tsx
'use client'

import { ApolloProvider } from '@apollo/client'
import { apolloClient } from '@/lib/apollo/client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  )
}
```

### Using Apollo Queries

```tsx
'use client'

import { useQuery, gql } from '@apollo/client'
import { Card } from '@/components/ui/card'

const GET_INVOICES = gql`
  query GetInvoices($limit: Int!, $offset: Int!) {
    invoices(limit: $limit, offset: $offset) {
      id
      invoiceNumber
      clientName
      amount
      status
      createdAt
    }
  }
`

export function InvoicesList() {
  const { data, loading, error, fetchMore } = useQuery(GET_INVOICES, {
    variables: { limit: 20, offset: 0 },
  })

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-4">
      {data.invoices.map((invoice) => (
        <Card key={invoice.id}>
          {/* Invoice content */}
        </Card>
      ))}

      <Button
        onClick={() => {
          fetchMore({
            variables: {
              offset: data.invoices.length,
            },
          })
        }}
      >
        Load More
      </Button>
    </div>
  )
}
```

### Using Apollo Mutations

```tsx
'use client'

import { useMutation, gql } from '@apollo/client'
import { toast } from 'sonner'

const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceNumber
      status
    }
  }
`

export function CreateInvoiceForm() {
  const [createInvoice, { loading }] = useMutation(CREATE_INVOICE, {
    onCompleted: (data) => {
      toast.success(`Invoice ${data.createInvoice.invoiceNumber} created`)
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`)
    },
    // Update cache after mutation
    update(cache, { data: { createInvoice } }) {
      cache.modify({
        fields: {
          invoices(existingInvoices = []) {
            const newInvoiceRef = cache.writeFragment({
              data: createInvoice,
              fragment: gql`
                fragment NewInvoice on Invoice {
                  id
                  invoiceNumber
                  status
                }
              `,
            })
            return [newInvoiceRef, ...existingInvoices]
          },
        },
      })
    },
  })

  const handleSubmit = async (formData: InvoiceFormData) => {
    await createInvoice({
      variables: {
        input: formData,
      },
    })
  }

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>
}
```

### Using Apollo Subscriptions

```tsx
'use client'

import { useSubscription, gql } from '@apollo/client'

const INVOICE_UPDATED = gql`
  subscription OnInvoiceUpdated($invoiceId: ID!) {
    invoiceUpdated(invoiceId: $invoiceId) {
      id
      status
      updatedAt
    }
  }
`

export function InvoiceStatus({ invoiceId }: { invoiceId: string }) {
  const { data, loading } = useSubscription(INVOICE_UPDATED, {
    variables: { invoiceId },
  })

  if (loading) return <span>Connecting...</span>

  return (
    <motion.span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      animate={{
        backgroundColor: ['transparent', '#10b98120', 'transparent'],
      }}
      transition={{ duration: 1 }}
    >
      {data?.invoiceUpdated.status}
    </motion.span>
  )
}
```

---

## TanStack Query for REST APIs

### Setup Query Client

```typescript
// lib/query/client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

### Query Provider

```tsx
// app/providers.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query/client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Using Queries

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

async function fetchDashboardStats() {
  const res = await fetch('/api/dashboard/stats', {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export function DashboardStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30s
  })

  if (isLoading) return <StatsLoadingSkeleton />
  if (error) return <ErrorAlert error={error} />

  return (
    <div className="grid grid-cols-4 gap-6">
      <StatCard label="Revenue" value={data.revenue} />
      <StatCard label="Projects" value={data.projects} />
      <StatCard label="Clients" value={data.clients} />
      <StatCard label="Tasks" value={data.tasks} />
    </div>
  )
}
```

### Using Mutations

```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

async function updateInvoice(id: string, data: Partial<Invoice>) {
  const res = await fetch(`/api/invoices/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update invoice')
  return res.json()
}

export function InvoiceEditor({ invoice }: { invoice: Invoice }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Partial<Invoice>) => updateInvoice(invoice.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice updated successfully')
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      mutation.mutate({ status: 'approved' })
    }}>
      {/* Form fields */}
      <Button type="submit" loading={mutation.isPending}>
        Save Changes
      </Button>
    </form>
  )
}
```

---

## Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image'

// Automatic optimization
<Image
  src="/project-hero.jpg"
  alt="Project visualization"
  width={1200}
  height={600}
  priority // For LCP images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Responsive images
<Image
  src="/project-hero.jpg"
  alt="Project visualization"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-only if needed
})

// Lazy load with Suspense
import { lazy, Suspense } from 'react'

const ReportGenerator = lazy(() => import('./ReportGenerator'))

<Suspense fallback={<LoadingSkeleton />}>
  <ReportGenerator />
</Suspense>
```

### Virtual Scrolling

```tsx
'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export function VirtualInvoiceList({ invoices }: { invoices: Invoice[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const invoice = invoices[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <InvoiceRow invoice={invoice} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Memoization

```tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive calculations
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return heavyCalculation(data)
  }, [data])

  const handleClick = useCallback(() => {
    // Handle click
  }, [])

  return <div onClick={handleClick}>{processedData}</div>
})

// Use React.memo for pure components
export default memo(ExpensiveComponent, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id
})
```

---

## Testing Patterns

### Component Testing

```tsx
// __tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('applies glassmorphism variant', () => {
    render(<Button variant="glass">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('backdrop-blur-xl')
  })
})
```

### Accessibility Testing

```tsx
// __tests__/components/Form.test.tsx
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { InvoiceForm } from '@/components/InvoiceForm'

expect.extend(toHaveNoViolations)

describe('InvoiceForm Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<InvoiceForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA labels', () => {
    render(<InvoiceForm />)

    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
  })

  it('announces form errors to screen readers', async () => {
    render(<InvoiceForm />)

    const submitButton = screen.getByRole('button', { name: /create invoice/i })
    await userEvent.click(submitButton)

    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toHaveTextContent(/required/i)
  })
})
```

### E2E Testing with Playwright

```typescript
// e2e/invoice-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices/new')
  })

  test('creates an invoice successfully', async ({ page }) => {
    // Fill form
    await page.fill('[name="clientName"]', 'ACME Corporation')
    await page.fill('[name="amount"]', '50000')
    await page.selectOption('[name="status"]', 'draft')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.getByText(/invoice created/i)).toBeVisible()
    await expect(page).toHaveURL(/\/invoices\/\d+/)
  })

  test('validates required fields', async ({ page }) => {
    // Submit without filling
    await page.click('button[type="submit"]')

    // Check for error messages
    await expect(page.getByRole('alert')).toHaveText(/client name.*required/i)
  })

  test('is accessible', async ({ page }) => {
    // Run axe accessibility scan
    const accessibilityScanResults = await page.evaluate(() => {
      return (window as any).axe.run()
    })

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

---

## Deployment Checklist

### Pre-deployment

- [ ] Run full test suite: `pnpm test`
- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] Run accessibility audit: `pnpm test:a11y`
- [ ] Run Lighthouse CI: `pnpm lighthouse`
- [ ] Verify environment variables in `.env.production`
- [ ] Check bundle size: `pnpm analyze`
- [ ] Review Core Web Vitals metrics
- [ ] Test in all supported browsers
- [ ] Verify mobile responsiveness
- [ ] Check for console errors/warnings

### Build

```bash
# Production build
pnpm build

# Analyze bundle
pnpm analyze

# Preview production build
pnpm start
```

### Post-deployment

- [ ] Verify production deployment URL
- [ ] Test critical user flows
- [ ] Check analytics/monitoring dashboards
- [ ] Verify error tracking (Sentry)
- [ ] Monitor performance metrics
- [ ] Check PWA installation
- [ ] Verify WebSocket connections
- [ ] Test offline functionality

---

## Troubleshooting

### Common Issues

**Issue: Glassmorphism not working**
```css
/* Ensure backdrop-filter is supported */
@supports not (backdrop-filter: blur(20px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

**Issue: Framer Motion animations not smooth**
```tsx
// Add will-change for GPU acceleration
<motion.div
  style={{ willChange: 'transform' }}
  animate={{ x: 100 }}
/>
```

**Issue: Apollo Client cache not updating**
```typescript
// Use cache.modify or refetchQueries
const [createInvoice] = useMutation(CREATE_INVOICE, {
  refetchQueries: ['GetInvoices'],
  // OR
  update(cache, { data }) {
    cache.modify({
      fields: {
        invoices(existingRefs = []) {
          return [newInvoiceRef, ...existingRefs]
        },
      },
    })
  },
})
```

**Issue: Next.js Image not loading**
```javascript
// next.config.js - Add remote image domains
module.exports = {
  images: {
    domains: ['example.com', 'cdn.example.com'],
  },
}
```

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [TanStack Query Docs](https://tanstack.com/query/latest)

### Tools
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Playwright VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [GraphQL VS Code Extension](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql)

### Design Resources
- [Vextrus Vision Figma Kit](link-to-figma)
- [Component Storybook](http://localhost:6006)
- [Design Tokens](./design-tokens.json)

---

**Ready to build world-class frontend! 🚀**