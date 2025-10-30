# Accessibility Patterns

This document outlines accessibility (a11y) best practices and patterns for the Vextrus ERP application.

## WCAG 2.1 AA Compliance

The application aims for WCAG 2.1 Level AA compliance.

## Accessibility Utilities

See `src/lib/utils/accessibility.ts` for helper functions.

### generateAriaLabel

```typescript
import { generateAriaLabel } from '@/lib/utils/accessibility'

<button aria-label={generateAriaLabel('Settings', 'button')}>
  <SettingsIcon />
</button>
// aria-label="Settings button"
```

### getAriaProps

```typescript
import { getAriaProps } from '@/lib/utils/accessibility'

<input
  {...getAriaProps('Email address', 'email-help', true)}
  id="email"
  type="email"
/>
// Outputs: aria-label, aria-describedby, aria-required
```

### Color Contrast

```typescript
import { meetsContrastRequirement } from '@/lib/utils/accessibility'

const isAccessible = meetsContrastRequirement('#000000', '#FFFFFF', 'AA')
// Returns: true (21:1 ratio)
```

## Keyboard Navigation

### Focus Management

```typescript
// Ensure interactive elements are keyboard accessible
function Modal({ isOpen, onClose }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the close button when modal opens
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </div>
  )
}
```

### Keyboard Shortcuts

```typescript
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}

// Usage
function SearchPage() {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useKeyboardShortcut('k', () => {
    searchInputRef.current?.focus()
  })

  return <input ref={searchInputRef} placeholder="Search... (Ctrl+K)" />
}
```

### Tab Order

```typescript
// Use tabIndex to control tab order
<div>
  <button tabIndex={1}>First</button>
  <button tabIndex={2}>Second</button>
  <button tabIndex={3}>Third</button>

  {/* Hidden from tab order */}
  <div tabIndex={-1}>Not tabbable</div>
</div>
```

### Skip Navigation

```typescript
function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <nav>{/* Navigation */}</nav>

      <main id="main-content">
        {children}
      </main>
    </>
  )
}

// CSS
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## ARIA Attributes

### ARIA Labels

```typescript
// Button with icon only
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Input with label
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-help"
/>
<p id="email-help">We'll never share your email</p>
```

### ARIA Roles

```typescript
// Navigation
<nav role="navigation" aria-label="Main navigation">
  <ul role="list">
    <li role="listitem"><a href="/">Home</a></li>
  </ul>
</nav>

// Alert
<div role="alert" aria-live="polite">
  Your changes have been saved
</div>

// Dialog
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
</div>
```

### ARIA States

```typescript
// Expanded/Collapsed
<button
  aria-expanded={isOpen}
  aria-controls="menu-content"
  onClick={() => setIsOpen(!isOpen)}
>
  Menu
</button>
<div id="menu-content" hidden={!isOpen}>
  {/* Content */}
</div>

// Selected
<button
  role="tab"
  aria-selected={isActive}
  aria-controls="panel-1"
>
  Tab 1
</button>

// Disabled
<button aria-disabled="true" disabled>
  Submit
</button>

// Required
<input aria-required="true" required />

// Invalid
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'error-message' : undefined}
/>
{error && <p id="error-message">{error}</p>}
```

### ARIA Live Regions

```typescript
import { getLiveRegionProps } from '@/lib/utils/accessibility'

// Polite announcements (don't interrupt)
<div {...getLiveRegionProps('polite')}>
  {successMessage}
</div>

// Assertive announcements (interrupt)
<div {...getLiveRegionProps('assertive')}>
  {errorMessage}
</div>

// Status messages
<div role="status" aria-live="polite">
  Loading: {progress}%
</div>
```

## Semantic HTML

### Use Proper HTML Elements

```typescript
// ✅ Good: Semantic HTML
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>
  <p>&copy; 2025</p>
</footer>

// ❌ Avoid: Div soup
<div className="nav">
  <div className="nav-list">
    <div className="nav-item">
      <span onClick={...}>Home</span>
    </div>
  </div>
</div>
```

### Headings Hierarchy

```typescript
// ✅ Good: Proper heading order
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h4>Sub-subsection</h4>

// ❌ Avoid: Skipping levels
<h1>Page Title</h1>
<h4>Section</h4>
```

### Forms

```typescript
// ✅ Good: Labels and fieldsets
<form>
  <fieldset>
    <legend>Personal Information</legend>

    <label htmlFor="name">Name</label>
    <input id="name" type="text" required />

    <label htmlFor="email">Email</label>
    <input id="email" type="email" required />
  </fieldset>

  <button type="submit">Submit</button>
