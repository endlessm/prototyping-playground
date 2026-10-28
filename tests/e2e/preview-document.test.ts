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
const env = { STUDIO_PROTOTYPES: 'tests/fixtures/prototypes' }

const TRACER = 'tracer0000000001'
const HOME = 'vhme000000000001'
const NOTES = 'vnts000000000001'
const PLAIN = 'p1a1n00000000001'
const PLAIN_VIEW = 'vp1an00000000001'

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

function scenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
  })
  afterAll(async () => {
    await studio?.stop()
  })
  const base = () => new URL(studio.url).pathname

  test('[PR-20] [PR-21] [PR-22] a prototype’s address opens its first artifact, replacing the history entry', async () => {
    const page = await newPage()
    await page.goto(studio.url)
    await page.goto(`${studio.url}prototypes/${TRACER}?mode=source#intro`)
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .toBe(
        `${studio.url}prototypes/${TRACER}/artifacts/${HOME}?mode=source#intro`,
      )
    await expect
      .poll(() => page.title())
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
    const open = page.getByRole('link', { name: 'Open in a new tab' })
    await expect.poll(() => background(open)).toBe(STUDIO_NEUTRAL)
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

  test('[SY-134] [SY-135] the studio’s dark mode stays out of Endless Studios, which has only a light mode', async () => {
    const page = await newPage()
    await page.addInitScript(() =>
      localStorage.setItem('nuxt-color-mode', 'dark'),
    )
    await page.goto(`${studio.url}prototypes/${TRACER}/artifacts/${HOME}`)
    const view = await preview(page, 'Home')
    expect((await page.locator('html').evaluate(studioTraces)).colorMode).toBe(
      true,
    )
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
}

describe('the preview document on the dev server', () => {
  scenarios(() => startDevServer(env))
})

describe('the preview document in the static build, under a sub-path', () => {
  scenarios(() => startStaticSite('/studio/', env))
})
