# Phase 2: Core Component Library - Architecture Document

**Date Created:** 2025-09-30
**Status:** Design Phase - Pre-Implementation
**Dependencies:** Phase 1 Complete ✅

---

## Executive Summary

This document defines the architecture, API design, and implementation patterns for Phase 2 of the Vextrus Vision Frontend Foundation. Phase 2 builds upon the foundation established in Phase 1, adding a comprehensive component library with advanced form handling, navigation, feedback mechanisms, and data display capabilities.

**Core Technologies:**
- **Radix UI Primitives** - Accessible, headless UI components
- **React Hook Form v7** - Performant form state management
- **TanStack Table v8** - Powerful data table solution
- **Sonner** - Toast notification system
- **Framer Motion 11** - Animation library (from Phase 1)
- **Zod** - Schema validation (from Phase 1)

---

## Architecture Principles

### 1. Composability First
Components are designed as composable building blocks that can be combined to create complex UIs:
```tsx
<Form onSubmit={handleSubmit}>
  <FormField name="email" label="Email">
    <Input type="email" />
  </FormField>
  <FormField name="role" label="Role">
    <Select options={roles} />
  </FormField>
</Form>
```

### 2. Accessibility by Default
Every component follows WCAG 2.1 Level AA+ standards:
- Keyboard navigation support
- Screen reader announcements
- ARIA attributes
- Focus management
- Color contrast compliance

### 3. Integration Patterns
Seamless integration between libraries:
- Radix UI primitives wrapped with Vextrus Vision styling
- React Hook Form Controller wraps Radix components
- TanStack Table integrates with backend GraphQL APIs
- Sonner toasts styled with glassmorphism

### 4. Type Safety
Full TypeScript support throughout:
```tsx
interface SelectProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  options: SelectOption[]
  placeholder?: string
}
```

---

## Component Categories

### Phase 2.1: Form Components
**Purpose:** Enable complex form creation with validation and accessibility

Components:
1. **Select** - Dropdown selection with search
2. **Checkbox** - Single checkbox with indeterminate state
3. **Radio** - Radio button group
4. **Textarea** - Multi-line text input
5. **Switch** - Toggle switch
6. **FormField** - Wrapper for form fields with label/error display
7. **FormError** - Error message display component
8. **FormLabel** - Enhanced label with required indicator

### Phase 2.2: Navigation Components
**Purpose:** Enable intuitive app navigation and organization

Components:
1. **Sidebar** - Collapsible navigation sidebar
2. **Header** - Top navigation with user menu
3. **Breadcrumbs** - Navigation path display
4. **Tabs** - Tab navigation
5. **NavItem** - Individual navigation item
6. **UserMenu** - User account dropdown

### Phase 2.3: Feedback Components
**Purpose:** Provide user feedback and loading states

Components:
1. **Toast** - Toast notification system (Sonner integration)
2. **AlertDialog** - Confirmation and alert dialogs
3. **Dialog** - Generic modal dialog
4. **Skeleton** - Loading skeleton
5. **Spinner** - Loading spinner
6. **Progress** - Progress indicator
7. **Alert** - Inline alert messages

### Phase 2.4: Data Display Components
**Purpose:** Display and interact with tabular data

Components:
1. **DataTable** - Advanced data table with TanStack Table
2. **TablePagination** - Pagination controls
3. **TableToolbar** - Table actions toolbar
4. **Badge** - Status badge
5. **EmptyState** - No data state
6. **StatusDot** - Status indicator dot

---

## Phase 2.1: Form Components Architecture

### 1. Select Component

**Purpose:** Accessible dropdown selection with search and keyboard navigation

**Radix Primitive:** `@radix-ui/react-select`

**API Design:**
```tsx
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  onValueChange?: (value: string) => void
}

// Usage with React Hook Form
<Controller
  name="country"
  control={control}
  rules={{ required: 'Country is required' }}
  render={({ field }) => (
    <Select
      {...field}
      options={countries}
      placeholder="Select country"
      error={errors.country?.message}
    />
  )}
/>
```

