import { readFileSync } from 'node:fs'
import type { FrameLocator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

// A view renders in the preview document: a same-origin iframe holding only
// its system's app. The fixture studio has a prototype assigned to Endless
// Studios and one with no system.
const { name } = JSON.parse(readFileSync('studio.config.json', 'utf8'))
// Run as nobody, whoever runs the tests: Home's blocks depend on who you are.
const env = {
  STUDIO_PROTOTYPES: 'tests/fixtures/prototypes',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: '',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: '',
}

const TRACER = 'tracer0000000001'
const HOME = 'vhme000000000001'
const NOTES = 'vnts000000000001'
const PLAIN = 'p1a1n00000000001'
const PLAIN_VIEW = 'vp1an00000000001'
const DRAFTS = 'drafts0000000001'
const BLANK = 'b1ank00000000002'

// Endless Studios' primary colour (`--color-orange-500` in the app's
// stylesheet) and Nuxt UI's neutral primary (neutral-500), the studio's.
const APP_ORANGE = 'rgb(255, 105, 0)'
const STUDIO_NEUTRAL = 'oklch(0.556 0 none)'
// Where a preview document's styles come from: its built files, or in
// development the generated entry of its own pipeline.
const PREVIEW_STYLES = /\/_preview\/|\/studio-preview\//
const PREVIEW_STYLES_OR_COLOURS =
  /\/_preview\/|\/studio-preview\/|^#nuxt-ui-colors$/

const background = (locator: ReturnType<FrameLocator['locator']>) =>
  locator.evaluate((element) => getComputedStyle(element).backgroundColor)

/** What a document holds of the studio: its Nuxt runtime and stylesheets. */
function studioTraces() {
  return {
    nuxt: Boolean(
      (window as unknown as { __NUXT__?: unknown }).__NUXT__ ||
      document.getElementById('__nuxt') ||
      document.querySelector('[data-nuxt-data], #__NUXT_DATA__'),
    ),
    // Built files have an address; development styles name their source.
    // Nuxt UI writes its runtime colours into a <style id="nuxt-ui-colors">.
    stylesheets: [...document.styleSheets].map(
      (sheet) =>
        sheet.href ??
        (sheet.ownerNode as HTMLElement | null)?.dataset.viteDevId ??
        `#${(sheet.ownerNode as HTMLElement | null)?.id ?? ''}`,
    ),
    colorMode: document.documentElement.classList.contains('dark'),
  }
}

async function preview(page: Page, title: string) {
  const frame = page.locator(`iframe[title="${title}"]`)
  await expect
    .poll(() => frame.getAttribute('data-preview-state'), { timeout: 60_000 })
    .toBe('ready')
  return frame.contentFrame()
}

function scenarios(
  start: () => Promise<RunningStudio>,
  where: 'dev' | 'static',
) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
  })
  afterAll(async () => {
    await studio?.stop()
  })
  const base = () => new URL(studio.url).pathname

  test('[PR-20] [PR-21] [PR-22] [SH-19] a prototype’s address opens its first artifact, replacing the history entry', async () => {
    const page = await newPage()
    await page.goto(studio.url)
    await page.goto(`${studio.url}prototypes/${TRACER}?mode=source#intro`)
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .toBe(
        `${studio.url}prototypes/${TRACER}/artifacts/${HOME}?mode=source#intro`,
      )
    await expect
      .poll(() => page.title(), { timeout: 30_000 })
      .toBe(`Tracer — Home — ${name as string}`)
    await page.goBack()
    await expect.poll(() => new URL(page.url()).pathname).toBe(base())
  })

  test('[PR-23] [SY-139] the viewer lists the prototype’s artifacts beside the open one', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
    const navigation = page.getByRole('navigation', { name: 'Tracer' })
    await expect
      .poll(() => navigation.getByRole('link').allTextContents(), {
        timeout: 60_000,
      })
      .toEqual(['Home', 'Notes'])
    await expect
      .poll(() => page.getByText('System · Endless Studios').isVisible())
      .toBe(true)
    await navigation.getByRole('link', { name: 'Notes' }).click()
    await expect
      .poll(() => page.url())
      .toBe(`${studio.url}prototypes/${TRACER}/artifacts/${NOTES}`)
    const notes = await preview(page, 'Notes')
    await expect
      .poll(() => notes.getByText('Notes for the tracer.').isVisible())
      .toBe(true)
    await expect
      .poll(() => page.title())
      .toBe(`Tracer — Notes — ${name as string}`)
  })

  test('[PR-23] [PR-97] a view fills the artifact area with nothing above it, and its row menu opens it alone in a new tab', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
    await preview(page, 'Home')
    // Edge to edge beside the navigation, as in React: no strip, no button.
    const area = page
      .locator('[id$="-panel-prototype-artifact"] [data-slot="body"]')
      .first()
    const box = (await page.locator('iframe[title="Home"]').boundingBox())!
    const fill = (await area.boundingBox())!
    expect(Math.abs(box.x - fill.x)).toBeLessThan(1)
    expect(Math.abs(box.y - fill.y)).toBeLessThan(1)
    expect(Math.abs(box.width - fill.width)).toBeLessThan(1)
    expect(Math.abs(box.height - fill.height)).toBeLessThan(1)
    expect(await area.getByRole('link').count()).toBe(0)
    // The Comments tool's toolbar floats over the view; it is no strip.
    expect(
      await area.locator('button:not([role="toolbar"] button)').count(),
    ).toBe(0)

    const navigation = page.getByRole('navigation', { name: 'Tracer' })
    await navigation.getByRole('link', { name: 'Home' }).click({
      button: 'right',
    })
    const item = page.getByRole('menuitem', { name: 'Open in a new tab' })
    await expect.poll(() => item.isVisible()).toBe(true)
    const [tab] = await Promise.all([
      page.context().waitForEvent('page'),
      item.click(),
    ])
    await expect
      .poll(() => tab.locator('html').getAttribute('data-preview-state'), {
        timeout: 60_000,
      })
      .toBe('ready')
    expect(new URL(tab.url()).pathname).toMatch(/\/_preview\/[^/]+\/$/)
    expect(new URL(tab.url()).searchParams.get('artifact')).toBe(HOME)
    expect(await tab.getByRole('button', { name: 'Start' }).isVisible()).toBe(
      true,
    )
    await tab.close()
  })

  test('[PR-77] [PR-78] [SH-14] [SY-136] [SY-171] [SY-172] [SY-175] [SY-197] [CL-115] the view renders in Endless Studios’ own app, isolated both ways', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
    const view = await preview(page, 'Home')

    // Inside: the app's Nuxt UI theme, its stand-ins and nothing of the studio.
    const start = view.getByRole('button', { name: 'Start' })
    await expect.poll(() => background(start)).toBe(APP_ORANGE)
    await expect
      .poll(() =>
        view.getByRole('heading', { name: 'Welcome Back!' }).isVisible(),
      )
      .toBe(true)
    await expect.poll(() => view.getByText('Locale: en').isVisible()).toBe(true)
    await expect.poll(() => start.locator('svg').count()).toBe(1)
    await start.click()
    await expect
      .poll(() => view.getByText('Started 1 times').isVisible())
      .toBe(true)
    // The system's Tailwind sees the view's own classes (`m-6`), with no
    // edit to its stylesheet for where prototypes live.
    expect(
      await view
        .getByText('Locale: en')
        .evaluate(
          (element) =>
            getComputedStyle(element.closest('[class*="m-6"]')!).marginTop,
        ),
    ).toBe('24px')
    const inside = await view.locator('html').evaluate(studioTraces)
    expect(inside.nuxt).toBe(false)
    expect(inside.stylesheets.length).toBeGreaterThan(0)
    for (const sheet of inside.stylesheets)
      expect(sheet).toMatch(PREVIEW_STYLES_OR_COLOURS)

    // The view's pop-ups stay inside its document.
    await view.getByRole('button', { name: 'Menu' }).click()
    await expect
      .poll(() => view.getByRole('menuitem', { name: 'Sign out' }).isVisible())
      .toBe(true)
    expect(await page.getByRole('menuitem').count()).toBe(0)

    // Outside: the studio stays neutral Nuxt UI, without the app's styles.
    expect(
      await page.evaluate(() => {
        const probe = document.createElement('div')
        probe.style.background = 'var(--ui-primary)'
        document.body.append(probe)
        const colour = getComputedStyle(probe).backgroundColor
        probe.remove()
        return colour
      }),
    ).toBe(STUDIO_NEUTRAL)
    const outside = await page.locator('html').evaluate(studioTraces)
    expect(outside.stylesheets.length).toBeGreaterThan(0)
    for (const sheet of outside.stylesheets)
      expect(sheet).not.toMatch(PREVIEW_STYLES)
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue(
          '--color-cornflower-500',
        ),
      ),
    ).toBe('')
  })

  test('[SY-134] [SY-135] Endless Studios renders light on a computer set to dark', async () => {
    const page = await newPage()
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
    const view = await preview(page, 'Home')
    expect((await view.locator('html').evaluate(studioTraces)).colorMode).toBe(
      false,
    )
    await expect
      .poll(() => background(view.getByRole('button', { name: 'Start' })))
      .toBe(APP_ORANGE)
  })

  test('[PR-93] a prototype with no system renders with browser defaults and a system font', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${PLAIN}`)
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .toBe(`${studio.url}prototypes/${PLAIN}/artifacts/${PLAIN_VIEW}`)
    await expect
      .poll(() => page.getByText('System · None').isVisible())
      .toBe(true)
    const view = await preview(page, 'Plain')
    const button = view.getByRole('button', { name: 'Plain button' })
    await expect.poll(() => button.isVisible()).toBe(true)
    const look = await button.evaluate((element) => ({
      font: getComputedStyle(document.body).fontFamily,
      background: getComputedStyle(element).backgroundColor,
      sheets: document.styleSheets.length,
    }))
    // A button on a blank page has the browser's own button face.
    const blank = await newPage()
    await blank.setContent('<button>Blank</button>')
    const face = await blank
      .getByRole('button')
      .evaluate((element) => getComputedStyle(element).backgroundColor)
    expect(look.font).toBe('system-ui')
    expect(look.background).toBe(face)
    expect(look.sheets).toBe(0)
    const inside = await view.locator('html').evaluate(studioTraces)
    expect(inside.nuxt).toBe(false)
  })

  test('[SH-97] [PR-18] Home lists the newest prototypes, each opening its first artifact', async () => {
    const page = await newPage()
    await page.goto(studio.url)
    // Nobody is recognised here, so these are everyone's newest.
    const recent = page.getByRole('region', { name: 'Latest prototypes' })
    await expect
      .poll(
        () =>
          recent
            .getByRole('listitem')
            .getByRole('link')
            .evaluateAll((links) =>
              links.map((link) => link.getAttribute('aria-label')),
            ),
        { timeout: 60_000 },
      )
      .toEqual(['Drafts', 'Tracer', 'Plain'])
    await recent.getByRole('link', { name: 'Tracer' }).click()
    await expect
      .poll(() => page.url())
      .toBe(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
  })

  test('[SH-08] [PR-25] an unknown artifact is not found inside its prototype, which keeps its navigation', async () => {
    const page = await newPage()
    await page.goto(
      `${studio.url}prototypes/${TRACER}/artifacts/nothing0000000000`,
    )
    await expect
      .poll(() => page.getByText('Page not found').isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(
      await page.getByRole('navigation', { name: 'Tracer' }).isVisible(),
    ).toBe(true)
    await page.goto(`${studio.url}prototypes/nothing0000000000`)
    await expect
      .poll(() => page.getByText('Page not found').isVisible())
      .toBe(true)
  })

  test('[PR-80] a view stays light even when the computer is dark, from its first frame', async () => {
    const page = await newPage()
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript(() => {
      // A preference the studio no longer reads.
      localStorage.setItem('design-studio:color-mode', 'dark')
      // What each document's root holds at its first frame.
      requestAnimationFrame(() => {
        ;(window as unknown as { firstFrame: string }).firstFrame =
          document.documentElement.className
      })
    })
    await page.goto(`${studio.url}prototypes/${PLAIN}/artifacts/${PLAIN_VIEW}`)
    const view = await preview(page, 'Plain')
    expect(
      await view.locator('html').evaluate((root) => ({
        dark: root.classList.contains('dark'),
        scheme: getComputedStyle(root).colorScheme,
        firstFrame: (window as unknown as { firstFrame: string }).firstFrame,
      })),
    ).toEqual({ dark: false, scheme: 'light', firstFrame: '' })
  })

  test('[PR-88] a new, empty view shows the explanation, with the prompt only locally', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${DRAFTS}/artifacts/${BLANK}`)
    await expect
      .poll(() => page.getByText('This view is empty').isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(
      await page
        .getByText(
          "Ask your agent to build something here. Describe what it's for and who it's for.",
        )
        .isVisible(),
    ).toBe(true)
    expect(
      await page.getByRole('button', { name: 'Copy prompt' }).count(),
    ).toBe(where === 'dev' ? 1 : 0)
  })

  test.runIf(where === 'static')(
    '[SH-142] on the deployed site a prototype’s file list is fetched when first opened, then kept',
    async () => {
      const page = await newPage()
      const lists: string[] = []
      page.on('request', (request) => {
        if (
          /studio-manifest\/tracer0000000001\.[^/]+\.json$/.test(request.url())
        )
          lists.push(request.url())
      })
      await page.goto(studio.url)
      await expect.poll(() => page.title(), { timeout: 60_000 }).toBe(name)
      expect(lists).toEqual([])
      await page.goto(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
      const navigation = page.getByRole('navigation', { name: 'Tracer' })
      await expect
        .poll(() => navigation.getByRole('link').count(), { timeout: 60_000 })
        .toBe(2)
      for (const title of ['Notes', 'Home', 'Notes']) {
        await navigation.getByRole('link', { name: title }).click()
        await expect
          .poll(() => page.title())
          .toBe(`Tracer — ${title} — ${name as string}`)
      }
      expect(lists).toHaveLength(1)
    },
  )
}

describe('the preview document on the dev server', () => {
  scenarios(() => startDevServer(env), 'dev')
})

describe('the preview document in the static build, under a sub-path', () => {
  scenarios(() => startStaticSite('/studio/', env), 'static')
})
