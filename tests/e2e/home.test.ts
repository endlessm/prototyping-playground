import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const { name, tagline } = JSON.parse(readFileSync('studio.config.json', 'utf8'))

const targets = [
  { target: 'dev server', start: () => startDevServer() },
  { target: 'static build', start: () => startStaticSite('/studio-e2e/') },
]

describe.each(targets)('Home on the $target', ({ start }) => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('opens on Home, framed by the dashboard, showing the studio name', async () => {
    const page = await newPage()
    await page.goto(studio.url)
    await expect
      .poll(() => page.getByRole('heading', { level: 1, name }).isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(await page.getByText(tagline).first().isVisible()).toBe(true)
    expect(await page.getByRole('navigation').count()).toBeGreaterThan(0)
    expect(await page.title()).toBe(name)
  })
})
