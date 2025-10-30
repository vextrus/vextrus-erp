import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './label'
import { Input } from './input'
import { Checkbox } from './checkbox'

const meta = {
  title: 'UI/Forms/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Label Text',
  },
}

export const Required: Story = {
  args: {
    children: 'Required Field',
    required: true,
  },
}

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="name">Full Name</Label>
      <Input id="name" placeholder="Enter your name" />
    </div>
  ),
}

export const RequiredWithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email" required>
        Email Address
      </Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="cursor-pointer">
        Accept terms and conditions
      </Label>
    </div>
  ),
}

export const FormLabels: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="username" required>
          Username
        </Label>
        <Input id="username" placeholder="Enter username" />
        <p className="text-xs text-neutral-500">
          Choose a unique username for your account
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          className="flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Tell us about yourself"
        />
        <p className="text-xs text-neutral-500">Optional: Brief description</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country" required>
          Country
        </Label>
        <Input id="country" placeholder="Select your country" />
      </div>
    </div>
  ),
}