**Implementation Pattern:**
```tsx
const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, placeholder, error, disabled, ...props }, ref) => {
    return (
      <SelectPrimitive.Root {...props}>
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex items-center justify-between',
            'w-full px-3 py-2 rounded-lg',
            'border border-neutral-200 dark:border-neutral-800',
            'focus:ring-2 focus:ring-primary-500',
            error && 'border-error-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="glass-light rounded-lg shadow-lg overflow-hidden"
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'px-3 py-2 cursor-pointer',
                    'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  )}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  }
)
```

**Keyboard Interactions:**
- Space/Enter: Open dropdown
- Arrow Down/Up: Navigate options
- Escape: Close dropdown
- Type: Search options

**Accessibility:**
- ARIA role: `combobox`
- ARIA attributes: `aria-expanded`, `aria-controls`, `aria-activedescendant`
- Screen reader announcements for selected value

---

### 2. Checkbox Component

**Purpose:** Accessible checkbox with indeterminate state support

**Radix Primitive:** `@radix-ui/react-checkbox`

**API Design:**
```tsx
interface CheckboxProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  description?: string
  disabled?: boolean
  indeterminate?: boolean
}

// Usage with React Hook Form
<Controller
  name="agreeToTerms"
  control={control}
  rules={{ required: 'You must agree to terms' }}
  render={({ field }) => (
    <Checkbox
      {...field}
      label="I agree to the terms and conditions"
      description="Read our terms before agreeing"
    />
  )}
/>
```

**Implementation Pattern:**
```tsx
const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, description, disabled, indeterminate, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <CheckboxPrimitive.Root
          ref={ref}
          className={cn(
            'h-5 w-5 rounded border-2',
            'border-neutral-300 dark:border-neutral-600',
            'focus:ring-2 focus:ring-primary-500',
            'data-[state=checked]:bg-primary-500',
            'data-[state=checked]:border-primary-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
          checked={indeterminate ? 'indeterminate' : undefined}
          {...props}
        >
          <CheckboxPrimitive.Indicator>
            {indeterminate ? (
              <Minus className="h-3 w-3 text-white" />
            ) : (
              <Check className="h-3 w-3 text-white" />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {label && (
          <div className="flex flex-col">
            <label className="text-sm font-medium cursor-pointer">
              {label}
            </label>
            {description && (
              <p className="text-xs text-neutral-500">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
```

**Keyboard Interactions:**
- Space: Toggle checkbox

**Accessibility:**
- ARIA role: `checkbox`
- ARIA attributes: `aria-checked`, `aria-label`, `aria-describedby`
- Data attributes: `data-state` (checked/unchecked/indeterminate)

---

### 3. Radio Component

**Purpose:** Accessible radio button group for mutually exclusive selections

**Radix Primitive:** `@radix-ui/react-radio-group`

**API Design:**
```tsx
interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
}

// Usage with React Hook Form
<Controller
  name="paymentMethod"
  control={control}
  rules={{ required: 'Select a payment method' }}
  render={({ field }) => (
    <Radio
      {...field}
      options={paymentMethods}
      orientation="vertical"
    />
  )}
/>
```

**Implementation Pattern:**
```tsx
const Radio = forwardRef<HTMLDivElement, RadioProps>(
  ({ options, orientation = 'vertical', disabled, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn(
          'flex gap-4',
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        )}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-3">
            <RadioGroupPrimitive.Item
              value={option.value}
              disabled={option.disabled}
              className={cn(
                'h-5 w-5 rounded-full border-2',
                'border-neutral-300 dark:border-neutral-600',
                'focus:ring-2 focus:ring-primary-500',
                'data-[state=checked]:border-primary-500',
                (disabled || option.disabled) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>

            <div className="flex flex-col">
              <label className="text-sm font-medium cursor-pointer">
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-neutral-500">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </RadioGroupPrimitive.Root>
    )
  }
)
```

**Keyboard Interactions:**
- Tab: Focus first/checked item
- Space: Select focused item
- Arrow keys: Navigate and select items

**Accessibility:**
- ARIA role: `radiogroup`
- ARIA attributes: `aria-label`, `aria-orientation`
- Roving tabindex for keyboard navigation

