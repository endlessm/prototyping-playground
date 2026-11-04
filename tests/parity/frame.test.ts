import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Tracer, in Endless Studios.
// Color mode is out of parity: this studio is light only (ADR 0005).
const TRACER = 'tracer0000000001'
const HOME = 'vhme000000000001'

const shows = (locator: { isVisible: () => Promise<boolean> }) =>
  expect.poll(() => locator.isVisible(), { timeout: 120_000 }).toBe(true)

scenario(
  '[SH-58] [SH-25] a tooltip in the rail',
  async ({ page, url, step }) => {
    await page.goto(url)
    await shows(page.getByText('Your prototypes').first())
    await page.getByRole('button', { name: /^Search \(/ }).hover()
    await page.waitForTimeout(800)
    await step('Hovering the rail’s Search button')
  },
)

scenario(
  '[SH-01] [SH-24] [SH-26] [SH-37] [SH-96] [SH-98] the studio’s frame, Home and the rows of a section',
  async ({ page, url, step }) => {
    await page.goto(url)
    await shows(page.getByText('Your prototypes').first())
    await step('Home in the frame: the rail, the search row and the blocks')

    await page.goto(`${url}prototypes/${TRACER}/artifacts/${HOME}`)
    await shows(
      page
        .locator('iframe')
        .first()
        .contentFrame()
        .getByRole('heading', { name: 'Welcome Back!' }),
    )
    await page.getByRole('link', { name: 'Notes', exact: true }).first().hover()
    await page.waitForTimeout(800)
    await step('A section’s rows: the open one raised, another hovered')
  },
)
