/**
 * Create Invoice Page
 *
 * Form for creating new invoices with React Hook Form + Zod validation.
 *
 * Features:
 * - Dynamic line items with quantity and pricing
 * - Customer/Vendor selection
 * - VAT and tax calculations
 * - Bangladesh NBR compliance (TIN/BIN validation)
 * - GraphQL mutation with cache invalidation
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCreateInvoiceMutation } from '@/lib/graphql/generated/types';

// Zod validation schema
const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  customerTIN: z.string().length(12, 'Customer TIN must be 12 digits').optional().or(z.literal('')),
  customerBIN: z.string().length(9, 'Customer BIN must be 9 digits').optional().or(z.literal('')),
  vendorTIN: z.string().length(12, 'Vendor TIN must be 12 digits').optional().or(z.literal('')),
  vendorBIN: z.string().length(9, 'Vendor BIN must be 9 digits').optional().or(z.literal('')),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unitPrice: z.number().nonnegative('Unit price must be 0 or greater'),
    currency: z.string().default('BDT'),
    vatCategory: z.string().default('STANDARD'),
    hsCode: z.string().optional(),
    supplementaryDutyRate: z.number().min(0).max(100).optional(),
    advanceIncomeTaxRate: z.number().min(0).max(100).optional(),
  })).min(1, 'At least one line item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

function CreateInvoiceContent() {
  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      vendorId: '',
      customerTIN: '',
      customerBIN: '',
      vendorTIN: '',
      vendorBIN: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      lineItems: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          currency: 'BDT',
          vatCategory: 'STANDARD',
          hsCode: '',
          supplementaryDutyRate: 0,
          advanceIncomeTaxRate: 0,
        },
      ],
    },
  });

  // Field array for dynamic line items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  // Watch line items for subtotal calculation
  const lineItems = watch('lineItems');

  // Calculate subtotal
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  // GraphQL mutation
  const [createInvoice, { loading: mutationLoading, error: mutationError }] = useCreateInvoiceMutation({
    onCompleted: (data) => {
      toast.success('Invoice created successfully', {
        description: `Invoice ${data.createInvoice.invoiceNumber} has been created`,
      });
      router.push(`/finance/invoices/${data.createInvoice.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create invoice', {
        description: error.message,
      });
    },
    refetchQueries: ['GetInvoices'],
  });

  // Submit handler
  const onSubmit = (formData: InvoiceFormData) => {
    createInvoice({
      variables: {
        input: {
          customerId: formData.customerId,
          vendorId: formData.vendorId,
          customerTIN: formData.customerTIN || undefined,
          customerBIN: formData.customerBIN || undefined,
          vendorTIN: formData.vendorTIN || undefined,
          vendorBIN: formData.vendorBIN || undefined,
          invoiceDate: formData.invoiceDate,
          dueDate: formData.dueDate,
          lineItems: formData.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            vatCategory: item.vatCategory as any, // Type assertion needed due to enum mapping
            hsCode: item.hsCode,
            supplementaryDutyRate: item.supplementaryDutyRate,
            advanceIncomeTaxRate: item.advanceIncomeTaxRate,
          })),
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
              onClick={() => router.push('/finance/invoices')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create Invoice
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new invoice with line items and tax details
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

        {/* Invoice Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer & Vendor Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Customer & Vendor Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="customerId"
                    label="Customer ID"
                    required
                    error={errors.customerId?.message}
                  >
                    <Input
                      {...field}
                      placeholder="CUST-001"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
              <Controller
                name="vendorId"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="vendorId"
                    label="Vendor ID"
                    required
                    error={errors.vendorId?.message}
                  >
                    <Input
                      {...field}
                      placeholder="VEND-001"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
              <Controller
                name="customerTIN"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="customerTIN"
                    label="Customer TIN"
                    error={errors.customerTIN?.message}
                    description="12 digits"
                  >
                    <Input
                      {...field}
                      placeholder="123456789012"
                      maxLength={12}
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
              <Controller
                name="customerBIN"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="customerBIN"
                    label="Customer BIN"
                    error={errors.customerBIN?.message}
                    description="9 digits"
                  >
                    <Input
                      {...field}
                      placeholder="123456789"
                      maxLength={9}
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
              <Controller
                name="vendorTIN"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="vendorTIN"
                    label="Vendor TIN"
                    error={errors.vendorTIN?.message}
                    description="12 digits"
                  >
                    <Input
                      {...field}
                      placeholder="123456789012"
                      maxLength={12}
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
              <Controller
                name="vendorBIN"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="vendorBIN"
                    label="Vendor BIN"
                    error={errors.vendorBIN?.message}
                    description="9 digits"
                  >
                    <Input
                      {...field}
                      placeholder="123456789"
                      maxLength={9}
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
            </div>
          </Card>

          {/* Invoice Dates */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="invoiceDate"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="invoiceDate"
                    label="Invoice Date"
                    required
                    error={errors.invoiceDate?.message}
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
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="dueDate"
                    label="Due Date"
                    required
                    error={errors.dueDate?.message}
                  >
                    <Input
                      {...field}
                      type="date"
                      disabled={isSubmitting || mutationLoading}
                    />
                  </FormField>
                )}
              />
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  append({
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    currency: 'BDT',
                    vatCategory: 'STANDARD',
                    hsCode: '',
                    supplementaryDutyRate: 0,
                    advanceIncomeTaxRate: 0,
                  })
                }
                disabled={isSubmitting || mutationLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {errors.lineItems && typeof errors.lineItems === 'object' && 'message' in errors.lineItems && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {errors.lineItems.message as string}
              </div>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-lg dark:border-gray-700 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium">Item {index + 1}</h3>
                    {fields.length > 1 && (
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
                    <div className="col-span-2">
                      <Controller
                        name={`lineItems.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <FormField
                            name={`lineItems.${index}.description`}
                            label="Description"
                            required
                            error={errors.lineItems?.[index]?.description?.message}
                          >
                            <Input
                              {...field}
                              placeholder="Item description"
                              disabled={isSubmitting || mutationLoading}
                            />
                          </FormField>
                        )}
                      />
                    </div>

                    <Controller
                      name={`lineItems.${index}.quantity`}
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormField
                          name={`lineItems.${index}.quantity`}
                          label="Quantity"
                          required
                          error={errors.lineItems?.[index]?.quantity?.message}
                        >
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            value={value}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <Controller
                      name={`lineItems.${index}.unitPrice`}
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormField
                          name={`lineItems.${index}.unitPrice`}
                          label="Unit Price (BDT)"
                          required
                          error={errors.lineItems?.[index]?.unitPrice?.message}
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
                      name={`lineItems.${index}.hsCode`}
                      control={control}
                      render={({ field }) => (
                        <FormField
                          name={`lineItems.${index}.hsCode`}
                          label="HS Code"
                          error={errors.lineItems?.[index]?.hsCode?.message}
                        >
                          <Input
                            {...field}
                            placeholder="1234.56"
                            disabled={isSubmitting || mutationLoading}
                          />
                        </FormField>
                      )}
                    />

                    <div>
                      <label className="block text-sm font-medium mb-1">Subtotal</label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                        {((lineItems[index]?.quantity || 0) * (lineItems[index]?.unitPrice || 0)).toFixed(2)} BDT
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} BDT</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/finance/invoices')}
              disabled={isSubmitting || mutationLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutationLoading} loading={isSubmitting || mutationLoading}>
              {isSubmitting || mutationLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function CreateInvoicePage() {
  return (
    <ProtectedRoute>
      <CreateInvoiceContent />
    </ProtectedRoute>
  );
}
