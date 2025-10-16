import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { EmptyState } from './empty-state'
import { FileX, Users, Package, DollarSign, Inbox, FolderX } from 'lucide-react'

const meta = {
  title: 'UI/Data Display/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    title: 'No data available',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '500px', minHeight: '400px', display: 'flex', alignItems: 'center' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'No items found',
  },
}

export const WithDescription: Story = {
  args: {
    title: 'No results',
    description: "We couldn't find any items matching your search.",
  },
}

export const WithIcon: Story = {
  args: {
    icon: <Inbox className="h-16 w-16" />,
    title: 'Your inbox is empty',
    description: 'When you receive messages, they will appear here.',
  },
}

export const WithAction: Story = {
  args: {
    icon: <FileX className="h-16 w-16" />,
    title: 'No documents',
    description: 'Get started by creating your first document.',
    action: {
      label: 'Create Document',
      onClick: fn(),
    },
  },
}

export const WithSecondaryAction: Story = {
  args: {
    icon: <Users className="h-16 w-16" />,
    title: 'No team members',
    description: 'Invite people to collaborate on your projects.',
    action: {
      label: 'Invite Members',
      onClick: fn(),
    },
    secondaryAction: {
      label: 'Learn More',
      onClick: fn(),
      variant: 'ghost',
    },
  },
}

export const NoInvoices: Story = {
  args: {
    icon: <DollarSign className="h-16 w-16" />,
    title: 'No invoices yet',
    description: 'Create your first invoice to start billing clients.',
    action: {
      label: 'Create Invoice',
      onClick: fn(),
    },
  },
}

export const NoProducts: Story = {
  args: {
    icon: <Package className="h-16 w-16" />,
    title: 'No products in inventory',
    description: 'Add products to start managing your inventory.',
    action: {
      label: 'Add Product',
      onClick: fn(),
    },
    secondaryAction: {
      label: 'Import Products',
      onClick: fn(),
      variant: 'secondary',
    },
  },
}

export const NoSearchResults: Story = {
  args: {
    icon: <FolderX className="h-16 w-16" />,
    title: 'No results found',
    description: "Try adjusting your search or filter to find what you're looking for.",
    action: {
      label: 'Clear Filters',
      onClick: fn(),
    },
  },
}

export const SmallSize: Story = {
  args: {
    size: 'sm',
    icon: <Inbox className="h-12 w-12" />,
    title: 'No notifications',
    description: "You're all caught up!",
  },
}

export const LargeSize: Story = {
  args: {
    size: 'lg',
    icon: <Package className="h-20 w-20" />,
    title: 'No data available',
    description: "There's nothing to display right now. Check back later or add some data to get started.",
    action: {
      label: 'Get Started',
      onClick: fn(),
    },
  },
}
