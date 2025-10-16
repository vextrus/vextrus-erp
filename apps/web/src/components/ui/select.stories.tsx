import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Select, SelectGroup, SelectItem, SelectLabel, SelectSeparator } from './select'

const meta = {
  title: 'UI/Forms/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onValueChange: fn(),
  },
  argTypes: {
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '300px', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'bd', label: 'Bangladesh' },
]

export const Default: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option',
  },
}

export const WithDefaultValue: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option',
    defaultValue: 'option2',
  },
}

export const LongList: Story = {
  args: {
    options: countries,
    placeholder: 'Select a country',
  },
}

export const ErrorState: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option',
    error: true,
  },
}

export const Disabled: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option',
    disabled: true,
  },
}

export const DisabledWithValue: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option',
    defaultValue: 'option2',
    disabled: true,
  },
}

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'enabled1', label: 'Enabled Option 1' },
      { value: 'disabled', label: 'Disabled Option', disabled: true },
      { value: 'enabled2', label: 'Enabled Option 2' },
    ],
    placeholder: 'Select an option',
  },
}

// Custom grouped select
export const GroupedOptions: Story = {
  render: () => (
    <Select placeholder="Select a fruit">
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Vegetables</SelectLabel>
        <SelectItem value="carrot">Carrot</SelectItem>
        <SelectItem value="broccoli">Broccoli</SelectItem>
        <SelectItem value="spinach">Spinach</SelectItem>
      </SelectGroup>
    </Select>
  ),
}

// Time zone select
export const TimeZoneSelect: Story = {
  render: () => (
    <Select placeholder="Select timezone" defaultValue="est">
      <SelectGroup>
        <SelectLabel>North America</SelectLabel>
        <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
        <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
        <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
        <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Europe</SelectLabel>
        <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
        <SelectItem value="cet">Central European Time (CET)</SelectItem>
        <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Asia</SelectLabel>
        <SelectItem value="ist">India Standard Time (IST)</SelectItem>
        <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
        <SelectItem value="cst-china">China Standard Time (CST)</SelectItem>
      </SelectGroup>
    </Select>
  ),
}

// Form example with multiple selects
export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Country <span className="text-error-500">*</span>
        </label>
        <Select options={countries} placeholder="Select your country" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Language <span className="text-error-500">*</span>
        </label>
        <Select
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
            { value: 'bn', label: 'Bengali' },
          ]}
          placeholder="Select your language"
          defaultValue="en"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Account Type</label>
        <Select
          options={[
            { value: 'personal', label: 'Personal' },
            { value: 'business', label: 'Business' },
            { value: 'enterprise', label: 'Enterprise', disabled: true },
          ]}
          placeholder="Select account type"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Plan</label>
        <Select placeholder="Select a plan">
          <SelectGroup>
            <SelectLabel>Free Plans</SelectLabel>
            <SelectItem value="free">Free</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Paid Plans</SelectLabel>
            <SelectItem value="starter">Starter - $9/mo</SelectItem>
            <SelectItem value="pro">Pro - $29/mo</SelectItem>
            <SelectItem value="enterprise">Enterprise - $99/mo</SelectItem>
          </SelectGroup>
        </Select>
      </div>
    </div>
  ),
}

// Compact form example
export const CompactForm: Story = {
  render: () => (
    <div className="flex gap-3 items-end">
      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium">Country</label>
        <Select
          options={[
            { value: 'us', label: 'US' },
            { value: 'uk', label: 'UK' },
            { value: 'ca', label: 'CA' },
          ]}
          placeholder="Select"
        />
      </div>
      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium">Language</label>
        <Select
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
          ]}
          placeholder="Select"
          defaultValue="en"
        />
      </div>
      <button className="h-10 px-4 rounded-lg bg-primary-500 text-white font-medium">
        Save
      </button>
    </div>
  ),
}
