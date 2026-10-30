import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixture Docs (tests/fixtures/parity), with no system: Brief has
// a title and description in its frontmatter, "On this page", a table, a
// task list, code, a Mermaid fence, and embeds a view, a document and a
// missing file; Notes is the embedded document.
const DOCS = 'd0c5000000000p01'
const BRIEF = 'd0c5000000000p02'
const NOTES = 'd0c5000000000p03'

scenario(
  '[PR-106] [PR-107] [PR-108] [PR-110] [PR-113] [PR-112] [PR-99] [PR-100] [PR-101] [PR-102] [SY-148] reading a document with embeds',
  async ({ page, url, step }) => {
    const address = (id: string) => `${url}prototypes/${DOCS}/artifacts/${id}`
    const title = (name: string) =>
      page.getByRole('heading', { name, level: 1, exact: true })
    const toc = page.getByRole('navigation', { name: 'On this page' })

    await page.goto(address(BRIEF))
    await expect
      .poll(() => title('Research brief').isVisible(), { timeout: 120_000 })
      .toBe(true)
    await expect.poll(() => toc.isVisible()).toBe(true)
    await expect
      .poll(() => page.locator('svg').getByText('Finish').count(), {
        timeout: 60_000,
      })
      .toBeGreaterThan(0)
    await step(
      'A document: title, description, "On this page", table, code and a diagram',
    )

    await toc.getByRole('link', { name: 'Screens' }).click()
    const view = page.locator('iframe').first().contentFrame()
    await expect
      .poll(
        () =>
          view.getByRole('heading', { name: 'Hello from Home' }).isVisible(),
        { timeout: 120_000 },
      )
      .toBe(true)
    await expect
      .poll(() => page.getByText('Not found', { exact: true }).isVisible())
      .toBe(true)
    // Smooth scrolling (React) settles before the picture.
    await page.waitForTimeout(1000)
    await step('An embedded view, a document card and a missing file')

    await page.goto(address(NOTES))
    await expect
      .poll(() => title('Interview notes').isVisible(), { timeout: 60_000 })
      .toBe(true)
    await step('A document titled from its first heading')
  },
)
