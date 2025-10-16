import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { Button } from './button'
import { Badge } from './badge'

const meta = {
  title: 'UI/Data Display/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This is the card content area.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card with Footer</CardTitle>
        <CardDescription>This card includes a footer with actions</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </CardFooter>
    </Card>
  ),
}

export const GlassEffect: Story = {
  render: () => (
    <Card glass>
      <CardHeader>
        <CardTitle>Glass Card</CardTitle>
        <CardDescription>With glassmorphism effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This card uses the glass effect for a modern look.</p>
      </CardContent>
    </Card>
  ),
}

export const NoHover: Story = {
  render: () => (
    <Card hover={false}>
      <CardHeader>
        <CardTitle>No Hover Effect</CardTitle>
        <CardDescription>This card doesn't animate on hover</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Hover effects are disabled for this card.</p>
      </CardContent>
    </Card>
  ),
}

export const ProjectCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Bashundhara R-A - Building A</CardTitle>
            <CardDescription>Construction Project</CardDescription>
          </div>
          <Badge variant="success" dot size="sm">
            On Track
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Progress</span>
            <span className="font-medium">75%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Budget</span>
            <span className="font-medium">৳50,00,000</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Deadline</span>
            <span className="font-medium">Dec 2025</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
        <Button variant="primary" size="sm">
          Update Progress
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const InvoiceCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Invoice #INV-2024-042</CardTitle>
            <CardDescription>Due: January 20, 2025</CardDescription>
          </div>
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Client</span>
            <span className="font-medium">ABC Construction Ltd.</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Amount</span>
            <span className="font-medium text-lg">৳50,000</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          Download
        </Button>
        <Button variant="primary" size="sm">
          Send Reminder
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const StatsCard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle>৳45,231</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-success-500">+12.5% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Active Projects</CardDescription>
          <CardTitle>12</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-neutral-400">3 completing this month</p>
        </CardContent>
      </Card>
    </div>
  ),
}

export const EmployeeCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-semibold">
            JD
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">John Doe</CardTitle>
            <CardDescription>Software Engineer</CardDescription>
          </div>
          <Badge variant="success" size="sm" dot>
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Department</span>
            <span>Engineering</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Joined</span>
            <span>Jan 2024</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          View Profile
        </Button>
        <Button variant="primary" size="sm">
          Send Message
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const GlassCardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card glass glassLevel="light">
        <CardHeader>
          <CardTitle>Light Glass</CardTitle>
          <CardDescription>Subtle transparency</CardDescription>
        </CardHeader>
      </Card>
      <Card glass glassLevel="medium">
        <CardHeader>
          <CardTitle>Medium Glass</CardTitle>
          <CardDescription>Balanced effect</CardDescription>
        </CardHeader>
      </Card>
      <Card glass glassLevel="strong">
        <CardHeader>
          <CardTitle>Strong Glass</CardTitle>
          <CardDescription>Maximum transparency</CardDescription>
        </CardHeader>
      </Card>
      <Card glass glassLevel="subtle">
        <CardHeader>
          <CardTitle>Subtle Glass</CardTitle>
          <CardDescription>Minimal effect</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
}
