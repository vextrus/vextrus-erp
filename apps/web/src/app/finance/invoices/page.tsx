/**
 * Invoice List Page
 *
 * Displays paginated list of invoices with DataTable, filtering and search.
 * Uses real GraphQL data from Finance service.
 *
 * Features:
 * - DataTable with pagination and sorting
 * - Search by invoice number or customer
 * - Filter by status
 * - Real-time data fetching
 * - View invoice details
 * - Create new invoice
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
import { useGetInvoicesQuery } from '@/lib/graphql/generated/types';
import { Plus, Eye } from 'lucide-react';

// Invoice type for the table
type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  customerId: string;
  customerTIN?: string | null;
  customerBIN?: string | null;
  grandTotal: { amount: number; currency: string };
  invoiceDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

function InvoiceListContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch invoices
  const { data, loading, error, refetch } = useGetInvoicesQuery({
    variables: { limit: 100, offset: 0 },
  });

  const invoices = (data?.invoices || []) as Invoice[];

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        searchQuery === '' ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.customerTIN && invoice.customerTIN.includes(searchQuery));

      const matchesStatus =
        statusFilter === 'all' ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Status badge colors
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      DRAFT: { variant: 'default', label: 'Draft' },
      PENDING: { variant: 'warning', label: 'Pending' },
      APPROVED: { variant: 'info', label: 'Approved' },
      PAID: { variant: 'success', label: 'Paid' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
      OVERDUE: { variant: 'error', label: 'Overdue' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  // Column definitions
  const columns: ColumnDef<Invoice>[] = useMemo(() => [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.original.invoiceNumber}
        </div>
      ),
    },
    {
      accessorKey: 'customerId',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {row.original.customerId}
          </div>
          {row.original.customerTIN && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              TIN: {row.original.customerTIN}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'invoiceDate',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {formatDate(row.original.invoiceDate)}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {formatDate(row.original.dueDate)}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'grandTotal',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(
            row.original.grandTotal.amount,
            row.original.grandTotal.currency
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
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/finance/invoices/${row.original.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [router]);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Invoices
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and track all your invoices
            </p>
          </div>
          <Button onClick={() => router.push('/finance/invoices/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load invoices: {error.message}
            </p>
          </div>
        )}

        {/* Toolbar and Filters */}
        <div className="flex flex-col gap-4">
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by invoice #, customer, or TIN..."
            showRefresh
            onRefreshClick={() => refetch()}
          />

          {/* Status Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Status:
            </label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'PAID', label: 'Paid' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'OVERDUE', label: 'Overdue' },
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredInvoices}
          loading={loading}
          enablePagination={true}
          defaultPageSize={20}
          pageSizeOptions={[10, 20, 30, 50]}
          enableSorting={true}
          emptyState={{
            title: 'No invoices found',
            description: searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating a new invoice.',
            action: {
              label: 'New Invoice',
              onClick: () => router.push('/finance/invoices/new'),
            },
          }}
        />
      </div>
    </AppLayout>
  );
}

export default function InvoiceListPage() {
  return (
    <ProtectedRoute>
      <InvoiceListContent />
    </ProtectedRoute>
  );
}
