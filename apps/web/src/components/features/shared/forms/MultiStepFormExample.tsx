'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Step 1 Schema: Personal Information
 */
const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

/**
 * Step 2 Schema: Contact Information
 */
const step2Schema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
})

/**
 * Step 3 Schema: Address Information
 */
const step3Schema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(4, 'Invalid zip code'),
})

/**
 * Combined Schema for full form
 */
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema)

type FormData = z.infer<typeof fullSchema>

/**
 * MultiStepFormExample Component
 *
 * Demonstrates multi-step form pattern with:
 * - Step-by-step validation
 * - Progress indicator
 * - Navigation between steps
 * - Partial validation on step change
 * - Final submission with all data
 *
 * @example
 * ```tsx
 * <MultiStepFormExample />
 * ```
 */
export function MultiStepFormExample() {
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onBlur',
  })

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = []

    if (step === 1) {
      fieldsToValidate = ['firstName', 'lastName']
    } else if (step === 2) {
      fieldsToValidate = ['email', 'phone']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => setStep(step - 1)

  const onSubmit = async (data: FormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Form submitted:', data)

      // Reset to step 1 after submission
      setStep(1)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {step} of 3
          </span>
          <span className="text-sm text-foreground-secondary">
            {step === 1 && 'Personal Info'}
            {step === 2 && 'Contact Info'}
            {step === 3 && 'Address'}
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i <= step ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              {...register('firstName')}
              error={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              {...register('lastName')}
              error={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Contact Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              error={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="01712345678"
              {...register('phone')}
              error={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Address */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Address
            </label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main St"
              {...register('address')}
              error={!!errors.address}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              City
            </label>
            <Input
              id="city"
              type="text"
              placeholder="Dhaka"
              {...register('city')}
              error={!!errors.city}
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium mb-1">
              Zip Code
            </label>
            <Input
              id="zipCode"
              type="text"
              placeholder="1000"
              {...register('zipCode')}
              error={!!errors.zipCode}
            />
            {errors.zipCode && (
              <p className="text-sm text-red-500 mt-1">
                {errors.zipCode.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={prevStep}>
            Previous
          </Button>
        )}

        <div className="ml-auto">
          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
