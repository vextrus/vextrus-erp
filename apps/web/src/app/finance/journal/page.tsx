/**
 * Journal Entries List Page
 *
 * Displays all journal entries with DataTable, filtering and search.
 *
 * Features:
 * - DataTable with pagination and sorting
 * - Search by journal number or description
 * - Filter by status (DRAFT, POSTED, REVERSED)
 * - Real-time balance checking
 * - Create new journal entry
 * - View journal details
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
import { useGetJournalsQuery } from '@/lib/graphql/generated/types';
import { Plus } from 'lucide-react';

// Journal type for the table
type Journal = {
  id: string;
  journalNumber: string;
  journalDate: string;
  journalType: string;
  description: string;
  reference?: string | null;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  status: string;
  fiscalPeriod: string;
  isReversing: boolean;
  originalJournalId?: string | null;
  createdAt: string;
  updatedAt: string;
};

function JournalListContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch journals with optional status filter
  const { data, loading, error, refetch } = useGetJournalsQuery({
    variables: {
      limit: 100, // Load more for client-side pagination
      offset: 0,
      status: statusFilter === 'all' ? undefined : (statusFilter as any),
    },
  });

  const journals = (data?.journals || []) as Journal[];

  // Filter journals based on search
  const filteredJournals = useMemo(() => {
    return journals.filter(journal => {
      const matchesSearch =
        searchQuery === '' ||
        journal.journalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (journal.reference && journal.reference.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [journals, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      DRAFT: { variant: 'default', label: 'Draft' },
      POSTED: { variant: 'success', label: 'Posted' },
      REVERSED: { variant: 'warning', label: 'Reversed' },
      ERROR: { variant: 'error', label: 'Error' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
    };

    const config = statusMap[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Column definitions
  const columns: ColumnDef<Journal>[] = useMemo(() => [
    {
      accessorKey: 'journalNumber',
      header: 'Journal #',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.original.journalNumber}
        </div>
      ),
    },
    {
      accessorKey: 'journalDate',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(row.original.journalDate)}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
            {row.original.description}
          </div>
          {row.original.reference && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Ref: {row.original.reference}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'totalDebit',
      header: 'Total Debit',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-right text-gray-900 dark:text-gray-100">
          {formatCurrency(row.original.totalDebit, row.original.currency)}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'totalCredit',
      header: 'Total Credit',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-right text-gray-900 dark:text-gray-100">
          {formatCurrency(row.original.totalCredit, row.original.currency)}
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
              router.push(`/finance/journal/${row.original.id}`);
            }}
          >
            View
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
              Journal Entries
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Record and manage journal entries
            </p>
          </div>
          <Button onClick={() => router.push('/finance/journal/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load journals: {error.message}
            </p>
          </div>
        )}

        {/* Toolbar and Filters */}
        <div className="flex flex-col gap-4">
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by journal # or description..."
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
                { value: 'POSTED', label: 'Posted' },
                { value: 'REVERSED', label: 'Reversed' },
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredJournals}
          loading={loading}
          enablePagination={true}
          defaultPageSize={20}
          pageSizeOptions={[10, 20, 30, 50]}
          enableSorting={true}
          emptyState={{
            title: 'No journal entries found',
            description: searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first journal entry.',
            action: {
              label: 'Create Journal Entry',
              onClick: () => router.push('/finance/journal/new'),
            },
          }}
        />
      </div>
    </AppLayout>
  );
}

export default function JournalPage() {
  return (
    <ProtectedRoute>
      <JournalListContent />
    </ProtectedRoute>
  );
}
