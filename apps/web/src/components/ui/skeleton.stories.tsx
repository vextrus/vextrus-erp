import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
}

export const TextSkeleton: Story = {
  args: {
    variant: 'text',
    width: 250,
  },
}

export const CircularSkeleton: Story = {
  args: {
    variant: 'circular',
    width: 48,
    height: 48,
  },
}

export const RectangularSkeleton: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
}

export const PulseAnimation: Story = {
  args: {
    animation: 'pulse',
    width: 200,
    height: 20,
  },
}

export const WaveAnimation: Story = {
  args: {
    animation: 'wave',
    width: 200,
    height: 20,
  },
}

export const NoAnimation: Story = {
  args: {
    animation: 'none',
    width: 200,
    height: 20,
  },
}

export const TextLines: Story = {
  render: () => (
    <div className="space-y-2 w-full max-w-md">
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="95%" />
      <Skeleton variant="text" width="88%" />
    </div>
  ),
}

export const ProfileSkeleton: Story = {
  render: () => (
    <div className="flex items-center gap-4 w-full max-w-md">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  ),
}

export const CardSkeleton: Story = {
  render: () => (
    <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 w-full max-w-sm">
      <Skeleton variant="rectangular" width="100%" height={120} className="mb-4" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="60%" className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  ),
}

export const ListSkeleton: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-800">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
        </div>
      ))}
    </div>
  ),
}

export const TableSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 p-4 bg-neutral-900/50">
          <Skeleton variant="text" width={150} />
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={80} />
        </div>
        {/* Rows */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-t border-neutral-800">
            <Skeleton variant="text" width={150} />
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={80} />
          </div>
        ))}
      </div>
    </div>
  ),
}

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" height={28} />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <Skeleton variant="rectangular" width="100%" height={300} />
    </div>
  ),
}

export const ERPFormSkeleton: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <Skeleton variant="text" width={180} height={24} className="mb-6" />

      {/* Form fields */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={120} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  ),
}

export const InvoiceSkeleton: Story = {
  render: () => (
    <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/50 w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width={150} height={24} />
          <Skeleton variant="text" width={100} />
        </div>
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="70%" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width="75%" />
          <Skeleton variant="text" width="65%" />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-800">
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={80} />
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="text" width={120} height={28} />
      </div>
    </div>
  ),
}
