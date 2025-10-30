import { test, expect } from '@playwright/test'

/**
 * Example E2E Test
 *
 * This is a basic example demonstrating Playwright E2E testing setup.
 * Replace this with actual tests for your application.
 */

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Vextrus/i)
  })

  test('should display main navigation', async ({ page }) => {
    await page.goto('/')
    // Add actual navigation selectors based on your app
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have no automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')
    // This is a placeholder - integrate with axe-core or similar for real accessibility testing
    await expect(page).toHaveTitle(/Vextrus/i)
  })
})
