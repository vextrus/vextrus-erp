/**
 * Create Payment Page
 *
 * Form for creating new payments with React Hook Form + Zod validation.
 *
 * Features:
 * - Payment method selection
 * - Conditional fields based on payment method
 * - Invoice linking
 * - Mobile wallet support (bKash, Nagad, Rocket, Upay)
 * - GraphQL mutation with cache invalidation
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { useCreatePaymentMutation } from '@/lib/graphql/generated/types';

// Zod validation schema
const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('BDT'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHEQUE', 'MOBILE_WALLET'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  paymentDate: z.string().min(1, 'Payment date is required'),
  reference: z.string().optional(),
  bankAccountId: z.string().optional(),
  checkNumber: z.string().optional(),
  // Mobile wallet fields (optional)
  walletProvider: z.string().optional(),
  mobileNumber: z.string().optional(),
  walletTransactionId: z.string().optional(),
  merchantCode: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

function CreatePaymentContent() {
  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: 0,
      currency: 'BDT',
      paymentMethod: undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      bankAccountId: '',
      checkNumber: '',
      walletProvider: '',
      mobileNumber: '',
      walletTransactionId: '',
      merchantCode: '',
    },
  });

  // Watch payment method for conditional fields
  const paymentMethod = watch('paymentMethod');

  // GraphQL mutation
  const [createPayment, { loading: mutationLoading, error: mutationError }] = useCreatePaymentMutation({
    onCompleted: (data) => {
      toast.success('Payment created successfully', {
        description: `Payment ${data.createPayment.paymentNumber} has been created`,
      });
      router.push(`/finance/payments/${data.createPayment.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create payment', {
        description: error.message,
      });
    },
    refetchQueries: ['GetPayments', 'GetPaymentsByStatus'],
  });

  // Submit handler
  const onSubmit = (formData: PaymentFormData) => {
    createPayment({
      variables: {
        input: {
          invoiceId: formData.invoiceId,
          amount: formData.amount,
          currency: formData.currency,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          reference: formData.reference || undefined,
          bankAccountId: formData.bankAccountId || undefined,
          checkNumber: formData.checkNumber || undefined,
          walletProvider: formData.walletProvider || undefined,
          mobileNumber: formData.mobileNumber || undefined,
          walletTransactionId: formData.walletTransactionId || undefined,
          merchantCode: formData.merchantCode || undefined,
        },
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/finance/payments')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create Payment
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Record a new payment for an invoice
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {mutationError && (
          <Alert variant="error">
            <AlertDescription>{mutationError.message}</AlertDescription>
          </Alert>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="invoiceId"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="invoiceId"
                    label="Invoice ID"
                    required
                    error={errors.invoiceId?.message}
                    description="In production, this would be a dropdown"
                  >
                    <Input
                      {...field}
                      placeholder="INV-001"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <FormField
                    name="amount"
                    label="Payment Amount"
                    required
                    error={errors.amount?.message}
                  >
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="currency"
                    label="Currency"
                    required
                    error={errors.currency?.message}
                  >
                    <Input
                      {...field}
                      placeholder="BDT"
                      disabled={true}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="paymentDate"
                    label="Payment Date"
                    required
                    error={errors.paymentDate?.message}
                  >
                    <Input
                      {...field}
                      type="date"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />

              <div className="col-span-2">
                <Controller
                  name="reference"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      name="reference"
                      label="Reference"
                      error={errors.reference?.message}
                      description="Optional reference or notes"
                    >
                      <Input
                        {...field}
                        placeholder="Payment reference or notes"
                        disabled={isSubmitting || mutationLoading}
                      />
                    </FormField>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="space-y-4">
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="paymentMethod"
                    label="Payment Method"
                    required
                    error={errors.paymentMethod?.message}
                  >
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                      disabled={isSubmitting || mutationLoading}
                    >
                      <option value="">Select payment method</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="MOBILE_WALLET">Mobile Wallet</option>
                    </select>
                  </FormField>
                )}
              />

              {/* Conditional fields based on payment method */}
              {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CHEQUE') && (
                <Controller
                  name="bankAccountId"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      name="bankAccountId"
                      label="Bank Account ID"
                      error={errors.bankAccountId?.message}
                      description="In production, this would be a dropdown"
                    >
                      <Input
                        {...field}
                        placeholder="BANK-001"
                        disabled={isSubmitting || mutationLoading}
                      />
                    </FormField>
                  )}
                />
              )}

              {paymentMethod === 'CHEQUE' && (
                <Controller
                  name="checkNumber"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      name="checkNumber"
                      label="Check Number"
                      required
                      error={errors.checkNumber?.message}
                    >
                      <Input
                        {...field}
                        placeholder="CHK-123456"
                        disabled={isSubmitting || mutationLoading}
                      />
                    </FormField>
                  )}
                />
              )}

              {paymentMethod === 'MOBILE_WALLET' && (
                <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Mobile Wallet Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="walletProvider"
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name="walletProvider"
                          label="Wallet Provider"
                          required
                          error={errors.walletProvider?.message}
                        >
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            disabled={isSubmitting || mutationLoading}
                          >
                            <option value="">Select provider</option>
                            <option value="BKASH">bKash</option>
                            <option value="NAGAD">Nagad</option>
                            <option value="ROCKET">Rocket</option>
                            <option value="UPAY">Upay</option>
                          </select>
                        </FormField>
                      )}
                    />

                    <Controller
                      name="mobileNumber"
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name="mobileNumber"
                          label="Mobile Number"
                          required
                          error={errors.mobileNumber?.message}
                        >
                          <Input
                            {...field}
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name="walletTransactionId"
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name="walletTransactionId"
                          label="Transaction ID"
                          error={errors.walletTransactionId?.message}
                          description="Optional"
                        >
                          <Input
                            {...field}
                            placeholder="TXN123456789"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name="merchantCode"
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name="merchantCode"
                          label="Merchant Code"
                          error={errors.merchantCode?.message}
                          description="Optional"
                        >
                          <Input
                            {...field}
                            placeholder="MERCHANT-001"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Cash payment selected - no additional details required
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/finance/payments')}
              disabled={isSubmitting || mutationLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || mutationLoading}
              loading={isSubmitting || mutationLoading}
            >
              {isSubmitting || mutationLoading ? 'Creating...' : 'Create Payment'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function CreatePaymentPage() {
  return (
    <ProtectedRoute>
      <CreatePaymentContent />
    </ProtectedRoute>
  );
}
