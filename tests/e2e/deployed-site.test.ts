import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startStaticSite } from './setup/studio'

const { name } = JSON.parse(readFileSync('studio.config.json', 'utf8'))
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf8'))
const BASE = '/team/studio/'
const PUBLIC_URL = 'https://studio.example.org/team/studio'

function homeHeading(page: Page) {
  return page.getByRole('heading', { level: 1, name })
}

// The address of the entry module the built page loads first.
async function entryUrl(url: string) {
  const html = await (await fetch(url)).text()
  return new URL(html.match(/<script type="module" src="([^"]+)"/)![1]!, url)
    .href
}

describe('the deployed site, built under a sub-path and served statically', () => {
  const newPage = useBrowser()
  let site: Awaited<ReturnType<typeof startStaticSite>>
  beforeAll(async () => {
    site = await startStaticSite(BASE, { STUDIO_PUBLIC_URL: PUBLIC_URL })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[CL-107] [CL-109] the build serves Home under the base path set by environment', async () => {
    expect(new URL(site.url).pathname).toBe(BASE)
    const page = await newPage()
    const assets: string[] = []
    page.on('request', (request) =>
      assets.push(new URL(request.url()).pathname),
    )
    await page.goto(site.url)
    await expect
      .poll(() => homeHeading(page).isVisible(), { timeout: 30_000 })
      .toBe(true)
    expect(assets.filter((asset) => !asset.startsWith(BASE))).toEqual([])
    expect(
      await page.locator('meta[property="og:url"]').getAttribute('content'),
    ).toBe(`${PUBLIC_URL}/`)
  })

  test('[CL-111] a deep link loads the app from the 404 copy, which reads the address', async () => {
    const page = await newPage()
    const response = await page.goto(`${site.url}prototypes/missing/view`)
    expect(response?.status()).toBe(404)
    await expect
      .poll(
        () => page.getByText('/prototypes/missing/view').first().isVisible(),
        {
          timeout: 30_000,
        },
      )
      .toBe(true)
    expect(new URL(page.url()).pathname).toBe(`${BASE}prototypes/missing/view`)
  })

  test('[CL-112] a page whose entry file was removed reloads once and then opens', async () => {
    const page = await newPage()
    const entry = await entryUrl(site.url)
    let failures = 0
    await page.route(entry, (route) => {
      if (failures++ === 0) return route.fulfill({ status: 404, body: '' })
      return route.continue()
    })
    await page.goto(`${site.url}?view=main#details`)
    await expect
      .poll(() => homeHeading(page).isVisible(), { timeout: 30_000 })
      .toBe(true)
    const url = new URL(page.url())
    expect(url.searchParams.get('_studio_reload')).toBeTruthy()
    expect(url.searchParams.get('view')).toBe('main')
    expect(url.hash).toBe('#details')
  })

  test('[CL-112] when the file stays missing it reloads at most once, then says so', async () => {
    const page = await newPage()
    const entry = await entryUrl(site.url)
    await page.route(entry, (route) => route.fulfill({ status: 404, body: '' }))
    const documents: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents.push(request.url())
    })
    await page.goto(site.url)
    await expect
      .poll(() => page.getByText(en.deployment.unavailable).isVisible(), {
        timeout: 30_000,
      })
      .toBe(true)
    expect(documents).toHaveLength(2)
  })

  test('[CL-112] an offline page never reloads itself', async () => {
    const page = await newPage()
    const entry = await entryUrl(site.url)
    await page.route(entry, (route) => route.fulfill({ status: 404, body: '' }))
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'onLine', { get: () => false }),
    )
    const documents: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents.push(request.url())
    })
    await page.goto(site.url)
    await expect
      .poll(() => page.getByText(en.deployment.unavailable).isVisible(), {
        timeout: 30_000,
      })
      .toBe(true)
    expect(documents).toHaveLength(1)
  })

  test('[CL-114] build inspection reports the startup weight of the real build', () => {
    const result = spawnSync(
      process.execPath,
      ['tooling/inspect-build.ts', site.directory],
      { env: { ...process.env, STUDIO_BASE_PATH: BASE }, encoding: 'utf8' },
    )
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(
      /Initial JavaScript\/CSS: [1-9]\d* files, [\d.]+ KiB raw, [\d.]+ KiB gzip\. All emitted file references exist\./,
    )
  })
})
