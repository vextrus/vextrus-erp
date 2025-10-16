import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Spinner } from './spinner'
import { EmptyState } from './empty-state'

export interface DataTableProps<TData, TValue> {
  /**
   * Column definitions
   */
  columns: ColumnDef<TData, TValue>[]
  /**
   * Table data
   */
  data: TData[]
  /**
   * Enable row selection
   */
  enableRowSelection?: boolean
  /**
   * Enable pagination
   */
  enablePagination?: boolean
  /**
   * Page size options
   */
  pageSizeOptions?: number[]
  /**
   * Default page size
   */
  defaultPageSize?: number
  /**
   * Enable sorting
   */
  enableSorting?: boolean
  /**
   * Enable multi-sort
   */
  enableMultiSort?: boolean
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Empty state configuration
   */
  emptyState?: {
    title: string
    description?: string
    icon?: React.ReactNode
    action?: {
      label: string
      onClick: () => void
    }
  }
  /**
   * Callback when row selection changes
   */
  onRowSelectionChange?: (selectedRows: TData[]) => void
  /**
   * Custom className
   */
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = false,
  enablePagination = true,
  pageSizeOptions = [10, 20, 30, 40, 50],
  defaultPageSize = 10,
  enableSorting = true,
  enableMultiSort = false,
  loading = false,
  emptyState,
  onRowSelectionChange,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  // Add selection column if enabled
  const columnsWithSelection = React.useMemo(() => {
    if (!enableRowSelection) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection,
    enableSorting,
    enableMultiSort,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  })

  // Notify parent when selection changes
  React.useEffect(() => {
    if (enableRowSelection && onRowSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, enableRowSelection, onRowSelectionChange, table])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  // Show empty state
  if (data.length === 0) {
    const defaultEmptyState = {
      title: 'No data available',
      description: 'There are no records to display at this time.',
      icon: undefined,
      action: undefined,
    }
    const emptyConfig = emptyState || defaultEmptyState

    return (
      <EmptyState
        title={emptyConfig.title}
        description={emptyConfig.description}
        icon={emptyConfig.icon}
        action={emptyConfig.action}
      />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider',
                        header.column.getCanSort() && 'cursor-pointer select-none'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-neutral-400">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors',
                    row.getIsSelected() && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Selection info and page size selector */}
          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            {enableRowSelection && (
              <span>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </span>
            )}
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className={cn(
                  'rounded-md border border-neutral-200 dark:border-neutral-800',
                  'bg-white dark:bg-neutral-950 px-2 py-1',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create sortable column header
export function createSortableHeader(label: string) {
  const SortableHeader = () => <span>{label}</span>
  SortableHeader.displayName = `SortableHeader(${label})`
  return SortableHeader
}