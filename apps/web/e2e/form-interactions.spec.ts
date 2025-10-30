import { test, expect } from '@playwright/test'

test.describe('Form Interactions', () => {
  test('can fill and submit a basic form', async ({ page }) => {
    await page.goto('/examples/forms')

    // Fill form fields
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="name"]', 'John Doe')
    await page.fill('[name="message"]', 'Test message')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success message
    await expect(page.locator('text=Form submitted successfully')).toBeVisible()
  })

  test('shows validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/examples/forms')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Verify error messages
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Name is required')).toBeVisible()

    // Fill with invalid email
    await page.fill('[name="email"]', 'invalid-email')
    await page.blur('[name="email"]')

    await expect(page.locator('text=Invalid email address')).toBeVisible()
  })

  test('can use all form components', async ({ page }) => {
    await page.goto('/examples/forms')

    // Checkbox
    await page.click('[type="checkbox"]')
    await expect(page.locator('[type="checkbox"]')).toBeChecked()

    // Radio button
    await page.click('[type="radio"][value="option1"]')
    await expect(page.locator('[type="radio"][value="option1"]')).toBeChecked()

    // Select
    await page.selectOption('select', 'option2')
    await expect(page.locator('select')).toHaveValue('option2')

    // Switch
    await page.click('[role="switch"]')
    await expect(page.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true')
  })
})
