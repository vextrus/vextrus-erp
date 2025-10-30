import * as React from 'react'
import { Search, X, Filter, Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'

export interface TableToolbarProps {
  /**
   * Search query value
   */
  searchQuery?: string
  /**
   * Callback when search query changes
   */
  onSearchChange?: (query: string) => void
  /**
   * Search placeholder text
   */
  searchPlaceholder?: string
  /**
   * Show filter button
   */
  showFilters?: boolean
  /**
   * Callback when filter button clicked
   */
  onFilterClick?: () => void
  /**
   * Show export button
   */
  showExport?: boolean
  /**
   * Callback when export button clicked
   */
  onExportClick?: () => void
  /**
   * Show refresh button
   */
  showRefresh?: boolean
  /**
   * Callback when refresh button clicked
   */
  onRefreshClick?: () => void
  /**
   * Custom actions to display on the right
   */
  actions?: React.ReactNode
  /**
   * Custom className
   */
  className?: string
}

const TableToolbar = React.forwardRef<HTMLDivElement, TableToolbarProps>(
  (
    {
      searchQuery = '',
      onSearchChange,
      searchPlaceholder = 'Search...',
      showFilters = false,
      onFilterClick,
      showExport = false,
      onExportClick,
      showRefresh = false,
      onRefreshClick,
      actions,
      className,
    },
    ref
  ) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange?.(e.target.value)
    }

    const handleClearSearch = () => {
      onSearchChange?.('')
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4',
          className
        )}
      >
        {/* Left Section - Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  'rounded-md p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            )}
          </div>

          {showFilters && (
            <Button
              variant="outline"
              onClick={onFilterClick}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {showRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshClick}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {showExport && (
            <Button
              variant="outline"
              onClick={onExportClick}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
          )}

          {actions}
        </div>
      </div>
    )
  }
)
TableToolbar.displayName = 'TableToolbar'

export { TableToolbar }