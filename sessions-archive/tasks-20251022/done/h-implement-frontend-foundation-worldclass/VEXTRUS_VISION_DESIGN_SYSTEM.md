# Vextrus Vision Design System
## World-Class Enterprise ERP Design Language

**Version:** 1.0.0
**Status:** Foundation Specification
**Target:** Bangladesh Construction & Real Estate ERP

---

## Core Brand Values

**Vextrus represents the highest world-class quality in enterprise software.**

- **Excellence**: Every pixel, every interaction reflects mastery
- **Clarity**: Complex data presented with pristine simplicity
- **Trust**: Visual language that inspires confidence in financial decisions
- **Efficiency**: Designed for power users who demand speed and precision
- **Cultural Harmony**: Bangladesh-first with global sophistication

---

## Design Principles

### 1. **Role-Based Adaptive Design** (Inspired by SAP Fiori)
- Interfaces adapt to user roles: Executive, Manager, Operator
- Dashboard density scales with expertise level
- Progressive disclosure keeps complexity manageable

### 2. **Consumer-Grade Enterprise UX** (Inspired by Salesforce Lightning)
- Enterprise power with consumer elegance
- Microinteractions make data manipulation delightful
- Zero compromise between beauty and functionality

### 3. **Data-First Visual Hierarchy** (Inspired by IBM Carbon)
- Information architecture optimized for dense data
- Visual weight guides attention to critical metrics
- White space as a design element, not waste

### 4. **Coherent Motion Language** (Inspired by Material Design 3)
- Every animation serves a functional purpose
- Motion guides understanding of system state changes
- Performance-obsessed: 60fps minimum

### 5. **Accessible by Default** (WCAG 2.1 Level AA+)
- Accessibility is not an afterthought, it's the foundation
- Keyboard-first navigation for power users
- Screen reader optimized for complex financial data

---

## Typography System

### Font Families

#### Primary: **Inter** (Latin Script)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```
- **Usage**: UI elements, dashboards, data tables
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Rationale**: Exceptional readability at small sizes, OpenType features for numerals

#### Secondary: **Noto Sans Bengali** (Bengali Script)
```css
font-family: 'Noto Sans Bengali', 'Hind Siliguri', 'Mukta Malar', sans-serif;
```
- **Usage**: Bengali content, localized labels, reports
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Rationale**: Complete Unicode coverage, professionally designed conjuncts

#### Monospace: **JetBrains Mono**
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
```
- **Usage**: Transaction IDs, account numbers, code snippets
- **Rationale**: Ligatures, excellent digit differentiation

### Type Scale (Fluid Typography)

```typescript
// Tailwind configuration
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px - Captions, metadata
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - Secondary text, labels
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - Body text
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - Emphasized text
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px - Section headings
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px - Page headings
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - Major headings
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - Display text
  '5xl': ['3rem', { lineHeight: '1' }],           // 48px - Hero text
}
```

### Bengali Typography Considerations

```css
/* Enhanced line-height for Bengali script */
.text-bengali {
  line-height: 1.75;
  letter-spacing: 0.01em;
}

/* Proper rendering of conjuncts */
.text-bengali {
  font-feature-settings: 'liga' 1, 'calt' 1;
  text-rendering: optimizeLegibility;
}

/* Number formatting */
.number-bengali {
  font-variant-numeric: tabular-nums;
}
```

---

## Color System

### Philosophy
Colors in financial applications carry semantic weight. Our palette balances:
- **Trust**: Blues convey stability and professionalism
- **Clarity**: High contrast for data legibility
- **Meaning**: Semantic colors for status indicators
- **Elegance**: Sophisticated neutrals, not corporate gray

### Color Palette

#### Primary Colors (Brand Identity)
```typescript
colors: {
  primary: {
    50:  '#e8f4ff',  // Lightest - Backgrounds
    100: '#d0e8ff',  // Light - Hover states
    200: '#a6d5ff',  //
    300: '#75bfff',  //
    400: '#47a6ff',  //
    500: '#1a8fff',  // Primary - Main brand color
    600: '#0076f5',  //
    700: '#005ed1',  // Dark - Active states
    800: '#004aa8',  //
    900: '#003580',  // Darkest - Text on light
    950: '#002054',  // Ultra dark
  },
}
```
**Usage**: Primary actions, links, focus states, active navigation

#### Semantic Colors

**Success (Growth, Profit, Completion)**
```typescript
success: {
  50:  '#ecfdf5',
  500: '#10b981',  // Main success color
  700: '#047857',  // Dark variant
  900: '#064e3b',
}
```

**Warning (Caution, Pending, Review)**
```typescript
warning: {
  50:  '#fffbeb',
  500: '#f59e0b',  // Main warning color
  700: '#b45309',
  900: '#78350f',
}
```

**Error (Loss, Critical, Danger)**
```typescript
error: {
  50:  '#fef2f2',
  500: '#ef4444',  // Main error color
  700: '#b91c1c',
  900: '#7f1d1d',
}
```

**Info (Neutral, Informational)**
```typescript
info: {
  50:  '#eff6ff',
  500: '#3b82f6',
  700: '#1d4ed8',
  900: '#1e3a8a',
}
```

#### Neutral Colors (Surfaces & Text)
```typescript
neutral: {
  0:   '#ffffff',  // Pure white
  50:  '#fafafa',  // Background
  100: '#f5f5f5',  // Hover backgrounds
  200: '#e5e5e5',  // Borders
  300: '#d4d4d4',  // Disabled states
  400: '#a3a3a3',  // Placeholder text
  500: '#737373',  // Secondary text
  600: '#525252',  // Body text
  700: '#404040',  // Emphasis text
  800: '#262626',  // Headings
  900: '#171717',  // Primary text
  950: '#0a0a0a',  // Maximum contrast
}
```

#### Glassmorphism Colors (Alpha Transparency)
```typescript
glass: {
  white: {
    subtle: 'rgba(255, 255, 255, 0.05)',
    light:  'rgba(255, 255, 255, 0.10)',
    medium: 'rgba(255, 255, 255, 0.15)',
    strong: 'rgba(255, 255, 255, 0.25)',
  },
  dark: {
    subtle: 'rgba(0, 0, 0, 0.05)',
    light:  'rgba(0, 0, 0, 0.10)',
    medium: 'rgba(0, 0, 0, 0.15)',
    strong: 'rgba(0, 0, 0, 0.25)',
  },
  border: 'rgba(255, 255, 255, 0.18)',
}
```

### Accessibility Standards

**WCAG 2.1 Level AA Compliance:**
- Text contrast: 4.5:1 minimum (7:1 for AAA)
- UI component contrast: 3:1 minimum
- Large text (18pt+): 3:1 minimum

**Color-blind Safe Palette:**
- Never use color alone to convey information
- Pair color with icons, labels, or patterns
- Test with ColorBrewer and Coblis simulators

**Dark Mode Strategy:**
```typescript
// Automatic dark mode support
@media (prefers-color-scheme: dark) {
  :root {
    --background: 17 17 17;      // neutral-900
    --foreground: 250 250 250;   // neutral-50
    --card: 38 38 38;            // neutral-800
    --card-foreground: 245 245 245;
    --primary: 26 143 255;       // primary-500
    --border: 64 64 64;          // neutral-700
  }
}
```

---

## Spacing & Layout System

### Spacing Scale (8px base grid)
```typescript
spacing: {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px  - Base unit
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px
}
```

### Grid System
```typescript
// 12-column grid with responsive breakpoints
screens: {
  'xs': '475px',   // Mobile landscape
  'sm': '640px',   // Tablet portrait
  'md': '768px',   // Tablet landscape
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
}