---

### 4. Textarea Component

**Purpose:** Multi-line text input with auto-resize and character count

**API Design:**
```tsx
interface TextareaProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  autoResize?: boolean
  disabled?: boolean
  error?: string
}

// Usage with React Hook Form
<Controller
  name="description"
  control={control}
  rules={{
    required: 'Description is required',
    maxLength: { value: 500, message: 'Max 500 characters' }
  }}
  render={({ field }) => (
    <Textarea
      {...field}
      label="Description"
      placeholder="Enter description"
      maxLength={500}
      autoResize
      error={errors.description?.message}
    />
  )}
/>
```

**Implementation Pattern:**
```tsx
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, placeholder, rows = 4, maxLength, autoResize, error, disabled, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [charCount, setCharCount] = useState(0)

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [autoResize])

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium">
            {label}
          </label>
        )}

        <textarea
          ref={mergeRefs([ref, textareaRef])}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'border border-neutral-200 dark:border-neutral-800',
            'focus:ring-2 focus:ring-primary-500',
            'resize-none transition-all',
            error && 'border-error-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => {
            setCharCount(e.target.value.length)
            props.onChange?.(e)
          }}
          {...props}
        />

        {maxLength && (
          <div className="text-xs text-neutral-500 text-right">
            {charCount} / {maxLength}
          </div>
        )}

        {error && (
          <p className="text-sm text-error-600">{error}</p>
        )}
      </div>
    )
  }
)
```

**Accessibility:**
- ARIA attributes: `aria-label`, `aria-describedby`, `aria-invalid`
- Character count announced to screen readers
- Error messages associated with textarea

---

### 5. Switch Component

**Purpose:** Accessible toggle switch for boolean values

**Radix Primitive:** `@radix-ui/react-switch`

**API Design:**
```tsx
interface SwitchProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  description?: string
  disabled?: boolean
}

// Usage with React Hook Form
<Controller
  name="emailNotifications"
  control={control}
  render={({ field }) => (
    <Switch
      {...field}
      label="Email Notifications"
      description="Receive notifications via email"
    />
  )}
/>
```

**Implementation Pattern:**
```tsx
const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, description, disabled, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          {label && (
            <label className="text-sm font-medium cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-neutral-500">{description}</p>
          )}
        </div>

        <SwitchPrimitive.Root
          ref={ref}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors',
            'bg-neutral-200 dark:bg-neutral-700',
            'data-[state=checked]:bg-primary-500',
            'focus:ring-2 focus:ring-primary-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow-sm',
              'transition-transform duration-200',
              'data-[state=checked]:translate-x-5',
              'data-[state=unchecked]:translate-x-0.5'
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    )
  }
)
```

**Keyboard Interactions:**
- Space/Enter: Toggle switch

**Accessibility:**
- ARIA role: `switch`
- ARIA attributes: `aria-checked`, `aria-label`, `aria-describedby`
- Data attributes: `data-state` (checked/unchecked)

---

### 6. FormField Component

**Purpose:** Wrapper component for form fields with label, error display, and validation

**API Design:**
```tsx
interface FormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

// Usage
<FormField
  name="email"
  label="Email Address"
  required
  error={errors.email?.message}
>
  <Input type="email" placeholder="you@example.com" />
</FormField>
```

**Implementation Pattern:**
```tsx
const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  required,
  error,
  children
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}

      {description && (
        <p className="text-sm text-neutral-500" id={`${name}-description`}>
          {description}
        </p>
      )}

      {/* Clone children and pass necessary props */}
      {React.cloneElement(children as React.ReactElement, {
        id: name,
        name: name,
        'aria-invalid': !!error,
        'aria-describedby': description ? `${name}-description` : undefined,
        'aria-errormessage': error ? `${name}-error` : undefined
      })}

      {error && (
        <FormError id={`${name}-error`} message={error} />
      )}
    </div>
  )
}
```

---

### 7. FormError Component

**Purpose:** Consistent error message display with icons and animations

