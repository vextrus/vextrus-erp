'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { User, Settings, LogOut, ChevronDown, HelpCircle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'
import { getInitials } from '@/lib/utils'

export interface UserMenuProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  onLogoutClick?: () => void
}

const UserMenu = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  UserMenuProps
>(
  (
    {
      user,
      onProfileClick,
      onSettingsClick,
      onHelpClick,
      onLogoutClick,
      ...props
    },
    ref
  ) => {
    return (
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-1.5',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'transition-colors duration-200',
            'data-[state=open]:bg-neutral-100 dark:data-[state=open]:bg-neutral-800'
          )}
          {...props}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {user.email}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            className={cn(
              'z-50 min-w-[240px] overflow-hidden rounded-lg',
              'glass-light shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
            sideOffset={8}
            align="end"
          >
            {/* User Info */}
            <div className="px-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="p-1">
              <DropdownMenuPrimitive.Item
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2',
                  'rounded-md px-3 py-2 text-sm outline-none',
                  'transition-colors',
                  'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
                onSelect={onProfileClick}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuPrimitive.Item>

              <DropdownMenuPrimitive.Item
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2',
                  'rounded-md px-3 py-2 text-sm outline-none',
                  'transition-colors',
                  'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
                onSelect={onSettingsClick}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuPrimitive.Item>

              <DropdownMenuPrimitive.Item
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2',
                  'rounded-md px-3 py-2 text-sm outline-none',
                  'transition-colors',
                  'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
                onSelect={onHelpClick}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuPrimitive.Item>
            </div>

            <DropdownMenuPrimitive.Separator className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Logout */}
            <div className="p-1">
              <DropdownMenuPrimitive.Item
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2',
                  'rounded-md px-3 py-2 text-sm outline-none',
                  'transition-colors',
                  'focus:bg-error-50 dark:focus:bg-error-900/20',
                  'text-error-600 dark:text-error-400',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
                onSelect={onLogoutClick}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuPrimitive.Item>
            </div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    )
  }
)
UserMenu.displayName = 'UserMenu'

export { UserMenu }