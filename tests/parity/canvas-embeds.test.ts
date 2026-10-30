import type { Page } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Board, Bernardo's prototype
// with a view, a document and a canvas holding the view, the document and a
// link to a file that isn't there.
const BOARD = 'b0ardp0000000001'
const CANVAS = 'b0ardcnv00000001'

const menuButton = (page: Page) => page.getByTestId('main-menu-trigger')

scenario(
  '[CV-67] [CV-68] [CV-69] [CV-71] [CV-72] [CV-77] items on a canvas: a live view, a card and a missing file, then zoomed far out',
  async ({ page, url, step }) => {
    await page.goto(`${url}prototypes/${BOARD}/artifacts/${CANVAS}`)
    await expect
      .poll(() => menuButton(page).isVisible(), { timeout: 120_000 })
      .toBe(true)
    await expect
      .poll(
        () =>
          page
            .locator('iframe')
            .first()
            .contentFrame()
            .getByRole('heading', { name: 'Hello from the board' })
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    await expect
      .poll(() => page.getByText('Not found').isVisible(), { timeout: 30_000 })
      .toBe(true)
    // Fonts and the scene's fade settle.
    await page.waitForTimeout(1500)
    await step('Items on a canvas')

    await page.getByRole('link', { name: 'Open Home' }).hover()
    await page.waitForTimeout(300)
    await step('Hovering an item’s title bar')

    const box = (await page.locator('canvas').last().boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.keyboard.down('Control')
    for (let step = 0; step < 20; step++) await page.mouse.wheel(0, 100)
    await page.keyboard.up('Control')
    await page.waitForTimeout(800)
    await step('Zoomed far out')
  },
)
