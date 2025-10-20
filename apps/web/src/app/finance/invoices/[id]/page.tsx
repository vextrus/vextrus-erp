/**
 * Invoice Detail Page
 *
 * Displays detailed information about a single invoice.
 * Includes line items, tax breakdown, and payment information.
 *
 * Features:
 * - Full invoice details
 * - Line items table
 * - Tax calculations (VAT, SD, AIT)
 * - Bangladesh-specific fields (TIN, BIN, Mushak)
 * - Action buttons (Edit, Delete, Print)
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
import { Separator } from '@/components/ui/separator';
import { useGetInvoiceQuery } from '@/lib/graphql/generated/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  Download,
  Send,
} from 'lucide-react';

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

function InvoiceDetailContent({ params }: InvoiceDetailPageProps) {
  const router = useRouter();
  const { id } = params;

  // Fetch invoice details
  const { data, loading, error } = useGetInvoiceQuery({
    variables: { id },
  });

  const invoice = data?.invoice;

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

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PENDING: { variant: 'default', label: 'Pending' },
      APPROVED: { variant: 'default', label: 'Approved' },
      PAID: { variant: 'default', label: 'Paid' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      OVERDUE: { variant: 'destructive', label: 'Overdue' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };
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
              onClick={() => router.push('/finance/invoices')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? 'Loading...' : `Invoice ${invoice?.invoiceNumber}`}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage invoice details
              </p>
            </div>
          </div>

          {!loading && invoice && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/finance/invoices/${id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <p className="text-sm">
              Failed to load invoice: {error.message}
            </p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">Loading invoice...</span>
          </div>
        )}

        {/* Invoice Details */}
        {!loading && !error && invoice && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Invoice Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Invoice Details</h2>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                      From
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Vendor ID: {invoice.vendorId}
                    </p>
                    {invoice.vendorTIN && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        TIN: {invoice.vendorTIN}
                      </p>
                    )}
                    {invoice.vendorBIN && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        BIN: {invoice.vendorBIN}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                      To
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Customer ID: {invoice.customerId}
                    </p>
                    {invoice.customerTIN && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        TIN: {invoice.customerTIN}
                      </p>
                    )}
                    {invoice.customerBIN && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        BIN: {invoice.customerBIN}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Invoice Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(invoice.invoiceDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Due Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  {invoice.fiscalYear && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fiscal Year
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.fiscalYear}
                      </p>
                    </div>
                  )}
                  {invoice.mushakNumber && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Mushak Number
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.mushakNumber}
                      </p>
                    </div>
                  )}
                  {invoice.challanNumber && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Challan Number
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.challanNumber}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Line Items */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Line Items</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Description
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Quantity
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Unit Price
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {invoice.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                            {item.description}
                          </td>
                          <td className="py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                            {item.quantity}
                          </td>
                          <td className="py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              item.unitPrice.amount,
                              item.unitPrice.currency
                            )}
                          </td>
                          <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              item.quantity * item.unitPrice.amount,
                              item.unitPrice.currency
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(
                        invoice.subtotal.amount,
                        invoice.subtotal.currency
                      )}
                    </span>
                  </div>

                  {invoice.vatAmount.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        VAT
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          invoice.vatAmount.amount,
                          invoice.vatAmount.currency
                        )}
                      </span>
                    </div>
                  )}

                  {invoice.supplementaryDuty.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Supplementary Duty
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          invoice.supplementaryDuty.amount,
                          invoice.supplementaryDuty.currency
                        )}
                      </span>
                    </div>
                  )}

                  {invoice.advanceIncomeTax.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Advance Income Tax
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          invoice.advanceIncomeTax.amount,
                          invoice.advanceIncomeTax.currency
                        )}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Total
                    </span>
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(
                        invoice.grandTotal.amount,
                        invoice.grandTotal.currency
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
                  {formatDate(invoice.createdAt)}
                </p>

                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-4">
                  Last Updated
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.updatedAt)}
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return (
    <ProtectedRoute>
      <InvoiceDetailContent params={params} />
    </ProtectedRoute>
  );
}
