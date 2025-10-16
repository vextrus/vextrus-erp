---
task: h-implement-frontend-foundation-worldclass/02-core-components
branch: feature/frontend-foundation-worldclass
status: pending
created: 2025-09-29
modules: [web, ui-components, design-system]
phase: 2
duration: Week 3-4
---

# Phase 2: Core Components

## Objective
Build comprehensive component library with glassmorphism effects, animated interactions, and Vextrus Vision theme implementation including buttons, forms, cards, modals, and navigation.

## Success Criteria
- [ ] Base component library complete
- [ ] Glassmorphism effects implemented
- [ ] Animation system working
- [ ] Form components with validation
- [ ] Data display components ready
- [ ] Navigation components functional
- [ ] Storybook documentation complete
- [ ] Component tests passing
- [ ] Accessibility standards met

## Technical Implementation

### 1. Button Component with Glassmorphism
```tsx
// src/components/ui/button/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-vextrus-navy-500 text-white hover:bg-vextrus-navy-600 shadow-lg hover:shadow-xl',
        glass: 'glass-effect text-white hover:bg-white/20 border-white/20',
        'glass-primary': 'bg-vextrus-navy-500/20 backdrop-blur-md border border-vextrus-navy-500/30 text-vextrus-navy-900 dark:text-white hover:bg-vextrus-navy-500/30',
        'glass-success': 'bg-vextrus-emerald-500/20 backdrop-blur-md border border-vextrus-emerald-500/30 text-vextrus-emerald-900 dark:text-white hover:bg-vextrus-emerald-500/30',
        gradient: 'bg-gradient-vextrus text-white hover:opacity-90 shadow-lg hover:shadow-xl',
        outline: 'border border-vextrus-navy-500 bg-transparent text-vextrus-navy-500 hover:bg-vextrus-navy-500 hover:text-white',
        ghost: 'hover:bg-vextrus-navy-500/10 hover:text-vextrus-navy-500',
        link: 'text-vextrus-navy-500 underline-offset-4 hover:underline',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        glow: 'bg-vextrus-emerald-500 text-white shadow-glow hover:shadow-glow-lg',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        xl: 'h-14 rounded-2xl px-10 text-base',
        icon: 'h-10 w-10',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse-slow',
        bounce: 'hover:animate-bounce',
        spin: 'hover:animate-spin',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'size'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    animation,
    asChild = false,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : motion.button

    const buttonContent = (
      <>
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    )

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
```

### 2. Glass Card Component
```tsx
// src/components/ui/card/glass-card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'light' | 'dark' | 'primary' | 'success'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  shadow?: boolean
  hover?: boolean
  glow?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    className,
    variant = 'light',
    blur = 'md',
    border = true,
    shadow = true,
    hover = false,
    glow = false,
    children,
    ...props
  }, ref) => {
    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }

    const variantClasses = {
      light: 'bg-white/10',
      dark: 'bg-black/10',
      primary: 'bg-vextrus-navy-500/10',
      success: 'bg-vextrus-emerald-500/10',
    }

    const baseClasses = cn(
      'rounded-2xl p-6',
      variantClasses[variant],
      blurClasses[blur],
      border && 'border border-white/20',
      shadow && 'shadow-glass',
      hover && 'hover:bg-white/15 transition-all duration-300',
      glow && 'shadow-glow',
      className
    )

    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={hover ? { scale: 1.02 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

// Card subcomponents
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-6', className)}
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
      'text-2xl font-semibold leading-none tracking-tight gradient-text',
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
    className={cn('text-sm text-foreground-secondary', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export {
  GlassCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}
```

### 3. Advanced Input Components
```tsx
// src/components/ui/input/glass-input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  glass?: boolean
}

const GlassInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    success,
    leftIcon,
    rightIcon,
    glass = true,
    ...props
  }, ref) => {
    const [focused, setFocused] = React.useState(false)

    const inputClasses = cn(
      'flex h-11 w-full rounded-xl text-sm transition-all duration-300',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-foreground-tertiary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      glass && 'bg-white/10 backdrop-blur-md border border-white/20',
      !glass && 'bg-background border border-input',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      !leftIcon && !rightIcon && 'px-4',
      focused && 'ring-2 ring-vextrus-emerald-500 border-transparent',
      error && 'border-red-500 focus:ring-red-500',
      success && 'border-vextrus-emerald-500 focus:ring-vextrus-emerald-500',
      className
    )

    return (
      <div className="relative">
        {label && (
          <motion.label
            className="block text-sm font-medium mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            className="mt-2 text-sm text-red-500"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  glass?: boolean
}

const GlassSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, glass = true, ...props }, ref) => {
    const selectClasses = cn(
      'flex h-11 w-full rounded-xl px-4 text-sm transition-all duration-300',
      'disabled:cursor-not-allowed disabled:opacity-50',
      glass && 'bg-white/10 backdrop-blur-md border border-white/20',
      !glass && 'bg-background border border-input',
      'focus:ring-2 focus:ring-vextrus-emerald-500 focus:border-transparent',
      error && 'border-red-500 focus:ring-red-500',
      className
    )

    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium mb-2">{label}</label>
        )}
        <select className={selectClasses} ref={ref} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

GlassSelect.displayName = 'GlassSelect'

export { GlassInput, GlassSelect }
```

### 4. Modal Component with Glassmorphism
```tsx
// src/components/ui/modal/glass-modal.tsx
import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface GlassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeButton?: boolean
}

const GlassModal: React.FC<GlassModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  closeButton = true,
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  'fixed left-[50%] top-[50%] z-50 w-full p-4',
                  sizeClasses[size]
                )}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  x: '-50%',
                  y: '-50%',
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: '-50%',
                  y: '-50%',
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <div className="glass-effect rounded-2xl p-6 shadow-2xl border border-white/20">
                  {(title || closeButton) && (
                    <div className="flex items-center justify-between mb-4">
                      {title && (
                        <Dialog.Title className="text-xl font-semibold gradient-text">
                          {title}
                        </Dialog.Title>
                      )}
                      {closeButton && (
                        <Dialog.Close asChild>
                          <button
                            className="ml-auto rounded-lg p-1 hover:bg-white/10 transition-colors"
                            aria-label="Close"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </Dialog.Close>
                      )}
                    </div>
                  )}
                  {description && (
                    <Dialog.Description className="text-sm text-foreground-secondary mb-4">
                      {description}
                    </Dialog.Description>
                  )}
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export { GlassModal }
```

### 5. Navigation Components
```tsx
// src/components/ui/navigation/glass-nav.tsx
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Package,
  FileText,
  DollarSign,
  ChevronDown,
} from 'lucide-react'

interface NavItem {
  title: string
  href?: string
  icon?: React.ReactNode
  children?: NavItem[]
  badge?: string | number
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: 'Finance',
    icon: <DollarSign className="h-5 w-5" />,
    children: [
      { title: 'Invoices', href: '/finance/invoices' },
      { title: 'Payments', href: '/finance/payments' },
      { title: 'Reports', href: '/finance/reports' },
    ],
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: <Package className="h-5 w-5" />,
    badge: 'New',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
]

const GlassSidebar: React.FC = () => {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = item.href === pathname
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.title}>
        {item.href ? (
          <Link href={item.href}>
            <motion.div
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300',
                'hover:bg-white/10',
                isActive && 'bg-white/20 shadow-glass',
                depth > 0 && 'ml-6'
              )}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.icon}
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="rounded-full bg-vextrus-emerald-500/20 px-2 py-0.5 text-xs font-medium text-vextrus-emerald-500">
                  {item.badge}
                </span>
              )}
            </motion.div>
          </Link>
        ) : (
          <motion.button
            onClick={() => hasChildren && toggleExpand(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300',
              'hover:bg-white/10',
              depth > 0 && 'ml-6'
            )}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.title}</span>
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            )}
          </motion.button>
        )}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children!.map((child) => renderNavItem(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 p-4">
      <div className="h-full glass-effect rounded-2xl p-4 border border-white/20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold gradient-text">Vextrus</h1>
          <p className="text-sm text-foreground-secondary">Enterprise ERP</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </div>
    </aside>
  )
}

export { GlassSidebar }
```

### 6. Data Table Component
```tsx
// src/components/ui/table/glass-table.tsx
import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../button/button'
import { GlassInput } from '../input/glass-input'

interface GlassTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  showPagination?: boolean
  pageSize?: number
}

function GlassTable<TData, TValue>({
  columns,
  data,
  searchKey,
  showPagination = true,
  pageSize = 10,
}: GlassTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className="space-y-4">
      {searchKey && (
        <GlassInput
          placeholder={`Search ${searchKey}...`}
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="glass-effect rounded-xl border border-white/20 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/20">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() && 'cursor-pointer select-none'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/10 transition-colors hover:bg-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-foreground-secondary"
                >
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-secondary">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { GlassTable }
```

### 7. Toast Notifications
```tsx
// src/components/ui/toast/glass-toast.tsx
import * as React from 'react'
import { Toaster as Sonner } from 'sonner'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

const GlassToaster = () => {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        className: 'glass-effect border border-white/20',
        style: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
        },
      }}
      icons={{
        success: <CheckCircle className="h-5 w-5 text-vextrus-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
      }}
    />
  )
}

export { GlassToaster as Toaster }
```

### 8. Loading Components
```tsx
// src/components/ui/loading/glass-skeleton.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'default'
  animation?: 'pulse' | 'shimmer'
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'glass',
  animation = 'pulse',
  ...props
}) => {
  const baseClasses = cn(
    'rounded-lg',
    variant === 'glass' && 'bg-white/10 backdrop-blur-sm',
    variant === 'default' && 'bg-gray-200 dark:bg-gray-800',
    animation === 'pulse' && 'animate-pulse',
    animation === 'shimmer' && 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:1000px_100%]',
    className
  )

  return <div className={baseClasses} {...props} />
}

// Spinner Component
const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-white/20 border-t-vextrus-emerald-500',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

// Loading Overlay
const LoadingOverlay: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-effect rounded-2xl p-8 border border-white/20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

export { Skeleton, Spinner, LoadingOverlay }
```

## Component Testing

### Storybook Stories
```tsx
// src/stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button/button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Button',
  },
}

export const Gradient: Story = {
  args: {
    variant: 'gradient',
    children: 'Gradient Button',
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Upload',
    leftIcon: '📤',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Processing',
  },
}
```

### Unit Tests
```tsx
// src/components/ui/button/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant classes', () => {
    render(<Button variant="glass">Glass Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('glass-effect')
  })
})
```

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels for icon buttons
- [ ] Focus indicators visible
- [ ] Color contrast ratios meet WCAG AA
- [ ] Screen reader announcements
- [ ] Reduced motion support
- [ ] Touch targets minimum 44x44px
- [ ] Error messages associated with inputs
- [ ] Loading states announced
- [ ] Modal focus trap implemented

## Performance Metrics

- [ ] Component bundle < 50KB
- [ ] First render < 50ms
- [ ] Re-render < 16ms
- [ ] Animation FPS > 60
- [ ] Memory leaks prevented

## Documentation Status

- [ ] All components have Storybook stories
- [ ] Props documented with JSDoc
- [ ] Usage examples provided
- [ ] Accessibility notes included
- [ ] Performance considerations documented

## Next Phase Dependencies

This component library enables:
- Dashboard development (Phase 3)
- Form implementations
- Data visualizations
- Complex interactions

## Resources

- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Framer Motion Guide](https://www.framer.com/motion/introduction/)
- [TanStack Table](https://tanstack.com/table/v8)
- [Class Variance Authority](https://cva.style/docs)
- [Tailwind CSS Components](https://tailwindui.com/components)