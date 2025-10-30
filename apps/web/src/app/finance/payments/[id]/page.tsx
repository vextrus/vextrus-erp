/**
 * Payment Detail Page
 *
 * Displays detailed information about a single payment.
 * Includes payment details, method-specific fields, and state transitions.
 *
 * Features:
 * - Full payment details
 * - Payment method-specific information
 * - Reconciliation and reversal tracking
 * - State transition actions (Complete, Fail)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  useGetPaymentQuery,
  useCompletePaymentMutation,
  useFailPaymentMutation,
} from '@/lib/graphql/generated/types';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  CreditCard,
} from 'lucide-react';

interface PaymentDetailPageProps {
  params: {
    id: string;
  };
}

function PaymentDetailContent({ params }: PaymentDetailPageProps) {
  const router = useRouter();
  const { id } = params;

  // Dialog state
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [transactionReference, setTransactionReference] = useState('');
  const [failureReason, setFailureReason] = useState('');

  // Fetch payment details
  const { data, loading, error, refetch } = useGetPaymentQuery({
    variables: { id },
  });

  const payment = data?.payment;

  // Complete mutation
  const [completePayment, { loading: completingLoading }] = useCompletePaymentMutation({
    onCompleted: (data) => {
      toast.success('Payment completed successfully', {
        description: `Transaction reference: ${data.completePayment.transactionReference || 'N/A'}`,
      });
      setShowCompleteDialog(false);
      setTransactionReference('');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to complete payment', {
        description: error.message,
      });
    },
    refetchQueries: ['GetPayments', 'GetPaymentsByStatus', 'GetPayment'],
  });

  // Fail mutation
  const [failPayment, { loading: failingLoading }] = useFailPaymentMutation({
    onCompleted: () => {
      toast.success('Payment marked as failed');
      setShowFailDialog(false);
      setFailureReason('');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to update payment', {
        description: error.message,
      });
    },
    refetchQueries: ['GetPayments', 'GetPaymentsByStatus', 'GetPayment'],
  });

  // Handle complete
  const handleComplete = () => {
    if (!transactionReference.trim()) {
      toast.error('Please provide a transaction reference');
      return;
    }
    completePayment({
      variables: {
        id,
        input: { transactionReference }
      }
    });
  };

  // Handle fail
  const handleFail = () => {
    if (!failureReason.trim()) {
      toast.error('Please provide a failure reason');
      return;
    }
    failPayment({
      variables: {
        id,
        input: { failureReason }
      }
    });
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

  // Payment method badge
  const getMethodBadge = (method: string) => {
    const methodMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      BANK_TRANSFER: { variant: 'info', label: 'Bank Transfer' },
      CASH: { variant: 'success', label: 'Cash' },
      CHEQUE: { variant: 'default', label: 'Cheque' },
      MOBILE_WALLET: { variant: 'info', label: 'Mobile Wallet' },
    };
    const config = methodMap[method] || { variant: 'default' as const, label: method };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      PENDING: { variant: 'warning', label: 'Pending' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      FAILED: { variant: 'error', label: 'Failed' },
      RECONCILED: { variant: 'info', label: 'Reconciled' },
      REVERSED: { variant: 'error', label: 'Reversed' },
    };

    const config = statusMap[status] || { variant: 'default' as const, label: status };
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
              onClick={() => router.push('/finance/payments')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? 'Loading...' : `Payment ${payment?.paymentNumber}`}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage payment details
              </p>
            </div>
          </div>

          {!loading && payment && (
            <div className="flex items-center gap-2">
              {/* Complete button - only show for PENDING payments */}
              {payment.status === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={completingLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {completingLoading ? 'Completing...' : 'Complete Payment'}
                </Button>
              )}

              {/* Fail button - show for PENDING payments */}
              {payment.status === 'PENDING' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowFailDialog(true)}
                  disabled={failingLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {failingLoading ? 'Failing...' : 'Fail Payment'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <p className="text-sm">
              Failed to load payment: {error.message}
            </p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">Loading payment...</span>
          </div>
        )}

        {/* Payment Details */}
        {!loading && !error && payment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Payment Details</h2>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment Number
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.paymentNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Invoice
                      </p>
                      <Link
                        href={`/finance/invoices/${payment.invoiceId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        {payment.invoiceId}
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Amount
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          payment.amount.amount,
                          payment.amount.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment Method
                      </p>
                      <div className="mt-1">
                        {getMethodBadge(payment.paymentMethod)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment Date
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(payment.paymentDate)}
                      </p>
                    </div>
                    {payment.reference && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Reference
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {payment.reference}
                        </p>
                      </div>
                    )}
                  </div>

                  {payment.transactionReference && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Transaction Reference
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.transactionReference}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Payment Method Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Method Details</h2>
                <div className="space-y-3">
                  {(payment.paymentMethod === 'BANK_TRANSFER' || payment.paymentMethod === 'CHEQUE') && payment.bankAccountId && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Bank Account ID
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.bankAccountId}
                      </p>
                    </div>
                  )}

                  {payment.paymentMethod === 'CHEQUE' && payment.checkNumber && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Check Number
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.checkNumber}
                      </p>
                    </div>
                  )}

                  {payment.paymentMethod === 'MOBILE_WALLET' && payment.mobileWallet && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Wallet Provider
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.mobileWallet.provider}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Mobile Number
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.mobileWallet.mobileNumber}
                          </p>
                        </div>
                      </div>
                      {payment.mobileWallet.transactionId && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Transaction ID
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.mobileWallet.transactionId}
                          </p>
                        </div>
                      )}
                      {payment.mobileWallet.merchantCode && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Merchant Code
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.mobileWallet.merchantCode}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {payment.paymentMethod === 'CASH' && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Cash payment - no additional details required
                    </div>
                  )}
                </div>
              </Card>

              {/* Reconciliation Info */}
              {(payment.reconciledAt || payment.reversedAt || payment.failureReason) && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                  <div className="space-y-4">
                    {payment.reconciledAt && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Reconciliation
                          </h3>
                          <div className="space-y-2">
                            {payment.bankTransactionId && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Bank Transaction ID
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {payment.bankTransactionId}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Reconciled At
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDateTime(payment.reconciledAt)}
                              </p>
                            </div>
                            {payment.reconciledBy && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Reconciled By
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {payment.reconciledBy}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {payment.reversedAt && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Reversal
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Reversed At
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDateTime(payment.reversedAt)}
                              </p>
                            </div>
                            {payment.reversedBy && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Reversed By
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {payment.reversedBy}
                                </p>
                              </div>
                            )}
                            {payment.reversalReason && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Reversal Reason
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {payment.reversalReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {payment.failureReason && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Failure
                        </h3>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Failure Reason
                          </p>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            {payment.failureReason}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </span>
                    {getStatusBadge(payment.status)}
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Amount
                    </span>
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(
                        payment.amount.amount,
                        payment.amount.currency
                      )}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Created
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDateTime(payment.createdAt)}
                </p>

                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-4">
                  Last Updated
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDateTime(payment.updatedAt)}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Complete Payment Dialog */}
        <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this payment as completed? Please provide a transaction reference.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Transaction Reference *
              </label>
              <Input
                placeholder="Enter transaction reference..."
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                disabled={completingLoading}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={completingLoading}
                onClick={() => {
                  setShowCompleteDialog(false);
                  setTransactionReference('');
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleComplete}
                disabled={completingLoading || !transactionReference.trim()}
              >
                {completingLoading ? 'Completing...' : 'Complete Payment'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Fail Payment Dialog */}
        <AlertDialog open={showFailDialog} onOpenChange={setShowFailDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fail Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this payment as failed? Please provide a reason for the failure.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Failure Reason *
              </label>
              <Input
                placeholder="Enter reason for failure..."
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                disabled={failingLoading}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={failingLoading}
                onClick={() => {
                  setShowFailDialog(false);
                  setFailureReason('');
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleFail}
                disabled={failingLoading || !failureReason.trim()}
              >
                {failingLoading ? 'Failing...' : 'Fail Payment'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  return (
    <ProtectedRoute>
      <PaymentDetailContent params={params} />
    </ProtectedRoute>
  );
}