// Container max-widths
container: {
  padding: '2rem',
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}
```

### Component Spacing Standards

**Card Padding:**
- Compact: `p-4` (16px) - Dense data displays
- Standard: `p-6` (24px) - Default cards
- Spacious: `p-8` (32px) - Featured content

**Section Spacing:**
- Between sections: `mb-8` or `mb-12` (32-48px)
- Between components: `mb-4` or `mb-6` (16-24px)
- Between form fields: `mb-4` (16px)

---

## Glassmorphism System

### Core Technique

**Frosted Glass Effect:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.12),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
}
```

### Elevation Levels

**Level 0 - Base Surface:**
```css
.glass-level-0 {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
```

**Level 1 - Cards:**
```css
.glass-level-1 {
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.12);
}
```

**Level 2 - Modals, Popovers:**
```css
.glass-level-2 {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(30px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 12px 48px 0 rgba(0, 0, 0, 0.18),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.20);
}
```

**Level 3 - Tooltips, Floating Elements:**
```css
.glass-level-3 {
  background: rgba(255, 255, 255, 0.20);
  backdrop-filter: blur(40px) saturate(220%);
  border: 1px solid rgba(255, 255, 255, 0.30);
  box-shadow: 0 16px 64px 0 rgba(0, 0, 0, 0.24);
}
```

### Interactive States

**Hover State:**
```css
.glass-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.16);
  transition: all 200ms ease-out;
}
```

**Active State:**
```css
.glass-card:active {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(0);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  transition: all 100ms ease-in;
}
```

### Performance Optimization
```css
.glass-card {
  /* GPU acceleration */
  will-change: transform;
  transform: translateZ(0);

  /* Containment for performance */
  contain: layout style paint;
}
```

### Fallback for Unsupported Browsers
```css
@supports not (backdrop-filter: blur(20px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.10);
  }
}
```

### Tailwind Custom Utilities
```typescript
// tailwind.config.ts
theme: {
  extend: {
    backdropBlur: {
      'xs': '2px',
      'sm': '4px',
      'md': '12px',
      'lg': '20px',
      'xl': '30px',
      '2xl': '40px',
    },
    backdropSaturate: {
      '180': '180%',
      '200': '200%',
      '220': '220%',
    },
  },
}

// Custom plugin for glass utilities
plugins: [
  function({ addUtilities }) {
    const glassUtilities = {
      '.glass-subtle': {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
      },
      '.glass-light': {
        background: 'rgba(255, 255, 255, 0.10)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      },
      // ... more utilities
    }
    addUtilities(glassUtilities)
  }
]
```

---

## Motion & Animation System

### Animation Principles

1. **Purposeful**: Every animation serves a clear functional purpose
2. **Performant**: 60fps minimum, GPU-accelerated
3. **Contextual**: Animation intensity scales with data density
4. **Respectful**: Honor `prefers-reduced-motion` preferences
5. **Natural**: Physics-based easing for organic feel

### Timing Functions

```typescript
// Custom easing curves
const easings = {
  // Entrances
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',       // Deceleration
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Overshoot

  // Exits
  easeIn: 'cubic-bezier(0.64, 0, 0.78, 0)',        // Acceleration
  easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)', // Undershoot

  // Transitions
  easeInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',     // Smooth both ends

  // Spring physics (Framer Motion)
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
}
```

### Duration Scale

```typescript
duration: {
  instant: '100ms',    // Micro-interactions
  fast: '200ms',       // Small elements
  normal: '300ms',     // Standard transitions
  slow: '500ms',       // Large elements
  slower: '700ms',     // Complex state changes
  slowest: '1000ms',   // Page transitions
}
```

### Microinteractions

**Button Press:**
```typescript
<motion.button
  whileHover={{ scale: 1.02, brightness: 1.1 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>
```

**Card Hover:**
```typescript
<motion.div
  whileHover={{ y: -4, boxShadow: '0 12px 48px 0 rgba(0,0,0,0.16)' }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
```

**Input Focus:**
```typescript
<motion.input
  whileFocus={{
    borderColor: 'var(--primary-500)',
    boxShadow: '0 0 0 3px rgba(26, 143, 255, 0.1)'
  }}
  transition={{ duration: 0.15 }}
/>
```

