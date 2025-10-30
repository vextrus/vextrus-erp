'use client'

import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Package,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Info,
  Star,
  Trash2,
  Edit,
  MoreVertical,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination, PaginationInfo } from '@/components/ui/pagination'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Sample data types
interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
}

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    joinDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Manager',
    status: 'active',
    joinDate: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    joinDate: '2023-12-10',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'Manager',
    status: 'pending',
    joinDate: '2024-03-05',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'User',
    status: 'active',
    joinDate: '2024-01-28',
  },
]

export default function DataDisplayExamplesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState<User[]>([])

  // DataTable columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return (
          <Badge
            variant={
              role === 'Admin'
                ? 'primary'
                : role === 'Manager'
                ? 'info'
                : 'default'
            }
          >
            {role}
          </Badge>
        )
      },
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
                : status === 'inactive'
                ? 'error'
                : 'warning'
            }
            dot
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'joinDate',
      header: 'Join Date',
      cell: ({ row }) => {
        return new Date(row.getValue('joinDate')).toLocaleDateString()
      },
    },
    {
      id: 'actions',
      cell: () => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => toast.success('Edit clicked')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => toast.error('Delete clicked')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Data Display Components</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Phase 2.4: Comprehensive data display components including Badge, EmptyState,
          Pagination, TableToolbar, and DataTable
        </p>
      </div>

      {/* Badge Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Badge Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Status indicators, labels, and counts with multiple variants and sizes
          </p>
        </div>

        {/* Variants */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Variants</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        {/* Sizes */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Sizes</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" variant="primary">
              Small
            </Badge>
            <Badge size="md" variant="primary">
              Medium
            </Badge>
            <Badge size="lg" variant="primary">
              Large
            </Badge>
          </div>
        </div>

        {/* With Icons and Dots */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">With Icons & Dots</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
              Completed
            </Badge>
            <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
              Pending
            </Badge>
            <Badge variant="error" icon={<XCircle className="h-3 w-3" />}>
              Failed
            </Badge>
            <Badge variant="info" icon={<Info className="h-3 w-3" />}>
              Information
            </Badge>
            <Badge variant="success" dot>
              Active
            </Badge>
            <Badge variant="error" dot>
              Inactive
            </Badge>
            <Badge variant="warning" dot>
              Pending
            </Badge>
          </div>
        </div>

        {/* Dismissible */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Dismissible</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="primary"
              dismissible
              onDismiss={() => toast.success('Badge dismissed')}
            >
              Dismissible Badge
            </Badge>
            <Badge
              variant="success"
              dismissible
              icon={<Star className="h-3 w-3" />}
              onDismiss={() => toast.success('Featured badge dismissed')}
            >
              Featured
            </Badge>
          </div>
        </div>
      </section>

      {/* EmptyState Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">EmptyState Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            No data placeholders with optional actions
          </p>
        </div>

        {/* Default Empty State */}
        <div className="glass-light rounded-xl overflow-hidden">
          <EmptyState
            icon={<Package className="h-16 w-16" />}
            title="No items found"
            description="You haven&apos;t added any items yet. Get started by creating your first item."
            action={{
              label: 'Create Item',
              onClick: () => toast.success('Create item clicked'),
            }}
            secondaryAction={{
              label: 'Learn More',
              onClick: () => toast.info('Learn more clicked'),
            }}
          />
        </div>

        {/* Small Empty State */}
        <div className="glass-light rounded-xl overflow-hidden">
          <EmptyState
            size="sm"
            icon={<FileText className="h-12 w-12" />}
            title="No documents"
            description="Upload your first document to get started."
          />
        </div>
      </section>

      {/* Pagination Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Pagination Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Page navigation with customizable controls
          </p>
        </div>

        <div className="glass-light rounded-xl p-6 space-y-6">
          {/* Full Pagination */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Full Pagination</h3>
            <Pagination
              currentPage={currentPage}
              totalPages={10}
              onPageChange={setCurrentPage}
              showFirstLast={true}
              siblingCount={1}
            />
          </div>

          {/* With Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">With Pagination Info</h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <PaginationInfo
                currentPage={currentPage}
                totalPages={10}
                pageSize={20}
                totalItems={195}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
                showFirstLast={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* TableToolbar Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">TableToolbar Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Search, filters, and actions for data tables
          </p>
        </div>

        <div className="glass-light rounded-xl p-6">
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search users..."
            showFilters={true}
            onFilterClick={() => toast.info('Filters clicked')}
            showExport={true}
            onExportClick={() => toast.success('Export started')}
            showRefresh={true}
            onRefreshClick={() => toast.success('Data refreshed')}
            actions={
              <>
                <Button variant="primary" onClick={() => toast.success('User added')}>
                  Add User
                </Button>
              </>
            }
          />
        </div>
      </section>

      {/* DataTable Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">DataTable Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Advanced data table with sorting, selection, and pagination
          </p>
        </div>

        {/* Full Featured Table */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Full Featured Table</h3>
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search users..."
            showFilters={true}
            onFilterClick={() => toast.info('Filters clicked')}
            showExport={true}
            onExportClick={() => toast.success('Exporting data...')}
            showRefresh={true}
            onRefreshClick={() => toast.success('Data refreshed')}
          />
          <DataTable
            columns={columns}
            data={sampleUsers}
            enableRowSelection={true}
            enablePagination={true}
            enableSorting={true}
            onRowSelectionChange={(rows) => {
              setSelectedRows(rows)
              if (rows.length > 0) {
                toast.success(`${rows.length} row(s) selected`)
              }
            }}
          />
        </div>

        {/* Loading State */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Loading State</h3>
          <DataTable columns={columns} data={[]} loading={true} />
        </div>

        {/* Empty State */}
        <div className="glass-light rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Empty State</h3>
          <DataTable
            columns={columns}
            data={[]}
            emptyState={{
              title: 'No users found',
              description: 'Add your first user to get started.',
              icon: <Package className="h-16 w-16" />,
              action: {
                label: 'Add User',
                onClick: () => toast.success('Add user clicked'),
              },
            }}
          />
        </div>
      </section>

      {/* Component Showcase */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Component Features</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Comprehensive feature list for Phase 2.4 components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Badge */}
          <div className="glass-light rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="primary">Badge</Badge>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>✓ 7 semantic variants</li>
              <li>✓ 3 sizes (sm, md, lg)</li>
              <li>✓ Icon support</li>
              <li>✓ Dot indicator</li>
              <li>✓ Dismissible with callback</li>
              <li>✓ Dark mode support</li>
              <li>✓ TypeScript typed</li>
            </ul>
          </div>

          {/* EmptyState */}
          <div className="glass-light rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="success">EmptyState</Badge>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>✓ 3 sizes (sm, md, lg)</li>
              <li>✓ Custom icon/illustration</li>
              <li>✓ Title & description</li>
              <li>✓ Primary & secondary actions</li>
              <li>✓ ARIA live region</li>
              <li>✓ Responsive layout</li>
              <li>✓ Flexible content</li>
            </ul>
          </div>

          {/* Pagination */}
          <div className="glass-light rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="warning">Pagination</Badge>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>✓ Smart page number display</li>
              <li>✓ Ellipsis for large ranges</li>
              <li>✓ First/Last page buttons</li>
              <li>✓ Configurable sibling count</li>
              <li>✓ Pagination info component</li>
              <li>✓ Keyboard accessible</li>
              <li>✓ ARIA labels</li>
            </ul>
          </div>

          {/* TableToolbar */}
          <div className="glass-light rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="info">TableToolbar</Badge>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>✓ Search with clear button</li>
              <li>✓ Filter button</li>
              <li>✓ Export functionality</li>
              <li>✓ Refresh button</li>
              <li>✓ Custom actions slot</li>
              <li>✓ Responsive layout</li>
              <li>✓ Customizable placeholders</li>
            </ul>
          </div>

          {/* DataTable */}
          <div className="glass-light rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="error">DataTable</Badge>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>✓ TanStack Table v8</li>
              <li>✓ Column sorting (single/multi)</li>
              <li>✓ Row selection with checkboxes</li>
              <li>✓ Built-in pagination</li>
              <li>✓ Loading & empty states</li>
              <li>✓ Flexible column definitions</li>
              <li>✓ TypeScript generics</li>
              <li>✓ Fully accessible</li>
            </ul>
          </div>

          {/* Combined */}
          <div className="glass-light rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="primary">Integration</Badge>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>✓ TableToolbar + DataTable</li>
              <li>✓ Badge in table cells</li>
              <li>✓ EmptyState in DataTable</li>
              <li>✓ Pagination controls</li>
              <li>✓ Complete CRUD workflows</li>
              <li>✓ Enterprise-ready patterns</li>
              <li>✓ Bangladesh ERP ready</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}