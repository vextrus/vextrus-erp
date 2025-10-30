/**
 * Payments Page
 *
 * Displays list of payments with DataTable, filtering and search.
 *
 * Features:
 * - DataTable with pagination and sorting
 * - Search by payment number or invoice
 * - Filter by status and payment method
 * - Real-time data from backend
 * - Payment details
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Select } from '@/components/ui/select';
import { useGetPaymentsByStatusQuery } from '@/lib/graphql/generated/types';
import { Plus } from 'lucide-react';

// Payment type for the table
type Payment = {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: { amount: number; currency: string };
  paymentMethod: string;
  status: string;
  paymentDate: string;
  reference?: string | null;
  createdAt: string;
  updatedAt: string;
};

function PaymentsContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Fetch payments by status
  const { data, loading, error, refetch } = useGetPaymentsByStatusQuery({
    variables: {
      status: statusFilter as any,
      limit: 100,
      offset: 0,
    },
    skip: statusFilter === 'all', // Skip query if showing all
  });

  const payments = (data?.paymentsByStatus || []) as Payment[];

  // Filter payments based on search and method
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch =
        searchQuery === '' ||
        payment.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod =
        methodFilter === 'all' ||
        payment.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      PENDING: { variant: 'warning', label: 'Pending' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      FAILED: { variant: 'error', label: 'Failed' },
      REFUNDED: { variant: 'info', label: 'Refunded' },
      RECONCILED: { variant: 'success', label: 'Reconciled' },
      REVERSED: { variant: 'error', label: 'Reversed' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Method badge
  const getMethodBadge = (method: string) => {
    const methodMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      BANK_TRANSFER: { variant: 'info', label: 'Bank Transfer' },
      CASH: { variant: 'success', label: 'Cash' },
      CHEQUE: { variant: 'default', label: 'Cheque' },
      MOBILE_WALLET: { variant: 'info', label: 'Mobile Wallet' },
    };

    const config = methodMap[method] || { variant: 'default', label: method };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Column definitions
  const columns: ColumnDef<Payment>[] = useMemo(() => [
    {
      accessorKey: 'paymentNumber',
      header: 'Payment #',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.original.paymentNumber}
        </div>
      ),
    },
    {
      accessorKey: 'invoiceId',
      header: 'Invoice',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {row.original.invoiceId}
        </div>
      ),
    },
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {formatDate(row.original.paymentDate)}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }) => getMethodBadge(row.original.paymentMethod),
      enableSorting: true,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(
            row.original.amount.amount,
            row.original.amount.currency
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
      enableSorting: true,
    },
  ], []);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Payments
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track and manage payments
            </p>
          </div>
          <Button onClick={() => router.push('/finance/payments/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load payments: {error.message}
            </p>
          </div>
        )}

        {/* Toolbar and Filters */}
        <div className="flex flex-col gap-4">
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by payment # or invoice..."
            showRefresh
            onRefreshClick={() => refetch()}
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'FAILED', label: 'Failed' },
                  { value: 'REFUNDED', label: 'Refunded' },
                ]}
                placeholder="Select status"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Method:
              </label>
              <Select
                value={methodFilter}
                onValueChange={setMethodFilter}
                options={[
                  { value: 'all', label: 'All Methods' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CHEQUE', label: 'Cheque' },
                  { value: 'MOBILE_WALLET', label: 'Mobile Wallet' },
                ]}
                placeholder="All Methods"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredPayments}
          loading={loading}
          enablePagination={true}
          defaultPageSize={20}
          pageSizeOptions={[10, 20, 30, 50]}
          enableSorting={true}
          emptyState={{
            title: 'No payments found',
            description: searchQuery || methodFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by recording a payment.',
            action: {
              label: 'New Payment',
              onClick: () => router.push('/finance/payments/new'),
            },
          }}
        />
      </div>
    </AppLayout>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <PaymentsContent />
    </ProtectedRoute>
  );
}
