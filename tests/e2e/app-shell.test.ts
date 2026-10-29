import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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

// The studio's frame, Home and app-wide behavior, with two fixture modules:
// Garden, a section with its own navigation, and Diary, which is local only.
const folder = mkdtempSync(path.join(os.tmpdir(), 'studio-shell-e2e-'))
const config = path.join(folder, 'studio.config.json')
// An empty contributors folder, apart from the configuration.
const nobody = path.join(folder, 'contributors')
mkdirSync(nobody)
const { name, tagline, ...base } = JSON.parse(
  readFileSync('studio.config.json', 'utf8'),
)
writeFileSync(
  config,
  JSON.stringify({
    ...base,
    name,
    tagline,
    modules: { garden: true, diary: true },
  }),
)
const env = {
  STUDIO_CONFIG: config,
  STUDIO_MODULES: 'tests/fixtures/shell-modules',
  // Nobody is registered, so Home names the studio.
  STUDIO_CONTRIBUTORS: nobody,
  STUDIO_GITHUB: '',
}

afterAll(() => {
  rmSync(folder, { recursive: true, force: true })
})

const rail = (page: Page) => page.getByRole('navigation', { name: 'Main' })
const sectionNav = (page: Page) =>
  page.getByRole('complementary', { name: 'Garden' })
const resizeHandle = (page: Page) =>
  page.getByRole('separator', { name: 'Resize garden' })

async function open(page: Page, url: string) {
  await page.goto(url)
  await expect
    .poll(() => rail(page).isVisible(), { timeout: 60_000 })
    .toBe(true)
}

const htmlClass = (page: Page) =>
  page.evaluate(() => document.documentElement.className)

