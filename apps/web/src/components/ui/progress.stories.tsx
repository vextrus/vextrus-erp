import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './progress'

const meta = {
  title: 'UI/Feedback/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 60,
  },
}

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
}

export const Small: Story = {
  args: {
    value: 45,
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    value: 60,
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    value: 75,
    size: 'lg',
  },
}

export const SuccessVariant: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
  },
}

export const WarningVariant: Story = {
  args: {
    value: 65,
    variant: 'warning',
    showLabel: true,
  },
}

export const ErrorVariant: Story = {
  args: {
    value: 30,
    variant: 'error',
    showLabel: true,
  },
}

export const Empty: Story = {
  args: {
    value: 0,
    showLabel: true,
  },
}

export const Full: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Default (75%)</p>
        <Progress value={75} showLabel />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Success (100%)</p>
        <Progress value={100} variant="success" showLabel />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Warning (60%)</p>
        <Progress value={60} variant="warning" showLabel />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Error (25%)</p>
        <Progress value={25} variant="error" showLabel />
      </div>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Small</p>
        <Progress value={60} size="sm" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Medium</p>
        <Progress value={60} size="md" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">Large</p>
        <Progress value={60} size="lg" />
      </div>
    </div>
  ),
}

export const AnimatedProgress: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0)

    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0
          return prev + 10
        })
      }, 500)

      return () => clearInterval(timer)
    }, [])

    return <Progress value={progress} showLabel />
  },
}

export const FileUploadExample: Story = {
  render: () => (
    <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/50 w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">document.pdf</p>
          <p className="text-xs text-neutral-400">2.4 MB</p>
        </div>
        <p className="text-sm text-success-500">Uploading...</p>
      </div>
      <Progress value={67} variant="success" showLabel />
    </div>
  ),
}

export const MultipleUploads: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>invoice-2024.pdf</span>
          <span className="text-success-500">Complete</span>
        </div>
        <Progress value={100} variant="success" size="sm" />
      </div>

      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>project-report.docx</span>
          <span className="text-primary-500">75%</span>
        </div>
        <Progress value={75} size="sm" />
      </div>

      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>financial-data.xlsx</span>
          <span className="text-neutral-400">Queued</span>
        </div>
        <Progress value={0} size="sm" />
      </div>
    </div>
  ),
}

export const ProjectProgress: Story = {
  render: () => (
    <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/50 w-full space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Bashundhara R-A - Building A</h3>
        <p className="text-sm text-neutral-400">Construction Progress</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Foundation</span>
            <span className="text-success-500 font-medium">100%</span>
          </div>
          <Progress value={100} variant="success" size="lg" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Structural Work</span>
            <span className="text-primary-500 font-medium">85%</span>
          </div>
          <Progress value={85} size="lg" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Electrical & Plumbing</span>
            <span className="text-warning-500 font-medium">45%</span>
          </div>
          <Progress value={45} variant="warning" size="lg" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Finishing</span>
            <span className="text-neutral-400 font-medium">15%</span>
          </div>
          <Progress value={15} size="lg" />
        </div>
      </div>
    </div>
  ),
}

export const TaskCompletion: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Task Completion</h3>
        <span className="text-sm text-neutral-400">7 of 10 tasks completed</span>
      </div>
      <Progress value={70} variant="success" showLabel size="lg" />
    </div>
  ),
}
