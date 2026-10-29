import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures' Drafts prototype has one view that is still empty:
// a comment only in the new studio, `export default emptyView` in React.
const DRAFTS = 'drafts0000000001'
const BLANK = 'b1ank00000000002'

scenario(
  '[PR-88] a new view that is still empty',
  async ({ page, url, side, step }) => {
    await page.goto(`${url}prototypes/${DRAFTS}/artifacts/${BLANK}`)
    // React drew the empty page inside the preview document; the new studio
    // draws it in its own page, so it never takes a system's look.
    const where =
      side === 'react' ? page.locator('iframe').first().contentFrame() : page
    await expect
      .poll(() => where.getByText('This view is empty').isVisible(), {
        timeout: 120_000,
      })
      .toBe(true)
    await expect
      .poll(() =>
        where.getByRole('button', { name: 'Copy prompt' }).isVisible(),
      )
      .toBe(true)
    await step('The empty view asks for the agent')
  },
)
