/**
 * Theme Switcher Component
 *
 * Allows users to toggle between light, dark, and system themes.
 * Integrates with next-themes for theme management.
 *
 * Usage:
 * ```tsx
 * import { ThemeSwitcher } from '@/components/ui/theme-switcher';
 *
 * <ThemeSwitcher />
 * ```
 */

'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function ThemeSwitcher() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon">
          {theme === 'light' && <Sun className="h-5 w-5" />}
          {theme === 'dark' && <Moon className="h-5 w-5" />}
          {theme === 'system' && <Monitor className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={cn(
            'z-50 min-w-[160px] overflow-hidden rounded-lg',
            'glass-light shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          sideOffset={8}
          align="end"
        >
          <div className="p-1">
            <DropdownMenuPrimitive.Item
              className={cn(
                'relative flex cursor-pointer select-none items-center gap-2',
                'rounded-md px-3 py-2 text-sm outline-none',
                'transition-colors',
                'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              )}
              onSelect={() => setTheme('light')}
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuPrimitive.Item>

            <DropdownMenuPrimitive.Item
              className={cn(
                'relative flex cursor-pointer select-none items-center gap-2',
                'rounded-md px-3 py-2 text-sm outline-none',
                'transition-colors',
                'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              )}
              onSelect={() => setTheme('dark')}
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuPrimitive.Item>

            <DropdownMenuPrimitive.Item
              className={cn(
                'relative flex cursor-pointer select-none items-center gap-2',
                'rounded-md px-3 py-2 text-sm outline-none',
                'transition-colors',
                'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              )}
              onSelect={() => setTheme('system')}
            >
              <Monitor className="h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuPrimitive.Item>
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
