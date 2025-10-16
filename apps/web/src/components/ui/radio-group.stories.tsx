import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { RadioGroup } from './radio-group'

const meta = {
  title: 'UI/Forms/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onValueChange: fn(),
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

const optionsWithDescriptions = [
  {
    value: 'free',
    label: 'Free',
    description: 'Basic features for personal use',
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'Advanced features for professionals',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Full features with dedicated support',
  },
]

export const Default: Story = {
  args: {
    options: basicOptions,
  },
}

export const DefaultSelected: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'option2',
  },
}

export const Horizontal: Story = {
  args: {
    options: basicOptions,
    orientation: 'horizontal',
  },
}

export const WithDescriptions: Story = {
  args: {
    options: optionsWithDescriptions,
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export const WithDescriptionsHorizontal: Story = {
  args: {
    options: optionsWithDescriptions,
    orientation: 'horizontal',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '700px' }}>
        <Story />
      </div>
    ),
  ],
}

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'enabled1', label: 'Enabled Option 1' },
      { value: 'disabled', label: 'Disabled Option', disabled: true },
      { value: 'enabled2', label: 'Enabled Option 2' },
    ],
  },
}

export const AllDisabled: Story = {
  args: {
    options: basicOptions,
    disabled: true,
  },
}

// Size selection example
export const SizeSelection: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-md">
      <label className="text-sm font-medium">Select size</label>
      <RadioGroup
        options={[
          { value: 'xs', label: 'Extra Small' },
          { value: 's', label: 'Small' },
          { value: 'm', label: 'Medium' },
          { value: 'l', label: 'Large' },
          { value: 'xl', label: 'Extra Large' },
        ]}
        defaultValue="m"
        orientation="horizontal"
      />
    </div>
  ),
}

// Billing period example
export const BillingPeriod: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-lg">
      <label className="text-sm font-medium">Billing Period</label>
      <RadioGroup
        options={[
          {
            value: 'monthly',
            label: 'Monthly',
            description: '$29/month - Billed monthly',
          },
          {
            value: 'annual',
            label: 'Annual',
            description: '$290/year - Save 17%',
          },
        ]}
        defaultValue="annual"
      />
    </div>
  ),
}

// Shipping method example
export const ShippingMethod: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-lg">
      <h3 className="text-sm font-semibold">Shipping Method</h3>
      <RadioGroup
        options={[
          {
            value: 'standard',
            label: 'Standard Shipping',
            description: '4-6 business days - Free',
          },
          {
            value: 'express',
            label: 'Express Shipping',
            description: '2-3 business days - $15',
          },
          {
            value: 'overnight',
            label: 'Overnight Shipping',
            description: 'Next business day - $35',
          },
        ]}
        defaultValue="standard"
      />
    </div>
  ),
}

// Form with multiple radio groups
export const FormExample: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-2xl">
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Account Type <span className="text-error-500">*</span>
        </label>
        <RadioGroup
          options={[
            {
              value: 'personal',
              label: 'Personal',
              description: 'For individual use',
            },
            {
              value: 'business',
              label: 'Business',
              description: 'For companies and organizations',
            },
          ]}
          defaultValue="personal"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">
          Notification Preference <span className="text-error-500">*</span>
        </label>
        <RadioGroup
          options={[
            { value: 'email', label: 'Email only' },
            { value: 'sms', label: 'SMS only' },
            { value: 'both', label: 'Both Email and SMS' },
            { value: 'none', label: 'No notifications' },
          ]}
          defaultValue="email"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Payment Method</label>
        <RadioGroup
          options={[
            {
              value: 'card',
              label: 'Credit/Debit Card',
              description: 'Visa, Mastercard, American Express',
            },
            {
              value: 'paypal',
              label: 'PayPal',
              description: 'Pay with your PayPal account',
            },
            {
              value: 'bank',
              label: 'Bank Transfer',
              description: 'Direct bank transfer',
              disabled: true,
            },
          ]}
          defaultValue="card"
        />
      </div>
    </div>
  ),
}
