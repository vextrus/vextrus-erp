import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
} from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'UI/Feedback/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a default dialog with a title and description.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm">Dialog body content goes here.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const SmallSize: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Small Dialog</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Small Dialog</DialogTitle>
          <DialogDescription>This dialog uses the small size variant.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="primary">OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const LargeSize: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Large Dialog</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Large Dialog</DialogTitle>
          <DialogDescription>This dialog uses the large size variant.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm mb-4">
            This is a larger dialog that can contain more content. It's useful for forms,
            detailed information, or complex interactions.
          </p>
          <div className="space-y-4">
            <div className="h-32 bg-neutral-800 rounded-lg" />
            <div className="h-32 bg-neutral-800 rounded-lg" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const FormDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove
            your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const InvoiceDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Invoice</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Fill in the invoice details below.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input id="client" placeholder="Client name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input id="invoice-number" placeholder="INV-2024-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (৳)</Label>
              <Input id="amount" type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Invoice description" />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Create Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const AddEmployeeDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Enter employee information below.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email">Email</Label>
              <Input id="employee-email" type="email" placeholder="john@company.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="Engineering" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" placeholder="Software Engineer" />
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Add Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const ProjectDetailsDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Project</Button>
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Bashundhara R-A - Building A</DialogTitle>
          <DialogDescription>Construction project details and progress</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-400">Status</p>
                <p className="font-medium text-success-500">On Track</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Completion</p>
                <p className="font-medium">75%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Phase</p>
              <p className="text-sm text-neutral-400">Floor 12 - Structural Work</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Timeline</p>
              <p className="text-sm text-neutral-400">
                Start: Jan 2024 | Expected End: Dec 2025
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Budget</p>
              <p className="text-sm text-neutral-400">
                Allocated: ৳50,00,000 | Spent: ৳37,50,000
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Close</Button>
          <Button variant="primary">Edit Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const ImagePreviewDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Image</Button>
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Floor Plan - Level 8</DialogTitle>
          <DialogDescription>Building A architectural blueprint</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="aspect-video bg-neutral-800 rounded-lg flex items-center justify-center">
            <p className="text-neutral-500">Image Preview</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Close</Button>
          <Button variant="primary">Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
