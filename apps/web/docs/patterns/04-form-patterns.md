# Form Patterns

This document outlines standard form handling patterns using react-hook-form and Zod validation.

## Form Library Stack

- **react-hook-form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers/zod**: Integration layer

## Basic Form Pattern

### Simple Form with Validation

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 1. Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// 2. Infer type from schema
type LoginFormData = z.infer<typeof loginSchema>

// 3. Create component
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    // Handle submission
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          error={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  )
}
```

## Multi-Step Form Pattern

See `src/components/features/shared/forms/MultiStepFormExample.tsx` for complete implementation.

### Key Concepts

```typescript
// 1. Define schemas for each step
const step1Schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

const step2Schema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
})

// 2. Combine schemas
const fullSchema = step1Schema.merge(step2Schema)

// 3. Use trigger() for step validation
const nextStep = async () => {
  const fieldsToValidate: (keyof FormData)[] = ['firstName', 'lastName']
  const isValid = await trigger(fieldsToValidate)
  if (isValid) {
    setStep(step + 1)
  }
}
```

## Zod Validation Patterns

### Common Validations

```typescript
const schema = z.object({
  // Required string
  name: z.string().min(1, 'Name is required'),

  // Email
  email: z.string().email('Invalid email'),

  // Phone (Bangladesh format)
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid phone number'),

  // Number with min/max
  age: z.number().min(18).max(100),

  // Optional field
  middleName: z.string().optional(),

  // Enum
  role: z.enum(['admin', 'user', 'guest']),

  // Boolean
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept terms',
  }),

  // Date
  birthDate: z.date(),

  // Array
  tags: z.array(z.string()).min(1, 'At least one tag required'),

  // Object
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string(),
  }),
})
```

### Custom Validations

```typescript
// Password confirmation
const passwordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Conditional validation
const schema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasCompany) {
      return data.companyName && data.companyName.length > 0
    }
    return true
  },
  {
    message: 'Company name is required',
    path: ['companyName'],
  }
)

// Custom validator function
const tinValidator = z.string().refine(
  (val) => /^\d{10}$/.test(val),
  'TIN must be 10 digits'
)
```

## Form Field Patterns

### Controlled Input

```typescript
<div>
  <label htmlFor="email">Email</label>
  <Input
    id="email"
    type="email"
    {...register('email')}
    error={!!errors.email}
  />
  {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
</div>
```

### Select Field

```typescript
<div>
  <label htmlFor="country">Country</label>
  <select {...register('country')} id="country">
    <option value="">Select...</option>
    <option value="BD">Bangladesh</option>
    <option value="IN">India</option>
  </select>
  {errors.country && <ErrorMessage>{errors.country.message}</ErrorMessage>}
</div>
```

### Checkbox

```typescript
<div>
  <label>
    <input type="checkbox" {...register('acceptTerms')} />
    I accept the terms and conditions
  </label>
  {errors.acceptTerms && (
    <ErrorMessage>{errors.acceptTerms.message}</ErrorMessage>
  )}
</div>
```

### Radio Buttons

```typescript
<div>
  <label>Payment Method</label>
  <label>
    <input type="radio" {...register('paymentMethod')} value="card" />
    Card
  </label>
  <label>
    <input type="radio" {...register('paymentMethod')} value="bank" />
    Bank Transfer
  </label>
  {errors.paymentMethod && (
    <ErrorMessage>{errors.paymentMethod.message}</ErrorMessage>
  )}
</div>
```

### File Input

```typescript
const schema = z.object({
  file: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: 'File is required',
  }),
})

function FileUploadForm() {
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form>
      <input type="file" {...register('file')} />
    </form>
  )
}
```

## Advanced Patterns

### Dynamic Fields

```typescript
import { useFieldArray } from 'react-hook-form'

const schema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
    })
  ),
})

function DynamicForm() {
  const { control, register } = useForm({
    resolver: zodResolver(schema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`items.${index}.name`)} />
          <input type="number" {...register(`items.${index}.quantity`)} />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ name: '', quantity: 0 })}
      >
        Add Item
      </button>
    </form>
  )
}
```

### Dependent Fields

```typescript
const { watch } = useForm()

const hasCompany = watch('hasCompany')

return (
  <form>
    <input type="checkbox" {...register('hasCompany')} />

    {hasCompany && (
      <input {...register('companyName')} placeholder="Company Name" />
    )}
  </form>
)
```

### Default Values

```typescript
// From props
function EditForm({ user }: { user: User }) {
  const { register } = useForm({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })
}

// Async default values
function AsyncForm() {
  const { register, reset } = useForm()

  useEffect(() => {
    async function loadData() {
      const data = await fetchUserData()
      reset(data)
    }
    loadData()
  }, [reset])
}
```

### Form Reset

```typescript
const { reset } = useForm()

// Reset to default values
reset()

// Reset with new values
reset({
  email: 'new@example.com',
  name: 'New Name',
})

// Reset single field
reset({ ...getValues(), email: '' })
```

## Error Handling

### Display Errors

```typescript
// Individual field errors
{errors.email && <p className="error">{errors.email.message}</p>}

// Form-level errors
const onSubmit = async (data) => {
  try {
    await submitForm(data)
  } catch (error) {
    setError('root', {
      type: 'manual',
      message: 'Failed to submit form',
    })
  }
}

{errors.root && <p className="error">{errors.root.message}</p>}
```

### Custom Error Messages

```typescript
const { setError } = useForm()

// Set field error manually
setError('email', {
  type: 'manual',
  message: 'This email is already taken',
})

// Clear error
clearErrors('email')
```

## Form Submission States

```typescript
function SubmitButton() {
  const { formState: { isSubmitting, isValid, isDirty } } = useForm()

  return (
    <Button
      type="submit"
      disabled={isSubmitting || !isValid || !isDirty}
    >
      {isSubmitting && <Spinner />}
      {isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  )
}
```

## Validation Modes

```typescript
useForm({
  mode: 'onBlur',      // Validate on blur
  mode: 'onChange',    // Validate on change
  mode: 'onSubmit',    // Validate on submit (default)
  mode: 'onTouched',   // Validate after first blur, then on change
  mode: 'all',         // Validate on blur and change
})
```

## Best Practices

### 1. Schema-First Approach

Define schema before component:

```typescript
// ✅ Good: Schema defined separately
const userSchema = z.object({...})
type UserFormData = z.infer<typeof userSchema>

function UserForm() {
  const { register } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })
}
```

### 2. Reusable Schemas

Extract common schemas:

```typescript
// lib/validation/common.ts
export const emailSchema = z.string().email()
export const phoneSchema = z.string().regex(/^01[3-9]\d{8}$/)
export const tinSchema = z.string().regex(/^\d{10}$/)

// Usage
const schema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  tin: tinSchema,
})
```

### 3. Type Safety

Always infer types from schemas:

```typescript
// ✅ Good: Type inferred from schema
const schema = z.object({...})
type FormData = z.infer<typeof schema>

// ❌ Avoid: Manual type definition
interface FormData {
  // Might not match schema
}
```

### 4. Error Messages

Provide clear, actionable error messages:

```typescript
z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
```

### 5. Accessibility

Always use proper labels and ARIA attributes:

```typescript
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    {...register('email')}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <p id="email-error" className="error">
      {errors.email.message}
    </p>
  )}
</div>
```

## Summary

**Key Patterns:**
1. ✅ Use Zod for schema validation
2. ✅ Infer types from schemas
3. ✅ Handle all form states (submitting, errors, validation)
4. ✅ Provide clear error messages
5. ✅ Ensure accessibility

**Quick Start:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({...})
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
})
```
