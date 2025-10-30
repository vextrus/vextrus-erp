import { test, expect } from '@playwright/test'

test.describe('Navigation Flow', () => {
  test('can navigate through all example pages', async ({ page }) => {
    await page.goto('/')

    // Click Forms link
    await page.click('text=Forms')
    await expect(page).toHaveURL('/examples/forms')
    await expect(page.locator('h1')).toContainText('Form Components')

    // Click Navigation link
    await page.click('text=Navigation')
    await expect(page).toHaveURL('/examples/navigation')
    await expect(page.locator('h1')).toContainText('Navigation Components')

    // Click Data Display link
    await page.click('text=Data Display')
    await expect(page).toHaveURL('/examples/data-display')
    await expect(page.locator('h1')).toContainText('Data Display')

    // Return home
    await page.click('text=Home')
    await expect(page).toHaveURL('/')
  })

  test('sidebar navigation works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Open mobile menu
    await page.click('[aria-label="Open menu"]')
    await expect(page.locator('.mobile-menu')).toBeVisible()

    // Navigate
    await page.click('text=Forms')
    await expect(page).toHaveURL('/examples/forms')

    // Menu closes after navigation
    await expect(page.locator('.mobile-menu')).toBeHidden()
  })
})
