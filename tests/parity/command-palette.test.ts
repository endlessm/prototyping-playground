import { expect } from 'vitest'
import { scenario } from './setup/scenario'

scenario(
  '[SH-39] [SH-46] [PR-83] opening the palette from a view preview',
  async ({ page, url, step }) => {
    await page.goto(
      `${url}prototypes/st4tes0000000001/artifacts/vwe1c0me00000001`,
    )
    const frame = page.locator('iframe').first().contentFrame()
    await expect
      .poll(
        () =>
          frame
            .getByRole('heading', { name: 'Welcome', exact: true })
            .isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)
    await frame.getByRole('heading', { name: 'Welcome', exact: true }).click()
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search the studio')
    await expect.poll(() => input.isVisible(), { timeout: 30_000 }).toBe(true)
    await step('Palette opened from the preview')
    await input.press('Control+k')
    await expect.poll(() => input.isVisible()).toBe(false)
  },
)

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
        { timeout: 120_000 },
      )
      .toBe(true)
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search the studio')
    await expect.poll(() => input.isVisible(), { timeout: 120_000 }).toBe(true)
    await step('Places and module groups')
    await input.fill('Plain')
    await expect
      .poll(() => page.getByRole('option', { name: /^Plain/ }).isVisible())
      .toBe(true)
    await step('Finding a prototype')
    await page.getByRole('option', { name: /^Plain/ }).click()
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

scenario(
  '[SY-03] opening a system from the palette',
  async ({ page, url, step }) => {
    await page.goto(url)
    await expect
      .poll(
        () =>
          page
            .getByRole('button', { name: /Search/ })
            .first()
            .isVisible(),
        { timeout: 60000 },
      )
      .toBe(true)
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search the studio')
    await expect.poll(() => input.isVisible(), { timeout: 60000 }).toBe(true)
    await input.fill('Endless Studios')
    const system = page.getByRole('option', {
      name: 'Endless Studios system',
      exact: true,
    })
    await expect.poll(() => system.isVisible(), { timeout: 30000 }).toBe(true)
    await step('Systems palette entry')
    await system.click()
    await expect.poll(() => page.url()).toContain('/systems/8x5spen6xtvp96a9')
  },
)

scenario(
  '[PR-140] [SH-43] real Manual chapters in the command palette',
  async ({ page, url, step }) => {
    await page.goto(url)
    await page
      .getByRole('button', { name: /Search/ })
      .first()
      .waitFor({ state: 'visible', timeout: 120_000 })
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search the studio')
    await input.waitFor({ state: 'visible', timeout: 120_000 })
    await page
      .getByText('Manual', { exact: true })
      .last()
      .scrollIntoViewIfNeeded()
    await step('Manual group with empty search')
    await input.fill('Working with your agent')
    const chapter = page.getByRole('option', {
      name: 'Working with your agent',
      exact: true,
    })
    await chapter.waitFor({ state: 'visible', timeout: 30_000 })
    await step('Manual group with a real chapter')
    for (let index = 0; index < 20; index++) {
      if (
        (await chapter.getAttribute('data-highlighted')) !== null ||
        (await chapter.getAttribute('data-selected')) === 'true' ||
        (await chapter.getAttribute('aria-selected')) === 'true'
      )
        break
      await input.press('ArrowDown')
    }
    await input.press('Enter')
    await expect
      .poll(() => page.url(), { timeout: 30_000 })
      .toContain('/documentation/manual/agent')
    await step('Manual chapter opened from the keyboard')
  },
)
