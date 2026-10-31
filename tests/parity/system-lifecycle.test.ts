import type { Page } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The Systems collection's New system dialog and a system's menu with its
// rename and archive dialogs, as an Admin: on this computer both studios
// recognise Bernardo through the GitHub CLI. Every dialog is cancelled, so
// nothing changes; the browser scenarios (tests/e2e/system-lifecycle.test.ts)
// carry the changes out. Endless Studios is the default system on both
// sides, so archiving it is refused.
const visible = (
  locator: { isVisible: () => Promise<boolean> },
  timeout = 30_000,
) => expect.poll(() => locator.isVisible(), { timeout }).toBe(true)

async function openMenu(page: Page, wanted: string) {
  const trigger = page
    .getByRole('button', { name: 'Actions for Endless Studios' })
    .first()
  // Who you are arrives after the page: wait until the menu offers it.
  await expect
    .poll(
      async () => {
        await trigger.click()
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

async function dismiss(page: Page) {
  await page.keyboard.press('Escape')
  await expect.poll(() => page.getByRole('dialog').count()).toBe(0)
}

scenario(
  '[SY-20] [SY-21] [SY-41] [SY-45] [SY-48] [SY-50] the New system dialog and a system’s menu and dialogs',
  async ({ page, url, step }) => {
    await page.goto(`${url}systems`)
    const create = page.getByRole('button', { name: 'New system' })
    await visible(create, 120_000)
    await step('The Systems collection, with New system')

    await create.click()
    await visible(page.getByRole('dialog'))
    await step('The New system dialog')
    await dismiss(page)

    await openMenu(page, 'Rename')
    await step('A system’s menu (the default system)')
    await page.getByRole('menuitem', { name: 'Archive', exact: true }).click()
    await visible(page.getByRole('dialog'))
    await step('Archiving the default system is refused')
    await dismiss(page)

    await openMenu(page, 'Rename')
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click()
    await visible(page.getByRole('dialog'))
    await step('The Rename system dialog')
    await dismiss(page)
  },
)
