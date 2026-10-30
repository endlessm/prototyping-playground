import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixture Tree (tests/fixtures/parity), with no system: Home, and
// Details and sign-in in a folder "flows" (shown as Flows › Details, Sign In:
// files before folders, PR-59). Only what anyone may do: who
// runs the parity studios isn't fixed, so creating, renaming and deleting
// are left to the browser scenarios (tests/e2e/file-tree.test.ts).
const TREE = 'tree000000000001'
const HOME = 'vtrhme0000000001'

scenario(
  '[SH-68] [SH-71] [SH-73] [SH-75] [SH-76] [SH-77] [PR-48] [PR-50] [PR-52] the file tree: readable names, filtering and Show all files',
  async ({ page, url, side, step }) => {
    const link = (name: string) => page.getByRole('link', { name, exact: true })
    await page.goto(`${url}prototypes/${TREE}/artifacts/${HOME}`)
    await expect
      .poll(() => link('Sign In').isVisible(), { timeout: 120_000 })
      .toBe(true)
    await expect.poll(() => link('Details').isVisible()).toBe(true)
    expect(await link('Home').getAttribute('aria-current')).toBe('page')
    // Both studios hold Details in Flows, so both indent it under Flows. A
    // scenario that moved it on one side (file-tree-drag, which runs first
    // against the same React copy) would show here.
    const left = async (name: string) =>
      (await page.getByText(name, { exact: true }).first().boundingBox())!.x
    expect(await left('Details')).toBeGreaterThan(await left('Flows'))
    expect(await left('Sign In')).toBeGreaterThan(await left('Flows'))
    await step('The file tree, the open artifact current')

    await link('Home').hover()
    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    const filter = page.getByRole('textbox', { name: 'Filter artifacts' })
    await filter.fill('sign')
    await expect.poll(() => link('Details').count()).toBe(0)
    await expect.poll(() => link('Sign In').isVisible()).toBe(true)
    await step('Filtering by name')
    await filter.press('Escape')
    await filter.press('Escape')
    await expect.poll(() => filter.count()).toBe(0)

    // React's item is a plain menu item; the new one is a checkbox.
    await page.getByRole('button', { name: 'Prototype actions' }).click()
    await page
      .getByRole(side === 'react' ? 'menuitem' : 'menuitemcheckbox', {
        name: 'Show all files',
      })
      .click()
    await expect
      .poll(() => page.getByText('meta.json', { exact: true }).isVisible(), {
        timeout: 30_000,
      })
      .toBe(true)
    await step('Show all files')
  },
)
