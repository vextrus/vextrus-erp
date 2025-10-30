# Story Tests Guide

This guide explains how to write story tests using the `composeStories` pattern from Storybook for React Testing Library.

## Why Story Tests?

Story tests validate that your Storybook stories render correctly and have the expected props. This provides:

1. **Double Coverage**: Tests both the component and its stories
2. **Living Documentation**: Stories serve as test fixtures
3. **Consistency**: Ensures stories stay in sync with components
4. **Efficiency**: Reuses story configuration for testing

## Pattern Overview

The composeStories pattern allows you to import Storybook stories as React components and test them directly:

```typescript
import { composeStories } from '@storybook/react'
import * as stories from './my-component.stories'

const { StoryName1, StoryName2 } = composeStories(stories)

// Now test StoryName1 and StoryName2 as regular React components
```

## Established Pattern

Based on completed examples (button, badge, input), here's the standard pattern:

### 1. Import and Compose Stories

```typescript
import { describe, it, expect } from 'vitest'
import { composeStories } from '@storybook/react'
import { render, screen } from '@/test/utils'
import * as stories from './component-name.stories'

// Extract stories (skip complex render functions if needed)
const { Story1, Story2, Story3 } = composeStories(stories)
```

### 2. Test Structure

Organize tests into logical groups:

```typescript
describe('ComponentName Stories Tests', () => {
  describe('Story Rendering', () => {
    // Test that stories render without errors
    it('renders Story1', () => {
      render(<Story1 />)
      expect(screen.getByRole('...')).toBeInTheDocument()
    })
  })

  describe('Story Variants', () => {
    // Test different variants/states
  })

  describe('Story Props', () => {
    // Test that stories have correct args
    it('Story1 has correct props', () => {
      expect(Story1.args).toBeDefined()
      expect(Story1.args?.propName).toBe('expectedValue')
    })
  })
})
```

### 3. Common Test Patterns

#### Rendering Tests
```typescript
it('renders VariantStory', () => {
  render(<VariantStory />)
  const element = screen.getByRole('button')
  expect(element).toBeInTheDocument()
  expect(element).toHaveClass('expected-class')
})
```

#### State Tests
```typescript
it('renders DisabledStory in disabled state', () => {
  render(<DisabledStory />)
  const element = screen.getByRole('button')
  expect(element).toBeDisabled()
})
```

#### Props Tests
```typescript
it('PrimaryStory has primary variant', () => {
  expect(PrimaryStory.args).toBeDefined()
  expect(PrimaryStory.args?.variant).toBe('primary')
})
```

#### Icon/Child Element Tests
```typescript
it('renders WithIcon story with icon', () => {
  render(<WithIcon />)
  const element = screen.getByText('Button Text')
  const icon = element.parentElement?.querySelector('svg')
  expect(icon).toBeInTheDocument()
})
```

## Completed Examples

### ✅ button.stories.test.tsx (15 tests)
Tests: Primary, Secondary, Ghost, Destructive, Small, Medium, Large, Loading, WithLeftIcon, WithRightIcon, and props validation.

### ✅ badge.stories.test.tsx (19 tests)
Tests: Default, Primary, Success, Warning, Error, InfoVariant, Outline, Small, Large, WithDot, WithIcon, Dismissible, and props validation.

### ✅ input.stories.test.tsx (24 tests)
Tests: Default, WithValue, Email, Password, SearchType, Number, WithLeftIcon, WithRightIcon, WithBothIcons, ErrorState, ErrorWithIcon, Disabled, DisabledWithValue, ReadOnly, Required, WithMaxLength, and props validation.

## Remaining Components (29)

Need story tests for:

1. label.stories.tsx
2. textarea.stories.tsx
3. checkbox.stories.tsx
4. switch.stories.tsx
5. radio-group.stories.tsx
6. select.stories.tsx
7. tabs.stories.tsx
8. breadcrumbs.stories.tsx
9. avatar.stories.tsx
10. user-menu.stories.tsx
11. sidebar.stories.tsx
12. header.stories.tsx
13. spinner.stories.tsx
14. skeleton.stories.tsx
15. progress.stories.tsx
16. alert.stories.tsx
17. dialog.stories.tsx
18. alert-dialog.stories.tsx
19. pagination.stories.tsx
20. card.stories.tsx
21. data-table.stories.tsx
22. table-toolbar.stories.tsx
23. separator.stories.tsx
24. accordion.stories.tsx
25. scroll-area.stories.tsx
26. tooltip.stories.tsx
27. popover.stories.tsx
28. command.stories.tsx
29. empty-state.stories.tsx

## Template for New Story Tests

```typescript
import { describe, it, expect } from 'vitest'
import { composeStories } from '@storybook/react'
import { render, screen } from '@/test/utils'
import * as stories from './COMPONENT_NAME.stories'

// Compose stories - list exported story names from .stories.tsx file
// Skip stories with complex render functions
const { Story1, Story2, Story3 } = composeStories(stories)

describe('COMPONENT_NAME Stories Tests', () => {
  describe('Story Rendering', () => {
    it('renders Story1', () => {
      render(<Story1 />)
      // Add appropriate assertions
      expect(screen.getByRole('...')).toBeInTheDocument()
    })

    // Add more rendering tests
  })

  describe('Story Props', () => {
    it('Story1 has correct args', () => {
      expect(Story1.args).toBeDefined()
      // Add specific prop assertions
    })
  })
})
```

## Tips for Writing Story Tests

1. **Check story file first**: Read the `.stories.tsx` file to see what stories are exported
2. **Skip complex renders**: Stories with `render` functions may be harder to test with composeStories
3. **Use actual placeholders**: Don't use regex when the actual placeholder text is known
4. **Test what matters**: Focus on critical props, states, and rendering
5. **Keep tests simple**: Story tests validate stories render correctly, not full component behavior
6. **Run frequently**: `pnpm test:run component-name.stories.test.tsx`

## Running Story Tests

```bash
# Run all story tests
pnpm test:run "*.stories.test.tsx"

# Run specific story test
pnpm test:run button.stories.test.tsx

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

## Next Steps

1. Create story tests for remaining 29 components following the established pattern
2. Run all story tests together to verify coverage
3. Integrate story tests into CI/CD pipeline
4. Update coverage thresholds as more tests are added

## Resources

- [Storybook Test Addon Docs](https://storybook.js.org/docs/writing-tests)
- [composeStories API](https://storybook.js.org/docs/api/portable-stories-vitest)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