**API Design:**
```tsx
interface FormErrorProps {
  id?: string
  message: string
}

// Usage
<FormError message={errors.email?.message} />
```

**Implementation Pattern:**
```tsx
const FormError: React.FC<FormErrorProps> = ({ id, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 text-sm text-error-600"
      id={id}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </motion.div>
  )
}
```

---

## Phase 2.2: Navigation Components Architecture

### 1. Sidebar Component

**Purpose:** Collapsible navigation sidebar with nested sections

**Radix Primitive:** `@radix-ui/react-collapsible`

**API Design:**
```tsx
interface SidebarSection {
  id: string
  title: string
  icon?: React.ReactNode
  items: SidebarItem[]
  defaultOpen?: boolean
}

interface SidebarItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  active?: boolean
}

interface SidebarProps {
  sections: SidebarSection[]
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

// Usage
<Sidebar
  sections={navigationSections}
  collapsed={sidebarCollapsed}
  onCollapse={setSidebarCollapsed}
/>
```

**Implementation Pattern:**
```tsx
const Sidebar: React.FC<SidebarProps> = ({ sections, collapsed, onCollapse }) => {
  return (
    <aside
      className={cn(
        'h-screen flex flex-col glass-medium',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && <Logo />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse?.(!collapsed)}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  )
}

const SidebarSection: React.FC<{ section: SidebarSection; collapsed: boolean }> = ({
  section,
  collapsed
}) => {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Trigger
        className={cn(
          'w-full px-4 py-2 flex items-center justify-between',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'transition-colors'
        )}
      >
        <div className="flex items-center gap-3">
          {section.icon}
          {!collapsed && <span className="font-medium">{section.title}</span>}
        </div>
        {!collapsed && (
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </Collapsible.Trigger>

      <Collapsible.Content>
        {section.items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              collapsed ? 'justify-center' : 'pl-12',
              item.active && 'bg-primary-50 dark:bg-primary-900/20'
            )}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
```

**Keyboard Interactions:**
- Tab: Navigate between sections and items
- Enter/Space: Open/close sections, navigate to items
- Arrow keys: Navigate within sections

**Accessibility:**
- ARIA attributes: `aria-label`, `aria-expanded`, `aria-current`
- Keyboard navigation support
- Focus management

---

### 2. Header Component

**Purpose:** Top navigation bar with user menu and actions

**Radix Primitive:** `@radix-ui/react-dropdown-menu`

**API Design:**
```tsx
interface HeaderProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onLogout: () => void
  notifications?: number
}

// Usage
<Header
  user={currentUser}
  onLogout={handleLogout}
  notifications={5}
/>
```

**Implementation Pattern:**
```tsx
const Header: React.FC<HeaderProps> = ({ user, onLogout, notifications }) => {
  return (
    <header className="h-16 flex items-center justify-between px-6 glass-subtle">
      <div className="flex items-center gap-4">
        <CommandPalette />
        <SearchInput placeholder="Search..." />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge className="absolute -top-1 -right-1" variant="destructive">
              {notifications}
            </Badge>
          )}
        </Button>

        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}

const UserMenu: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="glass-light w-56 rounded-lg shadow-lg">
          <DropdownMenu.Item className="px-4 py-2">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item className="px-4 py-2">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1" />
          <DropdownMenu.Item className="px-4 py-2" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
```

---

### 3. Breadcrumbs Component

**Purpose:** Display navigation hierarchy

**API Design:**
```tsx
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
}

// Usage
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Finance', href: '/finance' },
    { label: 'Invoices' }
  ]}
/>
```

**Implementation Pattern:**
```tsx
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, separator = <ChevronRight className="h-4 w-4" /> }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-neutral-400" aria-hidden="true">
              {separator}
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-neutral-600 hover:text-primary-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-900 dark:text-neutral-100 font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
```

---

### 4. Tabs Component

**Purpose:** Tab navigation for content organization

**Radix Primitive:** `@radix-ui/react-tabs`

**API Design:**
```tsx
interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
}

// Usage
<Tabs
  tabs={[
    { value: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
    { value: 'analytics', label: 'Analytics', icon: <LineChart /> },
    { value: 'settings', label: 'Settings', icon: <Settings /> }
  ]}
  defaultValue="overview"
/>
```

