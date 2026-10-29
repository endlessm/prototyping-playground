import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixture States (tests/fixtures/parity), with no system: Welcome
// declares the states Member and New user and links to Details; Sketch is
// lo-fi.
const STATES = 'st4tes0000000001'
const MEMBER = 'smbr000000000001'
const NEW_USER = 'snew000000000001'
const DETAILS = 'vdeta1s000000001'
const SKETCH = 'vsketch000000001'

scenario(
  '[SH-72] [PR-51] [PR-89] [PR-82] [PR-91] named states, a link between views and a lo-fi view',
  async ({ page, url, step }) => {
    const address = (id: string) => `${url}prototypes/${STATES}/artifacts/${id}`
    const view = page.locator('iframe').first().contentFrame()
    const heading = (name: string) =>
      view.getByRole('heading', { name, exact: true })

    await page.goto(address(MEMBER))
    await expect
      .poll(() => heading('Welcome back, Ana').isVisible(), {
        timeout: 120_000,
      })
      .toBe(true)
    await expect
      .poll(() => page.getByRole('link', { name: 'New user' }).isVisible())
      .toBe(true)
    await step('A named state, listed under its view')

    await page.getByRole('link', { name: 'New user' }).click()
    await expect.poll(() => page.url()).toBe(address(NEW_USER))
    await expect
      .poll(() => heading('Welcome').isVisible(), { timeout: 60_000 })
      .toBe(true)
    await step('Another state of the same view')

    await view.getByRole('link', { name: 'Details' }).click()
    await expect.poll(() => page.url()).toBe(address(DETAILS))
    await expect
      .poll(() => heading('Details').isVisible(), { timeout: 60_000 })
      .toBe(true)
    await step('A link inside the view opens the other view')

    await page.goBack()
    await expect.poll(() => page.url()).toBe(address(NEW_USER))
    await expect
      .poll(() => heading('Welcome').isVisible(), { timeout: 60_000 })
      .toBe(true)

    await page.goto(address(SKETCH))
    await expect
      .poll(() => heading('Sketch').isVisible(), { timeout: 120_000 })
      .toBe(true)
    await expect
      .poll(() =>
        heading('Sketch').evaluate((element) => {
          for (let at: Element | null = element; at; at = at.parentElement)
            if (getComputedStyle(at).filter.includes('grayscale')) return true
          return false
        }),
      )
      .toBe(true)
    await step('A lo-fi view')
  },
)
