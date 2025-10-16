import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'
import { HelpCircle, Shield, CreditCard, Bell, FileText } from 'lucide-react'

const meta = {
  title: 'UI/Layout/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Vextrus ERP?</AccordionTrigger>
        <AccordionContent>
          Vextrus ERP is a comprehensive enterprise resource planning system designed specifically
          for construction and real estate businesses in Bangladesh. It helps manage projects,
          finances, inventory, and human resources.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionContent>
          Getting started is easy! Contact our sales team to schedule a demo, then we'll help you
          set up your account, import your data, and train your team on the platform.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger>Is my data secure?</AccordionTrigger>
        <AccordionContent>
          Yes, we take security seriously. All data is encrypted at rest and in transit. We use
          industry-standard security protocols and comply with Bangladesh data protection
          regulations.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Features</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-sm">
            <li>• Project management and tracking</li>
            <li>• Financial management and accounting</li>
            <li>• Inventory management</li>
            <li>• HR and payroll</li>
            <li>• Reporting and analytics</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger>Pricing</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm mb-2">We offer flexible pricing plans to suit businesses of all sizes:</p>
          <ul className="space-y-2 text-sm">
            <li>• Starter: ৳5,000/month</li>
            <li>• Professional: ৳15,000/month</li>
            <li>• Enterprise: Custom pricing</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger>Support</AccordionTrigger>
        <AccordionContent>
          We provide 24/7 customer support via email, phone, and live chat. Enterprise customers
          also get a dedicated account manager and priority support.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const FAQ: Story = {
  render: () => (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="faq-1">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              What payment methods do you accept?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            We accept all major payment methods including bank transfers, bKash, Nagad, and credit
            cards. Enterprise customers can also opt for annual invoicing.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-2">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Is my data backed up?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            Yes, we perform automated daily backups of all customer data. Backups are stored in
            multiple locations and retained for 30 days. You can also export your data at any time.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-3">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Can I cancel my subscription anytime?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            Yes, you can cancel your subscription at any time. If you cancel, you'll have access
            until the end of your current billing period. No refunds are provided for partial
            months.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-4">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Do you offer a free trial?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            Yes, we offer a 14-day free trial with full access to all features. No credit card
            required to start. You can upgrade to a paid plan at any time during or after the trial.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-5">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Can I import data from other systems?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            Yes, we provide data import tools and can help migrate your data from spreadsheets or
            other ERP systems. Our team will assist with the migration process to ensure a smooth
            transition.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export const ProjectDetails: Story = {
  render: () => (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Project: Bashundhara R-A - Building A</h2>
        <p className="text-sm text-neutral-400">Construction Project</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="overview">
          <AccordionTrigger>Project Overview</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Project Type</span>
                <span>Residential Construction</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Location</span>
                <span>Bashundhara R/A, Dhaka</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Budget</span>
                <span className="font-medium">৳50,00,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Start Date</span>
                <span>Jan 1, 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Expected Completion</span>
                <span>Dec 31, 2025</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="milestones">
          <AccordionTrigger>Milestones</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Foundation Complete</p>
                  <p className="text-xs text-neutral-400">Completed on Feb 15, 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Structural Work</p>
                  <p className="text-xs text-neutral-400">In Progress - 75% Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-neutral-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Finishing Work</p>
                  <p className="text-xs text-neutral-400">Scheduled to start Sep 1, 2025</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="team">
          <AccordionTrigger>Project Team</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50">
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-semibold">
                  AR
                </div>
                <div className="flex-1">
                  <p className="font-medium">Ahmed Rahman</p>
                  <p className="text-xs text-neutral-400">Project Manager</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50">
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-semibold">
                  FK
                </div>
                <div className="flex-1">
                  <p className="font-medium">Fatima Khan</p>
                  <p className="text-xs text-neutral-400">Site Engineer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50">
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-semibold">
                  MA
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mohammad Ali</p>
                  <p className="text-xs text-neutral-400">Supervisor</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="materials">
          <AccordionTrigger>Materials & Inventory</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded hover:bg-neutral-900/50">
                <span>Cement (50kg bags)</span>
                <span className="font-medium">500 units</span>
              </div>
              <div className="flex justify-between p-2 rounded hover:bg-neutral-900/50">
                <span>Steel Rods (10mm)</span>
                <span className="font-medium text-warning-500">25 units (Low Stock)</span>
              </div>
              <div className="flex justify-between p-2 rounded hover:bg-neutral-900/50">
                <span>Bricks (1000 pcs)</span>
                <span className="font-medium text-error-500">Out of Stock</span>
              </div>
              <div className="flex justify-between p-2 rounded hover:bg-neutral-900/50">
                <span>Paint (20L)</span>
                <span className="font-medium">150 units</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export const Settings: Story = {
  render: () => (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Account Settings</h2>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="profile">
          <AccordionTrigger>Profile Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm"
                  defaultValue="Ahmed Rahman"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm"
                  defaultValue="ahmed.rahman@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm"
                  defaultValue="+880 1712-345678"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications">
          <AccordionTrigger>Notification Preferences</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>SMS notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Push notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Project updates</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger>Security</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Two-Factor Authentication</p>
                <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-md text-sm transition-colors">
                  Enable 2FA
                </button>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Password</p>
                <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm transition-colors">
                  Change Password
                </button>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Active Sessions</p>
                <p className="text-sm text-neutral-400 mb-2">3 active sessions</p>
                <button className="px-4 py-2 bg-error-500/20 text-error-500 hover:bg-error-500/30 rounded-md text-sm transition-colors">
                  Revoke All Sessions
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}
