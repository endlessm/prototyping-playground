import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Tracer, in Endless Studios
// (light only), Plain, with no system, and Sketches with a canvas.
const TRACER = 'tracer0000000001'
const HOME = 'vhme000000000001'
const PLAIN = 'p1a1n00000000001'
const SKETCHES = 'skchp00000000001'
const SKETCH = 'skp1an0000000001'
const ENDLESS = '8x5spen6xtvp96a9'

const shows = (locator: { isVisible: () => Promise<boolean> }) =>
  expect.poll(() => locator.isVisible(), { timeout: 120_000 }).toBe(true)

scenario(
  '[SH-51] [SH-31] [SH-24] [SH-55] [PR-80] [CV-48] [SY-134] [SY-87] the studio in dark mode',
  async ({ page, url, side, step }) => {
    // No choice saved yet: both studios follow the computer.
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(url)
    await shows(page.getByText('Your prototypes').first())
    await step('Home, following the computer’s dark mode')

    const view = page.locator('iframe').first().contentFrame()
    await page.goto(`${url}prototypes/${TRACER}/artifacts/${HOME}`)
    await shows(view.getByRole('heading', { name: 'Welcome Back!' }))
    await step('An Endless Studios view stays light')

    await page.goto(`${url}prototypes/${PLAIN}`)
    await shows(view.getByRole('heading', { name: 'Plain prototype' }))
    await page.waitForTimeout(1000)
    await step('A view with no system')

    await page.goto(`${url}prototypes/${SKETCHES}/artifacts/${SKETCH}`)
    await shows(page.getByTestId('main-menu-trigger'))
    await expect
      .poll(() => page.getByText('Opening canvas').count(), { timeout: 30_000 })
      .toBe(0)
    await page.waitForTimeout(1500)
    await step('A canvas')

    await page.goto(`${url}systems/${ENDLESS}/colors`)
    await shows(
      page.getByRole('heading', { name: 'Colors', exact: true }).first(),
    )
    await page.waitForTimeout(1500)
    await step('Endless Studios’ Colors stay light')

    // React toggles with one button; the new studio offers System, Light
    // and Dark in a menu (a correction: you can go back to the computer's).
    await page.goto(url)
    await shows(page.getByText('Your prototypes').first())
    if (side === 'react') {
      await page.getByRole('button', { name: 'Light mode' }).hover()
      await page.waitForTimeout(800)
    } else {
      await page.getByRole('button', { name: 'Color mode' }).click()
      await shows(page.getByRole('menuitemcheckbox', { name: 'Light' }))
    }
    await step('The colour mode control in the rail')

    if (side === 'react')
      await page.getByRole('button', { name: 'Light mode' }).click()
    else await page.getByRole('menuitemcheckbox', { name: 'Light' }).click()
    await page.mouse.move(720, 450)
    await page.waitForTimeout(1000)
    await step('Light mode chosen in the rail, the computer still dark')
  },
)

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