**Implementation Pattern:**
```tsx
const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, defaultValue, value, onValueChange, orientation = 'horizontal' }, ref) => {
    return (
      <TabsPrimitive.Root
        ref={ref}
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        orientation={orientation}
      >
        <TabsPrimitive.List
          className={cn(
            'flex gap-2 border-b border-neutral-200 dark:border-neutral-800',
            orientation === 'vertical' && 'flex-col border-b-0 border-r'
          )}
        >
          {tabs.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                'flex items-center gap-2 px-4 py-2',
                'border-b-2 border-transparent',
                'hover:border-neutral-300 dark:hover:border-neutral-600',
                'data-[state=active]:border-primary-500',
                'data-[state=active]:text-primary-600',
                'transition-colors',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {/* Content rendered by parent */}
      </TabsPrimitive.Root>
    )
  }
)
```

---

## Phase 2.3: Feedback Components Architecture

### 1. Toast Component (Sonner Integration)

**Purpose:** Toast notification system with Vextrus Vision styling

**Library:** `sonner`

**API Design:**
```tsx
import { toast } from 'sonner'

// Success toast
toast.success('Invoice created successfully', {
  description: 'Invoice #INV-2025-001',
  action: {
    label: 'View',
    onClick: () => navigate('/invoices/INV-2025-001')
  }
})

// Error toast
toast.error('Failed to create invoice', {
  description: 'Network connection error'
})

// Loading toast
toast.loading('Creating invoice...')

// Promise toast
toast.promise(createInvoice(), {
  loading: 'Creating invoice...',
  success: (data) => `Invoice ${data.invoiceNumber} created`,
  error: 'Failed to create invoice'
})
```

**Implementation (Providers):**
```tsx
// In providers.tsx - already implemented in Phase 1
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      color: 'inherit',
    },
  }}
/>
```

**Custom Toast Component:**
```tsx
// For custom toast layouts
const CustomToast = () => {
  return toast.custom((t) => (
    <Card glass glassLevel="medium" className="p-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-success-500" />
        <div>
          <p className="font-medium">Success</p>
          <p className="text-sm text-neutral-500">Your changes have been saved</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => toast.dismiss(t)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  ))
}
```

---

### 2. AlertDialog Component

**Purpose:** Confirmation dialogs and destructive action alerts

**Radix Primitive:** `@radix-ui/react-alert-dialog`

**API Design:**
```tsx
interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  actionLabel?: string
  cancelLabel?: string
  onAction: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

// Usage
<AlertDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  title="Delete Invoice"
  description="Are you sure you want to delete this invoice? This action cannot be undone."
  actionLabel="Delete"
  cancelLabel="Cancel"
  onAction={handleDelete}
  variant="destructive"
/>
```

**Implementation Pattern:**
```tsx
const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onAction,
  variant = 'default'
}) => {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      await onAction()
      onOpenChange(false)
    } catch (error) {
      toast.error('Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <AlertDialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md glass-medium rounded-xl shadow-xl',
            'p-6 flex flex-col gap-4'
          )}
        >
          <AlertDialogPrimitive.Title className="text-xl font-semibold">
            {title}
          </AlertDialogPrimitive.Title>

          <AlertDialogPrimitive.Description className="text-neutral-600 dark:text-neutral-400">
            {description}
          </AlertDialogPrimitive.Description>

          <div className="flex gap-3 justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="ghost" disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>

            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'primary'}
                onClick={handleAction}
                loading={loading}
              >
                {actionLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
```

---

### 3. Dialog Component

**Purpose:** Generic modal dialog for forms and content

**Radix Primitive:** `@radix-ui/react-dialog` (already researched in Phase 2.1)

**API Design:**
```tsx
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// Usage
<Dialog
  open={showCreateDialog}
  onOpenChange={setShowCreateDialog}
  title="Create New Invoice"
  description="Fill in the details to create a new invoice"
  size="lg"
>
  <InvoiceForm onSubmit={handleSubmit} />
</Dialog>
```

