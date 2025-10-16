import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Alert } from './alert'

const meta = {
  title: 'UI/Feedback/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onDismiss: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'error'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '500px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Notification',
    description: 'This is a default alert message.',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    description: 'This is an informational message.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    description: 'Your changes have been saved successfully.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    description: 'Please review your information before proceeding.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    description: 'An error occurred while processing your request.',
  },
}

export const Dismissible: Story = {
  args: {
    variant: 'info',
    title: 'Dismissible Alert',
    description: 'Click the X button to dismiss this alert.',
    dismissible: true,
  },
}

export const TitleOnly: Story = {
  args: {
    variant: 'success',
    title: 'Payment Successful',
  },
}

export const DescriptionOnly: Story = {
  args: {
    variant: 'warning',
    description: 'Your session will expire in 5 minutes.',
  },
}

export const LongContent: Story = {
  args: {
    variant: 'info',
    title: 'Important Update',
    description:
      'We have made significant improvements to our system. This update includes new features, bug fixes, and performance enhancements. Please review the changelog for detailed information about all the changes.',
    dismissible: true,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Alert variant="default" title="Default" description="This is a default alert." />
      <Alert variant="info" title="Information" description="This is an info alert." />
      <Alert variant="success" title="Success" description="This is a success alert." />
      <Alert variant="warning" title="Warning" description="This is a warning alert." />
      <Alert variant="error" title="Error" description="This is an error alert." />
    </div>
  ),
}

export const FormValidation: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Alert
        variant="error"
        title="Validation Error"
        description="Please fix the following errors before submitting the form."
        dismissible
      />
      <div className="space-y-3 text-sm text-error-500">
        <p>• Email address is required</p>
        <p>• Password must be at least 8 characters</p>
        <p>• Phone number format is invalid</p>
      </div>
    </div>
  ),
}

export const PaymentSuccess: Story = {
  render: () => (
    <Alert
      variant="success"
      title="Payment Successful"
      description="Your payment of ৳15,000 has been processed successfully. Receipt #INV-2024-001."
      dismissible
    />
  ),
}

export const SystemMaintenance: Story = {
  render: () => (
    <Alert
      variant="warning"
      title="Scheduled Maintenance"
      description="The system will undergo maintenance on Friday, January 15th from 11:00 PM to 2:00 AM. Please save your work before this time."
    />
  ),
}

export const DataLoss: Story = {
  render: () => (
    <Alert
      variant="error"
      title="Connection Lost"
      description="Your connection to the server was lost. Any unsaved changes may be lost. Please refresh the page and try again."
    />
  ),
}

export const ERPNotifications: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Alert
        variant="success"
        title="Invoice Generated"
        description="Invoice #INV-2024-042 has been generated and sent to the client."
        dismissible
      />
      <Alert
        variant="warning"
        title="Low Stock Alert"
        description="Cement (Shah 50kg) stock is below minimum threshold. Current: 150 bags, Minimum: 500 bags."
        dismissible
      />
      <Alert
        variant="info"
        title="Payment Reminder"
        description="Payment for Invoice #INV-2024-035 is due in 3 days (January 18, 2025)."
        dismissible
      />
      <Alert
        variant="error"
        title="Failed Transaction"
        description="Payment processing failed for Invoice #INV-2024-038. Error: Insufficient funds."
        dismissible
      />
    </div>
  ),
}

export const ComplianceAlert: Story = {
  render: () => (
    <Alert
      variant="warning"
      title="VAT Filing Reminder"
      description="Your monthly VAT return filing is due by January 20, 2025. Please submit your returns to NBR before the deadline to avoid penalties."
      dismissible
    />
  ),
}

export const ConstructionAlert: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Alert
        variant="success"
        title="Milestone Completed"
        description="Floor 8 structural work has been completed. Ready for inspection and next phase."
        dismissible
      />
      <Alert
        variant="warning"
        title="Weather Alert"
        description="Heavy rainfall expected tomorrow. Consider rescheduling outdoor concrete work."
        dismissible
      />
      <Alert
        variant="error"
        title="Safety Incident"
        description="Minor safety incident reported at Site B. Immediate supervisor review required."
        dismissible
      />
    </div>
  ),
}
