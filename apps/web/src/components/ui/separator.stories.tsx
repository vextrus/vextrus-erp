import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta = {
  title: 'UI/Layout/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Account Settings</h4>
        <p className="text-sm text-neutral-400">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Privacy Settings</h4>
        <p className="text-sm text-neutral-400">
          Control who can see your information.
        </p>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center space-x-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Dashboard</h4>
        <p className="text-sm text-neutral-400">Overview</p>
      </div>
      <Separator orientation="vertical" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Analytics</h4>
        <p className="text-sm text-neutral-400">Reports</p>
      </div>
      <Separator orientation="vertical" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Settings</h4>
        <p className="text-sm text-neutral-400">Configure</p>
      </div>
    </div>
  ),
}

export const InList: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">General</h4>
          <p className="text-sm text-neutral-400">Basic settings and preferences</p>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium mb-1">Notifications</h4>
          <p className="text-sm text-neutral-400">Manage notification settings</p>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium mb-1">Security</h4>
          <p className="text-sm text-neutral-400">Password and authentication</p>
        </div>
      </div>
    </div>
  ),
}

export const InCard: Story = {
  render: () => (
    <div className="w-full max-w-md p-6 rounded-lg border border-neutral-800 bg-neutral-950">
      <div>
        <h3 className="text-lg font-semibold mb-1">Invoice Details</h3>
        <p className="text-sm text-neutral-400">Invoice #INV-2024-042</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Client</span>
          <span className="font-medium">ABC Construction Ltd.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Amount</span>
          <span className="font-medium">৳50,000</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Due Date</span>
          <span className="font-medium">Jan 20, 2025</span>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between text-sm">
        <span className="text-neutral-400">Status</span>
        <span className="font-medium text-warning-500">Pending</span>
      </div>
    </div>
  ),
}

export const InMenu: Story = {
  render: () => (
    <div className="w-64 p-2 rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="space-y-1">
        <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
          Profile Settings
        </button>
        <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
          Billing
        </button>
        <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
          Team
        </button>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1">
        <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
          Documentation
        </button>
        <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
          Support
        </button>
      </div>
      <Separator className="my-2" />
      <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors text-error-500">
        Logout
      </button>
    </div>
  ),
}

export const MultipleSections: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-6 rounded-lg border border-neutral-800 bg-neutral-950">
      <h2 className="text-xl font-bold mb-4">Employee Profile</h2>

      <div className="space-y-4">
        {/* Personal Information */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-neutral-300">Personal Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Full Name</span>
              <span>Ahmed Rahman</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Email</span>
              <span>ahmed.rahman@example.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Phone</span>
              <span>+880 1712-345678</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Employment Details */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-neutral-300">Employment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Department</span>
              <span>Engineering</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Position</span>
              <span>Software Engineer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Joined</span>
              <span>Jan 15, 2024</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-neutral-300">Emergency Contact</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Contact Name</span>
              <span>Fatima Rahman</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Relationship</span>
              <span>Spouse</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Phone</span>
              <span>+880 1712-987654</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const WithCustomSpacing: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Section 1</h4>
        <p className="text-sm text-neutral-400">Content for section 1</p>
      </div>
      <Separator className="my-2" />
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Section 2</h4>
        <p className="text-sm text-neutral-400">Content for section 2</p>
      </div>
      <Separator className="my-6" />
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Section 3</h4>
        <p className="text-sm text-neutral-400">Content for section 3 with larger spacing</p>
      </div>
      <Separator className="my-8" />
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Section 4</h4>
        <p className="text-sm text-neutral-400">Content for section 4 with even larger spacing</p>
      </div>
    </div>
  ),
}
