import type { Page } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// A prototype's menu and the dialogs it opens, on the parity fixtures Tree
// (no system) and the archived Shelf, both Bernardo's. Every dialog is
// cancelled, so the fixtures stay as they are. Only someone who may change
// the prototype sees the changes: on this computer both studios recognise
// Bernardo through the GitHub CLI. The browser scenarios
// (tests/e2e/organize-prototypes.test.ts) carry the changes out.
const TREE = 'tree000000000001'
const SHELF = 'she1f00000000001'

const visible = (
  locator: { isVisible: () => Promise<boolean> },
  timeout = 30_000,
) => expect.poll(() => locator.isVisible(), { timeout }).toBe(true)

async function openMenu(page: Page, wanted: string) {
  // Who you are arrives after the page: wait until the menu offers it.
  await expect
    .poll(
      async () => {
        await page.getByRole('button', { name: 'Prototype actions' }).click()
        await page.getByRole('menuitem').first().waitFor()
        const found = await page
          .getByRole('menuitem', { name: wanted, exact: true })
          .isVisible()
        if (!found) {
          await page.keyboard.press('Escape')
          await expect.poll(() => page.getByRole('menu').count()).toBe(0)
        }
        return found
      },
      { timeout: 60_000 },
    )
    .toBe(true)
}

async function choose(page: Page, action: string) {
  await openMenu(page, action)
  await page.getByRole('menuitem', { name: action, exact: true }).click()
  await visible(page.getByRole('dialog'))
}

async function dismiss(page: Page) {
  await page.keyboard.press('Escape')
  await expect.poll(() => page.getByRole('dialog').count()).toBe(0)
}

scenario(
  '[PR-29] [PR-30] [PR-31] [PR-35] [PR-37] [PR-39] [PR-43] a prototype’s menu and its rename, duplicate and delete dialogs',
  async ({ page, url, step }) => {
    await page.goto(`${url}prototypes/${TREE}`)
    await visible(
      page.getByRole('link', { name: 'Details', exact: true }),
      120_000,
    )
    await openMenu(page, 'Rename')
    await step('The prototype menu')
    await page.keyboard.press('Escape')

    await choose(page, 'Rename')
    await step('The Rename dialog')
    await dismiss(page)

    await choose(page, 'Duplicate')
    await step('The Duplicate dialog')
    await page.getByRole('combobox', { name: 'System' }).click()
    await page.getByRole('option', { name: 'Endless Studios' }).click()
    await visible(page.getByRole('button', { name: 'Continue' }))
    await step('Duplicating into another system')
    await page.getByRole('button', { name: 'Continue' }).click()
    await visible(page.getByText('Create a copy for a system rebuild?'))
    await step('The rebuild copy confirmation')
    await dismiss(page)

    await choose(page, 'Delete')
    await step('The Delete dialog')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect.poll(() => page.getByRole('dialog').count()).toBe(0)

    await page.goto(`${url}prototypes/${SHELF}`)
    await visible(page.getByText('Archived', { exact: true }), 60_000)
    await openMenu(page, 'Restore')
    await step('An archived prototype and its menu')
  },
)