**Loading Skeleton:**
```typescript
<motion.div
  animate={{ opacity: [0.4, 1, 0.4] }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut'
  }}
  className="bg-neutral-200 rounded"
/>
```

### Page Transitions

**Fade & Slide:**
```typescript
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  enter: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: 'easeIn' }
  },
}
```

**Shared Element Transitions:**
```typescript
// Next.js 14 App Router with Framer Motion
<motion.div layoutId="card-123">
  {/* Smoothly morphs between list and detail views */}
</motion.div>
```

### Data Visualization Animations

**Chart Entry Animation (Staggered):**
```typescript
const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,  // 50ms stagger
      duration: 0.4,
      ease: 'easeOut'
    }
  })
}

// Apply to each bar/line
{dataPoints.map((point, i) => (
  <motion.div
    key={point.id}
    custom={i}
    variants={chartVariants}
    initial="hidden"
    animate="visible"
  />
))}
```

**Number Counter Animation:**
```typescript
import { useSpring, animated } from '@react-spring/web'

const animatedValue = useSpring({
  from: { value: 0 },
  to: { value: targetValue },
  config: { tension: 50, friction: 20 }
})

<animated.span>
  {animatedValue.value.to(val => formatCurrency(val))}
</animated.span>
```

**Real-time Data Updates:**
```typescript
// Highlight changed values
<motion.span
  animate={{
    backgroundColor: ['transparent', '#10b98120', 'transparent']
  }}
  transition={{ duration: 1 }}
>
  {value}
</motion.span>
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// React Hook
import { useReducedMotion } from 'framer-motion'

const shouldReduceMotion = useReducedMotion()
const transition = shouldReduceMotion
  ? { duration: 0.01 }
  : { duration: 0.3, ease: 'easeOut' }
```

---

## Component Library Architecture

### Component Categories

1. **Primitives** (Radix UI foundation)
   - Buttons, Inputs, Checkboxes, Radio
   - Dropdowns, Selects, Switches
   - Tooltips, Popovers, Dialogs

2. **Composite Components**
   - Forms, Tables, Cards
   - Navigation, Sidebars, Headers
   - Charts, Graphs, KPI Cards

3. **Layout Components**
   - Grid, Flex, Stack
   - Container, Section, Divider
   - Responsive wrappers

4. **Domain Components**
   - Invoice Editor, Transaction List
   - Project Dashboard, Resource Planner
   - Financial Reports, Audit Logs

### Component Naming Convention

```typescript
// Pattern: [Domain?][Component][Variant?]
<Button />              // Base button
<Button variant="primary" />
<Button variant="ghost" />

<FinanceKPICard />      // Domain-specific
<InvoiceDataTable />    // Domain + component type

<DashboardLayout>       // Layout component
  <DashboardHeader />
  <DashboardContent />
  <DashboardSidebar />
</DashboardLayout>
```

### Composition Pattern

```typescript
// Flexible composition with compound components
<Card>
  <CardHeader>
    <CardTitle>Revenue Overview</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
  </CardHeader>
  <CardContent>
    <RevenueChart data={data} />
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

---

## Accessibility Implementation

### Keyboard Navigation

**Global Shortcuts:**
```typescript
const shortcuts = {
  'Cmd/Ctrl+K': 'Open command palette',
  'Cmd/Ctrl+B': 'Toggle sidebar',
  'Cmd/Ctrl+/': 'Show keyboard shortcuts',
  'Esc': 'Close modals/dialogs',
  '/': 'Focus search',
  '?': 'Show help',
}
```

**Component Navigation:**
- Tab: Move focus forward
- Shift+Tab: Move focus backward
- Arrow keys: Navigate within components (lists, menus)
- Enter/Space: Activate focused element
- Escape: Close/cancel

**Focus Management:**
```typescript
// Automatic focus trapping in modals
import { FocusTrap } from '@radix-ui/react-focus-scope'

