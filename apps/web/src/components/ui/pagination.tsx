import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface PaginationProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number
  /**
   * Total number of pages
   */
  totalPages: number
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void
  /**
   * Number of page buttons to show around current page
   */
  siblingCount?: number
  /**
   * Show first/last page buttons
   */
  showFirstLast?: boolean
  /**
   * Custom className
   */
  className?: string
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      showFirstLast = true,
      className,
    },
    ref
  ) => {
    // Generate array of page numbers to display
    const getPageNumbers = () => {
      const pages: (number | 'ellipsis')[] = []

      // Always show first page
      pages.push(1)

      // Calculate range around current page
      const leftSibling = Math.max(currentPage - siblingCount, 2)
      const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1)

      // Add left ellipsis if needed
      if (leftSibling > 2) {
        pages.push('ellipsis')
      }

      // Add pages around current page
      for (let i = leftSibling; i <= rightSibling; i++) {
        pages.push(i)
      }

      // Add right ellipsis if needed
      if (rightSibling < totalPages - 1) {
        pages.push('ellipsis')
      }

      // Always show last page (if more than 1 page)
      if (totalPages > 1) {
        pages.push(totalPages)
      }

      return pages
    }

    const pages = getPageNumbers()

    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page)
      }
    }

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn('flex items-center gap-1', className)}
      >
        {/* First Page Button */}
        {showFirstLast && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous Page Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-9 items-center justify-center text-neutral-500"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'ghost'}
                size="icon-sm"
                onClick={() => handlePageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            )
          })}
        </div>

        {/* Next Page Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page Button */}
        {showFirstLast && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </nav>
    )
  }
)
Pagination.displayName = 'Pagination'

// Simple pagination info component
export interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  className?: string
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  className,
}) => {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <p className={cn('text-sm text-neutral-600 dark:text-neutral-400', className)}>
      Showing <span className="font-medium">{start}</span> to{' '}
      <span className="font-medium">{end}</span> of{' '}
      <span className="font-medium">{totalItems}</span> results
    </p>
  )
}

export { Pagination }