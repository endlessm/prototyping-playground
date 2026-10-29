import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Tracer, in Endless Studios,
// with the views Home and Notes, and Plain, with no system.
const TRACER = 'tracer0000000001'
const HOME = 'vhme000000000001'
const PLAIN = 'p1a1n00000000001'

scenario(
  '[PR-20] [PR-21] [PR-23] [PR-77] [PR-93] [SY-172] opening a prototype’s views',
  async ({ page, url, step }) => {
    await page.goto(url)
    await expect
      .poll(() => page.getByRole('link').count(), { timeout: 60_000 })
      .toBeGreaterThan(0)
    await step('Home')

    await page.goto(`${url}prototypes/${TRACER}`)
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .toBe(`${url}prototypes/${TRACER}/artifacts/${HOME}`)
    const view = page.locator('iframe').first().contentFrame()
    await expect
      .poll(
        () => view.getByRole('heading', { name: 'Welcome Back!' }).isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)
    await expect
      .poll(() => view.getByRole('button', { name: 'Start' }).isVisible())
      .toBe(true)
    await expect.poll(() => page.title()).toMatch(/^Tracer — Home — /)
    await step('The prototype opens its first view')

    await page.getByRole('link', { name: 'Notes' }).click()
    await expect
      .poll(() => view.getByText('Notes for the tracer.').isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    await step('Its second view')

    await page.goto(`${url}prototypes/${PLAIN}`)
    await expect
      .poll(
        () =>
          view.getByRole('heading', { name: 'Plain prototype' }).isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)
    await step('A prototype with no system')
  },
)