<Dialog>
  <FocusTrap>
    <DialogContent>
      {/* Focus stays within modal */}
    </DialogContent>
  </FocusTrap>
</Dialog>
```

### ARIA Implementation

**Landmark Roles:**
```jsx
<header role="banner">
<nav role="navigation" aria-label="Main">
<main role="main">
<aside role="complementary" aria-label="Sidebar">
<footer role="contentinfo">
```

**Live Regions for Dynamic Content:**
```jsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>

<div
  role="alert"
  aria-live="assertive"
>
  {errorMessage}
</div>
```

**Form Accessibility:**
```jsx
<label htmlFor="email" className="text-sm font-medium">
  Email Address
  <span aria-label="required" className="text-error-500">*</span>
</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
{hasError && (
  <p id="email-error" role="alert" className="text-error-500">
    {errorMessage}
  </p>
)}
```

**Table Accessibility:**
```jsx
<table role="table" aria-label="Transactions">
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Amount</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{date}</td>
      <td>{amount}</td>
      <td>{status}</td>
    </tr>
  </tbody>
</table>
```

### Screen Reader Optimization

**Skip Links:**
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

**Visually Hidden Text:**
```css
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

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Enterprise UX Patterns

### Command Palette (Cmd+K)

```typescript
import { Command } from 'cmdk'

<Command.Dialog>
  <Command.Input placeholder="Search or jump to..." />
  <Command.List>
    <Command.Group heading="Navigation">
      <Command.Item onSelect={() => router.push('/dashboard')}>
        <DashboardIcon />
        Dashboard
        <Command.Shortcut>⌘D</Command.Shortcut>
      </Command.Item>
    </Command.Group>
    <Command.Group heading="Actions">
      <Command.Item onSelect={createInvoice}>
        <PlusIcon />
        Create Invoice
        <Command.Shortcut>⌘N</Command.Shortcut>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

### Bulk Operations

```typescript
// Multi-select with keyboard support
<DataTable
  data={invoices}
  onSelectionChange={setSelected}
  bulkActions={[
    { label: 'Approve', action: bulkApprove },
    { label: 'Export', action: bulkExport },
    { label: 'Delete', action: bulkDelete, variant: 'destructive' },
  ]}
/>

// Keyboard: Cmd+A (select all), Shift+Click (range select)
```

### Progressive Disclosure

```typescript
// Collapsible sections for advanced options
<Collapsible>
  <CollapsibleTrigger>
    Advanced Filters
    <ChevronDownIcon />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Complex filter UI */}
  </CollapsibleContent>
</Collapsible>
```

### Contextual Actions

```typescript
// Right-click context menu
<ContextMenu>
  <ContextMenuTrigger>
    <InvoiceRow data={invoice} />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
    <ContextMenuItem>Duplicate</ContextMenuItem>
    <ContextMenuItem>Export PDF</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-error-500">
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Wizard Flows

```typescript
// Multi-step process with progress
<Wizard
  steps={['Details', 'Items', 'Payment', 'Review']}
  currentStep={currentStep}
>
  <WizardStep>
    <InvoiceDetailsForm />
  </WizardStep>
  <WizardStep>
    <InvoiceItemsForm />
  </WizardStep>
  {/* ... */}
</Wizard>
```

### Inline Editing

```typescript
// Click to edit table cells
<TableCell
  value={amount}
  editable
  onSave={(newValue) => updateAmount(invoice.id, newValue)}
  validate={(value) => value > 0}
/>
```

---

## Responsive Design Strategy

### Breakpoint Philosophy

1. **Mobile First**: Design for smallest screen, enhance upward
2. **Content Breakpoints**: Break where content needs it, not arbitrary sizes
3. **Adaptive Layouts**: Different layouts for different contexts

### Responsive Patterns

**Dashboard Grid:**
```jsx
<div className="
  grid
  grid-cols-1           /* Mobile: Stack */
  md:grid-cols-2        /* Tablet: 2 columns */
  xl:grid-cols-4        /* Desktop: 4 columns */
  gap-6
">
  <KPICard />
  <KPICard />
  <KPICard />
  <KPICard />
</div>
```

