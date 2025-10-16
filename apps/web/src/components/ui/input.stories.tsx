import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Input } from './input'
import { Search, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'

const meta = {
  title: 'UI/Forms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello, World!',
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
}

export const SearchType: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
}

export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Search...',
    leftIcon: <Search className="h-4 w-4" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
    rightIcon: <Mail className="h-4 w-4" />,
  },
}

export const WithBothIcons: Story = {
  args: {
    placeholder: 'Username',
    leftIcon: <User className="h-4 w-4" />,
    rightIcon: <Eye className="h-4 w-4" />,
  },
}

export const ErrorState: Story = {
  args: {
    placeholder: 'Enter email',
    defaultValue: 'invalid-email',
    error: true,
  },
}

export const ErrorWithIcon: Story = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
    defaultValue: 'invalid',
    error: true,
    leftIcon: <Mail className="h-4 w-4" />,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const DisabledWithValue: Story = {
  args: {
    defaultValue: 'Disabled with value',
    disabled: true,
  },
}

export const ReadOnly: Story = {
  args: {
    defaultValue: 'Read-only value',
    readOnly: true,
  },
}

export const Required: Story = {
  args: {
    placeholder: 'Required field',
    required: true,
  },
}

export const WithMaxLength: Story = {
  args: {
    placeholder: 'Max 10 characters',
    maxLength: 10,
  },
}

// Example form with multiple inputs
export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <label className="text-sm font-medium">Username</label>
        <Input placeholder="Enter username" leftIcon={<User className="h-4 w-4" />} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" placeholder="Enter password" leftIcon={<Lock className="h-4 w-4" />} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <Input placeholder="Search..." leftIcon={<Search className="h-4 w-4" />} />
      </div>
    </div>
  ),
}
