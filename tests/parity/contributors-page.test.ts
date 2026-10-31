import { expect } from 'vitest'
import { scenario } from './setup/scenario'
scenario(
  '[SH-123] [SH-124] [SH-125] [SH-126] Contributors and access levels',
  async ({ page, url, step }) => {
    await page.goto(`${url}contributors`)
    await expect
      .poll(
        () =>
          page
            .getByRole('link', { name: 'Bernardo Campos', exact: true })
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    await expect
      .poll(
        () =>
          page
            .getByRole('heading', { name: 'Contributors', exact: true })
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    await expect
      .poll(
        () =>
          page
            .getByRole('heading', { name: 'Access levels', exact: true })
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    await step('Contributors and access levels')
  },
)
