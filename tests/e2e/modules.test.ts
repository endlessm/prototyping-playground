import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

// The studio runs with the fixture modules and a configuration of its own,
// so the scenario can switch the sample module without touching the real
// studio.
const folder = mkdtempSync(path.join(os.tmpdir(), 'studio-modules-e2e-'))
const config = path.join(folder, 'studio.config.json')
const env = {
  STUDIO_CONFIG: config,
  STUDIO_MODULES: 'tests/fixtures/modules',
}

function switchSample(on: boolean) {
  const base = JSON.parse(readFileSync('studio.config.json', 'utf8'))
  writeFileSync(config, JSON.stringify({ ...base, modules: { sample: on } }))
}

const rail = (page: Page) => page.getByRole('navigation', { name: 'Main' })

afterAll(() => {
  rmSync(folder, { recursive: true, force: true })
})

describe('a module switched on and off on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio | undefined
  afterAll(async () => {
    await studio?.stop()
  })

  test('[SH-146] [CL-118] an enabled module shows its rail button, its page and its build data', async () => {
    switchSample(true)
    studio = await startDevServer(env)
    const page = await newPage()
    await page.goto(studio.url)
    const button = rail(page).getByRole('link', { name: 'Sample' })
    await expect.poll(() => button.isVisible(), { timeout: 60_000 }).toBe(true)
    await button.click()
    await expect.poll(() => page.url()).toBe(`${studio.url}sample`)
    const notes = page.getByRole('list', { name: 'Sample' })
    await expect
      .poll(() => notes.getByRole('listitem').allTextContents(), {
        timeout: 30_000,
      })
      .toEqual(['first.md', 'second.md'])
  }, 300_000)

  test('[CL-118] build data is served to the studio’s own pages only', async () => {
    const url = `${studio!.url}_studio/data/sample/notes`
    const own = await fetch(url, {
      headers: { 'sec-fetch-site': 'same-origin' },
    })
    expect(own.status).toBe(200)
    expect(await own.json()).toEqual(['first.md', 'second.md'])
    const other = await fetch(url, {
      headers: { 'sec-fetch-site': 'cross-site' },
    })
    expect(other.status).toBe(403)
  })

  test('[SH-146] a disabled module loses its rail button and page after a restart', async () => {
    await studio!.stop()
    switchSample(false)
    studio = await startDevServer(env)
    const page = await newPage()
    await page.goto(studio.url)
    const { name } = JSON.parse(readFileSync(config, 'utf8'))
    await expect
      .poll(() => page.getByRole('heading', { level: 1, name }).isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(await rail(page).getByRole('link', { name: 'Sample' }).count()).toBe(
      0,
    )
    await page.goto(`${studio.url}sample`)
    await expect
      .poll(
        () =>
          page
            .getByText(/not found/i)
            .first()
            .isVisible(),
        {
          timeout: 30_000,
        },
      )
      .toBe(true)
    expect(await page.getByRole('list', { name: 'Sample' }).count()).toBe(0)
  }, 300_000)
})

describe('module build data in the static build', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    switchSample(true)
    studio = await startStaticSite('/studio-e2e/', env)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[CL-118] the build computes a module’s data into files the page loads', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}sample`)
    const notes = page.getByRole('list', { name: 'Sample' })
    await expect
      .poll(() => notes.getByRole('listitem').allTextContents(), {
        timeout: 30_000,
      })
      .toEqual(['first.md', 'second.md'])
  })
})
