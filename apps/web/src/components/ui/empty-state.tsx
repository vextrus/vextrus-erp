import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from './button'

const emptyStateVariants = cva('flex flex-col items-center justify-center text-center', {
  variants: {
    size: {
      sm: 'py-8 px-4',
      md: 'py-12 px-6',
      lg: 'py-16 px-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: React.ReactNode
}

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /**
   * Icon or illustration to display
   */
  icon?: React.ReactNode
  /**
   * Main heading text
   */
  title: string
  /**
   * Description text
   */
  description?: string
  /**
   * Primary action button
   */
  action?: EmptyStateAction
  /**
   * Secondary action button
   */
  secondaryAction?: EmptyStateAction
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      size,
      icon,
      title,
      description,
      action,
      secondaryAction,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size }), className)}
        role="status"
        aria-live="polite"
        {...props}
      >
        {icon && (
          <div className="mb-4 text-neutral-400 dark:text-neutral-600">
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
            {description}
          </p>
        )}

        {children}

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'primary'}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'secondary'}
              >
                {secondaryAction.icon && (
                  <span className="mr-2">{secondaryAction.icon}</span>
                )}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = 'EmptyState'

export { EmptyState, emptyStateVariants }