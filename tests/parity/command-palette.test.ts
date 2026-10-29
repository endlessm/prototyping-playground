import { expect } from 'vitest'
import { scenario } from './setup/scenario'

scenario(
  '[SH-39] [SH-41] [SH-42] [SH-43] [SH-44] [PR-19] searching the studio from the palette',
  async ({ page, url, step }) => {
    await page.goto(url)
    await expect
      .poll(
        () =>
          page
            .getByRole('button', { name: /Search/ })
            .first()
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search the studio')
    await expect.poll(() => input.isVisible(), { timeout: 60_000 }).toBe(true)
    await step('Places and module groups')
    await input.fill('Plain')
    await expect
      .poll(() => page.getByRole('option', { name: /^Plain/ }).isVisible())
      .toBe(true)
    await step('Finding a prototype')
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect
      .poll(() => page.url(), { timeout: 30_000 })
      .toContain('/prototypes/')
    await page.keyboard.press('Control+k')
    await expect.poll(() => input.isVisible()).toBe(true)
    await input.fill('zzzzzzzzzzzz')
    await expect
      .poll(() =>
        page.getByText('No results found.', { exact: true }).isVisible(),
      )
      .toBe(true)
    await step('No matching results')
    await input.press('Escape')
  },
)
