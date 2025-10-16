import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Badge } from './badge'
import { CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react'

const meta = {
  title: 'UI/Data Display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onDismiss: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error',
  },
}

export const InfoVariant: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
}

export const WithDot: Story = {
  args: {
    variant: 'success',
    dot: true,
    children: 'Active',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'success',
    icon: <CheckCircle2 className="h-3 w-3" />,
    children: 'Verified',
  },
}

export const Dismissible: Story = {
  args: {
    variant: 'info',
    dismissible: true,
    children: 'Dismissible',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}

export const WithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" dot>
        Active
      </Badge>
      <Badge variant="warning" dot>
        Pending
      </Badge>
      <Badge variant="error" dot>
        Inactive
      </Badge>
      <Badge variant="info" dot>
        Draft
      </Badge>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
        Approved
      </Badge>
      <Badge variant="error" icon={<AlertCircle className="h-3 w-3" />}>
        Rejected
      </Badge>
      <Badge variant="info" icon={<Info className="h-3 w-3" />}>
        Info
      </Badge>
      <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
        Pending
      </Badge>
    </div>
  ),
}

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800">
        <span className="text-sm">Order Status</span>
        <Badge variant="success" dot>
          Delivered
        </Badge>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800">
        <span className="text-sm">Payment Status</span>
        <Badge variant="warning" dot>
          Pending
        </Badge>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800">
        <span className="text-sm">Account Status</span>
        <Badge variant="error" dot>
          Suspended
        </Badge>
      </div>
    </div>
  ),
}

export const ERPStatusBadges: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-lg">
      <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
        <div>
          <p className="font-medium">Invoice #INV-2024-042</p>
          <p className="text-sm text-neutral-400">Due: Jan 20, 2025</p>
        </div>
        <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
          Pending
        </Badge>
      </div>
      <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
        <div>
          <p className="font-medium">Invoice #INV-2024-041</p>
          <p className="text-sm text-neutral-400">Paid: Jan 15, 2025</p>
        </div>
        <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
          Paid
        </Badge>
      </div>
      <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
        <div>
          <p className="font-medium">Invoice #INV-2024-040</p>
          <p className="text-sm text-neutral-400">Overdue: 5 days</p>
        </div>
        <Badge variant="error" icon={<AlertCircle className="h-3 w-3" />}>
          Overdue
        </Badge>
      </div>
    </div>
  ),
}

export const ProjectBadges: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-lg">
      <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Bashundhara R-A - Building A</h3>
          <Badge variant="success" dot size="sm">
            On Track
          </Badge>
        </div>
        <div className="flex gap-2">
          <Badge size="sm" variant="outline">
            Foundation
          </Badge>
          <Badge size="sm" variant="outline">
            Structural
          </Badge>
          <Badge size="sm" variant="info">
            Phase 2
          </Badge>
        </div>
      </div>
      <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Gulshan 2 - Commercial</h3>
          <Badge variant="warning" dot size="sm">
            Delayed
          </Badge>
        </div>
        <div className="flex gap-2">
          <Badge size="sm" variant="outline">
            Electrical
          </Badge>
          <Badge size="sm" variant="warning">
            Phase 3
          </Badge>
        </div>
      </div>
    </div>
  ),
}

export const EmployeeBadges: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-lg">
      <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800">
        <div className="flex-1">
          <p className="font-medium">John Doe</p>
          <p className="text-sm text-neutral-400">Software Engineer</p>
        </div>
        <div className="flex gap-2">
          <Badge size="sm" variant="success" dot>
            Active
          </Badge>
          <Badge size="sm" variant="primary">
            Full-time
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800">
        <div className="flex-1">
          <p className="font-medium">Jane Smith</p>
          <p className="text-sm text-neutral-400">Project Manager</p>
        </div>
        <div className="flex gap-2">
          <Badge size="sm" variant="warning" dot>
            On Leave
          </Badge>
          <Badge size="sm" variant="primary">
            Full-time
          </Badge>
        </div>
      </div>
    </div>
  ),
}
