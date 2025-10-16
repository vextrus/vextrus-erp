import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  maxLength?: number
  autoResize?: boolean
  showCharCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      maxLength,
      autoResize = false,
      showCharCount = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const [charCount, setCharCount] = React.useState(
      props.defaultValue?.toString().length || 0
    )

    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!)

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [autoResize, charCount])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)

      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }

      onChange?.(e)
    }

    return (
      <div className="w-full">
        <textarea
          ref={textareaRef}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border px-3 py-2',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200 dark:border-neutral-800',
            'text-sm placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            autoResize && 'resize-none overflow-hidden',
            !autoResize && 'resize-y',
            error &&
              'border-error-500 focus:ring-error-500 dark:border-error-500',
            className
          )}
          maxLength={maxLength}
          onChange={handleChange}
          aria-invalid={error}
          {...props}
        />
        {(showCharCount || maxLength) && (
          <div
            className={cn(
              'mt-1.5 flex items-center justify-end text-xs',
              charCount > (maxLength || Infinity)
                ? 'text-error-600 dark:text-error-400'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {maxLength ? (
              <span>
                {charCount} / {maxLength}
              </span>
            ) : (
              <span>{charCount} characters</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }