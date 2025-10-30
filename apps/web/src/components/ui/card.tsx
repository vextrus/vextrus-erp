import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hover?: boolean
  glassLevel?: 'subtle' | 'light' | 'medium' | 'strong'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      glass = false,
      hover = true,
      glassLevel = 'light',
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      'rounded-xl border',
      glass
        ? `glass-${glassLevel}`
        : 'bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800',
      className
    )

    if (!hover) {
      return (
        <div ref={ref} className={cardClasses} {...props}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cardClasses}
        whileHover={{
          y: -4,
          boxShadow: glass
            ? '0 12px 48px 0 rgba(0, 0, 0, 0.16)'
            : '0 12px 24px 0 rgba(0, 0, 0, 0.08)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }