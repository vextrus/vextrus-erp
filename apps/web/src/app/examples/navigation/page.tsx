'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Package,
  ShoppingCart,
  BarChart3,
  CreditCard,
  Folder,
  Home,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sidebar, SidebarSection } from '@/components/ui/sidebar'
import { Header } from '@/components/ui/header'
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/breadcrumbs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Mock user data
const currentUser = {
  name: 'John Doe',
  email: 'john.doe@vextrus.com',
  avatar: undefined, // Will show initials
}

// Sidebar navigation structure
const navigationSections: SidebarSection[] = [
  {
    id: 'main',
    title: 'Main',
    icon: <LayoutDashboard className="h-4 w-4" />,
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/examples/navigation',
        icon: <Home className="h-4 w-4" />,
        active: true,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/examples/navigation',
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    icon: <Package className="h-4 w-4" />,
    defaultOpen: true,
    items: [
      {
        id: 'products',
        label: 'Products',
        href: '/examples/navigation',
        icon: <Package className="h-4 w-4" />,
        badge: '12',
      },
      {
        id: 'orders',
        label: 'Orders',
        href: '/examples/navigation',
        icon: <ShoppingCart className="h-4 w-4" />,
        badge: '3',
      },
      {
        id: 'customers',
        label: 'Customers',
        href: '/examples/navigation',
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: <CreditCard className="h-4 w-4" />,
    defaultOpen: false,
    items: [
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/examples/navigation',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/examples/navigation',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'system',
    title: 'System',
    icon: <Settings className="h-4 w-4" />,
    defaultOpen: false,
    items: [
      {
        id: 'settings',
        label: 'Settings',
        href: '/examples/navigation',
        icon: <Settings className="h-4 w-4" />,
      },
      {
        id: 'files',
        label: 'Files',
        href: '/examples/navigation',
        icon: <Folder className="h-4 w-4" />,
      },
    ],
  },
]

// Breadcrumb items
const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Examples', href: '/examples' },
  { label: 'Navigation' },
]

export default function NavigationExamplePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  const handleSearch = (query: string) => {
    toast.info(`Searching for: ${query}`)
  }

  const handleNotifications = () => {
    toast.info('Opening notifications')
  }

  const handleProfile = () => {
    toast.info('Opening profile')
  }

  const handleSettings = () => {
    toast.info('Opening settings')
  }

  const handleHelp = () => {
    toast.info('Opening help')
  }

  const handleLogout = () => {
    toast.success('Logged out successfully')
  }

  const handleMenuClick = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sections={navigationSections}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        logo={
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="font-semibold">Vextrus</span>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          user={currentUser}
          onMenuClick={handleMenuClick}
          onSearch={handleSearch}
          onNotificationsClick={handleNotifications}
          onProfileClick={handleProfile}
          onSettingsClick={handleSettings}
          onHelpClick={handleHelp}
          onLogoutClick={handleLogout}
          notificationCount={5}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbItems} />

            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">Navigation Components</h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Comprehensive navigation system with sidebar, header, breadcrumbs, and tabs
              </p>
            </div>

            {/* Tabs Demo */}
            <Card glass glassLevel="medium">
              <CardHeader>
                <CardTitle>Tabs Navigation</CardTitle>
                <CardDescription>
                  Organize content into tabbed sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <h3 className="text-lg font-semibold">Overview</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      This is the overview tab content. The Tabs component provides
                      accessible tab navigation with keyboard support and smooth transitions.
                    </p>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    <h3 className="text-lg font-semibold">Analytics</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      View your analytics data here. The component supports unlimited
                      tabs and can be styled to match your design system.
                    </p>
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-4">
                    <h3 className="text-lg font-semibold">Reports</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Generate and view reports. All tabs are lazy-loaded for optimal
                      performance.
                    </p>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <h3 className="text-lg font-semibold">Settings</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Configure your preferences. The Tabs component follows WAI-ARIA
                      tab design patterns.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Components Showcase */}
            <Card glass glassLevel="light">
              <CardHeader>
                <CardTitle>Navigation Components Showcase</CardTitle>
                <CardDescription>
                  All Phase 2.2 components are production-ready with:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Sidebar</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Collapsible with smooth animations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Nested sections with Radix Collapsible</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Badge support for notifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Active state highlighting</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Header</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Search functionality</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Notification counter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>User menu with avatar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Mobile responsive</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Breadcrumbs</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Automatic home icon</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Custom separators</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Icon support per item</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>ARIA navigation landmarks</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Tabs</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Radix UI primitive</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Keyboard navigation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>Smooth transitions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500">✓</span>
                        <span>WCAG 2.1 compliant</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold mb-3">Additional Features</h3>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">✓</span>
                      <span><strong>Avatar:</strong> User profile images with fallback initials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">✓</span>
                      <span><strong>UserMenu:</strong> Dropdown with profile, settings, help, logout</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">✓</span>
                      <span><strong>Dark Mode:</strong> Full support across all components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">✓</span>
                      <span><strong>Glassmorphism:</strong> Consistent with Vextrus Vision</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">✓</span>
                      <span><strong>TypeScript:</strong> Fully typed with interfaces</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">✓</span>
                      <span><strong>Accessibility:</strong> WCAG 2.1 AA+ compliant</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}