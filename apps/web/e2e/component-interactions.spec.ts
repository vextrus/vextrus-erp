import { test, expect } from '@playwright/test'

test.describe('Component Interactions', () => {
  test('modal opens and closes correctly', async ({ page }) => {
    await page.goto('/examples/overlay')

    // Open modal
    await page.click('button:has-text("Open Modal")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Modal traps focus
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluateHandle(() => document.activeElement)
    const isInModal = await page.locator('[role="dialog"]').evaluate(
      (modal, focused) => modal.contains(focused as Element),
      focusedElement
    )
    expect(isInModal).toBe(true)

    // Close modal with Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).toBeHidden()
  })

  test('accordion expands and collapses', async ({ page }) => {
    await page.goto('/examples/layout')

    // Expand accordion
    await page.click('button[aria-expanded="false"]:first-of-type')
    await expect(page.locator('[role="region"]:first-of-type')).toBeVisible()

    // Collapse accordion
    await page.click('button[aria-expanded="true"]:first-of-type')
    await expect(page.locator('[role="region"]:first-of-type')).toBeHidden()
  })

  test('table sorting and pagination works', async ({ page }) => {
    await page.goto('/examples/data-display')

    // Click sort header
    await page.click('th:has-text("Name")')

    // Verify sorted order (ascending)
    const firstRow = await page.locator('tbody tr:first-child td:first-child').textContent()
    const secondRow = await page.locator('tbody tr:nth-child(2) td:first-child').textContent()

    if (firstRow && secondRow) {
      expect(firstRow.charCodeAt(0)).toBeLessThan(secondRow.charCodeAt(0))
    }

    // Navigate to next page
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Page 2')).toBeVisible()
  })
})
