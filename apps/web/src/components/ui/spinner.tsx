import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-primary-500',
      light: 'text-white',
      muted: 'text-neutral-500',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
})

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={label || 'Loading'}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        <Loader2 className={cn(spinnerVariants({ size, variant }))} />
        {label && <span className="sr-only">{label}</span>}
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'

export { Spinner, spinnerVariants }