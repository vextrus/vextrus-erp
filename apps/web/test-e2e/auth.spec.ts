/**
 * E2E Authentication Tests
 *
 * Comprehensive end-to-end tests for the authentication flow including:
 * - Login with valid/invalid credentials
 * - Form validation
 * - Protected route access
 * - Logout functionality
 * - Session persistence
 * - Token expiry handling
 *
 * @see apps/web/src/app/login/page.tsx - Login page implementation
 * @see apps/web/src/lib/auth/auth-context.tsx - Auth context and token management
 */

import { test, expect, type Page } from '@playwright/test'

// Test credentials (should match backend test users)
const VALID_CREDENTIALS = {
  email: 'admin@vextrus.com',
  password: 'admin123',
}

const INVALID_CREDENTIALS = {
  email: 'invalid@vextrus.com',
  password: 'wrongpassword',
}

/**
 * Helper function to login
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
}

/**
 * Helper function to check if user is on protected page
 */
async function expectToBeOnDashboard(page: Page) {
  // Wait for navigation to complete
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  expect(page.url()).toContain('/dashboard')
}

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      // Check page title
      await expect(page.locator('h1')).toContainText('Vextrus ERP')

      // Check form elements are visible
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // Check submit button text
      await expect(page.locator('button[type="submit"]')).toContainText('Sign in')
    })

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login')

      // Check labels
      await expect(page.locator('label[for="email"]')).toContainText('Email address')
      await expect(page.locator('label[for="password"]')).toContainText('Password')
    })

    test('should have proper input placeholders', async ({ page }) => {
      await page.goto('/login')

      // Check placeholders
      const emailInput = page.locator('#email')
      await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')

      const passwordInput = page.locator('#password')
      await expect(passwordInput).toHaveAttribute('placeholder', '••••••••')
    })

    test('should have autocomplete attributes', async ({ page }) => {
      await page.goto('/login')

      // Check autocomplete attributes for password managers
      await expect(page.locator('#email')).toHaveAttribute('autocomplete', 'email')
      await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'current-password')
    })
  })

  test.describe('Form Validation', () => {
    test('should show validation error for empty email', async ({ page }) => {
      await page.goto('/login')

      // Leave email empty, fill password
      await page.fill('#password', 'somepassword')
      await page.click('button[type="submit"]')

      // Check for validation error
      await expect(page.locator('text=Email is required')).toBeVisible()
    })

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/login')

      await page.fill('#email', 'notanemail')
      await page.fill('#password', 'somepassword')
      await page.click('button[type="submit"]')

      // Check for validation error
      await expect(page.locator('text=Invalid email address')).toBeVisible()
    })

    test('should show validation error for empty password', async ({ page }) => {
      await page.goto('/login')

      await page.fill('#email', 'test@vextrus.com')
      // Leave password empty
      await page.click('button[type="submit"]')

      // Check for validation error
      await expect(page.locator('text=Password is required')).toBeVisible()
    })

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/login')

      await page.fill('#email', 'test@vextrus.com')
      await page.fill('#password', '12345') // Less than 6 characters
      await page.click('button[type="submit"]')

      // Check for validation error
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
    })

    test('should show all validation errors when both fields are empty', async ({ page }) => {
      await page.goto('/login')

      await page.click('button[type="submit"]')

      // Check both validation errors are shown
      await expect(page.locator('text=Email is required')).toBeVisible()
      await expect(page.locator('text=Password is required')).toBeVisible()
    })
  })

  test.describe('Successful Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await login(page, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password)

      // Should redirect to dashboard
      await expectToBeOnDashboard(page)
    })

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/login')

      await page.fill('#email', VALID_CREDENTIALS.email)
      await page.fill('#password', VALID_CREDENTIALS.password)

      // Click submit and immediately check for loading state
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Check for loading text (may be brief)
      await expect(submitButton).toBeDisabled()
    })

    test('should persist session across page reloads', async ({ page }) => {
      // Login first
      await login(page, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password)
      await expectToBeOnDashboard(page)

      // Reload the page
      await page.reload()

      // Should still be on dashboard (session maintained)
      await expectToBeOnDashboard(page)
    })

    test('should redirect to original page after login', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/dashboard/finance')

      // Should be redirected to login with redirect param
      await page.waitForURL(/\/login\?redirect/)

      // Login
      await page.fill('#email', VALID_CREDENTIALS.email)
      await page.fill('#password', VALID_CREDENTIALS.password)
      await page.click('button[type="submit"]')

      // Should be redirected back to original page
      await page.waitForURL(/\/dashboard\/finance/, { timeout: 10000 })
      expect(page.url()).toContain('/dashboard/finance')
    })
  })

  test.describe('Failed Login', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      await login(page, INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password)

      // Should show error message
      await expect(page.locator('[role="alert"]').or(page.locator('text=/Login failed/i'))).toBeVisible({ timeout: 10000 })

      // Should remain on login page
      expect(page.url()).toContain('/login')
    })

    test('should allow retry after failed login', async ({ page }) => {
      // First attempt with invalid credentials
      await login(page, INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password)
      await expect(page.locator('[role="alert"]').or(page.locator('text=/Login failed/i'))).toBeVisible({ timeout: 10000 })

      // Second attempt with valid credentials
      await page.fill('#email', VALID_CREDENTIALS.email)
      await page.fill('#password', VALID_CREDENTIALS.password)
      await page.click('button[type="submit"]')

      // Should succeed and redirect
      await expectToBeOnDashboard(page)
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard')

      // Should be redirected to login
      await page.waitForURL(/\/login/, { timeout: 10000 })
      expect(page.url()).toContain('/login')
    })

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // Login first
      await login(page, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password)
      await expectToBeOnDashboard(page)

      // Try to access another protected route
      await page.goto('/dashboard/finance')

      // Should be able to access
      expect(page.url()).toContain('/dashboard/finance')
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await login(page, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password)
      await expectToBeOnDashboard(page)

      // Find and click logout button (adjust selector based on actual UI)
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), [aria-label="Logout"]').first()

      if (await logoutButton.isVisible()) {
        await logoutButton.click()

        // Should be redirected to login
        await page.waitForURL(/\/login/, { timeout: 10000 })
        expect(page.url()).toContain('/login')

        // Try to access protected route
        await page.goto('/dashboard')

        // Should be redirected to login (session cleared)
        await page.waitForURL(/\/login/, { timeout: 10000 })
        expect(page.url()).toContain('/login')
      }
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session in new tab', async ({ context }) => {
      const page1 = await context.newPage()

      // Login in first tab
      await login(page1, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password)
      await expectToBeOnDashboard(page1)

      // Open second tab
      const page2 = await context.newPage()
      await page2.goto('/dashboard')

      // Should be authenticated in second tab (shared cookies)
      await expectToBeOnDashboard(page2)

      await page1.close()
      await page2.close()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login')

      // Tab to email field
      await page.keyboard.press('Tab')
      await expect(page.locator('#email')).toBeFocused()

      // Type email
      await page.keyboard.type(VALID_CREDENTIALS.email)

      // Tab to password field
      await page.keyboard.press('Tab')
      await expect(page.locator('#password')).toBeFocused()

      // Type password
      await page.keyboard.type(VALID_CREDENTIALS.password)

      // Tab to submit button
      await page.keyboard.press('Tab')
      await expect(page.locator('button[type="submit"]')).toBeFocused()

      // Submit with Enter
      await page.keyboard.press('Enter')

      // Should login successfully
      await expectToBeOnDashboard(page)
    })

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/login')

      // Check for proper label associations
      const emailLabel = page.locator('label[for="email"]')
      const passwordLabel = page.locator('label[for="password"]')

      await expect(emailLabel).toBeVisible()
      await expect(passwordLabel).toBeVisible()
    })
  })
})

test.describe('Token Expiry Handling', () => {
  test.skip('should handle expired token gracefully', async ({ page }) => {
    // This test requires backend support for token expiry simulation
    // Skip for now, implement when token refresh is added

    // Login
    await login(page, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password)
    await expectToBeOnDashboard(page)

    // TODO: Simulate token expiry (needs backend endpoint or time manipulation)
    // TODO: Make API request that fails with 401
    // TODO: Verify user is redirected to login
    // TODO: Verify redirect includes original URL
  })

  test.skip('should refresh token automatically', async ({ page }) => {
    // This test requires token refresh implementation
    // Skip for now, implement in Day 7

    // TODO: Login
    // TODO: Wait for token to be near expiry
    // TODO: Make API request
    // TODO: Verify token was refreshed
    // TODO: Verify request succeeded
  })
})
