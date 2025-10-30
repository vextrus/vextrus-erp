import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './header'
import { fn } from '@storybook/test'

const meta = {
  title: 'UI/Navigation/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onSearch: fn(),
    onLogout: fn(),
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
  },
}

export const WithNotifications: Story = {
  args: {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
    notificationCount: 3,
  },
}

export const WithoutAvatar: Story = {
  args: {
    user: {
      name: 'Alice Brown',
      email: 'alice@example.com',
    },
  },
}

export const AdminUser: Story = {
  args: {
    user: {
      name: 'Admin User',
      email: 'admin@vextrus.com',
      avatar: 'https://github.com/vercel.png',
      role: 'Administrator',
    },
    notificationCount: 5,
  },
}

export const BengaliUser: Story = {
  args: {
    user: {
      name: 'আব্দুল্লাহ আল মামুন',
      email: 'mamun@vextrus.com',
    },
  },
}

export const WithCustomTitle: Story = {
  args: {
    title: 'Finance Dashboard',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
  },
}

export const WithBreadcrumbs: Story = {
  render: () => (
    <div className="space-y-4">
      <Header
        user={{
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://github.com/shadcn.png',
        }}
        onSearch={(query) => console.log('Search:', query)}
        onLogout={() => console.log('Logout')}
      />
      <div className="px-6">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <a href="#" className="hover:text-white">
            Dashboard
          </a>
          <span>/</span>
          <a href="#" className="hover:text-white">
            Finance
          </a>
          <span>/</span>
          <span className="text-white">Invoices</span>
        </div>
      </div>
    </div>
  ),
}

export const ERPDashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-neutral-950">
      <Header
        title="Vextrus ERP"
        user={{
          name: 'John Doe',
          email: 'john@vextrus.com',
          avatar: 'https://github.com/shadcn.png',
          role: 'Finance Manager',
        }}
        notificationCount={3}
        onSearch={(query) => console.log('Search:', query)}
        onLogout={() => console.log('Logout')}
      />
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Total Revenue</p>
            <p className="text-2xl font-bold mt-2">৳45,231</p>
          </div>
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Active Projects</p>
            <p className="text-2xl font-bold mt-2">12</p>
          </div>
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Pending Invoices</p>
            <p className="text-2xl font-bold mt-2">23</p>
          </div>
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Employees</p>
            <p className="text-2xl font-bold mt-2">134</p>
          </div>
        </div>
      </main>
    </div>
  ),
}

export const ConstructionERP: Story = {
  render: () => (
    <div className="min-h-screen bg-neutral-950">
      <Header
        title="Construction ERP"
        user={{
          name: 'Ahmed Rahman',
          email: 'ahmed@construction.com',
          avatar: 'https://github.com/shadcn.png',
          role: 'Project Manager',
        }}
        notificationCount={7}
        onSearch={(query) => console.log('Search:', query)}
        onLogout={() => console.log('Logout')}
      />
      <div className="border-b border-neutral-800 bg-neutral-950/50">
        <nav className="px-6 py-3 flex items-center gap-6 text-sm">
          <a href="#" className="text-white font-medium">
            Projects
          </a>
          <a href="#" className="text-neutral-400 hover:text-white">
            Materials
          </a>
          <a href="#" className="text-neutral-400 hover:text-white">
            Workforce
          </a>
          <a href="#" className="text-neutral-400 hover:text-white">
            Finance
          </a>
          <a href="#" className="text-neutral-400 hover:text-white">
            Reports
          </a>
        </nav>
      </div>
      <main className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Active Projects</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage all construction projects in one place
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <h3 className="font-semibold mb-2">Bashundhara R-A</h3>
            <p className="text-sm text-neutral-400">Building A - Floor 12</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-success-500">On Track</span>
              <span className="text-xs text-neutral-500">75% Complete</span>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <h3 className="font-semibold mb-2">Gulshan 2</h3>
            <p className="text-sm text-neutral-400">Commercial Complex</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-warning-500">Delayed</span>
              <span className="text-xs text-neutral-500">45% Complete</span>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <h3 className="font-semibold mb-2">Dhanmondi Residence</h3>
            <p className="text-sm text-neutral-400">Luxury Apartments</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-success-500">On Track</span>
              <span className="text-xs text-neutral-500">60% Complete</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  ),
}

export const MobileResponsive: Story = {
  render: () => (
    <div className="max-w-md">
      <Header
        user={{
          name: 'John Doe',
          email: 'john@example.com',
        }}
        notificationCount={2}
        onSearch={(query) => console.log('Search:', query)}
        onLogout={() => console.log('Logout')}
      />
      <div className="p-4">
        <p className="text-sm text-neutral-400">
          On mobile devices, the header should adapt to smaller screens
        </p>
      </div>
    </div>
  ),
}

export const MinimalHeader: Story = {
  render: () => (
    <div className="min-h-screen bg-neutral-950">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
        <div className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          Vextrus
        </div>
        <Header
          user={{
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://github.com/shadcn.png',
          }}
          onLogout={() => console.log('Logout')}
        />
      </header>
    </div>
  ),
}
