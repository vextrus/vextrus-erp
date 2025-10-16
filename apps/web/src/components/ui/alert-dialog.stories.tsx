import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogBody,
} from './alert-dialog'
import { Button } from './button'

const meta = {
  title: 'UI/Feedback/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Show Alert</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Please confirm if you want to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item and remove all
            associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const DeleteAccount: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you absolutely sure you want to delete your account? This action cannot be
            undone and will permanently remove all your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Yes, Delete My Account</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const LogoutConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">Logout</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay Logged In</AlertDialogCancel>
          <AlertDialogAction>Logout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const DeleteInvoice: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Invoice</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete Invoice #INV-2024-042? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-1">
            <p className="text-sm font-medium">Invoice Details:</p>
            <p className="text-sm text-neutral-400">Client: ABC Construction Ltd.</p>
            <p className="text-sm text-neutral-400">Amount: ৳50,000</p>
            <p className="text-sm text-neutral-400">Date: January 10, 2025</p>
          </div>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete Invoice</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const RemoveEmployee: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Remove Employee</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Employee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this employee from the system? Their access will be
            immediately revoked.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-1">
            <p className="text-sm font-medium">Employee: John Doe</p>
            <p className="text-sm text-neutral-400">Department: Engineering</p>
            <p className="text-sm text-neutral-400">Position: Software Engineer</p>
          </div>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Remove Employee</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const CancelProject: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Cancel Project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this construction project? This will stop all
            ongoing work and notify all stakeholders.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <div className="p-3 rounded-lg bg-warning-900/20 border border-warning-800 space-y-2">
            <p className="text-sm font-medium text-warning-500">Warning:</p>
            <ul className="text-sm text-warning-400 space-y-1">
              <li>• All active work orders will be terminated</li>
              <li>• Material orders will be cancelled</li>
              <li>• Workers will be reassigned</li>
              <li>• Clients will be notified</li>
            </ul>
          </div>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Project Active</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Cancel Project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const ApprovePayment: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="primary">Approve Payment</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the payment details before approving.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-sm text-neutral-400">Vendor</span>
              <span className="text-sm font-medium">Shah Cement Industries</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-sm text-neutral-400">Amount</span>
              <span className="text-sm font-medium">৳3,75,000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-sm text-neutral-400">Invoice</span>
              <span className="text-sm font-medium">#INV-2024-038</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-neutral-400">Payment Method</span>
              <span className="text-sm font-medium">Bank Transfer</span>
            </div>
          </div>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Reject</AlertDialogCancel>
          <AlertDialogAction>Approve Payment</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const DiscardChanges: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">Discard Changes</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Discard Changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const SubmitReport: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="primary">Submit to NBR</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit VAT Return</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to submit your monthly VAT return to NBR. Please verify all
            information is correct.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <div className="p-3 rounded-lg bg-info-900/20 border border-info-800 space-y-1">
            <p className="text-sm font-medium text-info-400">Report Summary:</p>
            <p className="text-sm text-info-300">Period: December 2024</p>
            <p className="text-sm text-info-300">Total VAT: ৳2,50,000</p>
            <p className="text-sm text-info-300">Due Date: January 20, 2025</p>
          </div>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Review Again</AlertDialogCancel>
          <AlertDialogAction>Submit to NBR</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}
