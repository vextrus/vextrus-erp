/**
 * Account Detail Page
 *
 * Displays detailed information about a single chart of account.
 * Includes account details, balance, and hierarchy information.
 *
 * Features:
 * - Full account details
 * - Account balance
 * - Parent account information
 * - Deactivate account action
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
import { Input } from '@/components/ui/input';
import {
  useGetChartOfAccountQuery,
  useDeactivateAccountMutation,
} from '@/lib/graphql/generated/types';
import { ArrowLeft, XCircle } from 'lucide-react';

interface AccountDetailPageProps {
  params: {
    id: string;
  };
}

function AccountDetailContent({ params }: AccountDetailPageProps) {
  const router = useRouter();
  const { id } = params;

  // Dialog state
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  // Fetch account details
  const { data, loading, error, refetch } = useGetChartOfAccountQuery({
    variables: { id },
  });

  const account = data?.chartOfAccount;

  // Deactivate mutation
  const [deactivateAccount, { loading: deactivatingLoading }] = useDeactivateAccountMutation({
    onCompleted: () => {
      toast.success('Account deactivated successfully', {
        description: `Account ${account?.accountCode} has been deactivated`,
      });
      setShowDeactivateDialog(false);
      setDeactivateReason('');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to deactivate account', {
        description: error.message,
      });
    },
    refetchQueries: ['GetChartOfAccounts', 'GetChartOfAccount'],
  });

  // Handle deactivate
  const handleDeactivate = () => {
    if (!deactivateReason.trim()) {
      toast.error('Please provide a deactivation reason');
      return;
    }
    deactivateAccount({ variables: { id, reason: deactivateReason } });
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
      month: 'long',
      day: 'numeric',
    });
  };

  // Account type badge
  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      ASSET: { variant: 'success', label: 'Asset' },
      LIABILITY: { variant: 'error', label: 'Liability' },
      EQUITY: { variant: 'info', label: 'Equity' },
      REVENUE: { variant: 'success', label: 'Revenue' },
      EXPENSE: { variant: 'warning', label: 'Expense' },
    };
    const config = typeMap[type] || { variant: 'default' as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/finance/accounts')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? 'Loading...' : `Account ${account?.accountCode}`}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage account details
              </p>
            </div>
          </div>

          {!loading && account && account.isActive && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeactivateDialog(true)}
                disabled={deactivatingLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {deactivatingLoading ? 'Deactivating...' : 'Deactivate Account'}
              </Button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="error">
            <p className="text-sm">
              Failed to load account: {error.message}
            </p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">Loading account...</span>
          </div>
        )}

        {/* Account Details */}
        {!loading && !error && account && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Account Details</h2>
                  {account.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="error">Inactive</Badge>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Account Code - Large and prominent */}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Account Code
                    </p>
                    <p className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100">
                      {account.accountCode}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Account Name
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {account.accountName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Account Type
                      </p>
                      <div className="mt-1">
                        {getTypeBadge(account.accountType)}
                      </div>
                    </div>

                    {account.parentAccount && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Parent Account
                        </p>
                        <button
                          onClick={() => router.push(`/finance/accounts/${account.parentAccount?.id}`)}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {account.parentAccount.accountCode} - {account.parentAccount.accountName}
                        </button>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Currency
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {account.currency}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Balance
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(account.balance.amount, account.balance.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Summary</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Current Balance
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(account.balance.amount, account.balance.currency)}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Type
                    </p>
                    {getTypeBadge(account.accountType)}
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </p>
                    {account.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="error">Inactive</Badge>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Created
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(account.createdAt)}
                </p>

                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-4">
                  Last Updated
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(account.updatedAt)}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Deactivate Account Dialog */}
        <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate this account? Please provide a reason for deactivation.
                This action will prevent this account from being used in new transactions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Deactivation Reason *
              </label>
              <Input
                placeholder="Enter reason for deactivation..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                disabled={deactivatingLoading}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deactivatingLoading}
                onClick={() => {
                  setShowDeactivateDialog(false);
                  setDeactivateReason('');
                }}
              >
                No, keep account
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeactivate}
                disabled={deactivatingLoading || !deactivateReason.trim()}
              >
                {deactivatingLoading ? 'Deactivating...' : 'Yes, deactivate account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

export default function AccountDetailPage({ params }: AccountDetailPageProps) {
  return (
    <ProtectedRoute>
      <AccountDetailContent params={params} />
    </ProtectedRoute>
  );
}
