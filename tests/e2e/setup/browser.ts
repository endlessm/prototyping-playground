import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll } from 'vitest'

// One headless Chromium for the file; each test opens its own page.
export function useBrowser() {
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
    return context.newPage()
  }
}