**Data Table Responsiveness:**
```jsx
// Desktop: Full table
// Tablet: Horizontal scroll with sticky columns
// Mobile: Card layout

<div className="
  overflow-x-auto        /* Enable horizontal scroll */
  -mx-4 md:mx-0         /* Full width on mobile */
">
  <table className="w-full min-w-[800px]">
    <thead className="sticky top-0">  {/* Sticky header */}
    {/* ... */}
  </table>
</div>

// Mobile alternative: Card view
<div className="md:hidden space-y-4">
  {items.map(item => (
    <Card key={item.id}>
      {/* Vertical layout */}
    </Card>
  ))}
</div>
```

**Navigation:**
```jsx
// Desktop: Full sidebar
// Tablet: Collapsed sidebar with icons
// Mobile: Bottom tab bar

<nav className="
  hidden md:flex         /* Desktop sidebar */
  md:w-64
  md:flex-col
">

<nav className="
  md:hidden              /* Mobile tab bar */
  fixed bottom-0 left-0 right-0
  flex justify-around
">
```

---

## Performance Standards

### Core Web Vitals Targets

```typescript
const performanceTargets = {
  LCP: {
    good: '< 1.2s',
    needsImprovement: '1.2s - 2.4s',
    poor: '> 2.4s'
  },
  FID: {
    good: '< 50ms',
    needsImprovement: '50ms - 300ms',
    poor: '> 300ms'
  },
  CLS: {
    good: '< 0.05',
    needsImprovement: '0.05 - 0.25',
    poor: '> 0.25'
  },
  // Custom metrics
  TTI: {
    target: '< 2.0s'
  },
  TBT: {
    target: '< 200ms'
  }
}
```

### Optimization Techniques

**Code Splitting:**
```typescript
// Next.js dynamic imports
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false  // Client-only if needed
})

// Route-based code splitting (automatic with App Router)
```

**Image Optimization:**
```jsx
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority  // LCP optimization
  placeholder="blur"
  blurDataURL="data:image/..." // Generate with sharp
/>
```

**Virtual Scrolling for Large Lists:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: 10000,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 5,
})
```

**React Server Components:**
```typescript
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await fetchDashboardData() // Server-side fetch
  return <DashboardClient data={data} />
}
```

**Lazy Loading & Suspense:**
```typescript
<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>
```

---

## Implementation Checklist

### Phase 1: Foundation Setup
- [ ] Initialize Next.js 14.2+ with App Router
- [ ] Configure Tailwind CSS with custom theme
- [ ] Set up Radix UI primitives
- [ ] Configure Framer Motion
- [ ] Implement base glassmorphism utilities
- [ ] Set up typography system (Inter + Noto Sans Bengali)
- [ ] Configure dark mode support
- [ ] Implement accessibility foundations (focus management, ARIA)

### Phase 2: Core Component Library
- [ ] Button variants (primary, secondary, ghost, glass)
- [ ] Input components with validation states
- [ ] Card components with glassmorphism
- [ ] Navigation components (sidebar, header, tabs)
- [ ] Form components (inputs, selects, checkboxes)
- [ ] Modal/Dialog system
- [ ] Tooltip & Popover system
- [ ] Data table with sorting, filtering, pagination

### Phase 3: Dashboard Components
- [ ] KPI card with real-time updates
- [ ] Chart components (line, bar, pie, area)
- [ ] Data visualization with animations
- [ ] Dashboard grid layout
- [ ] Quick actions panel
- [ ] Notification system
- [ ] Command palette (Cmd+K)

### Phase 4: Integration Layer
- [ ] Apollo Client setup for Federation
- [ ] Authentication context
- [ ] Error boundary implementation
- [ ] Loading states & skeletons
- [ ] Offline support (PWA)
- [ ] WebSocket integration for real-time
- [ ] API caching strategy

### Phase 5: Testing & Optimization
- [ ] Unit tests (Vitest + React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Accessibility testing (jest-axe, axe-core)
- [ ] Performance testing (Lighthouse CI)
- [ ] Cross-browser testing
- [ ] Responsive testing (BrowserStack)
- [ ] Load testing (K6)

---

## Bangladesh-Specific Considerations

### Bengali Language Support

**Font Loading Strategy:**
```typescript
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'bn'],
    defaultLocale: 'en',
  },
}

