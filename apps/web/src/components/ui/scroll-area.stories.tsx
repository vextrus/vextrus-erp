import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ScrollArea } from './scroll-area'
import { Badge } from './badge'
import { Separator } from './separator'

const meta = {
  title: 'UI/Layout/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-96 rounded-lg border border-neutral-800 p-4">
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="text-sm">
            <p className="font-medium">Item {i + 1}</p>
            <p className="text-neutral-400">This is a scrollable item with some content.</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-96 w-full max-w-2xl rounded-lg border border-neutral-800 p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Privacy Policy</h2>
        <p className="text-sm text-neutral-400">Last updated: January 10, 2025</p>

        <Separator className="my-4" />

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">1. Information We Collect</h3>
          <p className="text-sm text-neutral-400">
            We collect information you provide directly to us, such as when you create an account,
            use our services, or communicate with us. This may include your name, email address,
            phone number, and payment information.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">2. How We Use Your Information</h3>
          <p className="text-sm text-neutral-400">
            We use the information we collect to provide, maintain, and improve our services, to
            process your transactions, to send you technical notices and support messages, and to
            communicate with you about products, services, and events.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">3. Information Sharing</h3>
          <p className="text-sm text-neutral-400">
            We do not share your personal information with third parties except as described in this
            policy. We may share information with vendors and service providers who perform services
            on our behalf, such as payment processing and data analysis.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">4. Data Security</h3>
          <p className="text-sm text-neutral-400">
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction. However,
            no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">5. Your Rights</h3>
          <p className="text-sm text-neutral-400">
            You have the right to access, update, or delete your personal information. You can also
            object to or restrict certain processing of your information. To exercise these rights,
            please contact us at privacy@vextrus.com.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">6. Changes to This Policy</h3>
          <p className="text-sm text-neutral-400">
            We may update this privacy policy from time to time. We will notify you of any changes
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>
      </div>
    </ScrollArea>
  ),
}

