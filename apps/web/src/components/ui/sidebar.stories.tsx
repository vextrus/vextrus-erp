import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Sidebar } from './sidebar'
import {
  LayoutDashboard,
  DollarSign,
  Package,
  Users,
  FileText,
  Settings,
  BarChart3,
  Briefcase,
} from 'lucide-react'

const meta = {
  title: 'UI/Navigation/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

const defaultSections = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        isActive: true,
      },
      {
        label: 'Reports',
        icon: FileText,
        href: '/reports',
      },
    ],
  },
  {
    title: 'Modules',
    items: [
      {
        label: 'Finance',
        icon: DollarSign,
        href: '/finance',
      },
      {
        label: 'Inventory',
        icon: Package,
        href: '/inventory',
      },
      {
        label: 'HR',
        icon: Users,
        href: '/hr',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        icon: Settings,
        href: '/settings',
      },
    ],
  },
]

export const Default: Story = {
  args: {
    sections: defaultSections,
  },
}

export const Collapsed: Story = {
  args: {
    sections: defaultSections,
    defaultCollapsed: true,
  },
}

export const WithBadges: Story = {
  args: {
    sections: [
      {
        title: 'Main',
        items: [
          {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            isActive: true,
          },
          {
            label: 'Reports',
            icon: FileText,
            href: '/reports',
            badge: '3',
          },
        ],
      },
      {
        title: 'Modules',
        items: [
          {
            label: 'Finance',
            icon: DollarSign,
            href: '/finance',
            badge: 'New',
          },
          {
            label: 'Inventory',
            icon: Package,
            href: '/inventory',
          },
        ],
      },
    ],
  },
}

export const ConstructionERP: Story = {
  args: {
    sections: [
      {
        title: 'Overview',
        items: [
          {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            isActive: true,
          },
          {
            label: 'Analytics',
            icon: BarChart3,
            href: '/analytics',
          },
        ],
      },
      {
        title: 'Operations',
        items: [
          {
            label: 'Projects',
            icon: Briefcase,
            href: '/projects',
            badge: '12',
          },
          {
            label: 'Materials',
            icon: Package,
            href: '/materials',
          },
          {
            label: 'Finance',
            icon: DollarSign,
            href: '/finance',
          },
          {
            label: 'Workforce',
            icon: Users,
            href: '/workforce',
          },
        ],
      },
      {
        title: 'Management',
        items: [
          {
            label: 'Reports',
            icon: FileText,
            href: '/reports',
          },
          {
            label: 'Settings',
            icon: Settings,
            href: '/settings',
          },
        ],
      },
    ],
  },
}

export const WithActiveStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-neutral-500 mb-4">Dashboard Active</p>
        <Sidebar
          sections={[
            {
              title: 'Main',
              items: [
                {
                  label: 'Dashboard',
                  icon: LayoutDashboard,
                  href: '/dashboard',
                  isActive: true,
                },
                {
                  label: 'Reports',
                  icon: FileText,
                  href: '/reports',
                },
              ],
            },
          ]}
        />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-4">Finance Active</p>
        <Sidebar
          sections={[
            {
              title: 'Modules',
              items: [
                {
                  label: 'Finance',
                  icon: DollarSign,
                  href: '/finance',
                  isActive: true,
                },
                {
                  label: 'Inventory',
                  icon: Package,
                  href: '/inventory',
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  ),
}

export const FullLayout: Story = {
  render: () => (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar
        sections={[
          {
            title: 'Main',
            items: [
              {
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: '/dashboard',
                isActive: true,
              },
              {
                label: 'Reports',
                icon: FileText,
                href: '/reports',
                badge: '3',
              },
            ],
          },
          {
            title: 'Modules',
            items: [
              {
                label: 'Finance',
                icon: DollarSign,
                href: '/finance',
              },
              {
                label: 'Inventory',
                icon: Package,
                href: '/inventory',
              },
              {
                label: 'HR',
                icon: Users,
                href: '/hr',
              },
            ],
          },
          {
            title: 'System',
            items: [
              {
                label: 'Settings',
                icon: Settings,
                href: '/settings',
              },
            ],
          },
        ]}
      />
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Total Revenue</p>
            <p className="text-2xl font-bold mt-2">$45,231</p>
          </div>
          <div className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <p className="text-sm text-neutral-400">Active Projects</p>
            <p className="text-2xl font-bold mt-2">12</p>
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

export const CollapsedLayout: Story = {
  render: () => (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar
        defaultCollapsed
        sections={[
          {
            title: 'Main',
            items: [
              {
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: '/dashboard',
                isActive: true,
              },
              {
                label: 'Reports',
                icon: FileText,
                href: '/reports',
              },
            ],
          },
          {
            title: 'Modules',
            items: [
              {
                label: 'Finance',
                icon: DollarSign,
                href: '/finance',
              },
              {
                label: 'Inventory',
                icon: Package,
                href: '/inventory',
              },
            ],
          },
        ]}
      />
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold">Collapsed Sidebar Layout</h1>
        <p className="text-neutral-400 mt-2">
          The sidebar is collapsed, showing only icons. Hover or click to expand.
        </p>
      </main>
    </div>
  ),
}
