import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Plain, a prototype with no
// system and one view.
const PLAIN = 'p1a1n00000000001'
const PLAIN_VIEW = 'vp1an00000000001'

scenario(
  "[PR-125] [PR-130] [PR-134] [PR-135] a view's source, opened with Ctrl+'",
  async ({ page, url, step }) => {
    await page.goto(`${url}prototypes/${PLAIN}/artifacts/${PLAIN_VIEW}`)
    const view = page.locator('iframe').first().contentFrame()
    await expect
      .poll(
        () =>
          view.getByRole('heading', { name: 'Plain prototype' }).isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)

    await page.keyboard.press("Control+'")
    const editor = page.getByRole('textbox', { name: /^Source of .*Plain\./ })
    await expect.poll(() => editor.isVisible(), { timeout: 60_000 }).toBe(true)
    await expect.poll(() => new URL(page.url()).search).toBe('?mode=source')
    await step('The source of a view')

    await page.keyboard.press('Control+F')
    await expect
      .poll(() => page.getByRole('textbox', { name: 'Find' }).isVisible())
      .toBe(true)
    await step('Searching the source')

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect
      .poll(() =>
        view.getByRole('heading', { name: 'Plain prototype' }).isVisible(),
      )
      .toBe(true)
    await step('Back to the rendered view')
  },
)
