import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { Button } from './button'
import { Info, HelpCircle, Settings, AlertCircle, CheckCircle } from 'lucide-react'

const meta = {
  title: 'UI/Overlay/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div style={{ padding: '100px' }}>
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const OnIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>More information</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const WithHelpIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Need help? Click for documentation</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Project Details</Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-xs space-y-1">
          <p className="font-medium">Bashundhara R-A - Building A</p>
          <p className="text-xs">Construction project with foundation and structural work.</p>
          <p className="text-xs text-neutral-400">Due: Dec 2025</p>
        </div>
      </TooltipContent>
    </Tooltip>
  ),
}

export const DifferentSides: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const IconTooltips: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-neutral-900 transition-colors">
            <Settings className="h-5 w-5 text-neutral-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-neutral-900 transition-colors">
            <AlertCircle className="h-5 w-5 text-warning-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Warning: Low stock alert</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-neutral-900 transition-colors">
            <CheckCircle className="h-5 w-5 text-success-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Task completed</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-neutral-900 transition-colors">
            <Info className="h-5 w-5 text-info-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Additional information available</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const FormFieldHelp: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Email Address</label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-neutral-400 hover:text-neutral-300">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                We'll use this email for important notifications about your account and projects.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <input
          type="email"
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">TIN Number</label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-neutral-400 hover:text-neutral-300">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Tax Identification Number (TIN) is a 10-digit number issued by NBR for tax purposes.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <input
          type="text"
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm"
          placeholder="1234567890"
        />
      </div>
    </div>
  ),
}

export const TableActions: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <table className="w-full border border-neutral-800 rounded-lg overflow-hidden">
        <thead className="bg-neutral-900/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Employee</th>
            <th className="text-left p-3 text-sm font-medium">Department</th>
            <th className="text-left p-3 text-sm font-medium">Status</th>
            <th className="text-left p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          <tr className="hover:bg-neutral-900/50">
            <td className="p-3 text-sm">Ahmed Rahman</td>
            <td className="p-3 text-sm text-neutral-400">Engineering</td>
            <td className="p-3 text-sm">
              <span className="px-2 py-1 rounded-full bg-success-500/20 text-success-500 text-xs">
                Active
              </span>
            </td>
            <td className="p-3">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Details</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Employee</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
}

export const StatusIndicators: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800">
        <span className="text-sm">Project Status</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="h-2 w-2 rounded-full bg-success-500" />
              <span className="text-sm">On Track</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Project is progressing as planned - 75% complete</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800">
        <span className="text-sm">Budget Status</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="h-2 w-2 rounded-full bg-warning-500" />
              <span className="text-sm">At Risk</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Budget utilization at 85% - Monitor spending</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800">
        <span className="text-sm">Team Availability</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="h-2 w-2 rounded-full bg-error-500" />
              <span className="text-sm">Limited</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Only 3 of 8 team members available this week</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  ),
}
