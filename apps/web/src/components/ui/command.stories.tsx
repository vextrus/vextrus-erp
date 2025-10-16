import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from './command'
import { Button } from './button'
import {
  Search,
  Home,
  FileText,
  Users,
  Package,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  Building2,
  Calendar,
  BarChart3,
} from 'lucide-react'

const meta = {
  title: 'UI/Overlay/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border border-neutral-800 w-96">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Team</span>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

export const WithKeyboardShortcuts: Story = {
  render: () => (
    <Command className="rounded-lg border border-neutral-800 w-96">
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={fn()}>
            <FileText className="mr-2 h-4 w-4" />
            <span>New Invoice</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Users className="mr-2 h-4 w-4" />
            <span>Add Employee</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Package className="mr-2 h-4 w-4" />
            <span>Add Product</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

export const MultipleGroups: Story = {
  render: () => (
    <Command className="rounded-lg border border-neutral-800 w-96">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={fn()}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Invoices</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Package className="mr-2 h-4 w-4" />
            <span>Inventory</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={fn()}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Users className="mr-2 h-4 w-4" />
            <span>Team Settings</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup>
          <CommandItem onSelect={fn()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

export const AsDialog: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
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
      <>
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-400">
            Press{' '}
            <kbd className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-xs">
              ⌘K
            </kbd>{' '}
            to open
          </p>
          <Button variant="outline" onClick={() => setOpen(true)}>
            Open Command Menu
          </Button>
        </div>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => setOpen(false)}>
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Invoices</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Projects</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Package className="mr-2 h-4 w-4" />
                <span>Inventory</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Users className="mr-2 h-4 w-4" />
                <span>Employees</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => setOpen(false)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Create Invoice</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Users className="mr-2 h-4 w-4" />
                <span>Add Employee</span>
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Package className="mr-2 h-4 w-4" />
                <span>Add Product</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem onSelect={() => setOpen(false)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    )
  },
}

export const ERPCommandPalette: Story = {
  render: () => (
    <Command className="rounded-lg border border-neutral-800 w-[450px]">
      <CommandInput placeholder="Search projects, invoices, employees..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Recent">
          <CommandItem onSelect={fn()}>
            <FileText className="mr-2 h-4 w-4 text-warning-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Invoice #INV-2024-042</p>
              <p className="text-xs text-neutral-400">ABC Construction Ltd. - ৳50,000</p>
            </div>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Building2 className="mr-2 h-4 w-4 text-primary-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Bashundhara R-A - Building A</p>
              <p className="text-xs text-neutral-400">Construction Project - 75% Complete</p>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={fn()}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Create New Invoice</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Add New Project</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Users className="mr-2 h-4 w-4" />
            <span>Add Employee</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Package className="mr-2 h-4 w-4" />
            <span>Add Product</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Record Payment</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Reports">
          <CommandItem onSelect={fn()}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Financial Report</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Project Progress Report</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Inventory Report</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

export const SearchResults: Story = {
  render: () => {
    const [search, setSearch] = React.useState('')

    const invoices = [
      { id: 'INV-2024-042', client: 'ABC Construction Ltd.', amount: 50000 },
      { id: 'INV-2024-041', client: 'XYZ Builders', amount: 75000 },
      { id: 'INV-2024-040', client: 'Rahman Enterprise', amount: 35000 },
    ]

    const projects = [
      { name: 'Bashundhara R-A - Building A', status: 'On Track' },
      { name: 'Gulshan 2 - Commercial', status: 'Delayed' },
    ]

    const filteredInvoices = invoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.client.toLowerCase().includes(search.toLowerCase())
    )

    const filteredProjects = projects.filter((proj) =>
      proj.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
      <Command className="rounded-lg border border-neutral-800 w-[500px]">
        <CommandInput
          placeholder="Search invoices, projects, employees..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found for "{search}"</CommandEmpty>

          {filteredInvoices.length > 0 && (
            <>
              <CommandGroup heading="Invoices">
                {filteredInvoices.map((invoice) => (
                  <CommandItem key={invoice.id} onSelect={fn()}>
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{invoice.id}</p>
                      <p className="text-xs text-neutral-400">
                        {invoice.client} - ৳{invoice.amount.toLocaleString()}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {filteredProjects.length > 0 && <CommandSeparator />}
            </>
          )}

          {filteredProjects.length > 0 && (
            <CommandGroup heading="Projects">
              {filteredProjects.map((project) => (
                <CommandItem key={project.name} onSelect={fn()}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-neutral-400">Status: {project.status}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    )
  },
}

export const WithCategories: Story = {
  render: () => (
    <Command className="rounded-lg border border-neutral-800 w-[450px]">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Finance">
          <CommandItem onSelect={fn()}>
            <DollarSign className="mr-2 h-4 w-4 text-success-500" />
            <span>View Revenue</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <FileText className="mr-2 h-4 w-4 text-warning-500" />
            <span>Pending Invoices</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <BarChart3 className="mr-2 h-4 w-4 text-info-500" />
            <span>Financial Reports</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Operations">
          <CommandItem onSelect={fn()}>
            <Building2 className="mr-2 h-4 w-4 text-primary-500" />
            <span>Active Projects</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Users className="mr-2 h-4 w-4 text-primary-500" />
            <span>Team Management</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Package className="mr-2 h-4 w-4 text-primary-500" />
            <span>Inventory</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          <CommandItem onSelect={fn()}>
            <Settings className="mr-2 h-4 w-4" />
            <span>System Settings</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <Users className="mr-2 h-4 w-4" />
            <span>User Management</span>
          </CommandItem>
          <CommandItem onSelect={fn()}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}
