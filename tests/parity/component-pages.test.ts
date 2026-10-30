import type { Page } from 'playwright'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// Both studios have the real Endless Studios system, with its Button and
// Card pages.
const ENDLESS = '8x5spen6xtvp96a9'

const shows = (locator: { isVisible: () => Promise<boolean> }) =>
  expect.poll(() => locator.isVisible(), { timeout: 120_000 }).toBe(true)

// The first example's text. The new studio renders each example in the
// system's preview document (an iframe); the React studio renders it inline.
const firstExample = (page: Page, side: string, text: string) =>
  side === 'vue'
    ? page.locator('iframe').first().contentFrame().getByText(text).first()
    : page.getByText(text).first()

scenario(
  '[SY-103] [SY-105] [SY-106] [SY-108] [SY-110] [SY-167] [SY-168] reading component pages',
  async ({ page, url, side, step }) => {
    await page.goto(`${url}systems/${ENDLESS}/components/button`)
    await shows(page.getByRole('heading', { name: 'Button', exact: true }))
    await shows(firstExample(page, side, 'Invite Learners'))
    await step('The Button page')

    await page.getByRole('button', { name: 'Show code' }).click()
    await page.getByRole('button', { name: /^Props/ }).click()
    await shows(page.getByRole('columnheader', { name: 'Type' }))
    await step('Button with its code and props open')

    await page.goto(`${url}systems/${ENDLESS}/components/card`)
    await shows(page.getByRole('heading', { name: 'Card', exact: true }))
    await shows(firstExample(page, side, 'Game Design Foundations'))
    await step('The Card page')
  },
)
