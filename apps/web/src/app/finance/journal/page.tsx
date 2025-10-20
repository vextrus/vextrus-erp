/**
 * Journal Entries List Page
 *
 * Displays all journal entries with filtering and actions.
 *
 * Features:
 * - List all journal entries with pagination
 * - Filter by status (DRAFT, POSTED, REVERSED)
 * - Create new journal entry
 * - View journal details
 * - Real-time balance checking
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Select } from '@/components/ui/select';
import { useGetJournalsQuery } from '@/lib/graphql/generated/types';
import { Plus, FileText } from 'lucide-react';

function JournalListContent() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Fetch journals
  const { data, loading, error } = useGetJournalsQuery({
    variables: {
      limit: 50,
      offset: 0,
      status: statusFilter as any,
    },
  });

  const journals = data?.journals || [];

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

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Filter by Status
              </label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value)}
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
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <p className="text-sm">
              Failed to load journals: {error.message}
            </p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">Loading journals...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && journals.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No journal entries found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter
                ? `No journal entries with status: ${statusFilter}`
                : 'Get started by creating your first journal entry.'}
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/finance/journal/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Journal Entry
              </Button>
            </div>
          </Card>
        )}

        {/* Journals Table */}
        {!loading && !error && journals.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Journal #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Credit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {journals.map((journal) => (
                    <tr
                      key={journal.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => router.push(`/finance/journal/${journal.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {journal.journalNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(journal.journalDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="max-w-xs truncate">{journal.description}</div>
                        {journal.reference && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ref: {journal.reference}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(journal.totalDebit, journal.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(journal.totalCredit, journal.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(journal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/finance/journal/${journal.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination placeholder */}
        {!loading && !error && journals.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {journals.length} journal entries
            </p>
          </div>
        )}
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
