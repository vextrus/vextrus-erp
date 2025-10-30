/**
 * Dashboard Page
 *
 * Main dashboard page for authenticated users.
 * Protected route that requires authentication.
 *
 * Shows:
 * - User information
 * - Navigation to different modules
 * - Quick stats and overview
 */

'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back, {user?.name}
          </p>
        </div>

        {/* User Info Card */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">User Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.organizationId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.roleId || 'None'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.status || 'Active'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Modules Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Modules</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Finance</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Manage invoices, payments, and accounting
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => router.push('/finance/invoices')}
              >
                Go to Finance
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
              <h3 className="text-lg font-semibold text-gray-900">CRM</h3>
              <p className="mt-2 text-sm text-gray-500">
                Customer relationship management
              </p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
              <h3 className="text-lg font-semibold text-gray-900">HR</h3>
              <p className="mt-2 text-sm text-gray-500">
                Human resources management
              </p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
              <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
              <p className="mt-2 text-sm text-gray-500">
                Stock and inventory management
              </p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
              <h3 className="text-lg font-semibold text-gray-900">Project Management</h3>
              <p className="mt-2 text-sm text-gray-500">
                Manage construction projects
              </p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
              <h3 className="text-lg font-semibold text-gray-900">Reporting</h3>
              <p className="mt-2 text-sm text-gray-500">
                Analytics and reports
              </p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Quick Stats</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Total Invoices</div>
              <div className="mt-2 text-3xl font-bold">-</div>
              <div className="mt-2 text-sm text-gray-500">Coming soon</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Pending Payments</div>
              <div className="mt-2 text-3xl font-bold">-</div>
              <div className="mt-2 text-sm text-gray-500">Coming soon</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Active Projects</div>
              <div className="mt-2 text-3xl font-bold">-</div>
              <div className="mt-2 text-sm text-gray-500">Coming soon</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Team Members</div>
              <div className="mt-2 text-3xl font-bold">-</div>
              <div className="mt-2 text-sm text-gray-500">Coming soon</div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
