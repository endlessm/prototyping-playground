import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const { name, tagline } = JSON.parse(readFileSync('studio.config.json', 'utf8'))

// Nobody is registered, so the heading is the studio's name.
const nobody = mkdtempSync(path.join(os.tmpdir(), 'studio-home-e2e-'))
const env = { STUDIO_CONTRIBUTORS: nobody, STUDIO_GITHUB: '' }
afterAll(() => {
  rmSync(nobody, { recursive: true, force: true })
})

const targets = [
  { target: 'dev server', local: true, start: () => startDevServer(env) },
  {
    target: 'static build',
    local: false,
    start: () => startStaticSite('/studio-e2e/', env),
  },
]

describe.each(targets)('Home on the $target', ({ local, start }) => {
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
    // The tagline is for visitors to the deployed site.
    expect(await page.getByText(tagline).count()).toBe(local ? 0 : 1)
    expect(await page.getByRole('navigation').count()).toBeGreaterThan(0)
    expect(await page.title()).toBe(name)
  })
})
