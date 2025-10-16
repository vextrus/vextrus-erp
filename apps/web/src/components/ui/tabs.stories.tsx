import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
import { User, Settings, Bell, CreditCard } from 'lucide-react'

const meta = {
  title: 'UI/Navigation/Tabs',
  component: Tabs,
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
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4">Content for Tab 1</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4">Content for Tab 2</div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4">Content for Tab 3</div>
      </TabsContent>
    </Tabs>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold">Profile Settings</h3>
          <p className="text-sm text-neutral-400">Manage your profile information</p>
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold">General Settings</h3>
          <p className="text-sm text-neutral-400">Configure application preferences</p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
          <p className="text-sm text-neutral-400">Manage how you receive notifications</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="available1">
      <TabsList>
        <TabsTrigger value="available1">Available</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="available2">Available</TabsTrigger>
      </TabsList>
      <TabsContent value="available1">
        <div className="p-4">This tab is available</div>
      </TabsContent>
      <TabsContent value="disabled">
        <div className="p-4">You cannot access this tab</div>
      </TabsContent>
      <TabsContent value="available2">
        <div className="p-4">This tab is also available</div>
      </TabsContent>
    </Tabs>
  ),
}

export const FormTabsExample: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-full">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            placeholder="Your name"
            className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </TabsContent>
      <TabsContent value="password" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </TabsContent>
      <TabsContent value="billing" className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
          <CreditCard className="h-6 w-6 text-primary-500" />
          <div>
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="text-xs text-neutral-400">Expires 12/24</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const DashboardExample: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <h3 className="text-lg font-semibold">Dashboard Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Total Revenue</p>
            <p className="text-2xl font-bold">$45,231</p>
          </div>
          <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Active Users</p>
            <p className="text-2xl font-bold">2,345</p>
          </div>
          <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Orders</p>
            <p className="text-2xl font-bold">573</p>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="p-8 text-center">
          <p className="text-neutral-400">Analytics content goes here</p>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="p-8 text-center">
          <p className="text-neutral-400">Reports content goes here</p>
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-8 text-center">
          <p className="text-neutral-400">Settings content goes here</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}
