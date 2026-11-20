// Takes a prototype's picture: its first view, rendered alone in its
// system's preview document (never the studio around it), at a desktop size
// scaled down, as a JPEG. A view that errors or is empty is not captured,
// and the previous picture stays. Playwright's headless Chromium does it;
// one browser serves many captures, and it is loaded only when needed, so
// the build and the dev server never need it.
import type { Browser } from 'playwright'
import { NO_SYSTEM, PREVIEW_ROUTE } from '../preview/constants.ts'
import { previewAddress } from '../preview/protocol.ts'
import { prototypeFingerprint } from './fingerprint.ts'
import {
  THUMBNAIL_FORMAT_VERSION,
  writeThumbnail,
  type ThumbnailRecord,
} from './record.ts'

/** CSS pixels of the screen the view is drawn on. */
export const THUMBNAIL_VIEWPORT = { width: 1280, height: 800 }
/** Pixels per CSS pixel in the picture: 640×400. */
export const THUMBNAIL_SCALE = 0.5
export const THUMBNAIL_QUALITY = 80

const LOAD_TIMEOUT = 60_000
// After the view is ready and fonts are in, for images and transitions.
const SETTLE_MS = 400

export interface ThumbnailTarget {
  /** The prototype's folder, absolute. */
  dir: string
  /** The prototype's system, or null for none. */
  systemId: string | null
  /** The system's package version (`systemVersion`). */
  systemVersion: string
  /** The view to capture: the prototype's first view in the tree's order. */
  artifactId: string
}

export type ThumbnailResult =
  | { ok: true; bytes: number; record: ThumbnailRecord }
  | {
      ok: false
      /** The preview's state when it gave up: `error`, `empty`, `loading`… */
      reason: string
      detail: string
    }

/** Chromium is not installed, so nothing can be captured. */
export class ChromiumMissing extends Error {}

export const CHROMIUM_INSTALL = 'yarn playwright install chromium'

/**
 * Starts a headless Chromium, or throws `ChromiumMissing` when Playwright
 * has no browser installed.
 */
export async function launchThumbnailBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright')
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    const message = (error as Error).message ?? ''
    if (/Executable doesn't exist|playwright install/i.test(message))
      throw new ChromiumMissing(
        `The browser that takes pictures (Playwright's Chromium) isn't installed. Install it with ${CHROMIUM_INSTALL}, then run this again.`,
      )
    throw error
  }
}

/** The preview document's address for one view, under the studio's base. */
export function thumbnailAddress(studioUrl: string, target: ThumbnailTarget) {
  const document = new URL(
    `${PREVIEW_ROUTE}${target.systemId ?? NO_SYSTEM}/`,
    studioUrl.endsWith('/') ? studioUrl : `${studioUrl}/`,
  )
  return previewAddress(document.href, target.artifactId)
}

/**
 * Captures one prototype into its `.thumbnail.jpg` and `.thumbnail.json`,
 * with a browser already running and the studio address (with its base
 * path) of a server that answers preview documents: the dev server, or the
 * command's own. The fingerprint is read before the view loads, so a change
 * made meanwhile leaves the picture stale.
 */
export async function captureThumbnail(
  browser: Browser,
  studioUrl: string,
  target: ThumbnailTarget,
): Promise<ThumbnailResult> {
  const fingerprint = prototypeFingerprint(
    target.dir,
    target.systemId,
    target.systemVersion,
  )
  const context = await browser.newContext({
    viewport: THUMBNAIL_VIEWPORT,
    deviceScaleFactor: THUMBNAIL_SCALE,
    // Studio and previews are light only; still motion draws the end state.
    colorScheme: 'light',
    reducedMotion: 'reduce',
  })
  try {
    const page = await context.newPage()
    await page.goto(thumbnailAddress(studioUrl, target), {
      waitUntil: 'load',
      timeout: LOAD_TIMEOUT,
    })
    const settled = () =>
      page.waitForFunction(
        () => {
          const { previewState, previewPhase } =
            document.documentElement.dataset
          return (
            (previewState === 'ready' &&
              (!previewPhase || previewPhase === 'current')) ||
            previewState === 'error' ||
            previewState === 'empty'
          )
        },
        undefined,
        { timeout: LOAD_TIMEOUT },
      )
    try {
      await settled()
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      // A first visit can optimise dependencies and reload the document.
      await page
        .waitForLoadState('networkidle', { timeout: 10_000 })
        .catch(() => undefined)
      await page.waitForTimeout(SETTLE_MS)
      await settled()
    } catch {
      return {
        ok: false,
        reason: 'loading',
        detail: 'The view did not finish loading within a minute.',
      }
    }
    const { state, detail } = await page.evaluate(() => ({
      state: document.documentElement.dataset.previewState ?? '',
      detail:
        document.documentElement.dataset.previewPhase === 'error'
          ? 'The latest change failed to render.'
          : '',
    }))
    if (state !== 'ready')
      return {
        ok: false,
        reason: state,
        detail:
          state === 'empty' ? 'The view is empty.' : 'The view has an error.',
      }
    if (detail) return { ok: false, reason: 'error', detail }
    const image = await page.screenshot({
      type: 'jpeg',
      quality: THUMBNAIL_QUALITY,
    })
    if (!image.length)
      return { ok: false, reason: 'empty', detail: 'The picture was empty.' }
    const record: ThumbnailRecord = {
      formatVersion: THUMBNAIL_FORMAT_VERSION,
      artifactId: target.artifactId,
      fingerprint,
      capturedAt: new Date().toISOString(),
    }
    writeThumbnail(target.dir, image, record)
    return { ok: true, bytes: image.length, record }
  } finally {
    await context.close()
  }
}

/**
 * One browser for many captures, started on the first and kept until
 * `close`. The dev server can hold one and close it when idle.
 */
export function createThumbnailCapturer(
  launch: () => Promise<Browser> = launchThumbnailBrowser,
) {
  let browser: Promise<Browser> | null = null
  return {
    async capture(studioUrl: string, target: ThumbnailTarget) {
      browser ??= launch().catch((error) => {
        browser = null
        throw error
      })
      return captureThumbnail(await browser, studioUrl, target)
    },
    get running() {
      return browser !== null
    },
    async close() {
      const pending = browser
      browser = null
      if (pending) await (await pending.catch(() => null))?.close()
    },
  }
}

export type ThumbnailCapturer = ReturnType<typeof createThumbnailCapturer>