---

### 4. Skeleton Component

**Purpose:** Loading skeleton for content placeholders

**API Design:**
```tsx
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

// Usage
<Skeleton variant="rectangular" width="100%" height={200} />
<Skeleton variant="text" width="60%" />
<Skeleton variant="circular" width={40} height={40} />
```

**Implementation Pattern:**
```tsx
const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  return (
    <div
      className={cn(
        'bg-neutral-200 dark:bg-neutral-800',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'animate-skeleton',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
```

---

### 5. Progress Component

**Purpose:** Progress indicator for long-running operations

**Radix Primitive:** `@radix-ui/react-progress`

**API Design:**
```tsx
interface ProgressProps {
  value: number // 0-100
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
}

// Usage
<Progress value={progress} showLabel />
```

---

## Phase 2.4: Data Display Components Architecture

### 1. DataTable Component

**Purpose:** Advanced data table with sorting, filtering, pagination, and virtualization

**Library:** `@tanstack/react-table` v8

**API Design:**
```tsx
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  loading?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  enableVirtualization?: boolean
}

// Usage
const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: ({ row }) => <Badge>{row.original.invoiceNumber}</Badge>
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => formatCurrency(row.original.amount)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
  }
]

<DataTable
  columns={columns}
  data={invoices}
  loading={isLoading}
  enableSorting
  enableFiltering
  enablePagination
  onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
/>
```

**Implementation Pattern:**
```tsx
function DataTable<TData>({
  columns,
  data,
  loading,
  pageSize = 15,
  onRowClick,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined
  })

  return (
    <div className="flex flex-col gap-4">
      {enableFiltering && <TableToolbar table={table} />}

      <div className="glass-subtle rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-neutral-200 dark:border-neutral-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() && 'cursor-pointer select-none'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <span>
                            {{
                              asc: <ArrowUp className="h-4 w-4" />,
                              desc: <ArrowDown className="h-4 w-4" />
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="h-4 w-4 text-neutral-400" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={<FileText />}
                    title="No data found"
                    description="There are no records to display"
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-neutral-200 dark:border-neutral-800',
                    'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
                    'transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && <TablePagination table={table} />}
    </div>
  )
}
```

---

### 2. Badge Component

**Purpose:** Status indicators and labels

**API Design:**
```tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
}

// Usage
<Badge variant="success">Active</Badge>
<Badge variant="warning" dot>Pending</Badge>
<Badge variant="error">Overdue</Badge>
```

**Implementation Pattern:**
```tsx
const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full',
          {
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-2.5 py-1 text-sm': size === 'md',
            'px-3 py-1.5 text-base': size === 'lg'
          },
          {
            'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100': variant === 'default',
            'bg-success-100 text-success-900 dark:bg-success-900/20 dark:text-success-100': variant === 'success',
            'bg-warning-100 text-warning-900 dark:bg-warning-900/20 dark:text-warning-100': variant === 'warning',
            'bg-error-100 text-error-900 dark:bg-error-900/20 dark:text-error-100': variant === 'error',
            'bg-info-100 text-info-900 dark:bg-info-900/20 dark:text-info-100': variant === 'info',
            'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400': variant === 'secondary'
          },
          className
        )}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              {
                'bg-success-500': variant === 'success',
                'bg-warning-500': variant === 'warning',
                'bg-error-500': variant === 'error',
                'bg-info-500': variant === 'info',
                'bg-neutral-500': variant === 'default' || variant === 'secondary'
              }
            )}
          />
        )}
        {children}
      </div>
    )
  }
)
```

---

### 3. EmptyState Component

**Purpose:** Display empty states with actions

**API Design:**
```tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// Usage
<EmptyState
  icon={<FileText className="h-12 w-12" />}
  title="No invoices found"
  description="Get started by creating your first invoice"
  action={{
    label: 'Create Invoice',
    onClick: () => setShowCreateDialog(true)
  }}
/>
```

---

## Integration Patterns

### React Hook Form + Radix UI

**Pattern:** Use Controller to wrap Radix UI components

