import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button } from './button'
import { Loader2, Plus, Send } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Versatile button component with glassmorphism support, loading states, and icon integration.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'glass', 'destructive', 'outline', 'link'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon-sm', 'icon'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state with spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Default variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
}

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Button',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
}

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}

// With Icons
export const WithLeftIcon: Story = {
  args: {
    children: 'Add New',
    leftIcon: <Plus className="h-4 w-4" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Send Message',
    rightIcon: <Send className="h-4 w-4" />,
  },
}

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <Plus className="h-5 w-5" />,
    'aria-label': 'Add',
  },
}

// States
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Submit',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
}

// Complex examples
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="glass">Glass</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Plus className="h-5 w-5" /></Button>
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button loading variant="primary">Primary Loading</Button>
      <Button loading variant="secondary">Secondary Loading</Button>
      <Button loading variant="glass">Glass Loading</Button>
    </div>
  ),
}