// Font preloading
<link
  rel="preload"
  href="/fonts/NotoSansBengali-Regular.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

**Number Formatting:**
```typescript
// Bengali numerals: ০১২৩৪৫৬৭৮৯
const formatNumber = (num: number, locale: 'en' | 'bn') => {
  if (locale === 'bn') {
    return num.toString().replace(/\d/g, d =>
      '০১২৩৪৫৬৭৮৯'[parseInt(d)]
    )
  }
  return num.toLocaleString('en-US')
}
```

**Date Formatting:**
```typescript
// Bengali months and calendar considerations
const formatDate = (date: Date, locale: 'en' | 'bn') => {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
```

### Cultural Design Considerations

- **Color Preferences**: Red and green are culturally significant
- **Icons**: Use universally understood symbols, not culture-specific
- **Forms**: Support for Bengali address formats
- **Currency**: BDT (৳) symbol and formatting
- **Mobile-First**: High mobile usage in Bangladesh

---

## Code Examples

### Glass Button Component

```typescript
// components/ui/button.tsx
import * as React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
        ghost: 'hover:bg-neutral-100 active:bg-neutral-200',
        glass: 'backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 active:bg-white/5 shadow-lg',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### Glass Card Component

```typescript
// components/ui/card.tsx
import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glass?: boolean
    hover?: boolean
  }
>(({ className, glass = false, hover = true, children, ...props }, ref) => {
  const cardClasses = cn(
    'rounded-xl border',
    glass
      ? 'backdrop-blur-xl bg-white/10 border-white/20 shadow-lg'
      : 'bg-white border-neutral-200 shadow-sm',
    className
  )

  const hoverAnimation = hover ? {
    whileHover: {
      y: -4,
      boxShadow: glass
        ? '0 12px 48px 0 rgba(0, 0, 0, 0.16)'
        : '0 12px 24px 0 rgba(0, 0, 0, 0.08)'
    },
    transition: { duration: 0.2, ease: 'easeOut' }
  } : {}

  return (
    <motion.div
      ref={ref}
      className={cardClasses}
      {...hoverAnimation}
      {...props}
    >
      {children}
    </motion.div>
  )
})
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-500', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### KPI Card with Real-time Updates

