/**
 * Chart of Accounts Page
 *
 * Displays hierarchical chart of accounts.
 * Shows account structure, balances, and account types.
 *
 * Features:
 * - Hierarchical account display
 * - Account balances
 * - Account type filtering
 * - Create/Edit accounts
 */

'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { useGetChartOfAccountsQuery } from '@/lib/graphql/generated/types';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';

function ChartOfAccountsContent() {
  const router = useRouter();

  // Fetch chart of accounts
  const { data, loading, error } = useGetChartOfAccountsQuery();

  const accounts = data?.chartOfAccounts || [];

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Account type badge
  const getAccountTypeBadge = (type: string) => {
    const typeMap: Record<string, { variant: any; label: string }> = {
      ASSET: { variant: 'default', label: 'Asset' },
      LIABILITY: { variant: 'default', label: 'Liability' },
      EQUITY: { variant: 'default', label: 'Equity' },
      REVENUE: { variant: 'default', label: 'Revenue' },
      EXPENSE: { variant: 'default', label: 'Expense' },
    };

    const config = typeMap[type] || { variant: 'default', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Group accounts by parent
  const rootAccounts = accounts.filter((acc) => !acc.parentAccountId);
  const childAccountsMap = new Map<string, typeof accounts>();

  accounts.forEach((acc) => {
    if (acc.parentAccountId) {
      if (!childAccountsMap.has(acc.parentAccountId)) {
        childAccountsMap.set(acc.parentAccountId, []);
      }
      childAccountsMap.get(acc.parentAccountId)?.push(acc);
    }
  });

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
          <Alert variant="error">
            <p className="text-sm">
              Failed to load accounts: {error.message}
            </p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">
              Loading chart of accounts...
            </span>
          </div>
        )}

        {/* Accounts List */}
        {!loading && !error && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Account Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          No accounts found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Get started by creating your chart of accounts.
                        </p>
                        <div className="mt-6">
                          <Button
                            onClick={() => router.push('/finance/accounts/new')}
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New Account
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {rootAccounts.map((account) => (
                        <AccountRow
                          key={account.id}
                          account={account}
                          childAccounts={childAccountsMap.get(account.id) || []}
                          formatCurrency={formatCurrency}
                          getAccountTypeBadge={getAccountTypeBadge}
                          level={0}
                        />
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

interface AccountRowProps {
  account: any;
  childAccounts: any[];
  formatCurrency: (amount: number, currency: string) => string;
  getAccountTypeBadge: (type: string) => JSX.Element;
  level: number;
}

function AccountRow({
  account,
  childAccounts,
  formatCurrency,
  getAccountTypeBadge,
  level,
}: AccountRowProps) {
  const indent = level * 24;

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="px-6 py-4 whitespace-nowrap">
          <div
            className="text-sm font-mono text-gray-900 dark:text-gray-100"
            style={{ paddingLeft: `${indent}px` }}
          >
            {childAccounts.length > 0 && (
              <ChevronRight className="inline h-4 w-4 mr-1" />
            )}
            {account.accountCode}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {account.accountName}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getAccountTypeBadge(account.accountType)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(account.balance.amount, account.balance.currency)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          {account.isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </td>
      </tr>

      {/* Render child accounts recursively */}
      {childAccounts.map((child) => (
        <AccountRow
          key={child.id}
          account={child}
          childAccounts={[]}
          formatCurrency={formatCurrency}
          getAccountTypeBadge={getAccountTypeBadge}
          level={level + 1}
        />
      ))}
    </>
  );
}

export default function ChartOfAccountsPage() {
  return (
    <ProtectedRoute>
      <ChartOfAccountsContent />
    </ProtectedRoute>
  );
}
