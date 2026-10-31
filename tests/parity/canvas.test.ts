import type { Page } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Sketches, Bernardo's
// prototype with two canvases. Both studios run as this machine's Git
// identity; where that is Bernardo (an Admin), the canvases are editable.
const SKETCHES = 'skchp00000000001'
const SKETCH = 'skp1an0000000001'
const EMPTY = 'emp1an0000000001'

// Excalidraw's menu button has no accessible name; both studios use the
// same Excalidraw, so its test id is the same on both sides.
const menuButton = (page: Page) => page.getByTestId('main-menu-trigger')

async function opened(page: Page) {
  await expect
    .poll(() => menuButton(page).isVisible(), { timeout: 120_000 })
    .toBe(true)
  await expect
    .poll(() => page.getByText('Opening canvas').count(), { timeout: 30_000 })
    .toBe(0)
  // Fonts and the scene's fade settle.
  await page.waitForTimeout(1500)
}

scenario(
  '[CV-27] [CV-31] [CV-34] [CV-23] [CV-46] a canvas, its menu and an empty canvas',
  async ({ page, url, step }) => {
    await page.goto(`${url}prototypes/${SKETCHES}/artifacts/${SKETCH}`)
    await opened(page)
    await step('A canvas')

    await menuButton(page).click()
    await expect
      .poll(() => page.getByText('Hide controls').isVisible())
      .toBe(true)
    await step('The canvas menu')
    await page.keyboard.press('Escape')

    await page.goto(`${url}prototypes/${SKETCHES}/artifacts/${EMPTY}`)
    await opened(page)
    // React's empty hint would be due after 500 ms (painted under Excalidraw,
    // so never seen); the Vue canvas shows none.
    await page.waitForTimeout(1000)
    await step('An empty canvas')
  },
)