</form>
```

## Images

### Alt Text

```typescript
// Decorative image
<img src="decoration.png" alt="" />

// Informative image
<img src="chart.png" alt="Sales increased by 25% in Q4" />

// Functional image (link/button)
<button>
  <img src="search.png" alt="Search" />
</button>

// Complex image
<figure>
  <img src="chart.png" alt="Bar chart showing sales data" />
  <figcaption>
    Detailed description: Sales in Q1 were $50k, Q2 $75k, Q3 $60k, Q4 $90k
  </figcaption>
</figure>
```

### Icons

```typescript
// Decorative icon (hidden from screen readers)
<span>
  <CheckIcon aria-hidden="true" />
  Completed
</span>

// Icon button (needs label)
<button aria-label="Close">
  <X aria-hidden="true" />
</button>

// Icon with visible text
<button>
  <Download aria-hidden="true" />
  <span>Download</span>
</button>
```

## Color and Contrast

### Minimum Contrast Ratios

- **Normal text**: 4.5:1 (WCAG AA)
- **Large text** (18pt or 14pt bold): 3:1 (WCAG AA)
- **UI components**: 3:1 (WCAG AA)

### Don't Rely on Color Alone

```typescript
// ✅ Good: Color + icon + text
<div className="text-red-500">
  <AlertTriangle className="inline" />
  <span>Error: Form submission failed</span>
</div>

// ❌ Avoid: Color only
<div className="text-red-500">
  Form submission failed
</div>
```

## Focus Indicators

### Visible Focus States

```css
/* Ensure visible focus indicators */
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Don't remove outlines without replacement */
/* ❌ Avoid */
button:focus {
  outline: none;
}
```

### Skip Irrelevant Focus

```typescript
// Skip mouse focus, keep keyboard focus
<button className="focus:outline-none focus-visible:outline-2">
  Click me
</button>
```

## Screen Reader Support

### Descriptive Links

```typescript
// ✅ Good: Descriptive link text
<a href="/reports/2025">View 2025 Annual Report</a>

// ❌ Avoid: Generic link text
<a href="/reports/2025">Click here</a>

// Context when needed
<a href="/reports/2025" aria-label="View 2025 Annual Report">
  Read more
</a>
```

### Hidden Content

```typescript
// Visually hidden but available to screen readers
<span className="sr-only">
  Email
</span>
<input type="email" aria-label="Email" />

// CSS
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Announcements

```typescript
function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-green-100 p-4 rounded"
    >
      <span className="sr-only">Success:</span>
      {message}
    </div>
  )
}
```

## Accessible Components

### Modal Dialog

```typescript
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (isOpen) {
      // Trap focus inside modal
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <h2 id={titleId}>{title}</h2>
          {children}
          <button onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Dropdown Menu

```typescript
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(menuRef, () => setIsOpen(false))

  return (
    <div ref={menuRef}>
      <button
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        Menu
      </button>

      {isOpen && (
        <div role="menu">
          <button role="menuitem" onClick={() => alert('Edit')}>
            Edit
          </button>
          <button role="menuitem" onClick={() => alert('Delete')}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
```

## Testing Accessibility

### Automated Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Manual Testing

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac)
3. **Zoom**: Test at 200% zoom
4. **Color Contrast**: Use browser devtools or online tools
5. **Focus Indicators**: Ensure all focusable elements have visible focus

## Checklist

### Component Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] Skip navigation link provided (if applicable)
- [ ] Buttons have descriptive aria-labels (if icon-only)
- [ ] Form inputs have associated labels
- [ ] Images have appropriate alt text
- [ ] Color contrast meets 4.5:1 ratio (AA)
- [ ] Don't rely on color alone to convey information
- [ ] ARIA attributes used appropriately
- [ ] Semantic HTML elements used
- [ ] Heading hierarchy is correct
- [ ] Live regions for dynamic content
- [ ] Modal dialogs trap focus
- [ ] Screen reader tested

## Summary

**Key Principles:**
1. ✅ Keyboard accessible
2. ✅ Semantic HTML
3. ✅ Proper ARIA attributes
4. ✅ Sufficient color contrast
5. ✅ Alternative text for images
6. ✅ Focus management
7. ✅ Screen reader support

**Quick Reference:**
```typescript
// Accessible button
<button aria-label="Close">
  <X aria-hidden="true" />
</button>

// Accessible form
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!error}
/>

// Accessible modal
<div role="dialog" aria-modal="true" aria-labelledby="title">
  <h2 id="title">Dialog Title</h2>
</div>
```
