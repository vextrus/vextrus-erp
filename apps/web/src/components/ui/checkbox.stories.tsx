import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Checkbox } from './checkbox'

const meta = {
  title: 'UI/Forms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onCheckedChange: fn(),
  },
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    indeterminate: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
}

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
}

export const WithLabelChecked: Story = {
  args: {
    label: 'Subscribe to newsletter',
    checked: true,
  },
}

export const WithDescription: Story = {
  args: {
    label: 'Enable notifications',
    description: 'Receive email notifications about your account activity',
  },
}

export const WithLongDescription: Story = {
  args: {
    label: 'Marketing emails',
    description:
      'Get emails about product updates, company news, and exclusive offers. You can unsubscribe at any time.',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export const DisabledWithLabel: Story = {
  args: {
    label: 'Disabled option',
    description: 'This option is currently unavailable',
    disabled: true,
  },
}

export const IndeterminateWithLabel: Story = {
  args: {
    label: 'Select all',
    description: 'Some items are selected',
    indeterminate: true,
  },
}

// Example form with multiple checkboxes
export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox
        label="Email notifications"
        description="Receive notifications about your account via email"
      />
      <Checkbox
        label="SMS notifications"
        description="Receive notifications about your account via SMS"
      />
      <Checkbox
        label="Push notifications"
        description="Receive push notifications on your devices"
      />
    </div>
  ),
}

// Example with select all functionality
export const SelectAllExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox label="Select all" indeterminate />
      <div className="ml-6 space-y-3 border-l-2 border-neutral-200 pl-4">
        <Checkbox label="Option 1" checked />
        <Checkbox label="Option 2" />
        <Checkbox label="Option 3" checked />
      </div>
    </div>
  ),
}

// Form example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-lg">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Privacy Settings</h3>
        <Checkbox
          label="Make profile public"
          description="Your profile will be visible to all users"
        />
        <Checkbox
          label="Show email address"
          description="Display your email on your public profile"
        />
        <Checkbox
          label="Allow search engines"
          description="Let search engines index your profile"
          checked
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Communication</h3>
        <Checkbox
          label="Newsletter"
          description="Weekly updates and announcements"
          checked
        />
        <Checkbox
          label="Product updates"
          description="News about new features and improvements"
          checked
        />
        <Checkbox
          label="Marketing emails"
          description="Promotional offers and events"
        />
      </div>
    </div>
  ),
}
