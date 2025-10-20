/**
 * Create Journal Entry Page
 *
 * Form for creating new journal entries with double-entry bookkeeping validation.
 *
 * CRITICAL FEATURES:
 * - Dynamic line items with useFieldArray
 * - Real-time balance calculation (Total Debit = Total Credit)
 * - Auto-balance validation (cannot submit if unbalanced)
 * - Running totals display
 * - Min 2 line items required (double-entry principle)
 * - Balance tolerance: 0.01 BDT for floating-point precision
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Select } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useCreateJournalMutation } from '@/lib/graphql/generated/types';

// Zod validation schema with custom balance validation
const journalSchema = z.object({
  journalDate: z.string().min(1, 'Journal date is required'),
  journalType: z.string().default('GENERAL'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string().min(1, 'Account is required'),
    description: z.string().min(1, 'Line description is required'),
    debitAmount: z.number().min(0, 'Debit must be >= 0'),
    creditAmount: z.number().min(0, 'Credit must be >= 0'),
    costCenter: z.string().optional(),
    project: z.string().optional(),
  })).min(2, 'At least two line items required for double-entry'),
}).refine((data) => {
  const totalDebit = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01; // BDT tolerance for floating point
}, {
  message: 'Journal must be balanced (Total Debit = Total Credit)',
  path: ['lines'],
});

type JournalFormData = z.infer<typeof journalSchema>;

// Journal types
const JOURNAL_TYPES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'CASH_PAYMENT', label: 'Cash Payment' },
  { value: 'CASH_RECEIPT', label: 'Cash Receipt' },
  { value: 'OPENING', label: 'Opening' },
  { value: 'CLOSING', label: 'Closing' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
];

function CreateJournalContent() {
  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      journalDate: new Date().toISOString().split('T')[0],
      journalType: 'GENERAL',
      description: '',
      reference: '',
      lines: [
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0, costCenter: '', project: '' },
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0, costCenter: '', project: '' },
      ],
    },
  });

  // Field array for dynamic line items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  // Watch lines for real-time totals calculation
  const lines = watch('lines');

  // Calculate running totals
  const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
  const balance = totalDebit - totalCredit;
  const isBalanced = Math.abs(balance) < 0.01;

  // GraphQL mutation
  const [createJournal, { loading: mutationLoading, error: mutationError }] = useCreateJournalMutation({
    onCompleted: (data) => {
      toast.success('Journal entry created successfully', {
        description: `Journal ${data.createJournal.journalNumber} has been created`,
      });
      router.push(`/finance/journal/${data.createJournal.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create journal entry', {
        description: error.message,
      });
    },
    refetchQueries: ['GetJournals'],
  });

  // Submit handler
  const onSubmit = (formData: JournalFormData) => {
    createJournal({
      variables: {
        input: {
          journalDate: formData.journalDate,
          description: formData.description,
          journalType: formData.journalType as any,
          reference: formData.reference || undefined,
          lines: formData.lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            costCenter: line.costCenter || undefined,
            project: line.project || undefined,
          })),
        },
      },
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
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
              onClick={() => router.push('/finance/journal')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create Journal Entry
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new journal entry with double-entry bookkeeping
              </p>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {!isBalanced && lines.length >= 2 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Journal is unbalanced by {formatCurrency(Math.abs(balance))} BDT.
              {balance > 0 ? ' Total Debit exceeds Total Credit.' : ' Total Credit exceeds Total Debit.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {mutationError && (
          <Alert variant="error">
            <AlertDescription>{mutationError.message}</AlertDescription>
          </Alert>
        )}

        {/* Journal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Journal Header */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Journal Header</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="journalDate"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="journalDate"
                    label="Journal Date"
                    required
                    error={errors.journalDate?.message}
                  >
                    <Input
                      {...field}
                      type="date"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="journalType"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="journalType"
                    label="Journal Type"
                    required
                    error={errors.journalType?.message}
                  >
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || mutationLoading}
                      options={JOURNAL_TYPES}
                      placeholder="Select journal type"
                    />
                  </FormField>
                )}
              />

              <div className="col-span-2">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      name="description"
                      label="Description"
                      required
                      error={errors.description?.message}
                    >
                      <Input
                        {...field}
                        placeholder="Enter journal description"
                        disabled={isSubmitting || mutationLoading}
                      />
                    </FormField>
                  )}
                />
              </div>

              <div className="col-span-2">
                <Controller
                  name="reference"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      name="reference"
                      label="Reference"
                      error={errors.reference?.message}
                      description="Optional reference number or code"
                    >
                      <Input
                        {...field}
                        placeholder="e.g., INV-001, PO-123"
                        disabled={isSubmitting || mutationLoading}
                      />
                    </FormField>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Journal Lines (Double-Entry)</h2>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  append({
                    accountId: '',
                    description: '',
                    debitAmount: 0,
                    creditAmount: 0,
                    costCenter: '',
                    project: '',
                  })
                }
                disabled={isSubmitting || mutationLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>

            {errors.lines && typeof errors.lines === 'object' && 'message' in errors.lines && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {errors.lines.message as string}
              </div>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-lg dark:border-gray-700 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium">Line {index + 1}</h3>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={isSubmitting || mutationLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name={`lines.${index}.accountId`}
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name={`lines.${index}.accountId`}
                          label="Account ID"
                          required
                          error={errors.lines?.[index]?.accountId?.message}
                          description="In production, this would be an account dropdown"
                        >
                          <Input
                            {...field}
                            placeholder="e.g., 1000, 2000"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name={`lines.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name={`lines.${index}.description`}
                          label="Line Description"
                          required
                          error={errors.lines?.[index]?.description?.message}
                        >
                          <Input
                            {...field}
                            placeholder="Description of this entry"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name={`lines.${index}.debitAmount`}
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormField
                          name={`lines.${index}.debitAmount`}
                          label="Debit Amount (BDT)"
                          required
                          error={errors.lines?.[index]?.debitAmount?.message}
                        >
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            value={value}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name={`lines.${index}.creditAmount`}
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormField
                          name={`lines.${index}.creditAmount`}
                          label="Credit Amount (BDT)"
                          required
                          error={errors.lines?.[index]?.creditAmount?.message}
                        >
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            value={value}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name={`lines.${index}.costCenter`}
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name={`lines.${index}.costCenter`}
                          label="Cost Center (Optional)"
                          error={errors.lines?.[index]?.costCenter?.message}
                        >
                          <Input
                            {...field}
                            placeholder="e.g., CC-001"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name={`lines.${index}.project`}
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name={`lines.${index}.project`}
                          label="Project (Optional)"
                          error={errors.lines?.[index]?.project?.message}
                        >
                          <Input
                            {...field}
                            placeholder="e.g., PRJ-001"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Running Totals - Always Visible */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Debit:
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalDebit)} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Credit:
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalCredit)} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Balance:
                  </span>
                  <span className={`text-lg font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(Math.abs(balance))} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <span className={`text-sm font-semibold flex items-center ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isBalanced ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Balanced
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 h-4 w-4" />
                        Unbalanced ({formatCurrency(Math.abs(balance))} BDT difference)
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/finance/journal')}
              disabled={isSubmitting || mutationLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isBalanced || isSubmitting || mutationLoading}
              loading={isSubmitting || mutationLoading}
            >
              {isBalanced
                ? (isSubmitting || mutationLoading ? 'Creating...' : 'Create Journal Entry')
                : `Unbalanced (${formatCurrency(Math.abs(balance))} BDT difference)`
              }
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function CreateJournalPage() {
  return (
    <ProtectedRoute>
      <CreateJournalContent />
    </ProtectedRoute>
  );
}
