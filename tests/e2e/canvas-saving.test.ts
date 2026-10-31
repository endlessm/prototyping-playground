// Saving a canvas and taking in outside edits: Ben's edits save to his
// canvas's file by themselves, a pill says how saving is going, failures
// retry, leaving with unsaved edits asks first, and a file changed on disk
// (by an agent, the command line or another tab) comes into the open canvas.
// Each scenario has a canvas of its own in a disposable copy of the fixtures;
// the scenarios observe the file on disk, the requests to the file service
// and what is on screen.
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Page, Request, Route } from 'playwright'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

const posix = (file: string) => file.split(path.sep).join('/')
mkdirSync('.e2e', { recursive: true })

const PROTOTYPE = 'cvsvpr0t00000001'
const VIEW = 'cvsvv1ew00000001'
const THEIRS = 'cvsvthrs00000001'
const NEWER = 'cvsvnewr00000001'
const canvasId = (n: number) => `cvsv${String(n).padStart(12, '0')}`
const ITEM = `/prototypes/${PROTOTYPE}/artifacts/${VIEW}`

const scene = (id: string, elements: unknown[], more = {}) =>
  `${JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: id,
      elements,
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
      ...more,
    },
    null,
    2,
  )}\n`
const shape = (id: string, x: number, y: number, more = {}) => ({
  id,
  type: 'rectangle',
  x,
  y,
  width: 200,
  height: 150,
  seed: 1,
  version: 1,
  versionNonce: 1,
  index: `a${id}`,
  ...more,
})
const embed = shape('item', 600, 0, {
  type: 'embeddable',
  width: 480,
  height: 300,
  link: ITEM,
})

// One canvas per scenario: what it starts with.
const CANVASES: Record<number, unknown[]> = {
  1: [shape('one', 0, 0), embed],
  2: [
    shape('one', 0, 0),
    shape('two', 400, 0, {
      type: 'text',
      text: 'Hello',
      originalText: 'Hello',
      fontSize: 20,
      fontFamily: 6,
      width: 60,
      height: 25,
    }),
  ],
  3: [shape('one', 0, 0)],
  4: [shape('one', 0, 0)],
  5: [shape('one', 0, 0)],
  6: [],
  7: [],
  8: [shape('one', 0, 0)],
  9: [shape('one', 0, 0)],
  10: [shape('one', 0, 0)],
  11: [shape('one', 0, 0)],
}
const fileOf = (n: number) => `Canvas ${n}.excalidraw`

const dir = mkdtempSync(path.join('.e2e', 'canvas-saving-'))
const prototypeDir = path.join(dir, 'ben', 'saving')
cpSync('tests/fixtures/prototypes', dir, { recursive: true })
mkdirSync(prototypeDir, { recursive: true })
writeFileSync(
  path.join(prototypeDir, 'meta.json'),
  JSON.stringify({
    title: 'Saving',
    studioId: PROTOTYPE,
    ownerContributorId: 'ben0000000000002',
    systemId: null,
  }),
)
writeFileSync(
  path.join(prototypeDir, 'Main.vue'),
  `<!-- @studio-id ${VIEW} -->\n<template><p>Main</p></template>\n`,
)
for (const [n, elements] of Object.entries(CANVASES))
  writeFileSync(
    path.join(prototypeDir, fileOf(Number(n))),
    scene(canvasId(Number(n)), elements),
  )
