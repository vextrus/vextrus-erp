'use client'

import * as React from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { UserMenu } from './user-menu'

export interface HeaderProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onMenuClick?: () => void
  onSearch?: (query: string) => void
  onNotificationsClick?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  onLogoutClick?: () => void
  notificationCount?: number
  showSearch?: boolean
  showNotifications?: boolean
  className?: string
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      user,
      onMenuClick,
      onSearch,
      onNotificationsClick,
      onProfileClick,
      onSettingsClick,
      onHelpClick,
      onLogoutClick,
      notificationCount = 0,
      showSearch = true,
      showNotifications = true,
      className,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState('')

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSearch?.(searchQuery)
    }

    return (
      <header
        ref={ref}
        className={cn(
          'h-16 flex items-center justify-between px-4 lg:px-6',
          'glass-subtle border-b border-neutral-200 dark:border-neutral-800',
          className
        )}
      >
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          {showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:block w-full max-w-md"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </form>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          {showSearch && (
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications */}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotificationsClick}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-white text-xs font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          )}

          {/* User Menu */}
          <UserMenu
            user={user}
            onProfileClick={onProfileClick}
            onSettingsClick={onSettingsClick}
            onHelpClick={onHelpClick}
            onLogoutClick={onLogoutClick}
          />
        </div>
      </header>
    )
  }
)
Header.displayName = 'Header'

export { Header }