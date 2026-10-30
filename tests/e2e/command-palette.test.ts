import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

for (const deployed of [false, true]) {
  describe(`command palette (${deployed ? 'static' : 'dev'})`, () => {
    const newPage = useBrowser()
    let studio: RunningStudio
    beforeAll(async () => {
      const env = {
        STUDIO_PROTOTYPES: 'tests/fixtures/parity/vue',
        STUDIO_GITHUB: '',
      }
      studio = deployed
        ? await startStaticSite('/palette/', env)
        : await startDevServer(env)
    })
    afterAll(async () => {
      await studio?.stop()
    })

    test('[SH-39] [SH-41] [SH-42] [SH-43] [SH-44] [SH-45] [PR-19] opens, filters hidden synonyms, navigates with the keyboard and restores focus', async () => {
      const page = await newPage()
      await page.goto(studio.url)
      const search = page.getByRole('button', {
        name: 'Search (Ctrl+K)',
        exact: true,
      })
      await expect
        .poll(() => search.isVisible(), { timeout: 60_000 })
        .toBe(true)
      await page.getByRole('button', { name: 'Search the studio' }).click()
      await page.getByPlaceholder('Search the studio').press('Escape')
      await search.click()
      const input = page.getByPlaceholder('Search the studio')
      await expect.poll(() => input.isVisible()).toBe(true)
      expect(
        await page
          .getByRole('option', { name: 'Home', exact: true })
          .getAttribute('data-disabled'),
      ).not.toBeNull()
      await input.fill('overview')
      await expect.poll(() => page.getByRole('option').count()).toBe(1)
      expect(
        await page.getByRole('option', { name: 'Home', exact: true }).count(),
      ).toBe(1)
      await input.fill('configuration')
      await expect
        .poll(() => page.getByRole('option').count())
        .toBe(deployed ? 0 : 1)
      expect(
        await page
          .getByRole('option', { name: 'Studio settings', exact: true })
          .count(),
      ).toBe(deployed ? 0 : 1)
      await input.fill('zzzzzzzzzzzz')
      await expect
        .poll(() =>
          page.getByText('No results found.', { exact: true }).isVisible(),
        )
        .toBe(true)
      await input.fill('Plain')
      await expect
        .poll(() => page.getByRole('option', { name: /^Plain/ }).isVisible())
        .toBe(true)
      await input.press('ArrowDown')
      await input.press('Enter')
      await expect
        .poll(() => page.url(), { timeout: 30_000 })
        .toContain('/prototypes/p1a1n00000000001')
      await page.keyboard.press('Control+k')
      await expect.poll(() => input.isVisible()).toBe(true)
      await input.press('Escape')
      await expect.poll(() => input.isVisible()).toBe(false)
      await search.click()
      await input.press('Escape')
      await expect
        .poll(() => search.evaluate((el) => el === document.activeElement))
        .toBe(true)
      await page.goto(`${studio.url}prototypes/st4tes0000000001`)
      await search.click()
      await input.fill('Member')
      await expect
        .poll(() =>
          page.getByRole('option', { name: 'Member', exact: true }).isVisible(),
        )
        .toBe(true)
      await input.press('ArrowDown')
      await input.press('Enter')
      await expect
        .poll(() => page.url())
        .toContain('/artifacts/smbr000000000001')
    })

    test('[SY-03] [PR-19] systems, documents and canvases join the palette and tree', async () => {
      const page = await newPage()
      for (const destination of [
        {
          prototype: 'd0c5000000000p01',
          query: 'Research brief',
          artifact: 'd0c5000000000p02',
        },
        {
          prototype: 'skchp00000000001',
          query: 'Sketch',
          artifact: 'skp1an0000000001',
        },
      ]) {
        await page.goto(studio.url + 'prototypes/' + destination.prototype)
        const search = page.getByRole('button', {
          name: 'Search (Ctrl+K)',
          exact: true,
        })
        await expect
          .poll(() => search.isVisible(), { timeout: 60000 })
          .toBe(true)
        await search.click()
        const input = page.getByPlaceholder('Search the studio')
        await input.fill(destination.query)
        const option = page.getByRole('option', {
          name: destination.query,
          exact: true,
        })
        await expect
          .poll(() => option.isVisible(), { timeout: 30000 })
          .toBe(true)
        await option.click()
        await expect
          .poll(() => page.url())
          .toContain('/artifacts/' + destination.artifact)
      }
      await page.goto(studio.url + 'systems/8x5spen6xtvp96a9/context')
      await page
        .getByRole('button', { name: 'Search (Ctrl+K)', exact: true })
        .click()
      const system = page.getByRole('option', {
        name: 'Endless Studios system',
        exact: true,
      })
      await expect.poll(() => system.isVisible(), { timeout: 30000 }).toBe(true)
      expect(await system.getAttribute('data-disabled')).not.toBeNull()
    })

    test('[SH-40] [SH-46] [PR-83] shortcuts cross the preview, preserve fields and ignore repeated keys', async () => {
      const page = await newPage()
      await page.goto(`${studio.url}prototypes/st4tes0000000001`)
      const frame = page.locator('iframe').first().contentFrame()
      await expect
        .poll(() => frame.locator('body').isVisible(), { timeout: 60_000 })
        .toBe(true)
      await frame.locator('body').click()
      await page.keyboard.press('Control+k')
      const input = page.getByPlaceholder('Search the studio')
      await expect.poll(() => input.isVisible(), { timeout: 30_000 }).toBe(true)
      await input.evaluate((el) =>
        el.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            repeat: true,
            bubbles: true,
          }),
        ),
      )
      expect(await input.isVisible()).toBe(true)
      await input.press('Control+k')
      await expect.poll(() => input.isVisible()).toBe(false)
      await frame.locator('body').evaluate((el) => {
        const field = document.createElement('input')
        field.setAttribute('aria-label', 'Preview field')
        el.append(field)
        field.focus()
      })
      await page.keyboard.press('Control+k')
      expect(await input.isVisible()).toBe(false)
    })
  })
}
