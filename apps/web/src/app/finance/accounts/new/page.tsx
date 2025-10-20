/**
 * Create Account Page
 *
 * Form for creating new chart of accounts with React Hook Form + Zod validation.
 *
 * Features:
 * - Account code and name fields
 * - Account type selection (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
 * - Optional parent account hierarchy
 * - Currency configuration (immutable after creation)
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
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCreateAccountMutation } from '@/lib/graphql/generated/types';

// Zod validation schema
const accountSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required').max(20, 'Account code too long'),
  accountName: z.string().min(1, 'Account name is required').max(100, 'Account name too long'),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    errorMap: () => ({ message: 'Please select an account type' }),
  }),
  parentAccountId: z.string().optional(),
  currency: z.string().default('BDT'),
});

type AccountFormData = z.infer<typeof accountSchema>;

function CreateAccountContent() {
  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountCode: '',
      accountName: '',
      accountType: undefined,
      parentAccountId: '',
      currency: 'BDT',
    },
  });

  // GraphQL mutation
  const [createAccount, { loading: mutationLoading, error: mutationError }] = useCreateAccountMutation({
    onCompleted: (data) => {
      toast.success('Account created successfully', {
        description: `Account ${data.createAccount.accountCode} has been created`,
      });
      router.push(`/finance/accounts/${data.createAccount.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create account', {
        description: error.message,
      });
    },
    refetchQueries: ['GetChartOfAccounts'],
  });

  // Submit handler
  const onSubmit = (formData: AccountFormData) => {
    createAccount({
      variables: {
        input: {
          accountCode: formData.accountCode,
          accountName: formData.accountName,
          accountType: formData.accountType as any, // Type assertion needed due to enum mapping
          currency: formData.currency,
          parentAccountId: formData.parentAccountId || undefined,
        },
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/finance/accounts')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create Account
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a new account to your chart of accounts
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Account Code, Type, and Currency cannot be changed after creation.
            Please ensure these details are correct before submitting.
          </AlertDescription>
        </Alert>

        {/* Error Alert */}
        {mutationError && (
          <Alert variant="error">
            <AlertDescription>{mutationError.message}</AlertDescription>
          </Alert>
        )}

        {/* Account Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Account Details</h2>
            <div className="space-y-4">
              <Controller
                name="accountCode"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="accountCode"
                    label="Account Code"
                    required
                    error={errors.accountCode?.message}
                    description="Unique identifier for this account (e.g., 1000, 2000)"
                  >
                    <Input
                      {...field}
                      placeholder="1000"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="accountName"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="accountName"
                    label="Account Name"
                    required
                    error={errors.accountName?.message}
                    description="Descriptive name for this account"
                  >
                    <Input
                      {...field}
                      placeholder="Cash and Cash Equivalents"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="accountType"
                    label="Account Type"
                    required
                    error={errors.accountType?.message}
                    description="Classification of this account (immutable)"
                  >
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      disabled={isSubmitting || mutationLoading}
                    >
                      <option value="">Select account type...</option>
                      <option value="ASSET">Asset</option>
                      <option value="LIABILITY">Liability</option>
                      <option value="EQUITY">Equity</option>
                      <option value="REVENUE">Revenue</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </FormField>
                )}
              />

              <Controller
                name="parentAccountId"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="parentAccountId"
                    label="Parent Account ID"
                    error={errors.parentAccountId?.message}
                    description="Optional: ID of parent account for hierarchical structure"
                  >
                    <Input
                      {...field}
                      placeholder="Leave empty for root account"
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
                    description="Currency for this account (immutable after creation)"
                  >
                    <Input
                      {...field}
                      placeholder="BDT"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/finance/accounts')}
              disabled={isSubmitting || mutationLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutationLoading} loading={isSubmitting || mutationLoading}>
              {isSubmitting || mutationLoading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function CreateAccountPage() {
  return (
    <ProtectedRoute>
      <CreateAccountContent />
    </ProtectedRoute>
  );
}
