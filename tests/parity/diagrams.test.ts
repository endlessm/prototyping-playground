import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixture Diagrams (tests/fixtures/parity), with no system:
// Sign-in is a flowchart, Broken an invalid `.mmd`, and Guide a document
// embedding Sign-in.
const DIAGRAMS = 'd1a6000000000p01'
const SIGN_IN = 'd1a6000000000p02'
const BROKEN = 'd1a6000000000p03'
const GUIDE = 'd1a6000000000p04'

scenario(
  '[PR-117] [PR-118] [PR-120] [PR-121] diagrams on their pages, in dark mode, broken, and embedded in a document',
  async ({ page, url, step }) => {
    const address = (id: string) =>
      `${url}prototypes/${DIAGRAMS}/artifacts/${id}`
    const drawn = (text: string) =>
      expect
        .poll(
          () => page.locator('svg').getByText(text, { exact: true }).count(),
          {
            timeout: 120_000,
          },
        )
        .toBeGreaterThan(0)

    await page.goto(address(SIGN_IN))
    await drawn('Try again')
    await step('A diagram filling its page')

    await page.emulateMedia({ colorScheme: 'dark' })
    // Both studios draw again for the new colour mode.
    await page.waitForTimeout(1500)
    await drawn('Try again')
    await step('The same diagram in dark mode')
    await page.emulateMedia({ colorScheme: 'light' })

    await page.goto(address(BROKEN))
    await expect
      .poll(
        () => page.getByText('Unable to render Mermaid diagram.').isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)
    await step('Invalid Mermaid with its message')

    await page.goto(address(GUIDE))
    await expect
      .poll(
        () => page.getByRole('link', { name: 'Open Sign-in flow' }).isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)
    await drawn('Try again')
    await step('A diagram embedded in a document')
  },
)
