import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumbs } from './breadcrumbs'
import { Home, ChevronRight } from 'lucide-react'

const meta = {
  title: 'UI/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
    ],
  },
}

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
    ],
  },
}

export const DeepNesting: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Finance', href: '/dashboard/finance' },
      { label: 'Invoices', href: '/dashboard/finance/invoices' },
      { label: 'Invoice #12345', href: '/dashboard/finance/invoices/12345' },
    ],
  },
}

export const WithHomeIcon: Story = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: <Home className="h-4 w-4" />, href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'Website Redesign', href: '/projects/1' },
      ]}
    />
  ),
}

export const LongLabels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Product Management', href: '/products' },
      { label: 'Construction Materials', href: '/products/construction' },
      { label: 'Cement and Concrete Products', href: '/products/construction/cement' },
    ],
  },
}

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Dashboard', href: '/dashboard' }],
  },
}

export const ERPExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-neutral-500 mb-2">Finance Module</p>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Chart of Accounts', href: '/finance/accounts' },
            { label: 'Account Details', href: '/finance/accounts/1001' },
          ]}
        />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-2">Inventory Module</p>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products', href: '/inventory/products' },
            { label: 'Edit Product', href: '/inventory/products/edit/42' },
          ]}
        />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-2">HR Module</p>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Human Resources', href: '/hr' },
            { label: 'Employees', href: '/hr/employees' },
            { label: 'Employee Profile', href: '/hr/employees/profile/123' },
          ]}
        />
      </div>
    </div>
  ),
}

export const ConstructionExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-neutral-500 mb-2">Project Navigation</p>
        <Breadcrumbs
          items={[
            { label: 'Projects', href: '/projects' },
            { label: 'Bashundhara R-A', href: '/projects/bashundhara' },
            { label: 'Building A', href: '/projects/bashundhara/building-a' },
            { label: 'Floor Plans', href: '/projects/bashundhara/building-a/plans' },
          ]}
        />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-2">Material Management</p>
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Materials', href: '/inventory/materials' },
            { label: 'Cement', href: '/inventory/materials/cement' },
            { label: 'Shah Cement 50kg', href: '/inventory/materials/cement/shah-50kg' },
          ]}
        />
      </div>
    </div>
  ),
}
