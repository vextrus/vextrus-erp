import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './spinner'

const meta = {
  title: 'UI/Feedback/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'light', 'muted'],
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
}

export const LightVariant: Story = {
  args: {
    variant: 'light',
  },
}

export const MutedVariant: Story = {
  args: {
    variant: 'muted',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Loading data...',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner variant="default" />
      <Spinner variant="light" />
      <Spinner variant="muted" />
    </div>
  ),
}

export const LoadingCard: Story = {
  render: () => (
    <div className="p-8 rounded-lg bg-neutral-900/50 border border-neutral-800">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-400">Loading your data...</p>
      </div>
    </div>
  ),
}

export const InlineLoading: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm">Processing payment...</span>
      </div>
      <div className="flex items-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm">Uploading files...</span>
      </div>
      <div className="flex items-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm">Generating report...</span>
      </div>
    </div>
  ),
}

export const ButtonLoading: Story = {
  render: () => (
    <div className="flex gap-4">
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white">
        <Spinner size="sm" variant="light" />
        Processing...
      </button>
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800">
        <Spinner size="sm" />
        Loading
      </button>
    </div>
  ),
}

export const FullPageLoading: Story = {
  render: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <Spinner size="xl" />
        <p className="text-neutral-400">Loading application...</p>
      </div>
    </div>
  ),
}

export const ERPModuleLoading: Story = {
  render: () => (
    <div className="min-h-[400px] flex items-center justify-center bg-neutral-950/50 rounded-lg border border-neutral-800">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <div>
          <p className="font-medium">Loading Finance Module</p>
          <p className="text-sm text-neutral-400 mt-1">Fetching chart of accounts...</p>
        </div>
      </div>
    </div>
  ),
}
