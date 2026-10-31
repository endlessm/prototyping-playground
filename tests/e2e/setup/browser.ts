import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll } from 'vitest'

// The browser's memory of the welcome for someone the studio doesn't know
// (src/modules/onboarding/utils/progress.ts), on a studio at `/`.
const WELCOME_SEEN = 'design-studio:welcome:/:unregistered'

/**
 * One headless Chromium for the file; each test opens its own page. Pages
 * belong to a returning visitor, so the welcome doesn't cover Home; pass
 * `{ welcome: true }` to see it as a first-time visitor would.
 */
export function useBrowser({ welcome = false } = {}) {
  let browser: Browser | undefined
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true })
  })
  afterAll(async () => {
    await browser?.close()
  })
  return async () => {
    if (!browser) throw new Error('The browser has not started')
    const context = await browser.newContext()
    if (!welcome)
      await context.addInitScript((key) => {
        try {
          localStorage.setItem(key, 'shown')
        } catch {
          // No storage on this page.
        }
      }, WELCOME_SEEN)
    return context.newPage()
  }
}
