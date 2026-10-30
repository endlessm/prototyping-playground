import { expect } from 'vitest'
import { scenario } from './setup/scenario'

scenario(
  '[SH-104] [SH-106] [SH-108] [SH-109] [SH-111] [SH-112] [SH-113] Studio settings',
  async ({ page, url, step }) => {
    await page.goto(`${url}settings`)
    await expect
      .poll(
        () =>
          page
            .getByRole('textbox', { name: 'Studio name', exact: true })
            .isVisible(),
        { timeout: 60000 },
      )
      .toBe(true)
    await step('General settings and role')
    await page
      .getByText('Disabling a module keeps its files and content.', {
        exact: true,
      })
      .scrollIntoViewIfNeeded()
    await step('Capabilities and required modules')
  },
)
