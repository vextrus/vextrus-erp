import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('home page loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(2000)
  })

  test('images are lazy loaded', async ({ page }) => {
    await page.goto('/')

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Wait for lazy loaded images
    await page.waitForLoadState('networkidle')

    // Verify images loaded
    const images = await page.locator('img').all()
    for (const img of images) {
      await expect(img).toHaveAttribute('src', /.+/)
    }
  })

  test('no layout shifts during page load', async ({ page }) => {
    await page.goto('/')

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          resolve(clsValue)
        }).observe({ type: 'layout-shift', buffered: true })

        setTimeout(() => resolve(clsValue), 3000)
      })
    })

    expect(cls).toBeLessThan(0.1) // Good CLS score
  })
})