```tsx
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email(),
  role: z.string(),
  notifications: z.boolean()
})

type FormData = z.infer<typeof schema>

function MyForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Email" error={errors.email?.message}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => <Input {...field} type="email" />}
        />
      </FormField>

      <FormField label="Role" error={errors.role?.message}>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select {...field} options={roles} />
          )}
        />
      </FormField>

      <Controller
        name="notifications"
        control={control}
        render={({ field }) => (
          <Switch
            {...field}
            label="Email Notifications"
          />
        )}
      />

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

## TypeScript Types

### Form Types
```typescript
import { Control, FieldValues, Path } from 'react-hook-form'

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  description?: string
  required?: boolean
  error?: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}
```

### Table Types
```typescript
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  loading?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
}
```

---

## Accessibility Compliance

### WCAG 2.1 Level AA+ Requirements

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Visible focus indicators (2px ring)
   - Logical tab order
   - Keyboard shortcuts documented

2. **Screen Reader Support**
   - Proper ARIA labels and roles
   - ARIA live regions for dynamic content
   - ARIA descriptions for complex components
   - Form errors announced

3. **Color Contrast**
   - 4.5:1 for normal text
   - 3:1 for large text
   - Non-color indicators for status

4. **Focus Management**
   - Focus trapped in modals
   - Focus returned after dialogs close
   - Skip links for navigation

5. **Form Accessibility**
   - Labels associated with inputs
   - Required fields indicated
   - Error messages descriptive
   - Validation triggered appropriately

---

## Performance Considerations

### 1. Component Optimization
```tsx
// Memoize expensive components
const DataTable = React.memo(DataTableComponent)

// Use React.lazy for code splitting
const DataTable = lazy(() => import('./components/data-table'))
```

### 2. Virtualization
```tsx
// For large tables, use TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50
})
```

### 3. Debounced Search
```tsx
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    table.getColumn('name')?.setFilterValue(value)
  }, 300),
  []
)
```

---

## Implementation Plan

### Phase 2.1: Form Components (Week 1)
- [ ] Select component with React Hook Form integration
- [ ] Checkbox component with indeterminate state
- [ ] Radio component with orientation support
- [ ] Textarea component with auto-resize
- [ ] Switch component
- [ ] FormField wrapper component
- [ ] FormError component
- [ ] Update documentation

### Phase 2.2: Navigation Components (Week 1)
- [ ] Sidebar with collapsible sections
- [ ] Header with user menu
- [ ] Breadcrumbs component
- [ ] Tabs component
- [ ] Update documentation

### Phase 2.3: Feedback Components (Week 2)
- [ ] Toast integration (Sonner styling)
- [ ] AlertDialog component
- [ ] Dialog component
- [ ] Skeleton component
- [ ] Spinner component
- [ ] Progress component
- [ ] Update documentation

### Phase 2.4: Data Display Components (Week 2)
- [ ] DataTable with TanStack Table
- [ ] TablePagination component
- [ ] TableToolbar component
- [ ] Badge component
- [ ] EmptyState component
- [ ] Update documentation

### Testing & Documentation
- [ ] Unit tests for all components
- [ ] Accessibility tests (keyboard nav, screen readers)
- [ ] Integration tests for forms
- [ ] Update VEXTRUS_IMPLEMENTATION_GUIDE.md
- [ ] Create component examples
- [ ] Production build verification

---

## Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Component Count | 25+ | Components implemented |
| Type Coverage | 100% | TypeScript strict mode |
| Accessibility | WCAG 2.1 AA+ | axe-core tests pass |
| Bundle Size | < 150 kB | First Load JS |
| Test Coverage | > 80% | Unit + integration tests |
| Documentation | Complete | All APIs documented |

---

## Next Steps

After Phase 2 architecture approval:
1. Begin implementation with Phase 2.1 (Form Components)
2. Create component stories/examples
3. Write unit tests for each component
4. Update documentation continuously
5. Conduct accessibility testing
6. Performance optimization
7. Production build verification

---

**Document Status:** ✅ Complete - Ready for Implementation
**Last Updated:** 2025-09-30
**Next Review:** After Phase 2.1 Implementation