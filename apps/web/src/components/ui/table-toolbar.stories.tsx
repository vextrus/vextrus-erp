import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { TableToolbar } from './table-toolbar'
import { DataTable, createSortableHeader } from './data-table'
import { Button } from './button'
import { Badge } from './badge'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Upload, FileDown } from 'lucide-react'

// Sample data type
interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  status: 'active' | 'inactive' | 'on_leave'
}

// Sample data
const employeeData: Employee[] = [
  {
    id: '1',
    name: 'Ahmed Rahman',
    email: 'ahmed.rahman@example.com',
    department: 'Engineering',
    position: 'Software Engineer',
    status: 'active',
  },
  {
    id: '2',
    name: 'Fatima Khan',
    email: 'fatima.khan@example.com',
    department: 'Finance',
    position: 'Accountant',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mohammad Ali',
    email: 'mohammad.ali@example.com',
    department: 'Operations',
    position: 'Project Manager',
    status: 'on_leave',
  },
  {
    id: '4',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.com',
    department: 'HR',
    position: 'HR Manager',
    status: 'active',
  },
  {
    id: '5',
    name: 'Karim Hassan',
    email: 'karim.hassan@example.com',
    department: 'Engineering',
    position: 'Senior Developer',
    status: 'active',
  },
  {
    id: '6',
    name: 'Ayesha Siddiqui',
    email: 'ayesha.siddiqui@example.com',
    department: 'Marketing',
    position: 'Marketing Manager',
    status: 'inactive',
  },
  {
    id: '7',
    name: 'Rahim Ahmed',
    email: 'rahim.ahmed@example.com',
    department: 'Engineering',
    position: 'DevOps Engineer',
    status: 'active',
  },
  {
    id: '8',
    name: 'Sultana Begum',
    email: 'sultana.begum@example.com',
    department: 'Finance',
    position: 'Financial Analyst',
    status: 'active',
  },
]

// Column definitions
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
]

const meta = {
  title: 'UI/Data Display/TableToolbar',
  component: TableToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSearchChange: fn(),
    onFilterClick: fn(),
    onExportClick: fn(),
    onRefreshClick: fn(),
  },
} satisfies Meta<typeof TableToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    searchPlaceholder: 'Search...',
  },
}

export const WithSearch: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = React.useState('')

    return (
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search employees..."
      />
    )
  },
}

export const WithFilters: Story = {
  args: {
    searchPlaceholder: 'Search...',
    showFilters: true,
  },
}

export const WithExport: Story = {
  args: {
    searchPlaceholder: 'Search...',
    showExport: true,
  },
}

export const WithRefresh: Story = {
  args: {
    searchPlaceholder: 'Search...',
    showRefresh: true,
  },
}

export const FullFeatures: Story = {
  args: {
    searchPlaceholder: 'Search...',
    showFilters: true,
    showExport: true,
    showRefresh: true,
  },
}

export const WithCustomActions: Story = {
  args: {
    searchPlaceholder: 'Search...',
    showFilters: true,
    showExport: true,
    actions: (
      <>
        <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />}>
          Import
        </Button>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Add New
        </Button>
      </>
    ),
  },
}

export const EmployeeToolbar: Story = {
  args: {
    searchPlaceholder: 'Search employees by name or email...',
    showFilters: true,
    showExport: true,
    showRefresh: true,
    actions: (
      <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
        Add Employee
      </Button>
    ),
  },
}

export const InvoiceToolbar: Story = {
  args: {
    searchPlaceholder: 'Search invoices...',
    showFilters: true,
    showExport: true,
    showRefresh: true,
    actions: (
      <>
        <Button variant="outline" leftIcon={<FileDown className="h-4 w-4" />}>
          Download Report
        </Button>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Create Invoice
        </Button>
      </>
    ),
  },
}

export const ProductToolbar: Story = {
  args: {
    searchPlaceholder: 'Search products by name or category...',
    showFilters: true,
    showExport: true,
    showRefresh: true,
    actions: (
      <>
        <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />}>
          Import Products
        </Button>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Add Product
        </Button>
      </>
    ),
  },
}

export const WithTableIntegration: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [filteredData, setFilteredData] = React.useState(employeeData)

    React.useEffect(() => {
      if (!searchQuery) {
        setFilteredData(employeeData)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = employeeData.filter(
        (employee) =>
          employee.name.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.department.toLowerCase().includes(query) ||
          employee.position.toLowerCase().includes(query)
      )
      setFilteredData(filtered)
    }, [searchQuery])

    return (
      <div className="space-y-4">
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search employees..."
          showFilters
          showExport
          showRefresh
          actions={
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Add Employee
            </Button>
          }
        />
        <DataTable
          columns={employeeColumns}
          data={filteredData}
          enableSorting
          enablePagination
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    )
  },
}

export const WithSearchActive: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = React.useState('Ahmed')

    return (
      <div className="space-y-4">
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search employees..."
          showFilters
          showExport
          showRefresh
        />
        <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
          <p className="text-sm text-neutral-400">
            Search query: <span className="font-medium text-white">{searchQuery}</span>
          </p>
        </div>
      </div>
    )
  },
}

export const InteractiveExample: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [filteredData, setFilteredData] = React.useState(employeeData)
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    React.useEffect(() => {
      if (!searchQuery) {
        setFilteredData(employeeData)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = employeeData.filter(
        (employee) =>
          employee.name.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.department.toLowerCase().includes(query)
      )
      setFilteredData(filtered)
    }, [searchQuery])

    const handleRefresh = () => {
      setIsRefreshing(true)
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }

    const handleExport = () => {
      console.log('Exporting data...')
      alert(`Exporting ${filteredData.length} employee records`)
    }

    const handleFilter = () => {
      console.log('Opening filters...')
      alert('Filter dialog would open here')
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Employee Management</h2>
          <p className="text-sm text-neutral-400">
            Manage your team members and their information
          </p>
        </div>

        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by name, email, or department..."
          showFilters
          showExport
          showRefresh
          onFilterClick={handleFilter}
          onExportClick={handleExport}
          onRefreshClick={handleRefresh}
          actions={
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Add Employee
            </Button>
          }
        />

        {searchQuery && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
            <span className="text-sm">
              Showing {filteredData.length} of {employeeData.length} employees
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </div>
        )}

        <DataTable
          columns={employeeColumns}
          data={filteredData}
          enableSorting
          enablePagination
          enableRowSelection
          defaultPageSize={5}
          loading={isRefreshing}
        />
      </div>
    )
  },
}
