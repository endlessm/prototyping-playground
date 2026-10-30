import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The Manual and Context & Skills in both studios, each with its own
// chapters and guidance (the new studio's are rewritten for the Endless
// team, so the text differs): the Manual's index, a chapter with sections in
// the sidebar, a chapter's right-click menu, then Context & Skills with a
// module branch open and a search.
scenario(
  '[PR-137] [PR-138] [PR-139] [PR-141] [PR-157] [PR-158] [PR-159] reading the Manual and Context & Skills',
  async ({ page, url, step }) => {
    const title = (name: string) =>
      page.getByRole('heading', { name, level: 1, exact: true })
    const tabs = page.getByRole('navigation', {
      name: 'Documentation sections',
    })

    await page.goto(`${url}documentation`)
    await expect
      .poll(() => title('Overview').isVisible(), { timeout: 120_000 })
      .toBe(true)
    await step('The Manual opens on its Overview')

    await page
      .getByRole('link', { name: 'Prototypes & systems' })
      .first()
      .click()
    await expect
      .poll(() => title('Prototypes & systems').isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    await step('A chapter, with "On this page"')

    await page
      .getByRole('link', { name: 'Overview', exact: true })
      .first()
      .click({ button: 'right' })
    await expect.poll(() => page.getByRole('menu').isVisible()).toBe(true)
    await step('A chapter’s right-click menu')
    await page.keyboard.press('Escape')

    await tabs.getByRole('link', { name: 'Context & Skills' }).click()
    await expect
      .poll(() => page.getByRole('region', { name: 'Modules' }).isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    await step('Context & Skills: the Platform and the modules')

    await page
      .getByRole('button', { name: 'Search', exact: true })
      .last()
      .click()
    await page
      .getByRole('textbox', { name: 'Search context and skills' })
      .or(page.getByRole('searchbox', { name: 'Search context and skills' }))
      .fill('prototype')
    await page.waitForTimeout(500)
    await step('Searching context and skills')
  },
)
