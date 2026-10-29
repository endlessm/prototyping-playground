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

  test('[PR-12] [PR-16] only a registered contributor, running the studio locally, can create a prototype', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes`)
    await expect
      .poll(
        () =>
          page
            .getByRole('heading', { level: 1, name: 'Prototypes' })
            .isVisible(),
        { timeout: 60_000 },
      )
      .toBe(true)
    expect(
      await page.getByRole('button', { name: 'New prototype' }).count(),
    ).toBe(0)
    // The file service refuses too, and the deployed site has none.
    const reply = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Sneaky', system: null }),
      })
      return { status: response.status, text: await response.text() }
    }, `${studio.url}_studio/files/prototypes`)
    if (local) {
      expect(reply.status).toBe(403)
      expect(reply.text).toContain('Ask your agent to add you.')
    } else expect(reply.status).not.toBe(201)
  })
})
