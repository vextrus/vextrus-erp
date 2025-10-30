import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('home page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('examples page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/examples/forms')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/examples/forms')

    // Tab through all interactive elements
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      const tagName = await focusedElement.evaluate(el => el.tagName)

      expect(['BUTTON', 'INPUT', 'A', 'SELECT', 'TEXTAREA']).toContain(tagName)
    }
  })
})
