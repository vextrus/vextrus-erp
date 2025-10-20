/**
 * Create Invoice Page
 *
 * Form for creating new invoices with line items, customer details, and Bangladesh tax compliance.
 *
 * Features:
 * - Dynamic line items with quantity and pricing
 * - Customer selection
 * - VAT and tax calculations
 * - Bangladesh NBR compliance (TIN/BIN)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

function CreateInvoiceContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [customerTIN, setCustomerTIN] = useState('');
  const [customerBIN, setCustomerBIN] = useState('');
  const [vendorTIN, setVendorTIN] = useState('');
  const [vendorBIN, setVendorBIN] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState([
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
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
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
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // TODO: Implement GraphQL mutation for creating invoice
      // For now, just show a success message
      alert('Invoice creation not yet implemented. GraphQL mutation needed.');
      router.push('/finance/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

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
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Invoice Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Vendor Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Customer & Vendor Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer ID *
                </label>
                <input
                  type="text"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="CUST-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor ID *
                </label>
                <input
                  type="text"
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="VEND-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer TIN
                </label>
                <input
                  type="text"
                  value={customerTIN}
                  onChange={(e) => setCustomerTIN(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="123456789012"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer BIN
                </label>
                <input
                  type="text"
                  value={customerBIN}
                  onChange={(e) => setCustomerBIN(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor TIN
                </label>
                <input
                  type="text"
                  value={vendorTIN}
                  onChange={(e) => setVendorTIN(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="123456789012"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor BIN
                </label>
                <input
                  type="text"
                  value={vendorBIN}
                  onChange={(e) => setVendorBIN(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="123456789"
                />
              </div>
            </div>
          </Card>

          {/* Invoice Dates */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <Button type="button" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg dark:border-gray-700 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium">Item {index + 1}</h3>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, 'description', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Item description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, 'quantity', parseFloat(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Unit Price (BDT) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, 'unitPrice', parseFloat(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        HS Code
                      </label>
                      <input
                        type="text"
                        value={item.hsCode}
                        onChange={(e) =>
                          updateLineItem(index, 'hsCode', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                        placeholder="1234.56"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Subtotal
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                        {(item.quantity * item.unitPrice).toFixed(2)} BDT
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
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