writeFileSync(
  path.join(prototypeDir, 'Newer.excalidraw'),
  scene(NEWER, [shape('one', 0, 0)], { studioVersion: 2 }),
)
mkdirSync(path.join(dir, 'bernardo', 'plain'), { recursive: true })
writeFileSync(
  path.join(dir, 'bernardo', 'plain', 'Theirs.excalidraw'),
  scene(THEIRS, [shape('one', 0, 0)]),
)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const BEN = {
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

const disk = (n: number) =>
  readFileSync(path.join(prototypeDir, fileOf(n)), 'utf8')
const elementsOnDisk = (n: number) =>
  (JSON.parse(disk(n)).elements as { id: string }[]).map(({ id }) => id)
const writeOutside = (n: number, text: string) =>
  writeFileSync(path.join(prototypeDir, fileOf(n)), text)

const newPage = useBrowser()
const pages: Page[] = []
// Pages stay open in their own contexts, so each is closed after its
// scenario: an open canvas would go on saving into the next one.
afterEach(async () => {
  for (const page of pages.splice(0)) await page.close().catch(() => {})
})

interface Saves {
  /** Every save request, in order. */
  requests: Request[]
}
async function canvasPage(): Promise<Page & Saves> {
  const page = Object.assign(await newPage(), { requests: [] as Request[] })
  pages.push(page)
  // Excalidraw's fonts come from its CDN.
  await page.route('https://esm.sh/**', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  page.on('request', (request) => {
    if (isSave(request)) page.requests.push(request)
  })
  return page
}
const isSave = (request: Request) =>
  request.method() === 'PUT' &&
  new URL(request.url()).pathname.endsWith('/_studio/files/source')
const SOURCE = (url: URL) => url.pathname.endsWith('/_studio/files/source')
/** Answers every save itself until the returned function is called. */
async function interceptSaves(
  page: Page,
  answer: (route: Route) => Promise<void>,
) {
  const handler = (route: Route) =>
    route.request().method() === 'PUT' ? answer(route) : route.fallback()
  await page.route(SOURCE, handler)
  return () => page.unroute(SOURCE, handler)
}
/** Holds every save until the returned function is called. */
async function holdSaves(page: Page) {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  const stop = await interceptSaves(page, async (route) => {
    await held
    await route.continue()
  })
  return async () => {
    release()
    await stop()
  }
}

const address = (studio: RunningStudio, artifact: string) =>
  `${studio.url}prototypes/${PROTOTYPE}/artifacts/${artifact}`
const canvas = (page: Page) => page.locator('.canvas')
const pill = (page: Page) => page.locator('[data-save-status]')
// Whether the scene holds nothing, as the page reports it.
const empty = (page: Page) =>
  canvas(page).evaluate((node) => node.hasAttribute('data-canvas-empty'))
async function open(page: Page, studio: RunningStudio, artifact: string) {
  await page.goto(address(studio, artifact))
  await expect
    .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
      timeout: 60_000,
    })
    .toBe('ready')
}
async function says(page: Page, text: string, timeout = 15_000) {
  await expect
    .poll(async () => (await pill(page).textContent())?.trim(), { timeout })
    .toMatch(new RegExp(`^${text}`))
}
// Draws a rectangle in the middle of the canvas; `at` moves it along.
async function draw(page: Page, at = 0) {
  const box = (await canvas(page).boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 60)
  await page.keyboard.press('r')
  const x = box.x + box.width / 2 - 100 + at
  const y = box.y + box.height / 2 - 60
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 120, y + 90, { steps: 5 })
  await page.mouse.up()
}
// Navigates inside the app, as a link would.
const go = (page: Page, to: string) =>
  page.evaluate((target) => {
    const app = (
      document.querySelector('#__nuxt') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: { $router: { push: (to: string) => unknown } }
          }
        }
      }
    ).__vue_app__
    void app.config.globalProperties.$router.push(target)
  }, to)
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('saving a canvas in the studio running locally', () => {
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer({ ...BEN, STUDIO_PROTOTYPES: posix(dir) })
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[CV-87] [CV-90] [CV-97] [CV-102] [CV-103] [CV-105] an edit saves by itself after a pause, and the status says so', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(1))
    await says(page, 'Saved')
    expect(
      await page.getByRole('status').filter({ hasText: 'Saved' }).count(),
    ).toBe(1)
    // A slow save, so "Saving…" shows.
    const release = await interceptSaves(page, async (route) => {
      await settle(1500)
      await route.continue()
    })
    await draw(page)
    await says(page, 'Unsaved changes', 2000)
    await says(page, 'Saving…')
    await says(page, 'Saved')
    await release()
    expect(elementsOnDisk(1)).toHaveLength(3)
    const text = disk(1)
    const file = JSON.parse(text)
    expect(file).toMatchObject({
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: canvasId(1),
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    })
    expect(text.endsWith('}\n')).toBe(true)
    // The item's link is still its app address, not this server's URL.
    const item = file.elements.find(
      (element: { id: string }) => element.id === 'item',
    )
    expect(item.link).toBe(ITEM)
    const drawn = file.elements.find(
      (element: { id: string }) => !['one', 'item'].includes(element.id),
    )
    expect(Object.keys(drawn)).toEqual([...Object.keys(drawn)].sort())
    for (const key of ['updated', 'isDeleted', 'angle', 'opacity', 'locked'])
      expect(drawn).not.toHaveProperty(key)
    for (const key of ['version', 'versionNonce', 'index'])
      expect(drawn).toHaveProperty(key)
    expect(
      [drawn.x, drawn.y, drawn.width, drawn.height].every(
        (n: number) => Math.round(n * 100) / 100 === n,
      ),
    ).toBe(true)
    expect(page.requests).toHaveLength(1)
  })

  test('[CV-88] opening, selecting, panning and zooming never write the file', async () => {
    const page = await canvasPage()
    const before = statSync(path.join(prototypeDir, fileOf(2))).mtimeMs
    await open(page, studio, canvasId(2))
    await says(page, 'Saved')
    const box = (await canvas(page).boundingBox())!
    // Select everything, then pan and zoom.
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 60)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Escape')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(120, 80)
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -200)
    await page.keyboard.up('Control')
    await settle(3000)
    expect(page.requests).toEqual([])
    expect(statSync(path.join(prototypeDir, fileOf(2))).mtimeMs).toBe(before)
    expect((await pill(page).textContent())?.trim()).toBe('Saved')
  })

  test('[CV-92] [CV-93] [CV-90] a failed save says so once and tries again; Retry saves at once', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(3))
    const stop = await interceptSaves(page, (route) =>
      route.fulfill({
        status: 500,
        json: { error: 'The disk is full.', code: 'http_error' },
      }),
    )
    await draw(page)
    await says(page, 'Couldn’t save')
    const notice = page.getByText('Couldn’t save this canvas. Trying again.')
    await expect.poll(() => notice.first().isVisible()).toBe(true)
    // It tries again by itself, 2 s later, without another notice.
    await expect.poll(() => page.requests.length, { timeout: 10_000 }).toBe(2)
    expect(await notice.count()).toBeLessThanOrEqual(2)
    await stop()
    // The notice covers the status for a while, so it offers Retry too.
    await page
      .getByRole('region', { name: /Notifications/ })
      .getByRole('button', { name: 'Retry' })
      .click()
    await says(page, 'Saved', 3000)
    expect(elementsOnDisk(3)).toHaveLength(2)
  })

  test('[CV-91] [CV-93] when the file keeps changing, saving pauses with a notice until Retry', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(4))
    const stop = await interceptSaves(page, (route) =>
      route.fulfill({
        status: 409,
        json: {
          error: 'This file changed on disk since you opened it.',
          code: 'changed',
        },
      }),
    )
    await draw(page)
    const notice = page.getByText('Couldn’t save: the file keeps changing.')
    await expect
      .poll(() => notice.first().isVisible(), { timeout: 15_000 })
      .toBe(true)
    // One try, then three after merging the file in; then it waits.
    expect(page.requests).toHaveLength(4)
    await settle(3000)
    expect(page.requests).toHaveLength(4)
    await says(page, 'Couldn’t save')
    await stop()
    await pill(page).getByRole('button', { name: 'Retry' }).click()
    await says(page, 'Saved', 3000)
    expect(elementsOnDisk(4)).toHaveLength(2)
  })

  test('[CV-91] [CV-99] an outside edit made while a save is pending is merged, and the union saved', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(5))
    const release = await holdSaves(page)
    await draw(page)
    await says(page, 'Saving…')
    // An agent adds an element to the file meanwhile.
    writeOutside(
      5,
      scene(canvasId(5), [shape('one', 0, 0), shape('agent', 0, 400)]),
    )
    await settle(1500)
    await release()
    await says(page, 'Saved')
    await expect
      .poll(() => elementsOnDisk(5).length, { timeout: 15_000 })
      .toBe(3)
    expect(elementsOnDisk(5)).toEqual(expect.arrayContaining(['one', 'agent']))
  })

  test('[CV-98] [CV-99] an outside edit comes in live, without a reload and outside the undo history', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(6))
    await expect.poll(() => empty(page)).toBe(true)
    await page.evaluate(() => {
      ;(window as unknown as { marker: boolean }).marker = true
    })
    writeOutside(6, scene(canvasId(6), [shape('agent', 0, 0)]))
    await expect.poll(() => empty(page), { timeout: 15_000 }).toBe(false)
    expect(
      await page.evaluate(
        () => (window as unknown as { marker?: boolean }).marker,
      ),
    ).toBe(true)
    // Undo has nothing to take back: the change came from the file.
    const box = (await canvas(page).boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 60)
    await page.keyboard.press('Control+z')
    await settle(1000)
    expect(await empty(page)).toBe(false)
    // Taking it in is not an edit.
    await settle(1500)
    expect(page.requests).toEqual([])
  })

  test('[CV-100] a half-written file is skipped until the next change, and the canvas’s own saves are ignored', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(7))
    await expect.poll(() => empty(page)).toBe(true)
    writeOutside(
      7,
      `{\n  "type": "excalidraw",\n  "studioId": "${canvasId(7)}",\n  "elements": [\n    {`,
    )
    await settle(2000)
    expect(await empty(page)).toBe(true)
    expect(await page.getByText('couldn’t be opened').count()).toBe(0)
    writeOutside(7, scene(canvasId(7), [shape('agent', 0, 0)]))
    await expect.poll(() => empty(page), { timeout: 15_000 }).toBe(false)
    // Its own save comes back as a change on disk, and is left alone.
    await draw(page)
    await says(page, 'Saved')
    await expect.poll(() => elementsOnDisk(7).length).toBe(2)
    await settle(3000)
    expect(page.requests).toHaveLength(1)
    expect((await pill(page).textContent())?.trim()).toBe('Saved')
  })

  test('[CV-94] hiding the tab saves at once, and so does leaving the canvas', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(8))
    await draw(page)
    const hidden = Date.now()
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect.poll(() => page.requests.length, { timeout: 5000 }).toBe(1)
    // Well before the 1.2 s pause would have saved it.
    expect(Date.now() - hidden).toBeLessThan(1000)
    await expect.poll(() => elementsOnDisk(8).length).toBe(2)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
    })
    await says(page, 'Saved')
    // Leaving straight after an edit.
    await draw(page, 200)
    await go(page, `/prototypes/${PROTOTYPE}/artifacts/${VIEW}`)
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toMatch(new RegExp(`${VIEW}$`))
    await expect.poll(() => elementsOnDisk(8).length).toBe(3)
  })

  test('[CV-95] leaving while saving can’t finish asks first: Keep editing stays, Discard leaves', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(9))
    const before = disk(9)
    await interceptSaves(page, (route) =>
      route.fulfill({ status: 500, json: { error: 'Down.', code: 'x' } }),
    )
    await draw(page)
    await says(page, 'Couldn’t save')
    await go(page, '/')
    const dialog = page.getByRole('dialog', {
      name: 'This canvas has unsaved changes',
    })
    await expect.poll(() => dialog.isVisible(), { timeout: 10_000 }).toBe(true)
    expect(await dialog.textContent()).toContain(
      'Saving hasn’t finished. Keep the canvas open to retry, or discard the unsaved changes.',
    )
    await dialog.getByRole('button', { name: 'Keep editing' }).click()
    await expect.poll(() => dialog.count()).toBe(0)
    expect(new URL(page.url()).pathname).toContain(canvasId(9))
    await go(page, '/')
    await expect.poll(() => dialog.isVisible(), { timeout: 10_000 }).toBe(true)
    await dialog.getByRole('button', { name: 'Discard' }).click()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .not.toContain(canvasId(9))
    expect(disk(9)).toBe(before)
  })

  test('[CV-96] reloading or closing the tab while a save is pending shows the browser’s leave warning', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(10))
    await holdSaves(page)
    await draw(page)
    await says(page, 'Saving…')
    const warned = new Promise<string>((resolve) =>
      page.once('dialog', (dialog) => {
        resolve(dialog.type())
        void dialog.dismiss()
      }),
    )
    await page.close({ runBeforeUnload: true })
    expect(await warned).toBe('beforeunload')
  })

  test('[CV-39] the background comes in live from the file, and one chosen in the menu is saved', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(11))
    await says(page, 'Saved')
    // The colour Excalidraw paints behind the scene, in the top-left corner.
    const painted = () =>
      page.evaluate(() => {
        const surface = document.querySelector<HTMLCanvasElement>(
          '.excalidraw__canvas.static',
        )!
        const [r, g, b] = surface.getContext('2d')!.getImageData(2, 2, 1, 1)
          .data as unknown as number[]
        return `rgb(${r}, ${g}, ${b})`
      })
    expect(await painted()).toBe('rgb(255, 255, 255)')
    // An agent paints it pink.
    writeOutside(
      11,
      scene(canvasId(11), [shape('one', 0, 0)], {
        appState: { viewBackgroundColor: '#ffc9c9' },
      }),
    )
    await expect.poll(painted).toBe('rgb(255, 201, 201)')
    // Taking it in is not an edit.
    await settle(2000)
    expect(page.requests).toEqual([])
    // White again from the menu's swatches: only the background changes.
    await page.getByTestId('main-menu-trigger').click()
    await page.locator('.dropdown-menu .color-picker__button').first().click()
    await expect.poll(painted).toBe('rgb(255, 255, 255)')
    await expect
      .poll(() => JSON.parse(disk(11)).appState.viewBackgroundColor)
      .toBe('#ffffff')
    expect(elementsOnDisk(11)).toEqual(['one'])
    await says(page, 'Saved')
  })

  test('[CV-90] [CV-106] someone else’s canvas, and one from a newer format, show no save status and are never written', async () => {
    const page = await canvasPage()
    await page.goto(`${studio.url}prototypes`)
    for (const target of [
      address(studio, NEWER),
      `${studio.url}prototypes/p1a1n00000000001/artifacts/${THEIRS}`,
    ]) {
      await page.goto(target)
      await expect
        .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
          timeout: 60_000,
        })
        .toBe('ready')
      await settle(500)
      expect(await pill(page).count()).toBe(0)
    }
    expect(page.requests).toEqual([])
  })
})
