'use client'

import { useState } from 'react'
import {
  Package,
  Layers,
  FileText,
  Settings,
  HelpCircle,
  ChevronRight,
  Star,
  Bell,
  Calendar,
  User,
  CreditCard,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function LayoutExamplesPage() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Layout Components</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Phase 2.5: Essential layout components including Card, Separator, Accordion, and ScrollArea
        </p>
      </div>

      {/* Card Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Card Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Flexible content containers with header, body, and footer sections
          </p>
        </div>

        {/* Basic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Default Card */}
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Standard card with white background</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This is a basic card with a border and white background. Perfect for displaying content in organized containers.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" onClick={() => toast.success('Action clicked')}>
                Action
              </Button>
            </CardFooter>
          </Card>

          {/* Glass Card */}
          <Card glass glassLevel="medium">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Glassmorphism effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This card uses glassmorphism with backdrop blur for a modern, translucent appearance.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="glass" onClick={() => toast.success('Glass clicked')}>
                Glass Action
              </Button>
            </CardFooter>
          </Card>

          {/* Hover Card */}
          <Card hover>
            <CardHeader>
              <CardTitle>Hover Card</CardTitle>
              <CardDescription>Interactive hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This card lifts up on hover with smooth animation, great for interactive elements.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" onClick={() => toast.info('Hover clicked')}>
                Hover Me
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Complex Card Example */}
        <div className="glass-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Complex Card Layout</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card hover>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Product Statistics</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </div>
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Products</span>
                    <span className="text-2xl font-bold">2,847</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">In Stock</span>
                    <span className="text-lg font-semibold text-success-600">2,134</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Low Stock</span>
                    <span className="text-lg font-semibold text-warning-600">523</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Out of Stock</span>
                    <span className="text-lg font-semibold text-error-600">190</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="primary" className="flex-1">View Details</Button>
                <Button variant="outline" className="flex-1">Export</Button>
              </CardFooter>
            </Card>

            <Card hover>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info-100 dark:bg-info-900/30 rounded-lg">
                    <Bell className="h-6 w-6 text-info-600 dark:text-info-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Notifications</CardTitle>
                    <CardDescription>3 unread messages</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {[
                      { title: 'New order received', time: '5 minutes ago', type: 'success' },
                      { title: 'Low stock alert', time: '1 hour ago', type: 'warning' },
                      { title: 'Payment processed', time: '2 hours ago', type: 'success' },
                      { title: 'Customer inquiry', time: '3 hours ago', type: 'info' },
                      { title: 'System update', time: '5 hours ago', type: 'default' },
                    ].map((notification, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                        <div className={`p-1.5 rounded-full ${
                          notification.type === 'success' ? 'bg-success-100 dark:bg-success-900/30' :
                          notification.type === 'warning' ? 'bg-warning-100 dark:bg-warning-900/30' :
                          notification.type === 'info' ? 'bg-info-100 dark:bg-info-900/30' :
                          'bg-neutral-100 dark:bg-neutral-800'
                        }`}>
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-neutral-500">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">Mark all as read</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Separator Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Separator Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Visual dividers for organizing content horizontally and vertically
          </p>
        </div>

        {/* Horizontal Separators */}
        <div className="glass-light rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Horizontal Separators</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">Section One</p>
                <p className="text-xs text-neutral-500">Content for the first section</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm mb-2">Section Two</p>
                <p className="text-xs text-neutral-500">Content for the second section</p>
              </div>

              <Separator className="bg-primary-200 dark:bg-primary-800" />

              <div>
                <p className="text-sm mb-2">Section Three (Custom Color)</p>
                <p className="text-xs text-neutral-500">Separator above uses custom color</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="glass-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Vertical Separator</h3>
          <div className="flex items-center gap-4 h-32">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-sm text-neutral-500">Total Products</p>
              </div>
            </div>

            <Separator orientation="vertical" />

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">523</p>
                <p className="text-sm text-neutral-500">Low Stock</p>
              </div>
            </div>

            <Separator orientation="vertical" />

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">190</p>
                <p className="text-sm text-neutral-500">Out of Stock</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Accordion Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Collapsible content sections with smooth animations
          </p>
        </div>

        {/* Single Accordion */}
        <div className="glass-light rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Single Accordion (One at a time)</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>Manage your account settings and preferences here.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit Profile</Button>
                      <Button size="sm" variant="outline">Change Password</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                    <Badge variant="error" size="sm">3 new</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>Configure your notification preferences:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Email notifications</li>
                      <li>Push notifications</li>
                      <li>SMS alerts</li>
                      <li>In-app notifications</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Security & Privacy</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>Manage your security settings:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                        <span>Two-factor authentication</span>
                        <Badge variant="success">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                        <span>Login notifications</span>
                        <Badge variant="success">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>Need help? We&apos;re here for you:</p>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="sm" className="justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule a Call
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Separator />

          {/* Multiple Accordion */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Multiple Accordion (Multiple open)</h3>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    We accept all major credit cards (Visa, MasterCard, American Express), bKash, Nagad, Rocket, and bank transfers for enterprise customers.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger>How do I track my order?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    You can track your order in real-time from the Orders page. We&apos;ll also send you email and SMS notifications at every stage of delivery.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger>What is your return policy?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    We offer a 30-day return policy for most items. Products must be unused and in original packaging. Refunds are processed within 7-10 business days.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ScrollArea Component */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">ScrollArea Component</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Custom scrollable regions with styled scrollbars
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vertical Scroll */}
          <Card>
            <CardHeader>
              <CardTitle>Vertical ScrollArea</CardTitle>
              <CardDescription>Scrollable content with custom scrollbar</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Bangladesh ERP Features</h4>
                  {[
                    'Financial Management - Complete accounting with NBR compliance',
                    'Inventory Control - Real-time stock tracking and valuation',
                    'Human Resources - Employee management and payroll',
                    'Project Management - Task tracking and resource allocation',
                    'Sales & CRM - Customer relationship management',
                    'Purchase Management - Vendor and procurement tracking',
                    'Manufacturing - Production planning and control',
                    'Reporting & Analytics - Comprehensive business insights',
                    'Multi-currency Support - International transactions',
                    'Tax Compliance - Automated VAT and tax calculations',
                    'Asset Management - Fixed asset tracking',
                    'Document Management - Digital file storage',
                    'Mobile Access - On-the-go management',
                    'API Integration - Connect with other systems',
                    'Role-based Access - Granular permission control',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary-500 shrink-0" />
                      <p className="text-sm">{feature}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tags Example */}
          <Card>
            <CardHeader>
              <CardTitle>Horizontal ScrollArea</CardTitle>
              <CardDescription>Scroll horizontally for more tags</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full whitespace-nowrap rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
                <div className="flex gap-2">
                  {[
                    'Accounting', 'Inventory', 'Sales', 'Purchase', 'HR', 'Payroll',
                    'Manufacturing', 'CRM', 'Project', 'Asset', 'Tax', 'Report',
                    'Analytics', 'Dashboard', 'Mobile', 'API', 'Integration',
                    'Security', 'Backup', 'Support'
                  ].map((tag, index) => (
                    <Badge key={index} variant="outline" className="shrink-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-neutral-500">Scroll horizontally to view all tags</p>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Component Showcase */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Component Features</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Comprehensive feature list for Phase 2.5 components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card */}
          <Card hover>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>✓ Multiple variants</li>
                <li>✓ Glassmorphism support</li>
                <li>✓ Hover animations</li>
                <li>✓ Compound components</li>
                <li>✓ Flexible layouts</li>
                <li>✓ Dark mode</li>
              </ul>
            </CardContent>
          </Card>

          {/* Separator */}
          <Card hover>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Separator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>✓ Horizontal dividers</li>
                <li>✓ Vertical dividers</li>
                <li>✓ Custom colors</li>
                <li>✓ Radix UI primitive</li>
                <li>✓ Accessible</li>
                <li>✓ Decorative option</li>
              </ul>
            </CardContent>
          </Card>

          {/* Accordion */}
          <Card hover>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Accordion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>✓ Single mode</li>
                <li>✓ Multiple mode</li>
                <li>✓ Smooth animations</li>
                <li>✓ Keyboard navigation</li>
                <li>✓ Radix UI primitive</li>
                <li>✓ Custom triggers</li>
              </ul>
            </CardContent>
          </Card>

          {/* ScrollArea */}
          <Card hover>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                ScrollArea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>✓ Custom scrollbars</li>
                <li>✓ Vertical scroll</li>
                <li>✓ Horizontal scroll</li>
                <li>✓ Radix UI primitive</li>
                <li>✓ Smooth scrolling</li>
                <li>✓ Dark mode</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}