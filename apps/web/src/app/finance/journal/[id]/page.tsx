/**
 * Journal Entry Detail Page
 *
 * Displays detailed information about a single journal entry.
 * Includes journal lines, totals, and state transition actions.
 *
 * Features:
 * - Full journal details with header information
 * - Journal lines table with debits and credits
 * - Balance validation display
 * - State transitions (Post, Reverse)
 * - Immutable after posting
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  useGetJournalQuery,
  usePostJournalMutation,
  useReverseJournalMutation,
} from '@/lib/graphql/generated/types';
import {
  ArrowLeft,
  CheckCircle,
  RotateCcw,
  FileText,
} from 'lucide-react';

interface JournalDetailPageProps {
  params: {
    id: string;
  };
}

function JournalDetailContent({ params }: JournalDetailPageProps) {
  const router = useRouter();
  const { id } = params;

  // Dialog state
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [reversingDate, setReversingDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch journal details
  const { data, loading, error, refetch } = useGetJournalQuery({
    variables: { id },
  });

  const journal = data?.journal;

  // Post mutation
  const [postJournal, { loading: postingLoading }] = usePostJournalMutation({
    onCompleted: (data) => {
      toast.success('Journal posted successfully', {
        description: `Journal ${data.postJournal.journalNumber} has been posted to ledger`,
      });
      setShowPostDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to post journal', {
        description: error.message,
      });
    },
    refetchQueries: ['GetJournals', 'GetJournal'],
  });

  // Reverse mutation
  const [reverseJournal, { loading: reversingLoading }] = useReverseJournalMutation({
    onCompleted: (data) => {
      toast.success('Journal reversed successfully', {
        description: `Reversing journal ${data.reverseJournal.journalNumber} has been created`,
      });
      setShowReverseDialog(false);
      setReversingDate(new Date().toISOString().split('T')[0]);
      // Navigate to the reversing journal
      router.push(`/finance/journal/${data.reverseJournal.id}`);
    },
    onError: (error) => {
      toast.error('Failed to reverse journal', {
        description: error.message,
      });
    },
    refetchQueries: ['GetJournals', 'GetJournal'],
  });

  // Handle post
  const handlePost = () => {
    postJournal({ variables: { id } });
  };

  // Handle reverse
  const handleReverse = () => {
    if (!reversingDate) {
      toast.error('Please provide a reversing date');
      return;
    }
    reverseJournal({ variables: { id, reversingDate } });
  };

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
      month: 'long',
      day: 'numeric',
    });
  };

  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      DRAFT: { variant: 'default', label: 'Draft' },
      POSTED: { variant: 'success', label: 'Posted' },
      REVERSED: { variant: 'warning', label: 'Reversed' },
    };
    const config = statusMap[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Journal type badge
  const getJournalTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      GENERAL: 'General',
      SALES: 'Sales',
      PURCHASE: 'Purchase',
      CASH_PAYMENT: 'Cash Payment',
      CASH_RECEIPT: 'Cash Receipt',
      OPENING: 'Opening',
      CLOSING: 'Closing',
      ADJUSTMENT: 'Adjustment',
      REVERSING: 'Reversing',
    };
    return <Badge variant="info">{typeMap[type] || type}</Badge>;
  };

  // Calculate balance
  const calculateBalance = () => {
    if (!journal) return 0;
    return journal.totalDebit - journal.totalCredit;
  };

  const balance = calculateBalance();
  const isBalanced = Math.abs(balance) < 0.01;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/finance/journal')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? 'Loading...' : `Journal ${journal?.journalNumber}`}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage journal entry details
              </p>
            </div>
          </div>

          {!loading && journal && (
            <div className="flex items-center gap-2">
              {/* Post button - only show for DRAFT journals */}
              {journal.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowPostDialog(true)}
                  disabled={postingLoading || !isBalanced}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {postingLoading ? 'Posting...' : 'Post Journal'}
                </Button>
              )}

              {/* Reverse button - only show for POSTED journals */}
              {journal.status === 'POSTED' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowReverseDialog(true)}
                  disabled={reversingLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {reversingLoading ? 'Reversing...' : 'Reverse Journal'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <p className="text-sm">
              Failed to load journal: {error.message}
            </p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">Loading journal...</span>
          </div>
        )}

        {/* Journal Details */}
        {!loading && !error && journal && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Journal Header Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Journal Entry Details</h2>
                  <div className="flex gap-2">
                    {getStatusBadge(journal.status)}
                    {getJournalTypeBadge(journal.journalType)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Journal Number
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {journal.journalNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Journal Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(journal.journalDate)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Description
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {journal.description}
                    </p>
                  </div>
                  {journal.reference && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reference
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {journal.reference}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Fiscal Period
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {journal.fiscalPeriod}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Currency
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {journal.currency}
                    </p>
                  </div>
                </div>

                {/* Posted/Reversed Information */}
                {journal.status === 'POSTED' && journal.postedAt && (
                  <>
                    <Separator className="my-6" />
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Posted by {journal.postedBy || 'System'} at {formatDateTime(journal.postedAt)}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        This journal is now immutable and cannot be edited
                      </p>
                    </div>
                  </>
                )}

                {journal.status === 'REVERSED' && journal.postedAt && (
                  <>
                    <Separator className="my-6" />
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Reversed by {journal.postedBy || 'System'} at {formatDateTime(journal.postedAt)}
                      </p>
                      {journal.originalJournalId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2 p-0 h-auto text-yellow-700 dark:text-yellow-300"
                          onClick={() => router.push(`/finance/journal/${journal.originalJournalId}`)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          View reversing journal entry
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {journal.isReversing && journal.originalJournalId && (
                  <>
                    <Separator className="my-6" />
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        This is a reversing entry
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto text-blue-700 dark:text-blue-300"
                        onClick={() => router.push(`/finance/journal/${journal.originalJournalId}`)}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        View original journal entry
                      </Button>
                    </div>
                  </>
                )}
              </Card>

              {/* Journal Lines */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Journal Lines</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Account ID
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Description
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Debit
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Credit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {journal.lines.map((line) => (
                        <tr key={line.lineId}>
                          <td className="py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {line.accountId}
                          </td>
                          <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div>{line.description || '-'}</div>
                            {line.costCenter && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Cost Center: {line.costCenter}
                              </div>
                            )}
                            {line.project && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Project: {line.project}
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            {line.debitAmount > 0 ? formatCurrency(line.debitAmount, journal.currency) : '-'}
                          </td>
                          <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            {line.creditAmount > 0 ? formatCurrency(line.creditAmount, journal.currency) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300 dark:border-gray-600">
                      <tr>
                        <td colSpan={2} className="py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Totals
                        </td>
                        <td className="py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(journal.totalDebit, journal.currency)}
                        </td>
                        <td className="py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(journal.totalCredit, journal.currency)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Balance
                        </td>
                        <td colSpan={2} className={`py-3 text-sm text-right font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(Math.abs(balance), journal.currency)}
                          {isBalanced ? ' ✓ Balanced' : ` ✗ Unbalanced (${balance > 0 ? 'Debit > Credit' : 'Credit > Debit'})`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Created
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDateTime(journal.createdAt)}
                </p>

                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-4">
                  Last Updated
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDateTime(journal.updatedAt)}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Post Journal Dialog */}
        <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Post Journal to Ledger</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to post this journal? This will make it immutable and affect account balances.
                This action cannot be undone (though it can be reversed with a reversing entry).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={postingLoading}>
                No, keep as draft
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePost}
                disabled={postingLoading}
              >
                {postingLoading ? 'Posting...' : 'Yes, post journal'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reverse Journal Dialog */}
        <AlertDialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverse Journal Entry</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new reversing journal entry that offsets this journal by swapping debits and credits.
                Specify the reversing date below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Reversing Date *
              </label>
              <Input
                type="date"
                value={reversingDate}
                onChange={(e) => setReversingDate(e.target.value)}
                disabled={reversingLoading}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={reversingLoading}
                onClick={() => {
                  setShowReverseDialog(false);
                  setReversingDate(new Date().toISOString().split('T')[0]);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleReverse}
                disabled={reversingLoading || !reversingDate}
              >
                {reversingLoading ? 'Reversing...' : 'Create reversing entry'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

export default function JournalDetailPage({ params }: JournalDetailPageProps) {
  return (
    <ProtectedRoute>
      <JournalDetailContent params={params} />
    </ProtectedRoute>
  );
}
