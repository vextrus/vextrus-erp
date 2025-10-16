'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup } from '@/components/ui/radio-group'

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Please select a role'),
  department: z.string().min(1, 'Please select a department'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500, 'Bio must be less than 500 characters'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  emailNotifications: z.boolean(),
  workLocation: z.string().min(1, 'Please select a work location'),
  newsletter: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

const roleOptions = [
  { value: 'developer', label: 'Software Developer' },
  { value: 'designer', label: 'UI/UX Designer' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'analyst', label: 'Business Analyst' },
]

const departmentOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
]

const workLocationOptions = [
  { value: 'office', label: 'Office', description: 'Work from office full-time' },
  { value: 'remote', label: 'Remote', description: 'Work from home full-time' },
  { value: 'hybrid', label: 'Hybrid', description: 'Mix of office and remote' },
]

export default function FormsExamplePage() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      department: '',
      bio: '',
      agreeToTerms: false,
      emailNotifications: true,
      workLocation: 'office',
      newsletter: false,
    },
  })

  const onSubmit = async (data: FormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    console.log('Form submitted:', data)
    toast.success('Profile created successfully!', {
      description: `Welcome, ${data.name}!`
    })

    reset()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card glass glassLevel="medium">
          <CardHeader>
            <CardTitle>Employee Registration Form</CardTitle>
            <CardDescription>
              Complete form demonstrating all Phase 2.1 components with React Hook Form integration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Text Input */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="name"
                    label="Full Name"
                    required
                    error={errors.name?.message}
                  >
                    <Input
                      {...field}
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                  </FormField>
                )}
              />

              {/* Email Input */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="email"
                    label="Email Address"
                    required
                    error={errors.email?.message}
                  >
                    <Input
                      {...field}
                      type="email"
                      placeholder="john.doe@vextrus.com"
                      disabled={isSubmitting}
                    />
                  </FormField>
                )}
              />

              {/* Select - Role */}
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="role"
                    label="Role"
                    required
                    error={errors.role?.message}
                  >
                    <Select
                      {...field}
                      options={roleOptions}
                      placeholder="Select your role"
                      disabled={isSubmitting}
                    />
                  </FormField>
                )}
              />

              {/* Select - Department */}
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="department"
                    label="Department"
                    required
                    error={errors.department?.message}
                  >
                    <Select
                      {...field}
                      options={departmentOptions}
                      placeholder="Select your department"
                      disabled={isSubmitting}
                    />
                  </FormField>
                )}
              />

              {/* Textarea */}
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="bio"
                    label="Bio"
                    description="Tell us a bit about yourself"
                    required
                    error={errors.bio?.message}
                  >
                    <Textarea
                      {...field}
                      placeholder="I'm a passionate developer..."
                      maxLength={500}
                      showCharCount
                      autoResize
                      disabled={isSubmitting}
                    />
                  </FormField>
                )}
              />

              {/* Radio Group */}
              <Controller
                name="workLocation"
                control={control}
                render={({ field }) => (
                  <FormField
                    name="workLocation"
                    label="Work Location Preference"
                    required
                    error={errors.workLocation?.message}
                  >
                    <RadioGroup
                      {...field}
                      options={workLocationOptions}
                      orientation="vertical"
                      disabled={isSubmitting}
                    />
                  </FormField>
                )}
              />

              {/* Switch */}
              <Controller
                name="emailNotifications"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    checked={value}
                    onCheckedChange={onChange}
                    label="Email Notifications"
                    description="Receive updates and notifications via email"
                    disabled={isSubmitting}
                  />
                )}
              />

              {/* Checkbox - Terms */}
              <Controller
                name="agreeToTerms"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <div>
                    <Checkbox
                      {...field}
                      checked={value}
                      onCheckedChange={onChange}
                      label="I agree to the terms and conditions"
                      description="Read our terms before proceeding"
                      disabled={isSubmitting}
                    />
                    {errors.agreeToTerms && (
                      <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                        {errors.agreeToTerms.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Checkbox - Newsletter */}
              <Controller
                name="newsletter"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Checkbox
                    {...field}
                    checked={value}
                    onCheckedChange={onChange}
                    label="Subscribe to newsletter"
                    description="Get monthly updates about company news"
                    disabled={isSubmitting}
                  />
                )}
              />

              {/* Submit Button */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset()}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Component Showcase */}
        <Card glass glassLevel="light" className="mt-8">
          <CardHeader>
            <CardTitle>Form Components Showcase</CardTitle>
            <CardDescription>
              All Phase 2.1 components are production-ready with:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>React Hook Form Integration:</strong> Full Controller support with type safety</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>Zod Validation:</strong> Schema-based validation with descriptive error messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>Accessibility:</strong> WCAG 2.1 AA+ compliant with ARIA attributes and keyboard navigation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>Dark Mode:</strong> Full dark mode support across all components</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>Glassmorphism:</strong> Vextrus Vision design system integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>TypeScript:</strong> Fully typed with generic form support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span><strong>Animations:</strong> Smooth transitions with Framer Motion</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}