import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

const meta = {
  title: 'UI/Navigation/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.png" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const OnlyFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  ),
}

export const SmallSize: Story = {
  render: () => (
    <Avatar className="h-8 w-8">
      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
      <AvatarFallback className="text-xs">CN</AvatarFallback>
    </Avatar>
  ),
}

export const LargeSize: Story = {
  render: () => (
    <Avatar className="h-20 w-20">
      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
      <AvatarFallback className="text-2xl">CN</AvatarFallback>
    </Avatar>
  ),
}

export const WithCustomFallbackColor: Story = {
  render: () => (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback className="bg-primary-500 text-white">JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-success-500 text-white">AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-warning-500 text-white">CD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-error-500 text-white">EF</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const MultipleAvatars: Story = {
  render: () => (
    <div className="flex gap-3">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>U4</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const SizeVariations: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://github.com/shadcn.png" alt="Small" />
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>
      <Avatar className="h-10 w-10">
        <AvatarImage src="https://github.com/shadcn.png" alt="Default" />
        <AvatarFallback className="text-sm">MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-12 w-12">
        <AvatarImage src="https://github.com/shadcn.png" alt="Large" />
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarImage src="https://github.com/shadcn.png" alt="Extra Large" />
        <AvatarFallback className="text-xl">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const UserListExample: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-md">
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-900/50">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">John Doe</p>
          <p className="text-xs text-neutral-400">john@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-900/50">
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Alice Brown</p>
          <p className="text-xs text-neutral-400">alice@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-900/50">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" alt="Charlie Davis" />
          <AvatarFallback>CD</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Charlie Davis</p>
          <p className="text-xs text-neutral-400">charlie@example.com</p>
        </div>
      </div>
    </div>
  ),
}

export const TeamExample: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <h3 className="text-sm font-semibold">Development Team</h3>
      <div className="flex -space-x-2">
        <Avatar className="border-2 border-neutral-950">
          <AvatarImage src="https://github.com/shadcn.png" alt="Member 1" />
          <AvatarFallback>M1</AvatarFallback>
        </Avatar>
        <Avatar className="border-2 border-neutral-950">
          <AvatarFallback>M2</AvatarFallback>
        </Avatar>
        <Avatar className="border-2 border-neutral-950">
          <AvatarImage src="https://github.com/vercel.png" alt="Member 3" />
          <AvatarFallback>M3</AvatarFallback>
        </Avatar>
        <Avatar className="border-2 border-neutral-950">
          <AvatarFallback>M4</AvatarFallback>
        </Avatar>
        <Avatar className="border-2 border-neutral-950 bg-neutral-800">
          <AvatarFallback className="text-xs">+5</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
}

export const StatusIndicator: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Online User" />
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success-500 border-2 border-neutral-950" />
      </div>
      <div className="relative">
        <Avatar>
          <AvatarFallback>AW</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-warning-500 border-2 border-neutral-950" />
      </div>
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" alt="Offline User" />
          <AvatarFallback>OF</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-neutral-500 border-2 border-neutral-950" />
      </div>
    </div>
  ),
}
