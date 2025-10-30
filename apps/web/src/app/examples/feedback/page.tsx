'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Trash2, Upload } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'

export default function FeedbackExamplePage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [showDialog, setShowDialog] = React.useState(false)

  // Simulate progress
  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 10
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLoadData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Data loaded successfully')
    }, 2000)
  }

  const handleDelete = () => {
    toast.success('Item deleted successfully', {
      description: 'The item has been permanently removed.'
    })
  }

  const handleUpload = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: 'Uploading file...',
        success: 'File uploaded successfully',
        error: 'Failed to upload file',
      }
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Feedback Components</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Comprehensive feedback system with spinners, skeletons, progress bars, alerts, and dialogs
          </p>
        </div>

        {/* Toast Notifications */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>
              Display temporary notifications using Sonner (implemented in Phase 1)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => toast('Default toast message')}
              >
                Default Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.success('Success! Operation completed.')}
              >
                Success Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.error('Error! Something went wrong.')}
              >
                Error Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info('Info: This is an informational message.')}
              >
                Info Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.warning('Warning: Please review this action.')}
              >
                Warning Toast
              </Button>
              <Button
                variant="secondary"
                onClick={handleUpload}
              >
                Promise Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spinners */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Spinner</CardTitle>
            <CardDescription>
              Loading spinner with multiple sizes and variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sizes */}
              <div>
                <h3 className="text-sm font-medium mb-3">Sizes</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-neutral-500">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <span className="text-xs text-neutral-500">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <span className="text-xs text-neutral-500">Large</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="xl" />
                    <span className="text-xs text-neutral-500">Extra Large</span>
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div>
                <h3 className="text-sm font-medium mb-3">Variants</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner variant="default" />
                    <span className="text-xs text-neutral-500">Default</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-primary-500 p-4 rounded-lg">
                    <Spinner variant="light" />
                    <span className="text-xs text-white">Light</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner variant="muted" />
                    <span className="text-xs text-neutral-500">Muted</span>
                  </div>
                </div>
              </div>

              {/* In Button */}
              <div>
                <h3 className="text-sm font-medium mb-3">With Button</h3>
                <Button onClick={handleLoadData} loading={isLoading}>
                  {isLoading ? 'Loading...' : 'Load Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Skeleton</CardTitle>
            <CardDescription>
              Loading placeholder for content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Text Skeletons */}
              <div>
                <h3 className="text-sm font-medium mb-3">Text Lines</h3>
                <div className="space-y-2">
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="80%" />
                </div>
              </div>

              {/* Circular Skeleton */}
              <div>
                <h3 className="text-sm font-medium mb-3">Avatar</h3>
                <Skeleton variant="circular" width={48} height={48} />
              </div>

              {/* Rectangular Skeleton */}
              <div>
                <h3 className="text-sm font-medium mb-3">Card Placeholder</h3>
                <div className="space-y-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <Skeleton variant="rectangular" width="100%" height={120} />
                  <div className="space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                  </div>
                </div>
              </div>

              {/* Animation Variants */}
              <div>
                <h3 className="text-sm font-medium mb-3">Animations</h3>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" animation="pulse" />
                    <span className="text-xs text-neutral-500">Pulse</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" animation="wave" />
                    <span className="text-xs text-neutral-500">Wave</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" animation="none" />
                    <span className="text-xs text-neutral-500">None</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              Progress indicator with variants and labels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Variants */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Default</p>
                  <Progress value={progress} variant="default" showLabel />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Success</p>
                  <Progress value={75} variant="success" showLabel />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Warning</p>
                  <Progress value={50} variant="warning" showLabel />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Error</p>
                  <Progress value={25} variant="error" showLabel />
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Sizes</h3>
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Small</p>
                  <Progress value={60} size="sm" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Medium</p>
                  <Progress value={60} size="md" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Large</p>
                  <Progress value={60} size="lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Alert</CardTitle>
            <CardDescription>
              Inline alert messages with variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="default" title="Default Alert" description="This is a default alert message." />
              <Alert variant="info" title="Information" description="This is an informational message with important details." />
              <Alert variant="success" title="Success" description="Your changes have been saved successfully." />
              <Alert variant="warning" title="Warning" description="Please review this action before proceeding." />
              <Alert variant="error" title="Error" description="An error occurred while processing your request." />
              <Alert
                variant="info"
                title="Dismissible Alert"
                description="Click the X button to dismiss this alert."
                dismissible
                onDismiss={() => toast.info('Alert dismissed')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Dialog</CardTitle>
            <CardDescription>
              Generic modal dialog with multiple sizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Small Dialog</Button>
                </DialogTrigger>
                <DialogContent size="sm">
                  <DialogHeader>
                    <DialogTitle>Small Dialog</DialogTitle>
                    <DialogDescription>
                      This is a small dialog window.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <p className="text-sm">
                      Dialog content goes here. This is a smaller dialog suitable for simple messages.
                    </p>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Medium Dialog</Button>
                </DialogTrigger>
                <DialogContent size="md">
                  <DialogHeader>
                    <DialogTitle>Medium Dialog</DialogTitle>
                    <DialogDescription>
                      This is a medium-sized dialog window (default).
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <p className="text-sm mb-4">
                      This is the default dialog size. It&apos;s suitable for most use cases including forms and detailed information.
                    </p>
                    <div className="space-y-2">
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width="90%" />
                    </div>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Large Dialog</Button>
                </DialogTrigger>
                <DialogContent size="lg">
                  <DialogHeader>
                    <DialogTitle>Large Dialog</DialogTitle>
                    <DialogDescription>
                      This is a large dialog window with more content space.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <div className="space-y-4">
                      <p className="text-sm">
                        Large dialogs are perfect for complex forms, detailed content, or multiple sections.
                      </p>
                      <Alert variant="info" title="Pro Tip" description="Use large dialogs when you need more space for content." />
                    </div>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button>Continue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="secondary"
                onClick={() => setShowDialog(true)}
              >
                Controlled Dialog
              </Button>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Controlled Dialog</DialogTitle>
                    <DialogDescription>
                      This dialog&apos;s state is controlled externally.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <p className="text-sm">
                      The open state is managed by React state, allowing programmatic control.
                    </p>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowDialog(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* AlertDialog */}
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Alert Dialog</CardTitle>
            <CardDescription>
              Confirmation dialogs for important actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary">Confirmation</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action requires your confirmation to proceed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toast.success('Action confirmed')}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this item? This action cannot be undone and will permanently remove the item from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Components Showcase */}
        <Card glass glassLevel="light">
          <CardHeader>
            <CardTitle>Feedback Components Showcase</CardTitle>
            <CardDescription>
              All Phase 2.3 components are production-ready with:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Toast (Phase 1)</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Sonner integration with glassmorphism</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Success, error, info, warning variants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Promise handling for async operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Action buttons and dismissal</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Spinner</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>4 sizes: sm, md, lg, xl</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>3 variants: default, light, muted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>ARIA labels for screen readers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Button integration with loading state</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Skeleton</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>3 variants: text, circular, rectangular</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>3 animations: pulse, wave, none</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Custom width and height</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Dark mode support</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Progress</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>4 variants: default, success, warning, error</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>3 sizes: sm, md, lg</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Optional label with percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Smooth animations</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Alert</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>5 variants: default, info, success, warning, error</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Icons for each variant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Dismissible with callback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Title and description support</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Dialog & AlertDialog</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Radix UI primitives with glassmorphism</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Multiple sizes: sm, md, lg, xl, full</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Controlled and uncontrolled modes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span>Accessibility with focus trap</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}