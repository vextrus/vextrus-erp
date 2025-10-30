import * as React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  className?: string
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, separator, showHome = true, className }, ref) => {
    const defaultSeparator = (
      <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
    )

    const breadcrumbItems = showHome
      ? [{ label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> }, ...items]
      : items

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn('flex items-center gap-2 text-sm', className)}
      >
        <ol className="flex items-center gap-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1

            return (
              <React.Fragment key={index}>
                <li className="flex items-center gap-2">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-1.5',
                        'text-neutral-600 hover:text-primary-600',
                        'dark:text-neutral-400 dark:hover:text-primary-400',
                        'transition-colors duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                        'rounded-md px-1'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        'flex items-center gap-1.5',
                        isLast
                          ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                          : 'text-neutral-600 dark:text-neutral-400'
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  )}
                </li>

                {!isLast && (
                  <li aria-hidden="true">
                    {separator || defaultSeparator}
                  </li>
                )}
              </React.Fragment>
            )
          })}
        </ol>
      </nav>
    )
  }
)
Breadcrumbs.displayName = 'Breadcrumbs'

export { Breadcrumbs }