describe('the studio frame on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[SH-01] [SH-32] every page has the Main rail beside it; the page scrolls, the window never does', async () => {
    const page = await newPage()
    await page.setViewportSize({ width: 1280, height: 600 })
    await open(page, `${studio.url}garden/rose`)
    await expect
      .poll(() => page.getByRole('heading', { name: 'Rose' }).isVisible())
      .toBe(true)
    // The fixture's page is taller than the window.
    const sizes = await page.evaluate(() => ({
      window: window.innerHeight,
      document: document.documentElement.scrollHeight,
    }))
    expect(sizes.document).toBe(sizes.window)
    for (const label of [name, 'Search (Ctrl+K)', 'Color mode'])
      expect(await rail(page).getByLabel(label).count()).toBe(1)
  })

  test('[SH-02] [SH-15] [SH-94] [SH-96] Home has the studio’s name in its tab, the name as heading for someone unregistered, and the search field', async () => {
    const page = await newPage()
    await open(page, studio.url)
    expect(await page.title()).toBe(name)
    await expect
      .poll(() => page.getByRole('heading', { level: 1 }).textContent())
      .toBe(name)
    const search = page.getByRole('button', { name: /Search the studio/ })
    expect(await search.isVisible()).toBe(true)
    expect(await search.textContent()).toContain('Ctrl+K')
  })

  test('[SH-97] [SH-98] [SH-23] each module adds its block; a heading links to its page and an empty block shows a hint', async () => {
    const page = await newPage()
    await open(page, studio.url)
    const garden = page.getByRole('region', { name: 'Garden' })
    await expect.poll(() => garden.isVisible()).toBe(true)
    expect(await garden.getByRole('link', { name: 'Rose' }).count()).toBe(1)
    const diary = page.getByRole('region', { name: 'Diary' })
    expect(await diary.getByText('Nothing written yet.').isVisible()).toBe(true)
    // Locally your own work (the diary) comes first.
    const headings = await page
      .getByRole('heading', { level: 2 })
      .allTextContents()
    expect(headings.map((text) => text.trim())).toEqual(['Diary', 'Garden'])
    await garden.getByRole('link', { name: 'Garden' }).click()
    await expect.poll(() => page.url()).toBe(`${studio.url}garden`)
  })

  test('[SH-24] [SH-58] the logo returns Home, with a tooltip to its right naming the studio', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden`)
    const logo = rail(page).getByRole('link', { name })
    await logo.hover()
    const tooltip = page
      .locator('[data-slot="content"][data-side="right"]')
      .filter({ hasText: name })
    await expect.poll(() => tooltip.isVisible()).toBe(true)
    const [link, tip] = await Promise.all([
      logo.boundingBox(),
      tooltip.boundingBox(),
    ])
    expect(tip!.x).toBeGreaterThanOrEqual(link!.x + link!.width)
    await logo.click()
    await expect.poll(() => page.url()).toBe(studio.url)
  })

  test('[SH-26] a module’s rail button is marked as the current page anywhere in its section', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden/tulip`)
    const button = rail(page).getByRole('link', { name: 'Garden' })
    await expect.poll(() => button.getAttribute('aria-current')).toBe('page')
    await open(page, studio.url)
    expect(await button.getAttribute('aria-current')).toBe(null)
  })

  test('[SH-28] [SH-33] [SH-38] the navigation toggle is on the rail only where a section has navigation', async () => {
    const page = await newPage()
    await open(page, studio.url)
    const hide = rail(page).getByRole('button', {
      name: 'Hide navigation (Ctrl+;)',
    })
    expect(await hide.count()).toBe(0)
    await rail(page).getByRole('link', { name: 'Garden' }).click()
    await expect.poll(() => sectionNav(page).isVisible()).toBe(true)
    expect(
      await sectionNav(page).getByRole('link', { name: 'Tulip' }).count(),
    ).toBe(1)
    await hide.click()
    await expect.poll(() => sectionNav(page).count()).toBe(0)
    const show = rail(page).getByRole('button', {
      name: 'Show navigation (Ctrl+;)',
    })
    await show.click()
    await expect.poll(() => sectionNav(page).isVisible()).toBe(true)
  })

  test('[SH-34] [SH-47] Ctrl+; hides the navigation for every section and the browser remembers it', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden`)
    await expect.poll(() => sectionNav(page).isVisible()).toBe(true)
    await page.keyboard.press('Control+;')
    await expect.poll(() => sectionNav(page).count()).toBe(0)
    await page.reload()
    await expect.poll(() => rail(page).isVisible()).toBe(true)
    expect(
      await rail(page)
        .getByRole('button', { name: 'Show navigation (Ctrl+;)' })
        .isVisible(),
    ).toBe(true)
    expect(await sectionNav(page).count()).toBe(0)
    // Not while typing in a text field.
    await page.getByRole('textbox', { name: 'Search the garden' }).focus()
    await page.keyboard.press('Control+;')
    expect(await sectionNav(page).count()).toBe(0)
    await page.evaluate(() => (document.activeElement as HTMLElement).blur())
    await page.keyboard.press('Control+;')
    await expect.poll(() => sectionNav(page).isVisible()).toBe(true)
  })

  test('[SH-35] [SH-36] the navigation resizes from the keyboard between 180 and 420 px and remembers its width', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden`)
    // The edge is a line, so it has no width of its own.
    const handle = resizeHandle(page)
    await expect.poll(() => handle.count()).toBe(1)
    const width = async () =>
      Math.round((await sectionNav(page).boundingBox())!.width)
    expect(await handle.getAttribute('aria-valuenow')).toBe('220')
    expect(await handle.getAttribute('title')).toBe(
      'Drag to resize. Double-click to reset.',
    )
    await handle.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(width).toBe(228)
    await page.keyboard.press('Shift+ArrowRight')
    await expect.poll(width).toBe(252)
    await page.keyboard.press('ArrowLeft')
    await expect.poll(width).toBe(244)
    await page.keyboard.press('End')
    await expect.poll(width).toBe(420)
    await page.keyboard.press('Home')
    await expect.poll(width).toBe(180)
    await page.keyboard.press('Shift+ArrowRight')
    await page.reload()
    await expect.poll(() => sectionNav(page).isVisible()).toBe(true)
    expect(await width()).toBe(204)
    await resizeHandle(page).focus()
    await page.keyboard.press('Enter')
    await expect.poll(width).toBe(220)
    await page.keyboard.press('End')
    await expect.poll(width).toBe(420)
    const edge = (await resizeHandle(page).boundingBox())!
    await page.mouse.dblclick(edge.x, edge.y + edge.height / 2)
    await expect.poll(width).toBe(220)
  })

  test('[SH-35] dragging the edge resizes the navigation and keeps the resize cursor', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden`)
    const box = (await resizeHandle(page).boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 60, y, { steps: 4 })
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe('col-resize')
    await page.mouse.up()
    await expect
      .poll(async () =>
        Math.round((await sectionNav(page).boundingBox())!.width),
      )
      .toBe(280)
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe('auto')
  })

  test('[SH-31] [SH-51] [SH-53] [SH-143] [CL-113] color mode offers System, Light and Dark and applies the choice before the first paint', async () => {
    const page = await newPage()
    await page.emulateMedia({ colorScheme: 'light' })
    // What the root element holds at the first frame, before anything paints.
    await page.addInitScript(() => {
      requestAnimationFrame(() => {
        ;(window as unknown as { firstFrame: string }).firstFrame =
          document.documentElement.className
      })
    })
    await open(page, studio.url)
    expect(await htmlClass(page)).not.toContain('dark')
    await rail(page).getByRole('button', { name: 'Color mode' }).click()
    const choices = page.getByRole('menuitemcheckbox')
    expect(
      (await choices.allTextContents()).map((text) => text.trim()),
    ).toEqual(['System', 'Light', 'Dark'])
    await page.getByRole('menuitemcheckbox', { name: 'Dark' }).click()
    await expect.poll(() => htmlClass(page)).toContain('dark')
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
    ).toBe('dark')
    expect(
      await page.evaluate(() =>
        localStorage.getItem('design-studio:color-mode'),
      ),
    ).toBe('dark')
    await page.reload()
    await expect.poll(() => rail(page).isVisible()).toBe(true)
    expect(
      await page.evaluate(
        () => (window as unknown as { firstFrame: string }).firstFrame,
      ),
    ).toContain('dark')
  })

  test('[SH-51] System follows the computer again, including live changes', async () => {
    const page = await newPage()
    await page.emulateMedia({ colorScheme: 'light' })
    await page.addInitScript(() =>
      localStorage.setItem('design-studio:color-mode', 'dark'),
    )
    await open(page, studio.url)
    await expect.poll(() => htmlClass(page)).toContain('dark')
    await rail(page).getByRole('button', { name: 'Color mode' }).click()
    await page.getByRole('menuitemcheckbox', { name: 'System' }).click()
    await expect.poll(() => htmlClass(page)).not.toContain('dark')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(() => htmlClass(page)).toContain('dark')
  })

  test('[SH-52] switching mode cross-fades, except when reduced motion is preferred', async () => {
    const transitions = async (reducedMotion: 'reduce' | 'no-preference') => {
      const page = await newPage()
      await page.emulateMedia({ reducedMotion, colorScheme: 'light' })
      await page.addInitScript(() => {
        const original = document.startViewTransition?.bind(document)
        const counted = window as unknown as { transitions: number }
        counted.transitions = 0
        document.startViewTransition = ((update: () => void) => {
          counted.transitions++
          return original!(update)
        }) as typeof document.startViewTransition
      })
      await open(page, studio.url)
      await rail(page).getByRole('button', { name: 'Color mode' }).click()
      await page.getByRole('menuitemcheckbox', { name: 'Dark' }).click()
      await expect.poll(() => htmlClass(page)).toContain('dark')
      return page.evaluate(
        () => (window as unknown as { transitions: number }).transitions,
      )
    }
    expect(await transitions('no-preference')).toBe(1)
    expect(await transitions('reduce')).toBe(0)
  })

  test('[SH-50] shortcut labels show ⌘ on Apple computers', async () => {
    const page = await newPage()
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'userAgent', {
        get: () =>
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }),
    )
    await open(page, `${studio.url}garden`)
    expect(await rail(page).getByLabel('Search (⌘K)').count()).toBe(1)
    expect(
      await rail(page)
        .getByRole('button', { name: 'Hide navigation (⌘;)' })
        .count(),
    ).toBe(1)
  })

  test('[SH-30] [SH-16] [SH-02] the settings gear opens Studio settings, highlighted, with its tab title', async () => {
    const page = await newPage()
    await open(page, studio.url)
    const gear = rail(page).getByRole('link', { name: 'Studio settings' })
    await gear.click()
    await expect.poll(() => page.url()).toBe(`${studio.url}settings`)
    await expect.poll(() => page.title()).toBe(`Studio settings — ${name}`)
    expect(await gear.getAttribute('aria-current')).toBe('page')
  })

  test('[SH-29] [SH-23] a local-only module has its rail button locally', async () => {
    const page = await newPage()
    await open(page, studio.url)
    expect(await rail(page).getByRole('link', { name: 'Diary' }).count()).toBe(
      1,
    )
  })

  test('[SH-08] [PR-25] an unknown address is not found, inside the frame', async () => {
    const page = await newPage()
    await open(page, `${studio.url}no/such/page`)
    await expect
      .poll(() => page.getByText('Page not found').isVisible())
      .toBe(true)
    expect(
      await page.getByText('There’s nothing at this address.').isVisible(),
    ).toBe(true)
    expect(
      await page
        .getByText('If it was archived, it isn’t on the deployed site.', {
          exact: false,
        })
        .count(),
    ).toBe(0)
    await page.getByRole('link', { name: 'View all prototypes' }).click()
    await expect.poll(() => page.url()).toBe(`${studio.url}prototypes`)
  })

  test('[SH-06] [SH-07] [PR-24] a slow page keeps the current one on screen and shows “Opening page” after 0.2 s', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden/rose`)
    await expect
      .poll(() => page.getByRole('heading', { name: 'Rose' }).isVisible())
      .toBe(true)
    await sectionNav(page).getByRole('link', { name: 'Slow' }).click()
    const badge = page.getByRole('status').filter({ hasText: 'Opening page' })
    await expect.poll(() => badge.isVisible()).toBe(true)
    expect(await page.getByRole('heading', { name: 'Rose' }).isVisible()).toBe(
      true,
    )
    await expect
      .poll(() => page.getByRole('heading', { name: 'Slow' }).isVisible(), {
        timeout: 10_000,
      })
      .toBe(true)
    expect(await badge.count()).toBe(0)
  })

  test('[SH-07] a quick page shows no badge', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden/rose`)
    await page.evaluate(() => {
      const seen = window as unknown as { badge: boolean }
      seen.badge = false
      new MutationObserver(() => {
        if (document.body.textContent?.includes('Opening page'))
          seen.badge = true
      }).observe(document.body, { subtree: true, childList: true })
    })
    await sectionNav(page).getByRole('link', { name: 'Tulip' }).click()
    await expect
      .poll(() => page.getByRole('heading', { name: 'Tulip' }).isVisible())
      .toBe(true)
    expect(
      await page.evaluate(
        () => (window as unknown as { badge: boolean }).badge,
      ),
    ).toBe(false)
  })

  test('[SH-10] [PR-26] a page that fails to load says so, with its error and Try again', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden/flaky`)
    const alert = page.getByRole('alert')
    await expect
      .poll(() => alert.getByText('This page couldn’t load.').isVisible())
      .toBe(true)
    expect(
      await alert.getByText('The flaky bed is not ready.').isVisible(),
    ).toBe(true)
    // The frame stays.
    expect(await rail(page).isVisible()).toBe(true)
    await alert.getByRole('button', { name: 'Try again' }).click()
    await expect
      .poll(() =>
        page.getByRole('heading', { name: 'Flaky', exact: true }).isVisible(),
      )
      .toBe(true)
  })

  test('[SH-11] a file page that crashes offers its error to copy', async () => {
    const page = await newPage()
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    await open(page, `${studio.url}garden/broken`)
    const alert = page.getByRole('alert')
    await expect
      .poll(() =>
        alert
          .getByText(
            'This page couldn’t load. Copy the error and give it to your agent.',
          )
          .isVisible(),
      )
      .toBe(true)
    expect(
      await alert.getByText('The broken bed has no soil.').isVisible(),
    ).toBe(true)
    await alert.getByRole('button', { name: 'Copy error' }).click()
    await expect
      .poll(() => alert.getByRole('button', { name: 'Copied' }).isVisible())
      .toBe(true)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      'The broken bed has no soil.',
    )
  })

  test('[SH-57] messages appear at the bottom-right and close themselves', async () => {
    const page = await newPage()
    await open(page, `${studio.url}garden/rose`)
    await page.getByRole('button', { name: 'Water the rose' }).click()
    const toast = page.getByRole('listitem').filter({ hasText: 'Rose watered' })
    await expect.poll(() => toast.isVisible()).toBe(true)
    const box = (await toast.boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.x + box.width).toBeGreaterThan(viewport.width - 64)
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 64)
    await expect.poll(() => toast.count(), { timeout: 8_000 }).toBe(0)
  })
})

