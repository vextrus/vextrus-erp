import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, options, orientation = 'vertical', ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn(
        'flex gap-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
      orientation={orientation}
      {...props}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-start gap-3">
          <RadioGroupPrimitive.Item
            value={option.value}
            disabled={option.disabled}
            id={option.value}
            className={cn(
              'aspect-square h-5 w-5 rounded-full border-2',
              'border-neutral-300 dark:border-neutral-600',
              'text-primary-500',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'data-[state=checked]:border-primary-500',
              'transition-all duration-200'
            )}
          >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={option.value}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                option.disabled && 'cursor-not-allowed opacity-70'
              )}
            >
              {option.label}
            </label>
            {option.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {option.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </RadioGroupPrimitive.Root>
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

// Individual Radio Item component for custom usage
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-5 w-5 rounded-full border-2',
        'border-neutral-300 dark:border-neutral-600',
        'text-primary-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary-500',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }