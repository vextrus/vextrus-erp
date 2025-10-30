/**
 * Application Layout
 *
 * Main layout wrapper for authenticated application pages.
 * Includes sidebar navigation, header, and breadcrumbs.
 *
 * Usage:
 * ```tsx
 * import { AppLayout } from '@/components/layout/app-layout';
 *
 * export default function Page() {
 *   return (
 *     <AppLayout>
 *       <div>Page content here</div>
 *     </AppLayout>
 *   );
 * }
 * ```
 */

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sidebar, SidebarSection } from '@/components/ui/sidebar';
import { Header } from '@/components/ui/header';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  UserCircle,
  Package,
  FolderKanban,
  BarChart3,
  FileText,
  Receipt,
  CreditCard,
  BookOpen,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Generate sidebar navigation sections based on user permissions
 */
function generateSidebarSections(pathname: string): SidebarSection[] {
  return [
    {
      id: 'main',
      title: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
          active: pathname === '/dashboard',
        },
      ],
      defaultOpen: true,
    },
    {
      id: 'finance',
      title: 'Finance',
      icon: <DollarSign className="h-4 w-4" />,
      items: [
        {
          id: 'invoices',
          label: 'Invoices',
          href: '/finance/invoices',
          icon: <Receipt className="h-4 w-4" />,
          active: pathname.startsWith('/finance/invoices'),
        },
        {
          id: 'payments',
          label: 'Payments',
          href: '/finance/payments',
          icon: <CreditCard className="h-4 w-4" />,
          active: pathname.startsWith('/finance/payments'),
        },
        {
          id: 'accounts',
          label: 'Chart of Accounts',
          href: '/finance/accounts',
          icon: <BookOpen className="h-4 w-4" />,
          active: pathname.startsWith('/finance/accounts'),
        },
        {
          id: 'journal',
          label: 'Journal Entries',
          href: '/finance/journal',
          icon: <FileText className="h-4 w-4" />,
          active: pathname.startsWith('/finance/journal'),
        },
      ],
      defaultOpen: pathname.startsWith('/finance'),
    },
    {
      id: 'crm',
      title: 'CRM',
      icon: <Users className="h-4 w-4" />,
      items: [
        {
          id: 'customers',
          label: 'Customers',
          href: '/crm/customers',
          icon: <UserCircle className="h-4 w-4" />,
          active: pathname.startsWith('/crm/customers'),
        },
      ],
      defaultOpen: pathname.startsWith('/crm'),
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: <Package className="h-4 w-4" />,
      items: [
        {
          id: 'products',
          label: 'Products',
          href: '/inventory/products',
          icon: <Package className="h-4 w-4" />,
          active: pathname.startsWith('/inventory/products'),
        },
      ],
      defaultOpen: pathname.startsWith('/inventory'),
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: <FolderKanban className="h-4 w-4" />,
      items: [
        {
          id: 'project-list',
          label: 'All Projects',
          href: '/projects',
          icon: <FolderKanban className="h-4 w-4" />,
          active: pathname === '/projects',
        },
      ],
      defaultOpen: pathname.startsWith('/projects'),
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <BarChart3 className="h-4 w-4" />,
      items: [
        {
          id: 'analytics',
          label: 'Analytics',
          href: '/reports/analytics',
          icon: <BarChart3 className="h-4 w-4" />,
          active: pathname.startsWith('/reports/analytics'),
        },
      ],
      defaultOpen: pathname.startsWith('/reports'),
    },
  ];
}

/**
 * Generate breadcrumbs from current pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Capitalize and format segment
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}

export function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarSections = generateSidebarSections(pathname);
  const autoBreadcrumbs = generateBreadcrumbs(pathname);
  const displayBreadcrumbs = breadcrumbs || autoBreadcrumbs;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        sections={sidebarSections}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        logo={
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-lg">Vextrus</span>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Theme Switcher */}
        <div className="relative">
          <Header
            user={{
              name: user.name,
              email: user.email,
            }}
            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            onLogoutClick={handleLogout}
            onProfileClick={() => router.push('/profile')}
            onSettingsClick={() => router.push('/settings')}
            onHelpClick={() => router.push('/help')}
            notificationCount={0}
          />
          {/* Theme Switcher - positioned absolutely to insert before user menu */}
          <div className="absolute right-20 top-4">
            <ThemeSwitcher />
          </div>
        </div>

        {/* Breadcrumbs */}
        {displayBreadcrumbs.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
            <Breadcrumbs items={displayBreadcrumbs} />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
