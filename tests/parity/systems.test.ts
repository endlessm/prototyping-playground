import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// Both studios have the real Endless Studios system, with the same
// permanent ID, and one Context document.
const ENDLESS = '8x5spen6xtvp96a9'

const shows = (locator: { isVisible: () => Promise<boolean> }) =>
  expect.poll(() => locator.isVisible(), { timeout: 120_000 }).toBe(true)

scenario(
  '[SY-09] [SY-10] [SY-13] [SY-31] [SY-32] [SY-33] [SY-63] [SY-64] [SY-65] [SY-66] [SY-80] [SY-121] [SY-123] browsing a system',
  async ({ page, url, step }) => {
    await page.goto(`${url}systems`)
    await shows(page.getByRole('heading', { name: 'Systems', exact: true }))
    await shows(page.getByText('Endless Studios').first())
    await step('The Systems collection')

    await page.goto(`${url}systems/${ENDLESS}`)
    await shows(
      page.getByRole('heading', { name: 'Where it’s used', exact: true }),
    )
    await step('A system’s Overview')

    await page.goto(`${url}systems/${ENDLESS}/libraries`)
    await shows(page.getByText('The sources and tools behind Endless Studios.'))
    await step('Libraries')

    await page.goto(`${url}systems/${ENDLESS}/context`)
    await shows(
      page.getByText(
        'Agent instructions must point to the relevant files. Being listed here does not automatically load them into a conversation.',
      ),
    )
    await step('The Context section')

    await page.goto(`${url}systems/${ENDLESS}/context/user-types`)
    await shows(
      page.getByRole('heading', { name: 'Endless Access user types' }).first(),
    )
    await step('A Context document')
  },
)

scenario(
  '[SY-86] [SY-87] [SY-88] [SY-89] [SY-90] [SY-93] [SY-100] [SY-165] [SY-170] Endless Studios’ theme and assets',
  async ({ page, url, side, step }) => {
    const heading = (name: string) =>
      page.getByRole('heading', { name, exact: true }).first()
    // The new studio draws the tokens inside the system's preview document.
    const measured = async (token: string) => {
      if (side !== 'vue') return
      await expect
        .poll(
          () =>
            page
              .locator('iframe')
              .first()
              .contentFrame()
              .locator(`[data-token="${token}"]`)
              .getAttribute('data-value'),
          { timeout: 120_000 },
        )
        .toMatch(/./)
    }

    await page.goto(`${url}systems/${ENDLESS}/colors`)
    await shows(heading('Colors'))
    await measured('--ui-text-muted')
    await step('Colors')

    await page.goto(`${url}systems/${ENDLESS}/typography`)
    await shows(heading('Typography'))
    await measured('--font-sans')
    await step('Typography')

    await page.goto(`${url}systems/${ENDLESS}/radius`)
    await shows(heading('Radius'))
    await measured('--radius-4xl')
    await step('Radius')

    await page.goto(`${url}systems/${ENDLESS}/icons`)
    await shows(heading('Icons'))
    await step('Icons')

    await page.goto(`${url}systems/${ENDLESS}/images`)
    await shows(heading('Images'))
    await step('Images')
  },
)
