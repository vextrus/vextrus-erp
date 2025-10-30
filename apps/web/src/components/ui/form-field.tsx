import * as React from 'react'
import { Label } from './label'
import { FormError } from './form-error'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactElement
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  required,
  error,
  className,
  children,
}) => {
  // Clone the child element and pass necessary props for accessibility
  const childElement = React.cloneElement(children, {
    id: children.props.id || name,
    name: children.props.name || name,
    'aria-invalid': !!error,
    'aria-describedby': description
      ? `${name}-description`
      : error
      ? `${name}-error`
      : undefined,
    error: !!error,
  })

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}

      {description && (
        <p
          className="text-sm text-neutral-500 dark:text-neutral-400"
          id={`${name}-description`}
        >
          {description}
        </p>
      )}

      {childElement}

      {error && <FormError id={`${name}-error`} message={error} />}
    </div>
  )
}

FormField.displayName = 'FormField'

export { FormField }