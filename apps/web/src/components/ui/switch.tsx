import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
  description?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, description, ...props }, ref) => {
  const switchContent = (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'bg-neutral-200 dark:bg-neutral-700',
        'data-[state=checked]:bg-primary-500',
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm',
          'ring-0 transition-transform',
          'data-[state=checked]:translate-x-5',
          'data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  )

  if (!label && !description) {
    return switchContent
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1 flex-1">
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              'text-sm font-medium leading-none cursor-pointer',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            )}
          >
            {label}
          </label>
        )}
        {description && (
          <p
            className="text-xs text-neutral-500 dark:text-neutral-400"
            id={props.id ? `${props.id}-description` : undefined}
          >
            {description}
          </p>
        )}
      </div>
      {switchContent}
    </div>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }