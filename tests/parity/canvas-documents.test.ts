import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Board, Bernardo's prototype,
// whose Overview document embeds the board canvas (a live view, a card and
// a link to a file that isn't there).
const BOARD = 'b0ardp0000000001'
const OVERVIEW = 'b0ardd0c00000002'

scenario(
  '[CV-109] [CV-110] a canvas in a document: a fitted, read-only picture with its items',
  async ({ page, url, step }) => {
    await page.goto(`${url}prototypes/${BOARD}/artifacts/${OVERVIEW}`)
    await expect
      .poll(
        () =>
          page
            .locator('.canvas-preview')
            .getAttribute('data-canvas-opening')
            .catch(() => null),
        { timeout: 120_000 },
      )
      .toBe('ready')
    await expect
      .poll(
        () =>
          page
            .locator('.canvas-preview iframe')
            .first()
            .contentFrame()
            .getByRole('heading', { name: 'Hello from the board' })
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    await expect
      .poll(
        () =>
          page.locator('.canvas-preview').getByText('Not found').isVisible(),
        { timeout: 30_000 },
      )
      .toBe(true)
    // Fonts and the scene's fade settle.
    await page.waitForTimeout(1500)
    await step('A canvas in a document')
  },
)
