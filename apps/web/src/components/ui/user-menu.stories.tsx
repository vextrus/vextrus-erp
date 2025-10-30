import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { UserMenu } from './user-menu'
import { fn } from '@storybook/test'

const meta = {
  title: 'UI/Navigation/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onLogout: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '300px', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserMenu>

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

export const WithoutAvatar: Story = {
  args: {
    user: {
      name: 'Alice Brown',
      email: 'alice@example.com',
    },
  },
}

export const LongName: Story = {
  args: {
    user: {
      name: 'Mohammad Abdullah Al-Rahman',
      email: 'mohammad.abdullah@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
  },
}

export const ShortName: Story = {
  args: {
    user: {
      name: 'Li',
      email: 'li@example.com',
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
  },
}

export const BengaliUser: Story = {
  args: {
    user: {
      name: 'আব্দুল্লাহ আল মামুন',
      email: 'mamun@example.com',
    },
  },
}

export const InHeaderContext: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold">Vextrus ERP</div>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu
            user={{
              name: 'John Doe',
              email: 'john@vextrus.com',
              avatar: 'https://github.com/shadcn.png',
            }}
            onLogout={() => console.log('Logout clicked')}
          />
        </div>
      </header>
    </div>
  ),
}

export const WithNotifications: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <button className="relative p-2 rounded-lg hover:bg-neutral-900/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error-500" />
      </button>
      <UserMenu
        user={{
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://github.com/shadcn.png',
        }}
        onLogout={() => console.log('Logout')}
      />
    </div>
  ),
}

export const MultipleUsers: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg">
        <span className="text-sm text-neutral-400">Regular User</span>
        <UserMenu
          user={{
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://github.com/shadcn.png',
          }}
          onLogout={() => console.log('Logout')}
        />
      </div>
      <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg">
        <span className="text-sm text-neutral-400">Admin User</span>
        <UserMenu
          user={{
            name: 'Admin',
            email: 'admin@vextrus.com',
            role: 'Administrator',
          }}
          onLogout={() => console.log('Logout')}
        />
      </div>
      <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg">
        <span className="text-sm text-neutral-400">Bengali User</span>
        <UserMenu
          user={{
            name: 'রহমান সাহেব',
            email: 'rahman@example.com',
          }}
          onLogout={() => console.log('Logout')}
        />
      </div>
    </div>
  ),
}

export const ERPDashboardHeader: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Vextrus ERP
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#" className="text-neutral-400 hover:text-white">
              Dashboard
            </a>
            <a href="#" className="text-neutral-400 hover:text-white">
              Finance
            </a>
            <a href="#" className="text-neutral-400 hover:text-white">
              Inventory
            </a>
            <a href="#" className="text-neutral-400 hover:text-white">
              Reports
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-neutral-900/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button className="relative p-2 rounded-lg hover:bg-neutral-900/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error-500" />
          </button>
          <UserMenu
            user={{
              name: 'John Doe',
              email: 'john@vextrus.com',
              avatar: 'https://github.com/shadcn.png',
              role: 'Finance Manager',
            }}
            onLogout={() => console.log('Logout')}
          />
        </div>
      </header>
    </div>
  ),
}
