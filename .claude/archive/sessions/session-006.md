# Session 006: UI Foundation & Component Library

**Date**: 2025-08-29
**Phase**: 1 - Foundation
**Module**: UI Foundation (Day 9-10)

## 🎯 Session Objectives
- [x] Set up Tailwind CSS with custom configuration
- [x] Create design system tokens
- [x] Install and configure Radix UI / shadcn/ui
- [x] Build base component library
- [x] Implement responsive layout components
- [x] Add dark mode support
- [ ] Set up Bengali/English localization (partial)

## 📋 Tasks to Complete

### 1. Tailwind CSS Setup
- [x] Install Tailwind CSS and dependencies
- [x] Create custom configuration for Bangladesh market
- [x] Set up design tokens (colors, spacing, typography)
- [x] Configure responsive breakpoints
- [x] Add custom utilities

### 2. Component Library Setup
- [x] Install Radix UI primitives
- [x] Set up shadcn/ui CLI
- [x] Configure component aliases
- [x] Create component structure

### 3. Base Components
- [x] Button component with variants
- [x] Input fields (text, number, date)
- [ ] Select/Dropdown component
- [x] Card component
- [ ] Modal/Dialog component
- [ ] Toast/Notification component
- [ ] Table component
- [ ] Form components

### 4. Layout Components
- [ ] Header with navigation
- [ ] Sidebar for desktop
- [ ] Mobile navigation drawer
- [ ] Footer component
- [ ] Page container
- [ ] Grid/Flex layouts

### 5. Dark Mode Implementation
- [x] Install next-themes
- [ ] Create theme provider
- [ ] Add theme switcher component
- [ ] Configure color schemes
- [ ] Test all components in both modes

### 6. Localization Setup
- [ ] Install next-intl
- [ ] Create translation files (en, bn)
- [ ] Set up locale provider
- [ ] Add language switcher
- [ ] Configure RTL support preparation

### 7. Loading & Error States
- [ ] Skeleton loaders
- [ ] Spinner component
- [ ] Error boundary component
- [ ] Empty state component
- [ ] 404/500 error pages

## 🎨 Design System

### Color Palette
```css
/* Primary Colors - Construction Industry */
--primary: /* Orange/Yellow tones */
--secondary: /* Steel gray */
--accent: /* Safety green */

/* Semantic Colors */
--success: /* Green */
--warning: /* Amber */
--error: /* Red */
--info: /* Blue */

/* Neutral Colors */
--gray-50 to --gray-900

/* Dark Mode Variants */
/* All colors with dark mode equivalents */
```

### Typography Scale
```css
/* Headings */
--h1: 2.5rem
--h2: 2rem
--h3: 1.75rem
--h4: 1.5rem
--h5: 1.25rem
--h6: 1rem

/* Body Text */
--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
```

### Spacing System
```css
/* Based on 4px grid */
--space-1: 0.25rem  /* 4px */
--space-2: 0.5rem   /* 8px */
--space-3: 0.75rem  /* 12px */
--space-4: 1rem     /* 16px */
--space-6: 1.5rem   /* 24px */
--space-8: 2rem     /* 32px */
--space-12: 3rem    /* 48px */
--space-16: 4rem    /* 64px */
```

## 📱 Responsive Breakpoints
```css
/* Mobile First Approach */
sm: 640px   /* Tablet Portrait */
md: 768px   /* Tablet Landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1536px /* Extra Large */
```

## 🌏 Localization Structure
```
/locales
  /en
    common.json
    auth.json
    dashboard.json
    projects.json
  /bn
    common.json
    auth.json
    dashboard.json
    projects.json
```

## 🧪 Testing Requirements
- [ ] Component unit tests with React Testing Library
- [ ] Visual regression tests for key components
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

## 📝 Documentation Requirements
- [ ] Component usage examples
- [ ] Props documentation
- [ ] Storybook setup (optional)
- [ ] Design system documentation
- [ ] Accessibility guidelines

## 🚀 Implementation Order
1. Tailwind CSS setup and configuration
2. Design tokens creation
3. Radix UI / shadcn installation
4. Base components (Button, Input, Card)
5. Layout components (Header, Sidebar)
6. Dark mode implementation
7. Localization setup
8. Additional components
9. Testing and documentation

## 💡 Bangladesh Market Considerations
- **Colors**: Use vibrant colors common in local software
- **Typography**: Support for Bengali script
- **Icons**: Include local context icons (Taka symbol, etc.)
- **Date Format**: DD/MM/YYYY
- **Time Format**: 12-hour with AM/PM
- **Phone Input**: Bangladesh format validation
- **Currency**: BDT formatting

## 🔗 Dependencies to Install
```json
{
  "tailwindcss": "latest",
  "postcss": "latest",
  "autoprefixer": "latest",
  "@radix-ui/react-*": "latest",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "next-themes": "latest",
  "next-intl": "latest",
  "@tanstack/react-table": "latest",
  "react-hook-form": "latest",
  "lucide-react": "latest"
}
```

## 📚 References
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---
**Session Status**: 🚧 In Progress
**Prerequisites**: Session 005 (Authentication) Complete
**Estimated Duration**: 2 Days