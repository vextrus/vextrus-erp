import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

/**
 * PageLoading Component
 *
 * Full-page loading state with centered spinner.
 * Use for initial page loads or major view transitions.
 *
 * @example
 * ```tsx
 * if (isLoading) return <PageLoading />
 * ```
 */
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-foreground-secondary">Loading...</p>
      </div>
    </div>
  )
}

/**
 * TableSkeleton Component
 *
 * Skeleton loading state for tables.
 * Displays placeholder rows while data is loading.
 *
 * @param rows - Number of skeleton rows to display (default: 5)
 *
 * @example
 * ```tsx
 * if (isLoading) return <TableSkeleton rows={10} />
 * ```
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

/**
 * CardSkeleton Component
 *
 * Skeleton loading state for card components.
 * Displays placeholder content in a card layout.
 *
 * @example
 * ```tsx
 * if (isLoading) return <CardSkeleton />
 * ```
 */
export function CardSkeleton() {
  return (
    <div className="glass-effect p-6 rounded-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

/**
 * ListSkeleton Component
 *
 * Skeleton loading state for lists.
 * Displays placeholder items while data is loading.
 *
 * @param items - Number of skeleton items to display (default: 3)
 *
 * @example
 * ```tsx
 * if (isLoading) return <ListSkeleton items={5} />
 * ```
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * FormSkeleton Component
 *
 * Skeleton loading state for forms.
 * Displays placeholder form fields while loading.
 *
 * @param fields - Number of skeleton fields to display (default: 4)
 *
 * @example
 * ```tsx
 * if (isLoading) return <FormSkeleton fields={6} />
 * ```
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-6" />
    </div>
  )
}
