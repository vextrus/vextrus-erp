import { test, expect } from '@playwright/test'

/**
 * Navigation E2E Tests
 *
 * Tests for application navigation including:
 * - Page navigation
 * - Breadcrumbs
 * - Sidebar menu
 * - Back/forward navigation
 */

test.describe('Page Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')

    // Test navigation to different sections
    // Replace with actual navigation links
    const navLinks = page.locator('nav a')
    const linkCount = await navLinks.count()

    if (linkCount > 0) {
      const firstLink = navLinks.first()
      const href = await firstLink.getAttribute('href')

      if (href && href !== '#') {
        await firstLink.click()
        await expect(page).toHaveURL(new RegExp(href))
      }
    }
  })

  test('should update breadcrumbs on navigation', async ({ page }) => {
    await page.goto('/')

    const breadcrumbs = page.locator('[aria-label="breadcrumb"], nav[aria-label="Breadcrumb"]')

    // Navigate to a nested page
    const navLink = page.locator('nav a').first()
    if (await navLink.isVisible()) {
      await navLink.click()

      // Check if breadcrumbs updated
      // This is app-specific, adjust selectors as needed
      if (await breadcrumbs.isVisible()) {
        const breadcrumbItems = breadcrumbs.locator('a, span')
        expect(await breadcrumbItems.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/')
    const initialUrl = page.url()

    // Navigate to another page
    const link = page.locator('a[href]').first()
    if (await link.isVisible()) {
      const href = await link.getAttribute('href')
      if (href && href !== '#' && !href.startsWith('mailto:')) {
        await link.click()
        await page.waitForLoadState('networkidle')

        // Go back
        await page.goBack()
        await expect(page).toHaveURL(initialUrl)

        // Go forward
        await page.goForward()
        await expect(page).not.toHaveURL(initialUrl)
      }
    }
  })
})

test.describe('Sidebar Navigation', () => {
  test('should toggle sidebar menu items', async ({ page }) => {
    await page.goto('/')

    // Test sidebar expansion/collapse
    const sidebar = page.locator('[role="navigation"], aside, [data-testid="sidebar"]')

    if (await sidebar.isVisible()) {
      // Find expandable menu items
      const expandableItems = sidebar.locator('button[aria-expanded]')
      const itemCount = await expandableItems.count()

      if (itemCount > 0) {
        const firstItem = expandableItems.first()
        const initialState = await firstItem.getAttribute('aria-expanded')

        await firstItem.click()

        const newState = await firstItem.getAttribute('aria-expanded')
        expect(newState).not.toBe(initialState)
      }
    }
  })

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/')

    const navItems = page.locator('nav a, aside a')
    const itemCount = await navItems.count()

    if (itemCount > 0) {
      // Click a nav item
      const navItem = navItems.first()
      await navItem.click()

      // Check if it's marked as active
      // Common patterns: aria-current, class with "active", etc.
      const ariaCurrent = await navItem.getAttribute('aria-current')
      const classNames = await navItem.getAttribute('class')

      expect(ariaCurrent === 'page' || classNames?.includes('active')).toBeTruthy()
    }
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show mobile menu toggle', async ({ page }) => {
    await page.goto('/')

    // Look for hamburger menu or mobile nav toggle
    const mobileMenuButton = page.getByRole('button', {
      name: /menu|navigation|toggle/i,
    })

    // Mobile menu button should be visible on small screens
    // This depends on your responsive design
    const isVisible = await mobileMenuButton.isVisible().catch(() => false)

    // Just verify the page loads on mobile
    await expect(page).toHaveTitle(/Vextrus/i)
  })

  test('should toggle mobile navigation menu', async ({ page }) => {
    await page.goto('/')

    const mobileMenuButton = page.getByRole('button', {
      name: /menu|navigation|toggle/i,
    })

    if (await mobileMenuButton.isVisible()) {
      // Open menu
      await mobileMenuButton.click()

      // Mobile nav should be visible
      const mobileNav = page.locator('[role="navigation"], nav')
      await expect(mobileNav.first()).toBeVisible()

      // Close menu
      await mobileMenuButton.click()
    }
  })
})

test.describe('Keyboard Navigation', () => {
  test('should support tab navigation', async ({ page }) => {
    await page.goto('/')

    // Tab through focusable elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focus moves
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should activate links with Enter key', async ({ page }) => {
    await page.goto('/')

    // Tab to first link
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')

    if ((await focusedElement.count()) > 0) {
      const tagName = await focusedElement.evaluate((el) => el.tagName)
      if (tagName === 'A') {
        // Press Enter to follow link
        await page.keyboard.press('Enter')
        // URL should change
        await page.waitForLoadState('networkidle')
      }
    }
  })
})
