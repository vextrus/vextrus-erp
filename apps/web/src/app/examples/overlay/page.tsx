'use client'

import { useState, useEffect } from 'react'
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  FileText,
  BarChart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Home,
  Search,
  Info,
  HelpCircle,
  Bell,
  Mail,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function OverlayExamplesPage() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Overlay Components</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Phase 2.6 (FINAL): Contextual overlays including Tooltip, Popover, and Command palette
          </p>
        </div>

        {/* Tooltip Component */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Tooltip Component</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Contextual hints and information on hover or focus
            </p>
          </div>

          {/* Basic Tooltips */}
          <div className="glass-light rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Tooltips</h3>
              <div className="flex flex-wrap gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a tooltip</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="primary">
                      <Info className="h-4 w-4 mr-2" />
                      With Icon
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tooltips work great with icons</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Need help?</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <Separator />

            {/* Icon Tooltips */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Action Tooltips</h3>
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Mail className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send email</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Make a call</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifications (3 new)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <Separator />

            {/* Complex Tooltips */}
            <div>
              <h3 className="text-lg font-semibold mb-4">With Badges</h3>
              <div className="flex flex-wrap gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <Badge variant="success">Active</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>System is operational</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Awaiting approval</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <Badge variant="error">Error</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connection failed - check logs</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </section>

        {/* Popover Component */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Popover Component</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Floating panels for additional content and actions
            </p>
          </div>

          {/* Basic Popovers */}
          <div className="glass-light rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Popover</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Information</h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      This is a popover. It can contain any content you want.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* User Profile Popover */}
            <div>
              <h3 className="text-lg font-semibold mb-4">User Profile Popover</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">John Doe</p>
                        <p className="text-sm text-neutral-500">john@example.com</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Notifications Popover */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Notifications Popover</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    <Badge variant="error" size="sm" className="ml-2">3</Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium mb-2">Recent Notifications</h4>
                    <div className="space-y-2">
                      {[
                        { title: 'New order received', time: '5 min ago', type: 'success' },
                        { title: 'Low stock alert', time: '1 hour ago', type: 'warning' },
                        { title: 'Payment processed', time: '2 hours ago', type: 'success' },
                      ].map((notification, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                        >
                          <div className={`p-1 rounded-full mt-0.5 ${
                            notification.type === 'success' ? 'bg-success-100 dark:bg-success-900/30' :
                            'bg-warning-100 dark:bg-warning-900/30'
                          }`}>
                            <div className="h-2 w-2 rounded-full bg-current" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-neutral-500">{notification.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <Button variant="ghost" size="sm" className="w-full">
                      View all notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </section>

        {/* Command Component */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Command Component</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Command palette for quick navigation and actions
            </p>
          </div>

          {/* Command Palette */}
          <div className="glass-light rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Command Palette (⌘K / Ctrl+K)</h3>
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full max-w-md justify-start text-neutral-500"
                  onClick={() => setOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search commands...
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-1.5 font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <p className="text-sm text-neutral-500">
                  Try pressing <kbd className="px-2 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800">⌘K</kbd> or <kbd className="px-2 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800">Ctrl+K</kbd>
                </p>
              </div>

              <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Quick Actions">
                    <CommandItem
                      onSelect={() => {
                        toast.success('Creating new invoice...')
                        setOpen(false)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>New Invoice</span>
                      <CommandShortcut>⌘N</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.success('Opening calculator...')
                        setOpen(false)
                      }}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      <span>Calculator</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.success('Opening calendar...')
                        setOpen(false)
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Calendar</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Navigation">
                    <CommandItem
                      onSelect={() => {
                        toast.info('Navigating to Dashboard...')
                        setOpen(false)
                      }}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                      <CommandShortcut>⌘D</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.info('Navigating to Reports...')
                        setOpen(false)
                      }}
                    >
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Reports</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.info('Navigating to Inventory...')
                        setOpen(false)
                      }}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>Inventory</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.info('Navigating to Customers...')
                        setOpen(false)
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>Customers</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Financial">
                    <CommandItem
                      onSelect={() => {
                        toast.success('Opening Accounting...')
                        setOpen(false)
                      }}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Accounting</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.success('Opening Sales...')
                        setOpen(false)
                      }}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span>Sales</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.success('Opening Purchase...')
                        setOpen(false)
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Purchase</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Settings">
                    <CommandItem
                      onSelect={() => {
                        toast.info('Opening Profile...')
                        setOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                      <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        toast.info('Opening Settings...')
                        setOpen(false)
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                      <CommandShortcut>⌘,</CommandShortcut>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </CommandDialog>
            </div>

            <Separator />

            {/* Inline Command */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Inline Command</h3>
              <Card>
                <CardContent className="p-4">
                  <Command className="rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-md">
                    <CommandInput placeholder="Search modules..." />
                    <CommandList>
                      <CommandEmpty>No modules found.</CommandEmpty>
                      <CommandGroup heading="Core Modules">
                        <CommandItem>
                          <DollarSign className="mr-2 h-4 w-4" />
                          <span>Finance</span>
                        </CommandItem>
                        <CommandItem>
                          <Package className="mr-2 h-4 w-4" />
                          <span>Inventory</span>
                        </CommandItem>
                        <CommandItem>
                          <Users className="mr-2 h-4 w-4" />
                          <span>HR & Payroll</span>
                        </CommandItem>
                        <CommandItem>
                          <BarChart className="mr-2 h-4 w-4" />
                          <span>Analytics</span>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup heading="Additional">
                        <CommandItem>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Billing</span>
                        </CommandItem>
                        <CommandItem>
                          <Smile className="mr-2 h-4 w-4" />
                          <span>CRM</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Component Showcase */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Component Features</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Comprehensive feature list for Phase 2.6 components (FINAL PHASE!)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tooltip */}
            <Card hover>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Tooltip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li>✓ Radix UI primitive</li>
                  <li>✓ Hover & focus triggers</li>
                  <li>✓ 4 side placements</li>
                  <li>✓ Smooth animations</li>
                  <li>✓ Keyboard accessible</li>
                  <li>✓ Dark mode support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Popover */}
            <Card hover>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Popover
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li>✓ Radix UI primitive</li>
                  <li>✓ Click/focus triggers</li>
                  <li>✓ Flexible positioning</li>
                  <li>✓ Portal rendering</li>
                  <li>✓ Dismiss on outside click</li>
                  <li>✓ Rich content support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Command */}
            <Card hover>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Command
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li>✓ cmdk library</li>
                  <li>✓ Fuzzy search</li>
                  <li>✓ Keyboard shortcuts</li>
                  <li>✓ Grouped commands</li>
                  <li>✓ Dialog & inline modes</li>
                  <li>✓ Custom shortcuts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Success Banner */}
        <Card glass glassLevel="medium" className="border-2 border-primary-200 dark:border-primary-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <Smile className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">Phase 2.6 Complete! 🎉</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  All 31 UI components have been successfully implemented. The Vextrus Vision design system is ready for production!
                </p>
              </div>
              <Badge variant="success" size="lg">
                100%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}