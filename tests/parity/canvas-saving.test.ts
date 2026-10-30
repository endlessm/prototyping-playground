import type { Page, Route } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// Bernardo's Sketch canvas (tests/fixtures/parity), editable where this
// machine's Git identity is Bernardo. Saves never reach the disk: the new
// studio reads the fixtures in place, so both studios' save requests are
// answered with a failure here, which is also the state worth comparing.
const SKETCHES = 'skchp00000000001'
const SKETCH = 'skp1an0000000001'

async function failSaves(page: Page) {
  await page.route(
    (url) =>
      url.pathname.endsWith('/_studio/files/source') ||
      url.pathname.endsWith('/__studio/write'),
    (route: Route) =>
      ['PUT', 'POST'].includes(route.request().method())
        ? route.fulfill({
            status: 500,
            json: { error: 'The disk is full.', code: 'http_error' },
          })
        : route.fallback(),
  )
}

async function opened(page: Page) {
  await expect
    .poll(() => page.getByTestId('main-menu-trigger').isVisible(), {
      timeout: 120_000,
    })
    .toBe(true)
  await expect
    .poll(() => page.getByText('Opening canvas').count(), { timeout: 30_000 })
    .toBe(0)
  await page.waitForTimeout(1500)
}

scenario(
  '[CV-90] [CV-92] [CV-95] the save status, a failed save and leaving with unsaved changes',
  async ({ page, url, step }) => {
    await failSaves(page)
    await page.goto(`${url}prototypes/${SKETCHES}/artifacts/${SKETCH}`)
    await opened(page)
    await expect
      .poll(() => page.getByRole('status').filter({ hasText: 'Saved' }).count())
      .toBe(1)
    await step('The save status')

    // Excalidraw's own canvas: draw a rectangle in the middle.
    const box = (await page.locator('canvas.interactive').boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 80)
    await page.keyboard.press('r')
    const x = box.x + box.width / 2 + 100
    const y = box.y + box.height / 2 - 60
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 160, y + 110, { steps: 5 })
    await page.mouse.up()
    await expect
      .poll(
        () => page.getByRole('button', { name: 'Retry' }).first().isVisible(),
        {
          timeout: 15_000,
        },
      )
      .toBe(true)
    await page.waitForTimeout(500)
    await step('A save that failed')

    await page.getByRole('link', { name: 'Empty', exact: true }).first().click()
    const dialog = page.getByRole('dialog', {
      name: 'This canvas has unsaved changes',
    })
    await expect.poll(() => dialog.isVisible(), { timeout: 15_000 }).toBe(true)
    await page.waitForTimeout(500)
    await step('Leaving with unsaved changes')
    await dialog.getByRole('button', { name: 'Keep editing' }).click()
  },
)