```typescript
// components/dashboard/kpi-card.tsx
'use client'

import * as React from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percentage'
  currency?: string
  realtime?: boolean
  endpoint?: string
  loading?: boolean
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  currency = 'BDT',
  realtime = false,
  endpoint,
  loading = false,
}) => {
  const [currentValue, setCurrentValue] = React.useState(value)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Animated value
  const spring = useSpring(currentValue, {
    stiffness: 50,
    damping: 20
  })
  const display = useTransform(spring, (latest) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
        }).format(latest)
      case 'percentage':
        return `${latest.toFixed(1)}%`
      default:
        return Math.floor(latest).toLocaleString()
    }
  })

  // Real-time WebSocket connection
  React.useEffect(() => {
    if (realtime && endpoint) {
      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}/${endpoint}`
      )

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setIsUpdating(true)
        setCurrentValue(data.value)
        setTimeout(() => setIsUpdating(false), 1000)
      }

      return () => ws.close()
    }
  }, [realtime, endpoint])

  // Update spring when value changes
  React.useEffect(() => {
    spring.set(currentValue)
  }, [currentValue, spring])

  // Calculate change percentage
  const changePercent = previousValue
    ? ((currentValue - previousValue) / previousValue) * 100
    : null

  const isPositive = changePercent ? changePercent > 0 : null

  if (loading) {
    return (
      <Card glass>
        <CardHeader>
          <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      glass
      className={isUpdating ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600">
          {title}
        </CardTitle>
        {realtime && (
          <div className="flex items-center gap-1">
            <motion.div
              className="h-2 w-2 rounded-full bg-success-500"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs text-neutral-500">Live</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <motion.div
          className="text-3xl font-bold"
          animate={isUpdating ? {
            backgroundColor: ['transparent', 'rgba(16, 185, 129, 0.1)', 'transparent']
          } : {}}
          transition={{ duration: 1 }}
        >
          <motion.span>{display}</motion.span>
        </motion.div>
        {changePercent !== null && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUpIcon className="h-4 w-4 text-success-500" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-error-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-success-500' : 'text-error-500'
              }`}
            >
              {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-neutral-500 ml-1">
              vs previous period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#e8f4ff',
          100: '#d0e8ff',
          200: '#a6d5ff',
          300: '#75bfff',
          400: '#47a6ff',
          500: '#1a8fff',
          600: '#0076f5',
          700: '#005ed1',
          800: '#004aa8',
          900: '#003580',
          950: '#002054',
        },
        // Semantic colors
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          700: '#047857',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Neutral palette
        neutral: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bengali: ['Noto Sans Bengali', 'Hind Siliguri', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '20px',
        xl: '30px',
        '2xl': '40px',
      },
      backdropSaturate: {
        180: '180%',
        200: '200%',
        220: '220%',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Custom glass utilities
    function({ addUtilities }: any) {
      const glassUtilities = {
        '.glass-subtle': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
        },
        '.glass-light': {
          background: 'rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        },
        '.glass-medium': {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.18)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.20)',
          backdropFilter: 'blur(40px) saturate(220%)',
          WebkitBackdropFilter: 'blur(40px) saturate(220%)',
          border: '1px solid rgba(255, 255, 255, 0.30)',
          boxShadow: '0 16px 64px 0 rgba(0, 0, 0, 0.24)',
        },
        // Dark mode variants
        '.dark .glass-subtle': {
          background: 'rgba(0, 0, 0, 0.10)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
        },
        '.dark .glass-light': {
          background: 'rgba(0, 0, 0, 0.20)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
        '.dark .glass-medium': {
          background: 'rgba(0, 0, 0, 0.30)',
          border: '1px solid rgba(255, 255, 255, 0.20)',
        },
        '.dark .glass-strong': {
          background: 'rgba(0, 0, 0, 0.40)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
        },
      }
      addUtilities(glassUtilities)
    },
  ],
}

export default config
```

---

## Next Steps

1. **Review & Approval**: Stakeholder review of design system specification
2. **Design Tokens Export**: Generate design tokens for consistent implementation
3. **Component Storybook**: Build interactive component documentation
4. **Design QA Process**: Establish design review checklist
5. **Phase-wise Implementation**: Begin Phase 1 - Architecture Setup

---

## Version History

- **v1.0.0** (2025-09-30): Initial Vextrus Vision Design System specification
  - Complete typography system with Bengali support
  - Comprehensive color palette with semantic meanings
  - Advanced glassmorphism implementation
  - Motion and animation system
  - Enterprise UX patterns
  - Accessibility-first approach
  - Bangladesh-specific considerations

---

## References & Inspiration

- **SAP Fiori Design Guidelines**: Role-based adaptive design principles
- **Salesforce Lightning Design System**: Component-driven architecture
- **Oracle Redwood**: Enterprise-grade visual refinement
- **Material Design 3**: Dynamic color and motion systems
- **Microsoft Fluent 2**: Depth, lighting, and acrylic materials
- **IBM Carbon**: Data-dense interface optimization
- **Ant Design**: Enterprise application patterns
- **WCAG 2.1**: Web accessibility standards
- **Bangladesh Government Portals**: Local design patterns and cultural considerations

---

**Vextrus Vision: Where World-Class Quality Meets Bangladesh Excellence**