describe('the studio from another device on the network', () => {
  const newPage = useBrowser()
  const address = Object.values(os.networkInterfaces())
    .flat()
    .find(
      (entry) => entry && entry.family === 'IPv4' && !entry.internal,
    )?.address
  let studio: RunningStudio | undefined
  beforeAll(async () => {
    if (address) studio = await startDevServer(env, { host: '0.0.0.0' })
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test.skipIf(!address)(
    '[SH-144] over plain http on the local network, copying, unique IDs and hashing still work',
    async () => {
      const page = await newPage()
      const url = studio!.url.replace('127.0.0.1', address!)
      await open(page, `${url}garden/rose`)
      await expect
        .poll(() => page.getByRole('heading', { name: 'Rose' }).isVisible())
        .toBe(true)
      const result = await page.evaluate(async () => ({
        secure: window.isSecureContext,
        uuid: crypto.randomUUID(),
        digest: [
          ...new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode('studio'),
            ),
          ),
        ]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join(''),
        clipboard: typeof navigator.clipboard?.writeText,
      }))
      expect(result.secure).toBe(false)
      expect(result.uuid).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.digest).toBe(
        createHash('sha256').update('studio').digest('hex'),
      )
      expect(result.clipboard).toBe('function')
    },
  )
})

describe('the studio frame on the deployed site', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startStaticSite('/studio-shell/', env)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[SH-95] [SH-97] Home shows the studio name, the tagline and what colleagues come for first', async () => {
    const page = await newPage()
    await open(page, studio.url)
    await expect
      .poll(() => page.getByRole('heading', { level: 1 }).textContent())
      .toBe(name)
    expect(await page.getByText(tagline).isVisible()).toBe(true)
    const headings = await page
      .getByRole('heading', { level: 2 })
      .allTextContents()
    expect(headings.map((text) => text.trim())).toEqual(['Garden'])
  })

  test('[SH-23] [SH-29] [SH-30] local-only modules and settings are absent', async () => {
    const page = await newPage()
    await open(page, studio.url)
    expect(await rail(page).getByRole('link', { name: 'Diary' }).count()).toBe(
      0,
    )
    expect(
      await rail(page).getByRole('link', { name: 'Studio settings' }).count(),
    ).toBe(0)
    await open(page, `${studio.url}settings`)
    await expect
      .poll(() => page.getByText('Page not found').isVisible())
      .toBe(true)
    await open(page, `${studio.url}diary`)
    await expect
      .poll(() => page.getByText('Page not found').isVisible())
      .toBe(true)
  })

  test('[SH-03] [CL-110] the page names Endless Design Studio, with its icons and a link preview for the Endless team', async () => {
    const page = await newPage()
    await open(page, studio.url)
    const head = await page.evaluate(() => {
      const meta = (selector: string) =>
        document.querySelector(selector)?.getAttribute('content')
      return {
        description: meta('meta[name="description"]'),
        title: meta('meta[property="og:title"]'),
        preview: meta('meta[property="og:description"]'),
        image: meta('meta[property="og:image"]'),
        icons: [...document.querySelectorAll('link[rel~="icon"]')].map(
          (link) => (link as HTMLLinkElement).href,
        ),
        touch: (
          document.querySelector('link[rel="apple-touch-icon"]') as
            HTMLLinkElement | undefined
        )?.href,
      }
    })
    expect(head.title).toBe(`${name}: ${tagline}`)
    expect(head.description).toContain('Endless team')
    expect(head.preview).toBe(head.description)
    expect(head.description).not.toMatch(/open source|Patrick/i)
    for (const url of [
      ...head.icons,
      head.touch!,
      new URL(head.image!, studio.url).href,
    ])
      expect((await fetch(url)).status, url).toBe(200)
    // Patrick's brand material is gone.
    for (const file of [
      'brand/design-studio-light.svg',
      'images/design-studio-social.png',
    ])
      expect((await fetch(`${studio.url}${file}`)).status, file).toBe(404)
  })

  test('[SH-09] [PR-25] not found adds that archived work isn’t on the deployed site', async () => {
    const page = await newPage()
    await open(page, `${studio.url}no/such/page`)
    await expect
      .poll(() =>
        page
          .getByText(
            'If it was archived, it isn’t on the deployed site. Run the studio locally to open it.',
          )
          .isVisible(),
      )
      .toBe(true)
  })

  test('[SH-04] [SH-05] a page’s code is loaded before its link is clicked, and it opens at a clean address under the base path', async () => {
    const page = await newPage()
    // The studio prefetches its pages while idle; hovering a link loads one
    // that isn't there yet.
    const before = new Set<string>()
    const code: string[] = []
    let clicked = false
    page.on('request', (request) => {
      if (!request.url().endsWith('.js')) return
      if (clicked) code.push(request.url())
      else before.add(request.url())
    })
    await open(page, studio.url)
    await page.waitForLoadState('networkidle')
    const garden = rail(page).getByRole('link', { name: 'Garden' })
    await garden.hover()
    await page.waitForLoadState('networkidle')
    clicked = true
    await garden.click()
    await expect
      .poll(() => page.getByRole('heading', { name: 'The garden' }).isVisible())
      .toBe(true)
    expect(page.url()).toBe(`${studio.url}garden`)
    // Imported from what was already fetched.
    expect(code.filter((url) => !before.has(url))).toEqual([])
  })
})
