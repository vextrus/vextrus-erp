import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Switch } from './switch'

const meta = {
  title: 'UI/Forms/Switch',
  component: Switch,
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
  },
} satisfies Meta<typeof Switch>

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

export const WithLabel: Story = {
  args: {
    label: 'Enable notifications',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '300px' }}>
        <Story />
      </div>
    ),
  ],
}

export const WithLabelChecked: Story = {
  args: {
    label: 'Dark mode',
    checked: true,
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '300px' }}>
        <Story />
      </div>
    ),
  ],
}

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive emails about new products, features, and more',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export const WithLongDescription: Story = {
  args: {
    label: 'Auto-save',
    description:
      'Automatically save your work every few minutes. This helps prevent data loss in case of unexpected issues.',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export const DisabledWithLabel: Story = {
  args: {
    label: 'Premium feature',
    description: 'Upgrade to access this feature',
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

// Example form with multiple switches
export const SwitchGroup: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-lg">
      <Switch
        label="Email notifications"
        description="Receive email about your account activity"
        defaultChecked
      />
      <Switch
        label="SMS notifications"
        description="Receive SMS about your account activity"
      />
      <Switch
        label="Push notifications"
        description="Receive push notifications on your devices"
        defaultChecked
      />
    </div>
  ),
}

// Settings page example
export const SettingsExample: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Appearance</h3>
        <Switch label="Dark mode" description="Use dark theme across the application" defaultChecked />
        <Switch label="Compact mode" description="Reduce spacing for a more compact layout" />
        <Switch
          label="Animations"
          description="Enable smooth animations and transitions"
          defaultChecked
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Privacy</h3>
        <Switch
          label="Public profile"
          description="Make your profile visible to all users"
          defaultChecked
        />
        <Switch label="Show activity status" description="Let others see when you're online" />
        <Switch label="Search engine indexing" description="Allow search engines to find your profile" />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Notifications</h3>
        <Switch
          label="Email notifications"
          description="Receive email updates about your account"
          defaultChecked
        />
        <Switch label="Desktop notifications" description="Show notifications on your desktop" defaultChecked />
        <Switch label="Mobile notifications" description="Receive push notifications on mobile" />
      </div>
    </div>
  ),
}

// Compact switches without descriptions
export const CompactSwitches: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-md">
      <Switch label="Auto-save" defaultChecked />
      <Switch label="Spell check" defaultChecked />
      <Switch label="Line numbers" />
      <Switch label="Word wrap" defaultChecked />
      <Switch label="Minimap" />
    </div>
  ),
}
