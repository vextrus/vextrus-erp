import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
        primary:
          'bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100',
        success:
          'bg-success-100 text-success-900 dark:bg-success-900/30 dark:text-success-100',
        warning:
          'bg-warning-100 text-warning-900 dark:bg-warning-900/30 dark:text-warning-100',
        error:
          'bg-error-100 text-error-900 dark:bg-error-900/30 dark:text-error-100',
        info: 'bg-info-100 text-info-900 dark:bg-info-900/30 dark:text-info-100',
        outline:
          'border border-neutral-300 bg-transparent text-neutral-700 dark:border-neutral-700 dark:text-neutral-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether the badge can be dismissed
   */
  dismissible?: boolean
  /**
   * Callback when badge is dismissed
   */
  onDismiss?: () => void
  /**
   * Icon to display before the label
   */
  icon?: React.ReactNode
  /**
   * Dot indicator before the label
   */
  dot?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dismissible,
      onDismiss,
      icon,
      dot,
      children,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false)

    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation()
      setDismissed(true)
      onDismiss?.()
    }

    if (dismissed) return null

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-1.5 w-1.5 rounded-full',
              variant === 'primary' && 'bg-primary-600 dark:bg-primary-400',
              variant === 'success' && 'bg-success-600 dark:bg-success-400',
              variant === 'warning' && 'bg-warning-600 dark:bg-warning-400',
              variant === 'error' && 'bg-error-600 dark:bg-error-400',
              variant === 'info' && 'bg-info-600 dark:bg-info-400',
              (variant === 'default' || variant === 'outline') &&
                'bg-neutral-600 dark:bg-neutral-400'
            )}
          />
        )}
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10',
              'transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500'
            )}
            aria-label="Dismiss badge"
          >
            <X className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          </button>
        )}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }