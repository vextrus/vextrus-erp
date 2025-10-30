'use client'

import * as React from 'react'
import Link from 'next/link'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface SidebarItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  active?: boolean
}

export interface SidebarSection {
  id: string
  title: string
  icon?: React.ReactNode
  items: SidebarItem[]
  defaultOpen?: boolean
}

export interface SidebarProps {
  sections: SidebarSection[]
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  logo?: React.ReactNode
  className?: string
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ sections, collapsed = false, onCollapse, logo, className }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          'h-screen flex flex-col glass-medium',
          'border-r border-neutral-200 dark:border-neutral-800',
          'transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          {!collapsed && logo && <div className="flex-1">{logo}</div>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse?.(!collapsed)}
            className="shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {sections.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </aside>
    )
  }
)
Sidebar.displayName = 'Sidebar'

interface SidebarSectionProps {
  section: SidebarSection
  collapsed: boolean
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  section,
  collapsed,
}) => {
  const [isOpen, setIsOpen] = React.useState(section.defaultOpen ?? true)

  if (collapsed) {
    return (
      <div className="mb-2">
        {section.items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex items-center justify-center h-10 rounded-lg',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'transition-colors duration-200',
              item.active &&
                'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            )}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-2"
    >
      <CollapsiblePrimitive.Trigger
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'px-3 py-2 rounded-lg text-sm font-medium',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
        )}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span>{section.title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsiblePrimitive.Trigger>

      <CollapsiblePrimitive.Content className="mt-1 space-y-1">
        {section.items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex items-center justify-between gap-2',
              'px-3 py-2 pl-9 rounded-lg text-sm',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              item.active &&
                'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            )}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  'bg-neutral-200 dark:bg-neutral-700',
                  'text-neutral-700 dark:text-neutral-300'
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Sidebar }