export const NotificationList: Story = {
  render: () => (
    <ScrollArea className="h-96 w-96 rounded-lg border border-neutral-800">
      <div className="p-4 space-y-3">
        {[
          {
            title: 'New invoice created',
            description: 'Invoice #INV-2024-042 has been generated.',
            time: '2 minutes ago',
            unread: true,
          },
          {
            title: 'Payment received',
            description: '৳75,000 received from XYZ Builders.',
            time: '1 hour ago',
            unread: true,
          },
          {
            title: 'Project milestone completed',
            description: 'Foundation work for Bashundhara project completed.',
            time: '3 hours ago',
            unread: false,
          },
          {
            title: 'Low stock alert',
            description: 'Steel Rods (10mm) stock is running low.',
            time: '5 hours ago',
            unread: false,
          },
          {
            title: 'Employee leave request',
            description: 'Mohammad Ali requested 3 days leave.',
            time: '1 day ago',
            unread: false,
          },
          {
            title: 'Invoice overdue',
            description: 'Invoice #INV-2024-040 is now overdue.',
            time: '2 days ago',
            unread: false,
          },
          {
            title: 'New team member added',
            description: 'Ayesha Siddiqui joined the Marketing team.',
            time: '3 days ago',
            unread: false,
          },
          {
            title: 'System maintenance',
            description: 'Scheduled maintenance on Jan 15, 2025.',
            time: '4 days ago',
            unread: false,
          },
          {
            title: 'Report generated',
            description: 'Monthly financial report is ready.',
            time: '5 days ago',
            unread: false,
          },
          {
            title: 'Project updated',
            description: 'Gulshan project timeline updated.',
            time: '6 days ago',
            unread: false,
          },
        ].map((notification, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${
              notification.unread
                ? 'bg-primary-500/10 border-primary-500/30'
                : 'bg-neutral-900/50 border-neutral-800'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium">{notification.title}</p>
              {notification.unread && (
                <div className="h-2 w-2 rounded-full bg-primary-500 mt-1" />
              )}
            </div>
            <p className="text-xs text-neutral-400 mb-1">{notification.description}</p>
            <p className="text-xs text-neutral-500">{notification.time}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const EmployeeList: Story = {
  render: () => (
    <ScrollArea className="h-96 w-80 rounded-lg border border-neutral-800">
      <div className="p-4">
        <h3 className="font-semibold mb-3">Team Members</h3>
        <div className="space-y-2">
          {[
            { name: 'Ahmed Rahman', role: 'Software Engineer', status: 'active' },
            { name: 'Fatima Khan', role: 'Accountant', status: 'active' },
            { name: 'Mohammad Ali', role: 'Project Manager', status: 'on_leave' },
            { name: 'Nusrat Jahan', role: 'HR Manager', status: 'active' },
            { name: 'Karim Hassan', role: 'Senior Developer', status: 'active' },
            { name: 'Ayesha Siddiqui', role: 'Marketing Manager', status: 'inactive' },
            { name: 'Rahim Ahmed', role: 'DevOps Engineer', status: 'active' },
            { name: 'Sultana Begum', role: 'Financial Analyst', status: 'active' },
            { name: 'Hasan Ali', role: 'Site Engineer', status: 'active' },
            { name: 'Samira Khan', role: 'HR Assistant', status: 'active' },
            { name: 'Tareq Rahman', role: 'Supervisor', status: 'active' },
            { name: 'Nabila Ahmed', role: 'Accountant', status: 'active' },
          ].map((employee, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-semibold">
                {employee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{employee.name}</p>
                <p className="text-xs text-neutral-400 truncate">{employee.role}</p>
              </div>
              <Badge
                variant={
                  employee.status === 'active'
                    ? 'success'
                    : employee.status === 'on_leave'
                      ? 'warning'
                      : 'error'
                }
                size="sm"
                dot
              >
                {employee.status === 'active'
                  ? 'Active'
                  : employee.status === 'on_leave'
                    ? 'Leave'
                    : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  ),
}

export const ProductCatalog: Story = {
  render: () => (
    <ScrollArea className="h-[500px] w-full max-w-4xl rounded-lg border border-neutral-800">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Product Catalog</h2>

        <div className="space-y-4">
          {[
            {
              category: 'Building Materials',
              products: [
                { name: 'Cement (50kg bag)', stock: 500, price: 450 },
                { name: 'Steel Rod (10mm)', stock: 25, price: 75 },
                { name: 'Brick (1000 pcs)', stock: 0, price: 8000 },
                { name: 'Sand (per ton)', stock: 200, price: 1500 },
              ],
            },
            {
              category: 'Finishing Materials',
              products: [
                { name: 'Paint (White - 20L)', stock: 150, price: 3500 },
                { name: 'Tiles (per sqft)', stock: 50, price: 120 },
                { name: 'Marble (per sqft)', stock: 80, price: 250 },
                { name: 'Wood Flooring (per sqft)', stock: 100, price: 180 },
              ],
            },
            {
              category: 'Electrical',
              products: [
                { name: 'Wire (per meter)', stock: 500, price: 15 },
                { name: 'Switch', stock: 200, price: 50 },
                { name: 'Socket', stock: 150, price: 60 },
                { name: 'Circuit Breaker', stock: 80, price: 350 },
              ],
            },
            {
              category: 'Plumbing',
              products: [
                { name: 'PVC Pipe (per meter)', stock: 300, price: 80 },
                { name: 'Faucet', stock: 100, price: 450 },
                { name: 'Toilet', stock: 50, price: 8000 },
                { name: 'Basin', stock: 70, price: 3500 },
              ],
            },
          ].map((category, i) => (
            <div key={i}>
              <h3 className="text-lg font-semibold mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.products.map((product, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-neutral-400">Stock: {product.stock} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">৳{product.price.toLocaleString()}</p>
                      <Badge
                        variant={product.stock === 0 ? 'error' : product.stock < 50 ? 'warning' : 'success'}
                        size="sm"
                      >
                        {product.stock === 0 ? 'Out' : product.stock < 50 ? 'Low' : 'In Stock'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {i < 3 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  ),
}

export const ChatMessages: Story = {
  render: () => (
    <ScrollArea className="h-96 w-96 rounded-lg border border-neutral-800 p-4">
      <div className="space-y-4">
        {[
          { sender: 'Ahmed Rahman', message: 'Hey, how is the project going?', time: '10:30 AM', isOwn: false },
          { sender: 'You', message: 'Going well! We completed the foundation work.', time: '10:32 AM', isOwn: true },
          { sender: 'Ahmed Rahman', message: 'That\'s great! When do you expect to start the structural work?', time: '10:33 AM', isOwn: false },
          { sender: 'You', message: 'We should start next week. Just waiting for the steel rods delivery.', time: '10:35 AM', isOwn: true },
          { sender: 'Ahmed Rahman', message: 'Understood. Let me know if you need anything.', time: '10:36 AM', isOwn: false },
          { sender: 'You', message: 'Will do, thanks!', time: '10:37 AM', isOwn: true },
          { sender: 'Fatima Khan', message: 'I uploaded the budget report for review.', time: '11:15 AM', isOwn: false },
          { sender: 'You', message: 'Thanks! I\'ll check it out.', time: '11:20 AM', isOwn: true },
          { sender: 'Fatima Khan', message: 'Let me know if you have any questions.', time: '11:21 AM', isOwn: false },
          { sender: 'You', message: 'Sure thing!', time: '11:22 AM', isOwn: true },
        ].map((msg, i) => (
          <div key={i} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] space-y-1`}>
              {!msg.isOwn && <p className="text-xs text-neutral-400">{msg.sender}</p>}
              <div
                className={`p-3 rounded-lg text-sm ${
                  msg.isOwn
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-900/50 border border-neutral-800'
                }`}
              >
                {msg.message}
              </div>
              <p className="text-xs text-neutral-500">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const CodeBlock: Story = {
  render: () => (
    <ScrollArea className="h-96 w-full max-w-3xl rounded-lg border border-neutral-800 bg-neutral-950">
      <pre className="p-4 text-sm">
        <code>
          {`import * as React from 'react'
import { Button } from './button'
import { Card, CardHeader, CardTitle, CardContent } from './card'

export function Dashboard() {
  const [data, setData] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-sm text-neutral-400">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default Dashboard`}
        </code>
      </pre>
    </ScrollArea>
  ),
}
