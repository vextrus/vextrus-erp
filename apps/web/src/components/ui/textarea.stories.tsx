import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Textarea } from './textarea'

const meta = {
  title: 'UI/Forms/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
  argTypes: {
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    autoResize: {
      control: 'boolean',
    },
    showCharCount: {
      control: 'boolean',
    },
    maxLength: {
      control: 'number',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue:
      'This is a textarea with some default content. You can edit this text.',
  },
}

export const AutoResize: Story = {
  args: {
    placeholder: 'This textarea will grow as you type...',
    autoResize: true,
  },
}

export const WithCharCount: Story = {
  args: {
    placeholder: 'Type something...',
    showCharCount: true,
  },
}

export const WithMaxLength: Story = {
  args: {
    placeholder: 'Maximum 100 characters',
    maxLength: 100,
    showCharCount: true,
  },
}

export const AutoResizeWithCharCount: Story = {
  args: {
    placeholder: 'Auto-resize with character count',
    autoResize: true,
    showCharCount: true,
  },
}

export const ErrorState: Story = {
  args: {
    placeholder: 'Enter description',
    defaultValue: 'This content has an error',
    error: true,
  },
}

export const ErrorWithMaxLength: Story = {
  args: {
    defaultValue: 'This text exceeds the maximum allowed length and shows an error state',
    error: true,
    maxLength: 50,
    showCharCount: true,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
  },
}

export const DisabledWithValue: Story = {
  args: {
    defaultValue: 'This textarea is disabled and cannot be edited.',
    disabled: true,
  },
}

export const ReadOnly: Story = {
  args: {
    defaultValue: 'This textarea is read-only.',
    readOnly: true,
  },
}

export const LongText: Story = {
  args: {
    defaultValue: `This is a longer text example to demonstrate how the textarea handles multiple lines of content.

It includes several paragraphs and line breaks to show the scrolling behavior.

The textarea maintains its styling and functionality even with extensive content.

You can continue typing here and the textarea will scroll as needed.`,
  },
}

// Form example with multiple textareas
export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Bio <span className="text-neutral-500">(Optional)</span>
        </label>
        <Textarea
          placeholder="Tell us about yourself..."
          showCharCount
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Comments <span className="text-error-500">*</span>
        </label>
        <Textarea
          placeholder="Enter your comments..."
          autoResize
          showCharCount
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Product description..."
          rows={6}
          maxLength={1000}
          showCharCount
        />
      </div>
    </div>
  ),
}
