import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { Calendar, Filter, Settings, User, MoreVertical } from 'lucide-react'

const meta = {
  title: 'UI/Overlay/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '200px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium">Popover Title</h4>
          <p className="text-sm text-neutral-400">
            This is a popover with some content inside.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" leftIcon={<User className="h-4 w-4" />}>
          Update Profile
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Update Profile</h4>
            <p className="text-sm text-neutral-400">
              Make changes to your profile here.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Ahmed Rahman" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="ahmed@example.com" />
            </div>
            <Button variant="primary" size="sm" className="w-full">
              Save Changes
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const FilterMenu: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Filter Options</h4>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Department</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Engineering</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span>Finance</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Operations</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1">
                Reset
              </Button>
              <Button variant="primary" size="sm" className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const DatePicker: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" leftIcon={<Calendar className="h-4 w-4" />}>
          Pick a Date
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">Select Date</h4>
            <p className="text-sm text-neutral-400">Choose a date for your event</p>
          </div>
          <div className="space-y-2">
            <Input type="date" />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="flex-1">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const ActionsMenu: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-1">
          <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
            View Details
          </button>
          <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
            Edit
          </button>
          <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors">
            Duplicate
          </button>
          <div className="h-px bg-neutral-800 my-1" />
          <button className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-error-500/10 text-error-500 transition-colors">
            Delete
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const SettingsPopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Quick Settings</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications</Label>
                <p className="text-xs text-neutral-400">Enable push notifications</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-neutral-400">Use dark theme</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Auto-save</Label>
                <p className="text-xs text-neutral-400">Save changes automatically</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const AddCommentForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="primary">Add Comment</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Add a Comment</h4>
            <p className="text-sm text-neutral-400">Share your thoughts on this project</p>
          </div>
          <div className="space-y-3">
            <Textarea
              placeholder="Write your comment here..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
              <Button variant="primary" size="sm">
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const DifferentAlignments: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="text-sm">Aligned to start</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p className="text-sm">Aligned to center</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm">Aligned to end</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
}

export const InTable: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <table className="w-full border border-neutral-800 rounded-lg overflow-hidden">
        <thead className="bg-neutral-900/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Invoice</th>
            <th className="text-left p-3 text-sm font-medium">Client</th>
            <th className="text-left p-3 text-sm font-medium">Amount</th>
            <th className="text-left p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          <tr className="hover:bg-neutral-900/50">
            <td className="p-3 text-sm font-medium">INV-2024-042</td>
            <td className="p-3 text-sm text-neutral-400">ABC Construction Ltd.</td>
            <td className="p-3 text-sm">৳50,000</td>
            <td className="p-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end">
                  <div className="space-y-1">
                    <button
                      onClick={fn()}
                      className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors"
                    >
                      View Invoice
                    </button>
                    <button
                      onClick={fn()}
                      className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors"
                    >
                      Send Reminder
                    </button>
                    <button
                      onClick={fn()}
                      className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-neutral-900 transition-colors"
                    >
                      Download PDF
                    </button>
                    <div className="h-px bg-neutral-800 my-1" />
                    <button
                      onClick={fn()}
                      className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-error-500/10 text-error-500 transition-colors"
                    >
                      Delete Invoice
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
}

export const ShareMenu: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="primary">Share Project</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Share Project</h4>
            <p className="text-sm text-neutral-400">Invite team members to collaborate</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input type="email" placeholder="colleague@example.com" />
            </div>

            <div className="space-y-1">
              <Label>Permission Level</Label>
              <select className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm">
                <option>Can View</option>
                <option>Can Edit</option>
                <option>Admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
                rows={2}
              />
            </div>

            <Button variant="primary" size="sm" className="w-full">
              Send Invitation
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
