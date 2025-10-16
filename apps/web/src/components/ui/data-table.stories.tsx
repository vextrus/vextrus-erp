import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { DataTable, createSortableHeader } from './data-table'
import { Badge } from './badge'
import { Button } from './button'
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Edit, Trash2, Eye, FileText, Users, Package } from 'lucide-react'

// Sample data types
interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  status: 'active' | 'inactive' | 'on_leave'
  joinedDate: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  issuedDate: string
}

interface Product {
  id: string
  name: string
  category: string
  stock: number
  price: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

// Sample employee data
const employeeData: Employee[] = [
  {
    id: '1',
    name: 'Ahmed Rahman',
    email: 'ahmed.rahman@example.com',
    department: 'Engineering',
    position: 'Software Engineer',
    status: 'active',
    joinedDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Fatima Khan',
    email: 'fatima.khan@example.com',
    department: 'Finance',
    position: 'Accountant',
    status: 'active',
    joinedDate: '2023-11-20',
  },
  {
    id: '3',
    name: 'Mohammad Ali',
    email: 'mohammad.ali@example.com',
    department: 'Operations',
    position: 'Project Manager',
    status: 'on_leave',
    joinedDate: '2023-08-10',
  },
  {
    id: '4',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.com',
    department: 'HR',
    position: 'HR Manager',
    status: 'active',
    joinedDate: '2024-02-01',
  },
  {
    id: '5',
    name: 'Karim Hassan',
    email: 'karim.hassan@example.com',
    department: 'Engineering',
    position: 'Senior Developer',
    status: 'active',
    joinedDate: '2022-05-15',
  },
  {
    id: '6',
    name: 'Ayesha Siddiqui',
    email: 'ayesha.siddiqui@example.com',
    department: 'Marketing',
    position: 'Marketing Manager',
    status: 'inactive',
    joinedDate: '2023-03-20',
  },
]

// Sample invoice data
const invoiceData: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-042',
    client: 'ABC Construction Ltd.',
    amount: 50000,
    status: 'pending',
    dueDate: '2025-01-20',
    issuedDate: '2025-01-10',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-041',
    client: 'XYZ Builders',
    amount: 75000,
    status: 'paid',
    dueDate: '2025-01-15',
    issuedDate: '2025-01-05',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-040',
    client: 'Rahman Enterprise',
    amount: 35000,
    status: 'overdue',
    dueDate: '2025-01-05',
    issuedDate: '2024-12-25',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-039',
    client: 'Shah Cement Industries',
    amount: 125000,
    status: 'paid',
    dueDate: '2025-01-10',
    issuedDate: '2024-12-30',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-038',
    client: 'Green Valley Properties',
    amount: 95000,
    status: 'pending',
    dueDate: '2025-01-25',
    issuedDate: '2025-01-12',
  },
]

// Sample product data
const productData: Product[] = [
  {
    id: '1',
    name: 'Cement (50kg bag)',
    category: 'Building Materials',
    stock: 500,
    price: 450,
    status: 'in_stock',
  },
  {
    id: '2',
    name: 'Steel Rod (10mm)',
    category: 'Building Materials',
    stock: 25,
    price: 75,
    status: 'low_stock',
  },
  {
    id: '3',
    name: 'Brick (1000 pcs)',
    category: 'Building Materials',
    stock: 0,
    price: 8000,
    status: 'out_of_stock',
  },
  {
    id: '4',
    name: 'Paint (White - 20L)',
    category: 'Finishing',
    stock: 150,
    price: 3500,
    status: 'in_stock',
  },
  {
    id: '5',
    name: 'Tiles (per sqft)',
    category: 'Finishing',
    stock: 50,
    price: 120,
    status: 'low_stock',
  },
]

