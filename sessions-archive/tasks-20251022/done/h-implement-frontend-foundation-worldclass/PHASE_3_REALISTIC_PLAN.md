# Phase 3: Testing & Tooling Infrastructure - REALISTIC PLAN

**Task**: h-implement-frontend-foundation-worldclass
**Duration**: 2-3 weeks
**Status**: Ready for Implementation
**Dependencies**: Phase 1 & 2 Complete

## Executive Summary

Phase 3 establishes the testing and tooling foundation for all 31 UI components. This phase focuses on infrastructure, not business features. After completion, we'll have a world-class component development environment with Storybook, comprehensive testing, and automated quality checks.

**What Changed from Original Plan:**
- ❌ Removed: Dashboard widgets, KPI cards, real-time integration
- ✅ Added: Storybook setup, component stories, Vitest infrastructure
- ✅ Focus: Testing foundation, not business features

## Success Criteria

- [ ] Storybook 8+ running with all 31 components
- [ ] All 31 components have comprehensive stories
- [ ] Vitest configured with React Testing Library
- [ ] >80% test coverage for UI components
- [ ] Playwright setup complete (not full E2E tests yet)
- [ ] CI/CD pipeline runs tests automatically
- [ ] Component documentation auto-generated
- [ ] Performance baselines established

## Technical Implementation

### Week 1: Storybook Setup & Configuration

#### Day 1-2: Storybook Installation & Configuration

**Install Dependencies:**
```bash
cd apps/web

# Install Storybook and addons
pnpm add -D @storybook/react-vite @storybook/addon-essentials \
  @storybook/addon-a11y @storybook/addon-interactions \
  @storybook/addon-coverage @storybook/addon-vitest \
  @storybook/testing-library storybook

# Initialize Storybook
pnpm dlx storybook@latest init --type react-vite
```

**Configure Storybook:**
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'
import { join, dirname } from 'path'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-coverage'),
    getAbsolutePath('@storybook/addon-vitest'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    // Customize Vite config for Storybook
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': join(__dirname, '../src'),
        },
      },
    }
  },
}

export default config

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
```

**Configure Storybook Preview:**
```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react'
import { themes } from '@storybook/theming'
import '../src/app/globals.css' // Import Tailwind styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a', // Navy background
        },
        {
          name: 'light',
          value: '#f8fafc',
        },
      ],
    },
    docs: {
      theme: themes.dark,
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
}

export default preview
```

**Add Scripts to package.json:**
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "test-storybook"
  }
}
```

#### Day 3-5: Create Stories for Form Components (8 components)

**Example: Button Component Story**
```typescript
// src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button } from './button'
import { Plus, Search, Download } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'gradient', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default Button',
  },
}

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Effect',
  },
}

export const Gradient: Story = {
  args: {
    variant: 'gradient',
    children: 'Gradient Button',
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Create New',
    leftIcon: <Plus className="h-4 w-4" />,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

// All sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}
```

**Components to Cover (Week 1):**
1. ✅ Button
2. ✅ Input
3. ✅ Label
4. ✅ Textarea
5. ✅ Checkbox
6. ✅ Switch
7. ✅ Radio Group
8. ✅ Select

### Week 2: Complete Stories & Setup Vitest

#### Day 6-8: Create Stories for Remaining Components

**Navigation Components (5):**
- Tabs
- Breadcrumbs
- Avatar
- UserMenu
- Sidebar

**Feedback Components (6):**
- Spinner
- Skeleton
- Progress
- Alert
- Dialog
- AlertDialog

**Data Display Components (6):**
- Badge
- EmptyState
- Pagination
- Card
- DataTable
- TableToolbar

**Layout Components (3):**
- Separator
- Accordion
- ScrollArea

**Overlay Components (3):**
- Tooltip
- Popover
- Command

#### Day 9-10: Vitest Setup & Configuration

**Install Vitest:**
```bash
pnpm add -D vitest @vitest/ui @vitest/browser \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom playwright
```

**Configure Vitest:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.stories.tsx',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Setup File:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

**Add Test Scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

### Week 3: Testing & Integration

#### Day 11-12: Write Component Tests Using composeStories

**Example: Button Tests**
```typescript
// src/components/ui/button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { composeStories } from '@storybook/react'
import * as stories from './button.stories'

const { Default, Glass, WithIcon, Loading, Disabled } = composeStories(stories)

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders default button with text', async () => {
      await Default.run()
      expect(screen.getByRole('button')).toHaveTextContent('Default Button')
    })

    it('renders glass variant', async () => {
      await Glass.run()
      const button = screen.getByRole('button')
      expect(button).toHaveClass('glass-effect')
    })

    it('renders with icon', async () => {
      await WithIcon.run()
      const button = screen.getByRole('button')
      expect(button).toContainHTML('svg')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup()
      await Default.run()

      const button = screen.getByRole('button')
      await user.click(button)

      expect(Default.args.onClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      await Disabled.run()

      const button = screen.getByRole('button')
      await user.click(button)

      expect(Disabled.args.onClick).not.toHaveBeenCalled()
    })
  })

  describe('States', () => {
    it('shows loading spinner when loading', async () => {
      await Loading.run()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('is disabled when loading', async () => {
      await Loading.run()
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const user = userEvent.setup()
      await Default.run()

      const button = screen.getByRole('button')
      button.focus()

      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(Default.args.onClick).toHaveBeenCalled()
    })
  })
})
```

