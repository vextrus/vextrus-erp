import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const skeletonVariants = cva(
  'bg-neutral-200 dark:bg-neutral-800',
  {
    variants: {
      variant: {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
      },
      animation: {
        pulse: 'animate-pulse',
        wave: 'animate-skeleton',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'rectangular',
      animation: 'pulse',
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, animation, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation }), className)}
        style={{
          width,
          height,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

export { Skeleton, skeletonVariants }