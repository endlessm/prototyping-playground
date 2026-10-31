import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// A system's Context and Skills in its navigation, as an Admin: on this
// computer both studios recognise Bernardo through the GitHub CLI. Context
// has one document, Skills none. Every menu and dialog is dismissed, so
// nothing changes; the browser scenarios (tests/e2e/system-trees.test.ts)
// make the changes.
const ENDLESS = '8x5spen6xtvp96a9'

const visible = (
  locator: { isVisible: () => Promise<boolean> },
  timeout = 30_000,
) => expect.poll(() => locator.isVisible(), { timeout }).toBe(true)

scenario(
  '[SH-93] [SY-124] [SY-125] Context and Skills as trees, with New and the New skill dialog',
  async ({ page, url, step }) => {
    await page.goto(`${url}systems/${ENDLESS}/context`)
    await visible(page.getByText('Empty folder').first(), 120_000)
    // "+" shows once the studio knows who you are: Context's, then Skills'.
    const add = page.getByRole('button', { name: 'New', exact: true })
    await visible(add.nth(1), 120_000)
    await step('Context and Skills in the navigation')

    await add.first().click()
    await visible(page.getByRole('menuitem', { name: 'New document' }))
    await step('Context’s New menu')
    await page.keyboard.press('Escape')
    await expect.poll(() => page.getByRole('menu').count()).toBe(0)

    await add.nth(1).click()
    const dialog = page.getByRole('dialog')
    await visible(dialog)
    await step('The New skill dialog')
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Review')
    await visible(dialog.getByText(/lowercase letters/))
    await step('A skill name that breaks the rules')
    await page.keyboard.press('Escape')
    await expect.poll(() => page.getByRole('dialog').count()).toBe(0)
  },
)
