import type { Page } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixtures (tests/fixtures/parity): Bernardo's Drafts, Tracer,
// Plain, States and Screens. Nothing is created: the dialog is opened and
// cancelled.
const card = (page: Page, title: string) =>
  page.getByRole('listitem').filter({ hasText: title }).first()

scenario(
  '[PR-01] [PR-03] [PR-04] [PR-05] [PR-06] [PR-07] [PR-10] [PR-11] [PR-13] [SH-99] [SH-100] [SH-101] [SH-103] the prototypes gallery',
  async ({ page, url, step }) => {
    // Photos come from GitHub; both sides show initials instead.
    await page.route('https://github.com/**', (route) => route.abort())
    await page.goto(`${url}prototypes`)
    await expect
      .poll(() => card(page, 'Tracer').isVisible(), { timeout: 120_000 })
      .toBe(true)
    await step('The gallery as cards')

    await page.getByRole('button', { name: 'List' }).click()
    await expect
      .poll(() =>
        page.getByRole('button', { name: 'List' }).getAttribute('aria-pressed'),
      )
      .not.toBe('false')
    await step('The gallery as a list')
    await page.getByRole('button', { name: 'Cards' }).click()

    // React's box is a text field, ours a search field: both are labelled.
    await page.getByLabel('Search prototypes').fill('tra')
    await expect.poll(() => card(page, 'Plain').isVisible()).toBe(false)
    await step('Searching')

    await page.getByRole('button', { name: 'Filters' }).click()
    await expect
      .poll(() => page.getByRole('combobox', { name: 'System' }).isVisible())
      .toBe(true)
    await step('The system filter')
    await page.keyboard.press('Escape')

    await page.goto(`${url}prototypes?q=nothing-like-this`)
    await expect
      .poll(
        () => page.getByText('Try a different search or system.').isVisible(),
        {
          timeout: 60_000,
        },
      )
      .toBe(true)
    await step('No matches')

    await page.goto(`${url}prototypes`)
    await expect
      .poll(() => card(page, 'Tracer').isVisible(), { timeout: 60_000 })
      .toBe(true)
    await card(page, 'Tracer').hover()
    await page.getByRole('button', { name: 'Actions for Tracer' }).click()
    await expect
      .poll(() => page.getByRole('menuitem', { name: 'Copy link' }).isVisible())
      .toBe(true)
    await step('A card’s actions')
    await page.keyboard.press('Escape')
    // The open menu hides the rest of the page from assistive technology.
    await expect.poll(() => page.getByRole('menu').count()).toBe(0)

    // Only when the person running the studios is a contributor (both
    // studios resolve the same Git identity).
    const create = page.getByRole('button', { name: 'New prototype' })
    if (await create.count()) {
      await create.click()
      const dialog = page.getByRole('dialog', { name: 'New prototype' })
      // The dialog loads on first use, from a cold dev server.
      await expect
        .poll(
          () => dialog.getByRole('textbox', { name: 'Title' }).isVisible(),
          { timeout: 30_000 },
        )
        .toBe(true)
      await step('The New prototype dialog')
      await dialog.getByRole('button', { name: 'Cancel' }).click()
    }
  },
)

// Home lists your three newest: Screens, States and Drafts, not Tracer.
scenario('[PR-18] [SH-101] Home’s prototypes', async ({ page, url, step }) => {
  await page.goto(url)
  await expect
    .poll(
      () =>
        page
          .getByRole('link', { name: /Screens/ })
          .first()
          .isVisible(),
      {
        timeout: 120_000,
      },
    )
    .toBe(true)
  await step('Home with prototypes')
})
