/**
 * Chart of Accounts Page
 *
 * Displays hierarchical chart of accounts with DataTable.
 * Shows account structure, balances, and account types.
 *
 * Features:
 * - DataTable with pagination and sorting
 * - Search by account code or name
 * - Filter by account type
 * - Hierarchical account display with indentation
 * - Create/Edit accounts
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
import { useGetChartOfAccountsQuery } from '@/lib/graphql/generated/types';
import { Plus, ChevronRight } from 'lucide-react';

// Account type for the table
type Account = {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountId: string | null;
  balance: { amount: number; currency: string };
  currency: string;
  isActive: boolean;
  level: number; // For hierarchical display
  hasChildren: boolean;
};

function ChartOfAccountsContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch chart of accounts
  const { data, loading, error, refetch } = useGetChartOfAccountsQuery();

  const rawAccounts = data?.chartOfAccounts || [];

  // Build hierarchical structure with levels
  const accounts = useMemo(() => {
    // Create a map for quick lookup
    const accountMap = new Map(rawAccounts.map(acc => [acc.id, acc]));

    // Build child relationships
    const childrenMap = new Map<string, typeof rawAccounts>();
    rawAccounts.forEach(acc => {
      if (acc.parentAccountId) {
        if (!childrenMap.has(acc.parentAccountId)) {
          childrenMap.set(acc.parentAccountId, []);
        }
        childrenMap.get(acc.parentAccountId)?.push(acc);
      }
    });

    // Flatten with levels (recursive)
    const flattenWithLevel = (
      accounts: typeof rawAccounts,
      level: number = 0
    ): Account[] => {
      const result: Account[] = [];
      accounts.forEach(acc => {
        const children = childrenMap.get(acc.id) || [];
        result.push({
          ...acc,
          level,
          hasChildren: children.length > 0,
        });
        if (children.length > 0) {
          result.push(...flattenWithLevel(children, level + 1));
        }
      });
      return result;
    };

    // Start with root accounts (no parent)
    const rootAccounts = rawAccounts.filter(acc => !acc.parentAccountId);
    return flattenWithLevel(rootAccounts);
  }, [rawAccounts]);

  // Filter accounts based on search and type
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch =
        searchQuery === '' ||
        acc.accountCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.accountName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === 'all' ||
        acc.accountType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, typeFilter]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Account type badge
  const getAccountTypeBadge = (type: string) => {
    const typeMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      ASSET: { variant: 'success', label: 'Asset' },
      LIABILITY: { variant: 'error', label: 'Liability' },
      EQUITY: { variant: 'info', label: 'Equity' },
      REVENUE: { variant: 'success', label: 'Revenue' },
      EXPENSE: { variant: 'warning', label: 'Expense' },
    };

    const config = typeMap[type] || { variant: 'default', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Column definitions
  const columns: ColumnDef<Account>[] = useMemo(() => [
    {
      accessorKey: 'accountCode',
      header: 'Account Code',
      cell: ({ row }) => {
        const indent = row.original.level * 24;
        return (
          <div
            className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100"
            style={{ paddingLeft: `${indent}px` }}
          >
            {row.original.hasChildren && (
              <ChevronRight className="inline h-4 w-4 mr-1 text-gray-400" />
            )}
            {row.original.accountCode}
          </div>
        );
      },
    },
    {
      accessorKey: 'accountName',
      header: 'Account Name',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {row.original.accountName}
        </div>
      ),
    },
    {
      accessorKey: 'accountType',
      header: 'Type',
      cell: ({ row }) => getAccountTypeBadge(row.original.accountType),
      enableSorting: true,
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-right text-gray-900 dark:text-gray-100">
          {formatCurrency(row.original.balance.amount, row.original.balance.currency)}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
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
              Chart of Accounts
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your accounting structure
            </p>
          </div>
          <Button onClick={() => router.push('/finance/accounts/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load accounts: {error.message}
            </p>
          </div>
        )}

        {/* Toolbar and Filters */}
        <div className="flex flex-col gap-4">
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by code or name..."
            showRefresh
            onRefreshClick={() => refetch()}
          />

          {/* Type Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Type:
            </label>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'ASSET', label: 'Asset' },
                { value: 'LIABILITY', label: 'Liability' },
                { value: 'EQUITY', label: 'Equity' },
                { value: 'REVENUE', label: 'Revenue' },
                { value: 'EXPENSE', label: 'Expense' },
              ]}
              placeholder="All Types"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredAccounts}
          loading={loading}
          enablePagination={true}
          defaultPageSize={20}
          pageSizeOptions={[10, 20, 30, 50, 100]}
          enableSorting={true}
          emptyState={{
            title: 'No accounts found',
            description: searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your chart of accounts.',
            action: {
              label: 'New Account',
              onClick: () => router.push('/finance/accounts/new'),
            },
          }}
          onRowSelectionChange={(selectedRows) => {
            // Navigate to detail on row click
            if (selectedRows.length === 1) {
              router.push(`/finance/accounts/${selectedRows[0].id}`);
            }
          }}
        />
      </div>
    </AppLayout>
  );
}

export default function ChartOfAccountsPage() {
  return (
    <ProtectedRoute>
      <ChartOfAccountsContent />
    </ProtectedRoute>
  );
}