// Employee columns
const employeeColumns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: createSortableHeader('Name'),
  },
  {
    accessorKey: 'email',
    header: createSortableHeader('Email'),
    cell: ({ row }) => (
      <span className="text-neutral-400">{row.getValue('email')}</span>
    ),
  },
  {
    accessorKey: 'department',
    header: createSortableHeader('Department'),
  },
  {
    accessorKey: 'position',
    header: createSortableHeader('Position'),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('position')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge
          variant={
            status === 'active'
              ? 'success'
              : status === 'on_leave'
                ? 'warning'
                : 'error'
          }
          size="sm"
          dot
        >
          {status === 'active' ? 'Active' : status === 'on_leave' ? 'On Leave' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'joinedDate',
    header: createSortableHeader('Joined Date'),
    cell: ({ row }) => (
      <span className="text-sm text-neutral-400">{row.getValue('joinedDate')}</span>
    ),
  },
  {
    id: 'actions',
    cell: () => (
      <Button variant="ghost" size="icon-sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ),
  },
]

// Invoice columns
const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: createSortableHeader('Invoice #'),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('invoiceNumber')}</span>
    ),
  },
  {
    accessorKey: 'client',
    header: createSortableHeader('Client'),
  },
  {
    accessorKey: 'amount',
    header: createSortableHeader('Amount'),
    cell: ({ row }) => (
      <span className="font-medium">৳{row.getValue<number>('amount').toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge
          variant={
            status === 'paid'
              ? 'success'
              : status === 'pending'
                ? 'warning'
                : 'error'
          }
          size="sm"
        >
          {status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'issuedDate',
    header: createSortableHeader('Issued'),
    cell: ({ row }) => (
      <span className="text-sm text-neutral-400">{row.getValue('issuedDate')}</span>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: createSortableHeader('Due Date'),
    cell: ({ row }) => (
      <span className="text-sm text-neutral-400">{row.getValue('dueDate')}</span>
    ),
  },
  {
    id: 'actions',
    cell: () => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

// Product columns
const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: createSortableHeader('Product Name'),
  },
  {
    accessorKey: 'category',
    header: createSortableHeader('Category'),
  },
  {
    accessorKey: 'stock',
    header: createSortableHeader('Stock'),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue<number>('stock')}</span>
    ),
  },
  {
    accessorKey: 'price',
    header: createSortableHeader('Price'),
    cell: ({ row }) => (
      <span className="font-medium">৳{row.getValue<number>('price').toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge
          variant={
            status === 'in_stock'
              ? 'success'
              : status === 'low_stock'
                ? 'warning'
                : 'error'
          }
          size="sm"
        >
          {status === 'in_stock'
            ? 'In Stock'
            : status === 'low_stock'
              ? 'Low Stock'
              : 'Out of Stock'}
        </Badge>
      )
    },
  },
]

const meta = {
  title: 'UI/Data Display/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

export const EmployeeTable: Story = {
  args: {
    columns: employeeColumns,
    data: employeeData,
    enableSorting: true,
    enablePagination: true,
    defaultPageSize: 10,
  },
}

export const WithRowSelection: Story = {
  args: {
    columns: employeeColumns,
    data: employeeData,
    enableRowSelection: true,
    enableSorting: true,
    enablePagination: true,
    onRowSelectionChange: fn(),
  },
}

export const InvoiceTable: Story = {
  args: {
    columns: invoiceColumns,
    data: invoiceData,
    enableSorting: true,
    enablePagination: true,
    defaultPageSize: 10,
  },
}

export const ProductTable: Story = {
  args: {
    columns: productColumns,
    data: productData,
    enableSorting: true,
    enablePagination: true,
    defaultPageSize: 10,
  },
}

export const WithoutPagination: Story = {
  args: {
    columns: employeeColumns,
    data: employeeData.slice(0, 3),
    enablePagination: false,
  },
}

export const LoadingState: Story = {
  args: {
    columns: employeeColumns,
    data: employeeData,
    loading: true,
  },
}

export const EmptyState: Story = {
  args: {
    columns: employeeColumns,
    data: [],
    emptyState: {
      title: 'No employees found',
      description: 'Get started by adding your first employee.',
      icon: <Users className="h-16 w-16" />,
      action: {
        label: 'Add Employee',
        onClick: fn(),
      },
    },
  },
}

export const EmptyInvoices: Story = {
  args: {
    columns: invoiceColumns,
    data: [],
    emptyState: {
      title: 'No invoices yet',
      description: 'Create your first invoice to start billing clients.',
      icon: <FileText className="h-16 w-16" />,
      action: {
        label: 'Create Invoice',
        onClick: fn(),
      },
    },
  },
}

export const EmptyProducts: Story = {
  args: {
    columns: productColumns,
    data: [],
    emptyState: {
      title: 'No products in inventory',
      description: 'Add products to start managing your inventory.',
      icon: <Package className="h-16 w-16" />,
      action: {
        label: 'Add Product',
        onClick: fn(),
      },
    },
  },
}

export const SmallPageSize: Story = {
  args: {
    columns: employeeColumns,
    data: employeeData,
    enableSorting: true,
    enablePagination: true,
    defaultPageSize: 3,
    pageSizeOptions: [3, 5, 10],
  },
}

export const WithSelectionAndActions: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<Employee[]>([])

    return (
      <div className="space-y-4">
        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary-500/10 border border-primary-500/30">
            <span className="text-sm font-medium">
              {selectedRows.length} employee(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Export Selected
              </Button>
              <Button variant="destructive" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}>
                Delete Selected
              </Button>
            </div>
          </div>
        )}
        <DataTable
          columns={employeeColumns}
          data={employeeData}
          enableRowSelection
          enableSorting
          enablePagination
          defaultPageSize={5}
          onRowSelectionChange={setSelectedRows}
        />
      </div>
    )
  },
}

export const FullFeatured: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<Invoice[]>([])

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Invoices</h2>
            <p className="text-sm text-neutral-400">Manage your client invoices</p>
          </div>
          <Button variant="primary">Create Invoice</Button>
        </div>

        {/* Selection Actions */}
        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary-500/10 border border-primary-500/30">
            <span className="text-sm font-medium">
              {selectedRows.length} invoice(s) selected - Total: ৳
              {selectedRows.reduce((sum, invoice) => sum + invoice.amount, 0).toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Send Reminders
              </Button>
              <Button variant="ghost" size="sm">
                Export
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={invoiceColumns}
          data={invoiceData}
          enableRowSelection
          enableSorting
          enablePagination
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
          onRowSelectionChange={setSelectedRows}
        />
      </div>
    )
  },
}
