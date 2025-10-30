---
task: h-implement-frontend-foundation-worldclass/03-dashboard-implementation
branch: feature/frontend-foundation-worldclass
status: pending
created: 2025-09-29
modules: [web, dashboard, analytics]
phase: 3
duration: Week 5-6
---

# Phase 3: Dashboard Implementation

## Objective
Build comprehensive dashboard system with real-time widgets, interactive charts, KPI cards, and advanced data visualizations using the Vextrus Vision glassmorphism theme.

## Success Criteria
- [ ] Main dashboard layout complete
- [ ] KPI cards with real-time updates
- [ ] Interactive charts and graphs
- [ ] Data widgets with glassmorphism
- [ ] Real-time notifications
- [ ] Responsive grid system
- [ ] Performance monitoring widgets
- [ ] User customization features
- [ ] WebSocket connections working

## Technical Implementation

### 1. Dashboard Layout System
```tsx
// src/app/(dashboard)/dashboard/layout.tsx
import { GlassSidebar } from '@/components/ui/navigation/glass-nav'
import { TopBar } from '@/components/layouts/top-bar'
import { Suspense } from 'react'
import { LoadingOverlay } from '@/components/ui/loading/glass-skeleton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vextrus-navy-900 via-vextrus-navy-800 to-vextrus-emerald-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-vextrus-emerald-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-vextrus-navy-500/20 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-vextrus-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Main layout */}
      <div className="relative z-10">
        <GlassSidebar />
        <div className="ml-64">
          <TopBar />
          <main className="p-6">
            <Suspense fallback={<LoadingOverlay />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
```

### 2. KPI Cards with Real-time Updates
```tsx
// src/components/dashboard/kpi-card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import CountUp from 'react-countup'

interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percentage'
  prefix?: string
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
  sparkline?: number[]
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
  realtime?: boolean
  endpoint?: string
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  prefix = '',
  suffix = '',
  trend,
  sparkline,
  icon,
  color = 'primary',
  realtime = false,
  endpoint,
}) => {
  const [currentValue, setCurrentValue] = React.useState(value)

  // Real-time updates via WebSocket
  React.useEffect(() => {
    if (realtime && endpoint) {
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/${endpoint}`)

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setCurrentValue(data.value)
      }

      return () => ws.close()
    }
  }, [realtime, endpoint])

  // Calculate trend
  const calculatedTrend = React.useMemo(() => {
    if (trend) return trend
    if (!previousValue) return 'neutral'
    if (currentValue > previousValue) return 'up'
    if (currentValue < previousValue) return 'down'
    return 'neutral'
  }, [currentValue, previousValue, trend])

  const changePercentage = previousValue
    ? ((currentValue - previousValue) / previousValue) * 100
    : 0

  const colorClasses = {
    primary: 'from-vextrus-navy-500/20 to-vextrus-navy-600/20 border-vextrus-navy-500/30',
    success: 'from-vextrus-emerald-500/20 to-vextrus-emerald-600/20 border-vextrus-emerald-500/30',
    warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    danger: 'from-red-500/20 to-red-600/20 border-red-500/30',
  }

  const trendIcon = {
    up: <TrendingUp className="h-4 w-4 text-vextrus-emerald-500" />,
    down: <TrendingDown className="h-4 w-4 text-red-500" />,
    neutral: <Minus className="h-4 w-4 text-gray-400" />,
  }

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'BDT',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'bg-gradient-to-br backdrop-blur-md border',
        colorClasses[color],
        'shadow-glass hover:shadow-glass-lg transition-all duration-300'
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-foreground-secondary">{title}</h3>
          </div>
          {realtime && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vextrus-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-vextrus-emerald-500"></span>
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold">
              {prefix}
              <CountUp
                start={previousValue || 0}
                end={currentValue}
                duration={2}
                separator=","
                decimals={format === 'percentage' ? 1 : 0}
              />
              {suffix}
            </div>
            {previousValue !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trendIcon[calculatedTrend]}
                <span
                  className={cn(
                    'text-xs font-medium',
                    calculatedTrend === 'up' && 'text-vextrus-emerald-500',
                    calculatedTrend === 'down' && 'text-red-500',
                    calculatedTrend === 'neutral' && 'text-gray-400'
                  )}
                >
                  {Math.abs(changePercentage).toFixed(1)}%
                </span>
                <span className="text-xs text-foreground-tertiary">vs last period</span>
              </div>
            )}
          </div>

          {sparkline && sparkline.length > 0 && (
            <Sparkline data={sparkline} color={color} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Sparkline Component
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  const width = 80
  const height = 32

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const colorMap = {
    primary: '#1E3A8A',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={colorMap[color]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
```

### 3. Interactive Charts
```tsx
// src/components/dashboard/revenue-chart.tsx
import * as React from 'react'
import { GlassCard } from '@/components/ui/card/glass-card'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useQuery } from '@tanstack/react-query'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

export const RevenueChart: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue-data'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/revenue')
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: 'Inter',
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'BDT',
            }).format(context.parsed.y)
            return `${label}: ${value}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value: any) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'BDT',
              notation: 'compact',
            }).format(value)
          },
        },
      },
    },
  }

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenue || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: data?.expenses || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold gradient-text">Revenue Overview</h3>
        <p className="text-sm text-foreground-secondary mt-1">
          Monthly revenue and expense trends
        </p>
      </div>
      <div className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-vextrus-emerald-500" />
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </GlassCard>
  )
}
```

### 4. Activity Feed Widget
```tsx
// src/components/dashboard/activity-feed.tsx
import * as React from 'react'
import { GlassCard } from '@/components/ui/card/glass-card'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface Activity {
  id: string
  type: 'invoice' | 'payment' | 'order' | 'user' | 'alert' | 'success'
  title: string
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
}

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = React.useState<Activity[]>([])

  // WebSocket connection for real-time updates
  React.useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/activities`)

    ws.onmessage = (event) => {
      const newActivity = JSON.parse(event.data)
      setActivities((prev) => [newActivity, ...prev].slice(0, 10))
    }

    return () => ws.close()
  }, [])

  const iconMap = {
    invoice: <FileText className="h-5 w-5 text-blue-500" />,
    payment: <DollarSign className="h-5 w-5 text-vextrus-emerald-500" />,
    order: <Package className="h-5 w-5 text-purple-500" />,
    user: <Users className="h-5 w-5 text-yellow-500" />,
    alert: <AlertCircle className="h-5 w-5 text-red-500" />,
    success: <CheckCircle className="h-5 w-5 text-vextrus-emerald-500" />,
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold gradient-text">Recent Activity</h3>
        <p className="text-sm text-foreground-secondary mt-1">
          Real-time system activities
        </p>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                {iconMap[activity.type]}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-foreground-secondary truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {activity.user && (
                    <span className="text-xs text-foreground-tertiary">
                      by {activity.user.name}
                    </span>
                  )}
                  <span className="text-xs text-foreground-tertiary">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
```

### 5. Main Dashboard Page
```tsx
// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { KPICard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { GlassCard } from '@/components/ui/card/glass-card'
import { Button } from '@/components/ui/button/button'
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  FileText,
  CreditCard,
  ArrowUpRight,
  Download,
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-foreground-secondary mt-1">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="glass" leftIcon={<Download className="h-4 w-4" />}>
            Export Report
          </Button>
          <Button variant="gradient" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
            View Analytics
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={2456789}
          previousValue={2234567}
          format="currency"
          icon={<DollarSign className="h-5 w-5 text-vextrus-emerald-500" />}
          color="success"
          sparkline={[30, 40, 35, 50, 45, 60, 55, 70]}
          realtime
          endpoint="revenue"
        />
        <KPICard
          title="Growth Rate"
          value={12.5}
          previousValue={10.2}
          format="percentage"
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          color="primary"
          sparkline={[10, 11, 10.5, 11.5, 12, 11.8, 12.3, 12.5]}
        />
        <KPICard
          title="Active Users"
          value={1234}
          previousValue={1156}
          icon={<Users className="h-5 w-5 text-yellow-500" />}
          color="warning"
          realtime
          endpoint="users"
        />
        <KPICard
          title="Pending Orders"
          value={89}
          previousValue={102}
          icon={<Package className="h-5 w-5 text-purple-500" />}
          color="primary"
        />
      </div>

      {/* Charts and Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Additional Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="glass" size="sm" className="w-full justify-start" leftIcon={<FileText className="h-4 w-4" />}>
              Create Invoice
            </Button>
            <Button variant="glass" size="sm" className="w-full justify-start" leftIcon={<CreditCard className="h-4 w-4" />}>
              Process Payment
            </Button>
            <Button variant="glass" size="sm" className="w-full justify-start" leftIcon={<Package className="h-4 w-4" />}>
              New Order
            </Button>
            <Button variant="glass" size="sm" className="w-full justify-start" leftIcon={<Users className="h-4 w-4" />}>
              Add Customer
            </Button>
          </div>
        </GlassCard>

        {/* Top Products */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {[
              { name: 'Construction Materials', sales: 234, revenue: 456789 },
              { name: 'Heavy Equipment', sales: 156, revenue: 234567 },
              { name: 'Safety Gear', sales: 189, revenue: 123456 },
              { name: 'Tools & Hardware', sales: 145, revenue: 98765 },
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-foreground-secondary">{product.sales} sales</p>
                </div>
                <p className="text-sm font-medium">৳{product.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* System Status */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            {[
              { service: 'API Gateway', status: 'operational', uptime: 99.9 },
              { service: 'Database', status: 'operational', uptime: 99.8 },
              { service: 'Cache', status: 'operational', uptime: 100 },
              { service: 'Queue', status: 'maintenance', uptime: 98.5 },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    service.status === 'operational' ? 'bg-vextrus-emerald-500' :
                    service.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm">{service.service}</span>
                </div>
                <span className="text-xs text-foreground-secondary">{service.uptime}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
```

### 6. Responsive Grid System
```tsx
// src/components/dashboard/dashboard-grid.tsx
import * as React from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  children: React.ReactNode
  onLayoutChange?: (layout: any) => void
  isDraggable?: boolean
  isResizable?: boolean
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  onLayoutChange,
  isDraggable = true,
  isResizable = true,
}) => {
  const defaultLayouts = {
    lg: [
      { i: 'revenue-chart', x: 0, y: 0, w: 8, h: 6 },
      { i: 'activity-feed', x: 8, y: 0, w: 4, h: 6 },
      { i: 'kpi-1', x: 0, y: 6, w: 3, h: 2 },
      { i: 'kpi-2', x: 3, y: 6, w: 3, h: 2 },
      { i: 'kpi-3', x: 6, y: 6, w: 3, h: 2 },
      { i: 'kpi-4', x: 9, y: 6, w: 3, h: 2 },
    ],
    md: [
      { i: 'revenue-chart', x: 0, y: 0, w: 6, h: 6 },
      { i: 'activity-feed', x: 6, y: 0, w: 4, h: 6 },
      { i: 'kpi-1', x: 0, y: 6, w: 5, h: 2 },
      { i: 'kpi-2', x: 5, y: 6, w: 5, h: 2 },
      { i: 'kpi-3', x: 0, y: 8, w: 5, h: 2 },
      { i: 'kpi-4', x: 5, y: 8, w: 5, h: 2 },
    ],
    sm: [
      { i: 'revenue-chart', x: 0, y: 0, w: 6, h: 6 },
      { i: 'activity-feed', x: 0, y: 6, w: 6, h: 6 },
      { i: 'kpi-1', x: 0, y: 12, w: 6, h: 2 },
      { i: 'kpi-2', x: 0, y: 14, w: 6, h: 2 },
      { i: 'kpi-3', x: 0, y: 16, w: 6, h: 2 },
      { i: 'kpi-4', x: 0, y: 18, w: 6, h: 2 },
    ],
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={defaultLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={60}
      isDraggable={isDraggable}
      isResizable={isResizable}
      onLayoutChange={onLayoutChange}
      draggableHandle=".drag-handle"
    >
      {children}
    </ResponsiveGridLayout>
  )
}
```

## Performance Optimization

### 1. Data Fetching Strategy
```tsx
// src/lib/dashboard/data-fetcher.ts
import { QueryClient } from '@tanstack/react-query'

export const prefetchDashboardData = async (queryClient: QueryClient) => {
  // Prefetch all dashboard data in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['kpi-revenue'],
      queryFn: fetchRevenueKPI,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
    queryClient.prefetchQuery({
      queryKey: ['kpi-users'],
      queryFn: fetchUsersKPI,
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['revenue-chart'],
      queryFn: fetchRevenueChartData,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),
    queryClient.prefetchQuery({
      queryKey: ['activities'],
      queryFn: fetchRecentActivities,
      staleTime: 1 * 60 * 1000, // 1 minute
    }),
  ])
}
```

### 2. WebSocket Management
```tsx
// src/lib/websocket/dashboard-socket.ts
class DashboardWebSocket {
  private ws: WebSocket | null = null
  private reconnectInterval: number = 5000
  private maxReconnectAttempts: number = 5
  private reconnectAttempts: number = 0

  connect(url: string) {
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onclose = () => {
      this.reconnect(url)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return this.ws
  }

  private reconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
        this.connect(url)
      }, this.reconnectInterval)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const dashboardSocket = new DashboardWebSocket()
```

## Testing Requirements

### Component Tests
```tsx
// src/components/dashboard/__tests__/kpi-card.test.tsx
import { render, screen } from '@testing-library/react'
import { KPICard } from '../kpi-card'

describe('KPICard', () => {
  it('renders title and value', () => {
    render(
      <KPICard
        title="Revenue"
        value={100000}
        format="currency"
      />
    )
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText(/100,000/)).toBeInTheDocument()
  })

  it('shows trend indicator', () => {
    render(
      <KPICard
        title="Growth"
        value={15}
        previousValue={10}
        format="percentage"
      />
    )
    expect(screen.getByText(/50.0%/)).toBeInTheDocument()
  })

  it('displays real-time indicator when enabled', () => {
    render(
      <KPICard
        title="Active Users"
        value={100}
        realtime
      />
    )
    expect(document.querySelector('.animate-ping')).toBeInTheDocument()
  })
})
```

## Responsive Design Checklist

- [ ] Mobile layout (< 768px) working
- [ ] Tablet layout (768px - 1024px) working
- [ ] Desktop layout (> 1024px) working
- [ ] Touch interactions supported
- [ ] Swipe gestures for mobile navigation
- [ ] Responsive charts scaling properly
- [ ] Grid layout adapts to screen size
- [ ] Text remains readable on all sizes
- [ ] Interactive elements properly sized for touch
- [ ] Performance maintained on mobile devices

## Performance Metrics

- [ ] Initial load time < 2s
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1s
- [ ] WebSocket connection < 500ms
- [ ] Chart rendering < 100ms
- [ ] Animation FPS > 60

## Accessibility Features

- [ ] Keyboard navigation for all widgets
- [ ] Screen reader announcements for updates
- [ ] High contrast mode support
- [ ] Focus indicators visible
- [ ] ARIA labels for interactive elements
- [ ] Skip navigation links
- [ ] Reduced motion option

## Next Phase Dependencies

This dashboard implementation enables:
- Integration with backend services (Phase 4)
- Real-time data synchronization
- Advanced analytics features
- Custom widget development

## Resources

- [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Framer Motion](https://www.framer.com/motion/)