#### Day 13: Playwright Setup (Configuration Only)

**Install Playwright:**
```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

**Configure Playwright:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Create Example E2E Test:**
```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Vextrus ERP/)
})

test('example page navigation', async ({ page }) => {
  await page.goto('/examples/forms')
  await expect(page.locator('h1')).toContainText('Form Components')
})
```

#### Day 14: CI/CD Pipeline Setup

**Create GitHub Actions Workflow:**
```yaml
# .github/workflows/test.yml
name: Test Frontend Components

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm --filter @vextrus/web test:run

      - name: Generate coverage
        run: pnpm --filter @vextrus/web test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/web/coverage/coverage-final.json

  storybook:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build Storybook
        run: pnpm --filter @vextrus/web build-storybook

      - name: Test Storybook
        run: pnpm --filter @vextrus/web test-storybook
```

#### Day 15: Documentation & Polish

**Create Component Documentation:**
```markdown
# Component Development Guide

## Writing Stories

1. Create a `.stories.tsx` file next to your component
2. Use the Meta and StoryObj types from @storybook/react
3. Export a default meta object with component info
4. Export named story objects for each variant

## Writing Tests

1. Import composeStories from @storybook/react
2. Import your stories file
3. Use the composed stories in your tests
4. Test rendering, interactions, and accessibility

## Running Tests

- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:coverage` - Generate coverage report
- `pnpm test:ui` - Open Vitest UI

## Storybook

- `pnpm storybook` - Start Storybook dev server
- `pnpm build-storybook` - Build static Storybook
```

## Deliverables

### Code Artifacts
- [ ] `.storybook/` configuration directory
- [ ] 31 `*.stories.tsx` files (one per component)
- [ ] 31 `*.test.tsx` files (one per component)
- [ ] `vitest.config.ts` configuration
- [ ] `playwright.config.ts` configuration
- [ ] `.github/workflows/test.yml` CI pipeline
- [ ] `e2e/` directory with example tests
- [ ] `src/test/setup.ts` test configuration

### Documentation
- [ ] Component development guide
- [ ] Testing best practices
- [ ] Storybook usage guide
- [ ] CI/CD pipeline documentation

### Metrics
- [ ] Test coverage >80%
- [ ] All components have stories
- [ ] Storybook builds successfully
- [ ] All tests pass in CI
- [ ] Accessibility checks pass

## Testing Checklist

### Per Component
- [ ] Has Storybook story with all variants
- [ ] Has unit tests using composeStories
- [ ] Tests rendering with default args
- [ ] Tests user interactions
- [ ] Tests loading/disabled states
- [ ] Tests accessibility (keyboard, ARIA)
- [ ] Tests edge cases

### Integration
- [ ] Storybook runs without errors
- [ ] All stories render correctly
- [ ] Tests pass locally and in CI
- [ ] Coverage meets 80% threshold
- [ ] Playwright setup verified

## Dependencies to Install

```json
{
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "@storybook/addon-a11y": "^8.3.0",
    "@storybook/addon-coverage": "^8.3.0",
    "@storybook/addon-essentials": "^8.3.0",
    "@storybook/addon-interactions": "^8.3.0",
    "@storybook/addon-vitest": "^8.3.0",
    "@storybook/react-vite": "^8.3.0",
    "@storybook/testing-library": "^0.2.2",
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/browser": "^2.0.5",
    "@vitest/ui": "^2.0.5",
    "jsdom": "^24.1.1",
    "playwright": "^1.47.0",
    "storybook": "^8.3.0",
    "vitest": "^2.0.5"
  }
}
```

## Next Phase Dependencies

Phase 3 provides the foundation for:
- **Phase 4**: Development patterns using tested components
- **Phase 5**: Production optimization with performance baselines
- **Future**: Business feature implementation with confidence

## Success Indicators

✅ **Development Experience:**
- Developers can view all components in Storybook
- Component variants are documented visually
- Tests provide immediate feedback
- Accessibility issues caught early

✅ **Code Quality:**
- High test coverage prevents regressions
- Stories serve as living documentation
- CI/CD ensures quality standards
- Automated accessibility checks

✅ **Foundation Ready:**
- Testing infrastructure in place
- All components verified
- Patterns established
- Ready for Phase 4 patterns

---

**Phase Status**: 📋 Planning Complete, Ready for Implementation
**Estimated Effort**: 2-3 weeks
**Team Size**: 1-2 developers
**Risk Level**: Low (no backend dependencies)
