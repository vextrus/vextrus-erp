---
task: h-implement-frontend-foundation-worldclass/04-integration-layer
branch: feature/frontend-foundation-worldclass
status: pending
created: 2025-09-29
modules: [web, api-integration, state-management]
phase: 4
duration: Week 7-8
---

# Phase 4: Integration Layer

## Objective
Implement comprehensive integration layer with Apollo Client for GraphQL Federation, authentication system, real-time subscriptions, state management, and error handling with retry strategies.

## Success Criteria
- [ ] Apollo Client configured for Federation
- [ ] Authentication flow complete
- [ ] GraphQL queries and mutations working
- [ ] WebSocket subscriptions active
- [ ] Global state management setup
- [ ] Error boundary implementation
- [ ] Offline support configured
- [ ] Data caching optimized
- [ ] Request interceptors working

## Technical Implementation

### 1. Apollo Client Setup with Federation
```typescript
// src/lib/apollo/apollo-client.ts
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  split,
  from,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { toast } from 'sonner'

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
})

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql',
    connectionParams: () => {
      const token = localStorage.getItem('accessToken')
      const tenantId = localStorage.getItem('tenantId')
      return {
        authorization: token ? `Bearer ${token}` : '',
        'x-tenant-id': tenantId,
      }
    },
    on: {
      connected: () => console.log('WebSocket connected'),
      error: (error) => console.error('WebSocket error:', error),
    },
  })
)

// Auth Link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken')
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

// Error Link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      // Handle specific error codes
      switch (extensions?.code) {
        case 'UNAUTHENTICATED':
          // Trigger re-authentication
          window.location.href = '/auth/login'
          break
        case 'FORBIDDEN':
          toast.error('You do not have permission to perform this action')
          break
        case 'BAD_REQUEST':
          toast.error(message)
          break
        default:
          console.error(`GraphQL error: ${message}`)
      }
    })
  }

  if (networkError) {
    // Handle network errors
    if ('statusCode' in networkError) {
      switch (networkError.statusCode) {
        case 401:
          // Token expired, try to refresh
          return refreshToken().then(() => forward(operation))
        case 503:
          toast.error('Service temporarily unavailable. Please try again later.')
          break
        default:
          toast.error('Network error. Please check your connection.')
      }
    }
  }
})

// Retry Link
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      return !!error && !graphQLErrors?.some(e =>
        e.extensions?.code === 'UNAUTHENTICATED'
      )
    },
  },
})

// Split link for routing between WebSocket and HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

// Cache configuration with field policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Paginated lists
        invoices: {
          keyArgs: ['filter', 'sort'],
          merge(existing = { items: [] }, incoming) {
            return {
              ...incoming,
              items: [...existing.items, ...incoming.items],
            }
          },
        },
        // Singleton fields
        currentUser: {
          read(existing) {
            return existing || null
          },
        },
      },
    },
    Invoice: {
      keyFields: ['id', 'tenantId'],
    },
    User: {
      keyFields: ['id'],
    },
  },
})

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, authLink, splitLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})

// Helper functions
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

async function refreshToken(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (response.ok) {
      const { accessToken } = await response.json()
      localStorage.setItem('accessToken', accessToken)
    } else {
      throw new Error('Token refresh failed')
    }
  } catch (error) {
    window.location.href = '/auth/login'
  }
}
```

### 2. Authentication System
```typescript
// src/lib/auth/auth-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client'
import { LOGIN_MUTATION, LOGOUT_MUTATION, CURRENT_USER_QUERY } from './queries'

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  tenantId: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  // Fetch current user
  const { loading, refetch } = useQuery(CURRENT_USER_QUERY, {
    skip: !localStorage.getItem('accessToken'),
    onCompleted: (data) => {
      if (data?.currentUser) {
        setUser(data.currentUser)
        localStorage.setItem('tenantId', data.currentUser.tenantId)
      }
    },
    onError: () => {
      localStorage.clear()
      router.push('/auth/login')
    },
  })

  // Login mutation
  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { user, accessToken, refreshToken } = data.login
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('tenantId', user.tenantId)
      setUser(user)
      router.push('/dashboard')
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed')
    },
  })

  // Logout mutation
  const [logoutMutation] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      localStorage.clear()
      setUser(null)
      router.push('/auth/login')
    },
  })

  const login = async (email: string, password: string) => {
    await loginMutation({ variables: { email, password } })
  }

  const logout = async () => {
    await logoutMutation()
  }

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null)
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false
  }

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  // Auto-refresh token
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        // Decode and check expiry
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiresIn = payload.exp * 1000 - Date.now()

        // Refresh if expires in less than 5 minutes
        if (expiresIn < 5 * 60 * 1000) {
          refreshToken()
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Protected Route Component
export const ProtectedRoute: React.FC<{
  children: React.ReactNode
  permission?: string
  role?: string
}> = ({ children, permission, role }) => {
  const { user, loading, hasPermission, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (permission && !hasPermission(permission)) {
        router.push('/403')
      } else if (role && !hasRole(role)) {
        router.push('/403')
      }
    }
  }, [user, loading, permission, role])

  if (loading) {
    return <LoadingOverlay />
  }

  if (!user || (permission && !hasPermission(permission)) || (role && !hasRole(role))) {
    return null
  }

  return <>{children}</>
}
```

### 3. GraphQL Queries and Mutations
```typescript
// src/lib/graphql/finance.graphql
import { gql } from '@apollo/client'

// Fragments
export const INVOICE_FRAGMENT = gql`
  fragment InvoiceDetails on Invoice {
    id
    invoiceNumber
    invoiceDate
    dueDate
    status
    subtotal
    vatAmount
    total
    customer {
      id
      name
      email
      tin
    }
    lineItems {
      id
      description
      quantity
      unitPrice
      total
      vatAmount
    }
    createdAt
    updatedAt
  }
`

// Queries
export const GET_INVOICES = gql`
  query GetInvoices(
    $filter: InvoiceFilterInput
    $sort: InvoiceSortInput
    $pagination: PaginationInput
  ) {
    invoices(filter: $filter, sort: $sort, pagination: $pagination) {
      items {
        ...InvoiceDetails
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${INVOICE_FRAGMENT}
`

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      ...InvoiceDetails
      payments {
        id
        amount
        paymentDate
        method
        reference
      }
      auditLog {
        id
        action
        user
        timestamp
        changes
      }
    }
  }
  ${INVOICE_FRAGMENT}
`

// Mutations
export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      ...InvoiceDetails
    }
  }
  ${INVOICE_FRAGMENT}
`

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      ...InvoiceDetails
    }
  }
  ${INVOICE_FRAGMENT}
`

// Subscriptions
export const INVOICE_UPDATED_SUBSCRIPTION = gql`
  subscription OnInvoiceUpdated($tenantId: ID!) {
    invoiceUpdated(tenantId: $tenantId) {
      ...InvoiceDetails
    }
  }
  ${INVOICE_FRAGMENT}
`

export const NEW_PAYMENT_SUBSCRIPTION = gql`
  subscription OnNewPayment($invoiceId: ID!) {
    newPayment(invoiceId: $invoiceId) {
      id
      amount
      paymentDate
      method
      status
    }
  }
`
```

### 4. Custom Hooks for Data Fetching
```typescript
// src/lib/hooks/use-invoices.ts
import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { useState, useEffect } from 'react'
import {
  GET_INVOICES,
  CREATE_INVOICE,
  UPDATE_INVOICE,
  INVOICE_UPDATED_SUBSCRIPTION,
} from '@/lib/graphql/finance.graphql'
import { toast } from 'sonner'

interface UseInvoicesOptions {
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filter?: Record<string, any>
  realtime?: boolean
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const {
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    filter = {},
    realtime = true,
  } = options

  const [page, setPage] = useState(1)

  const { data, loading, error, refetch, fetchMore, subscribeToMore } = useQuery(
    GET_INVOICES,
    {
      variables: {
        filter,
        sort: { field: sortBy, order: sortOrder },
        pagination: { page, pageSize },
      },
      notifyOnNetworkStatusChange: true,
    }
  )

  // Real-time updates
  useEffect(() => {
    if (realtime && subscribeToMore) {
      const unsubscribe = subscribeToMore({
        document: INVOICE_UPDATED_SUBSCRIPTION,
        variables: { tenantId: localStorage.getItem('tenantId') },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev

          const updatedInvoice = subscriptionData.data.invoiceUpdated
          const exists = prev.invoices.items.find((i: any) => i.id === updatedInvoice.id)

          if (exists) {
            // Update existing invoice
            return {
              ...prev,
              invoices: {
                ...prev.invoices,
                items: prev.invoices.items.map((i: any) =>
                  i.id === updatedInvoice.id ? updatedInvoice : i
                ),
              },
            }
          } else {
            // Add new invoice
            return {
              ...prev,
              invoices: {
                ...prev.invoices,
                items: [updatedInvoice, ...prev.invoices.items],
                totalCount: prev.invoices.totalCount + 1,
              },
            }
          }
        },
      })

      return () => unsubscribe()
    }
  }, [realtime, subscribeToMore])

  // Load more function for infinite scroll
  const loadMore = () => {
    if (data?.invoices?.pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          pagination: { page: page + 1, pageSize },
        },
      })
      setPage(page + 1)
    }
  }

  return {
    invoices: data?.invoices?.items || [],
    totalCount: data?.invoices?.totalCount || 0,
    loading,
    error,
    refetch,
    loadMore,
    hasMore: data?.invoices?.pageInfo?.hasNextPage || false,
  }
}

// Create Invoice Hook
export function useCreateInvoice() {
  const [createInvoice, { loading, error }] = useMutation(CREATE_INVOICE, {
    onCompleted: (data) => {
      toast.success(`Invoice ${data.createInvoice.invoiceNumber} created successfully`)
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`)
    },
    update: (cache, { data }) => {
      // Update cache with new invoice
      const existing = cache.readQuery({ query: GET_INVOICES })
      if (existing) {
        cache.writeQuery({
          query: GET_INVOICES,
          data: {
            invoices: {
              ...existing.invoices,
              items: [data.createInvoice, ...existing.invoices.items],
              totalCount: existing.invoices.totalCount + 1,
            },
          },
        })
      }
    },
  })

  return {
    createInvoice,
    loading,
    error,
  }
}
```

### 5. State Management with Zustand
```typescript
// src/lib/store/app-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: Notification[]

  // User Preferences
  preferences: {
    language: string
    currency: string
    dateFormat: string
    numberFormat: string
  }

  // Application State
  activeFilters: Record<string, any>
  selectedItems: string[]

  // Actions
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
  setActiveFilters: (filters: Record<string, any>) => void
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  clearSelection: () => void
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: Date
  read: boolean
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial State
        sidebarOpen: true,
        theme: 'system',
        notifications: [],
        preferences: {
          language: 'en',
          currency: 'BDT',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'en-US',
        },
        activeFilters: {},
        selectedItems: [],

        // Actions
        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen
          }),

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme
          }),

        addNotification: (notification) =>
          set((state) => {
            state.notifications.unshift(notification)
          }),

        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id)
          }),

        updatePreferences: (preferences) =>
          set((state) => {
            state.preferences = { ...state.preferences, ...preferences }
          }),

        setActiveFilters: (filters) =>
          set((state) => {
            state.activeFilters = filters
          }),

        selectItem: (id) =>
          set((state) => {
            if (!state.selectedItems.includes(id)) {
              state.selectedItems.push(id)
            }
          }),

        deselectItem: (id) =>
          set((state) => {
            state.selectedItems = state.selectedItems.filter((item) => item !== id)
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedItems = []
          }),
      })),
      {
        name: 'vextrus-app-store',
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'vextrus-app',
    }
  )
)
```

### 6. Error Boundary Implementation
```typescript
// src/components/error-boundary/error-boundary.tsx
import React, { Component, ReactNode } from 'react'
import { GlassCard } from '@/components/ui/card/glass-card'
import { Button } from '@/components/ui/button/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo)
      Sentry.captureException(error)
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-vextrus-navy-900 via-vextrus-navy-800 to-vextrus-emerald-900">
          <GlassCard className="max-w-lg w-full p-8">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-foreground-secondary mb-6">
                We encountered an unexpected error. The issue has been reported and we'll look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="w-full mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-foreground-secondary">
                    Error details
                  </summary>
                  <pre className="mt-2 p-4 bg-black/20 rounded-lg text-xs overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  variant="glass"
                  onClick={this.handleReset}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Try Again
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => window.location.href = '/'}
                  leftIcon={<Home className="h-4 w-4" />}
                >
                  Go Home
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for using error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    // Log to Sentry
    Sentry.withScope((scope) => {
      if (errorInfo) {
        scope.setExtras(errorInfo)
      }
      Sentry.captureException(error)
    })

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error, errorInfo)
    }
  }
}
```

### 7. Offline Support with Service Worker
```javascript
// public/service-worker.js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 5, // 5 minutes
        maxEntries: 50,
      }),
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60, // 24 hours
      }),
    ],
  })
)

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 100,
      }),
    ],
  })
)

// Handle offline page
const FALLBACK_HTML_URL = '/offline.html'
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open('offline-fallback').then((cache) => cache.add(FALLBACK_HTML_URL))
  )
})

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await fetch(event.request)
    } catch (error) {
      const cache = await caches.open('offline-fallback')
      return await cache.match(FALLBACK_HTML_URL)
    }
  }
)
```

### 8. Request Interceptors
```typescript
// src/lib/api/interceptors.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'

class APIClient {
  private client: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken')
        const tenantId = localStorage.getItem('tenantId')

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (tenantId && config.headers) {
          config.headers['X-Tenant-Id'] = tenantId
        }

        // Add correlation ID
        config.headers['X-Correlation-Id'] = this.generateCorrelationId()

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log('API Request:', config.method?.toUpperCase(), config.url)
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log('API Response:', response.status, response.config.url)
        }

        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          if (!this.refreshTokenPromise) {
            this.refreshTokenPromise = this.refreshAccessToken()
          }

          try {
            const token = await this.refreshTokenPromise
            originalRequest.headers.Authorization = `Bearer ${token}`
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh failed, redirect to login
            window.location.href = '/auth/login'
            return Promise.reject(refreshError)
          } finally {
            this.refreshTokenPromise = null
          }
        }

        // Handle other errors
        this.handleError(error)
        return Promise.reject(error)
      }
    )
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken')

    const response = await axios.post('/api/auth/refresh', {
      refreshToken,
    })

    const { accessToken } = response.data
    localStorage.setItem('accessToken', accessToken)

    return accessToken
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response

      switch (status) {
        case 400:
          toast.error(data.message || 'Invalid request')
          break
        case 403:
          toast.error('You do not have permission to perform this action')
          break
        case 404:
          toast.error('Resource not found')
          break
        case 500:
          toast.error('Server error. Please try again later')
          break
        default:
          toast.error(data.message || 'An error occurred')
      }
    } else if (error.request) {
      // No response received
      toast.error('Network error. Please check your connection')
    } else {
      // Request setup error
      toast.error('An unexpected error occurred')
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Public methods
  get = (url: string, config?: AxiosRequestConfig) => this.client.get(url, config)
  post = (url: string, data?: any, config?: AxiosRequestConfig) => this.client.post(url, data, config)
  put = (url: string, data?: any, config?: AxiosRequestConfig) => this.client.put(url, data, config)
  patch = (url: string, data?: any, config?: AxiosRequestConfig) => this.client.patch(url, data, config)
  delete = (url: string, config?: AxiosRequestConfig) => this.client.delete(url, config)
}

export const apiClient = new APIClient()
```

## Testing Requirements

### Integration Tests
```typescript
// src/tests/integration/apollo-client.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { useInvoices } from '@/lib/hooks/use-invoices'
import { GET_INVOICES } from '@/lib/graphql/finance.graphql'

const mocks = [
  {
    request: {
      query: GET_INVOICES,
      variables: {
        filter: {},
        sort: { field: 'createdAt', order: 'DESC' },
        pagination: { page: 1, pageSize: 10 },
      },
    },
    result: {
      data: {
        invoices: {
          items: [
            { id: '1', invoiceNumber: 'INV-001', total: 1000 },
            { id: '2', invoiceNumber: 'INV-002', total: 2000 },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '1',
            endCursor: '2',
          },
        },
      },
    },
  },
]

describe('Apollo Client Integration', () => {
  it('fetches invoices successfully', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.invoices).toHaveLength(2)
    expect(result.current.totalCount).toBe(2)
  })
})
```

## Security Checklist

- [ ] JWT tokens stored securely
- [ ] Refresh token rotation implemented
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Input sanitization active
- [ ] Rate limiting configured
- [ ] API key management secure
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Content Security Policy set

## Performance Optimization

- [ ] Apollo cache configured
- [ ] Query batching enabled
- [ ] Lazy loading implemented
- [ ] Code splitting active
- [ ] Bundle size optimized
- [ ] Service worker caching
- [ ] Prefetching strategic queries
- [ ] WebSocket connection pooling
- [ ] Request deduplication
- [ ] Optimistic UI updates

## Next Phase Dependencies

This integration layer enables:
- Complete end-to-end testing (Phase 5)
- Performance optimization
- Production deployment
- Real user monitoring

## Resources

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [GraphQL Subscriptions](https://www.apollographql.com/docs/react/data/subscriptions/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)