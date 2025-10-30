import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ message, className, id }, ref) => {
    if (!message) return null

    return (
      <AnimatePresence mode="wait">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-2 text-sm text-error-600 dark:text-error-400',
            className
          )}
          role="alert"
          aria-live="polite"
          id={id}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </motion.div>
      </AnimatePresence>
    )
  }
)
FormError.displayName = 'FormError'

export { FormError }