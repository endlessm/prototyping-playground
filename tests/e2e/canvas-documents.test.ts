// A canvas linked on its own line in a document shows as a fitted,
// read-only picture of the whole scene, through the same island as the
// canvas page, with its items live. It opens the way the page does, follows
// the colour mode and its file, and says so when it can't load. On the
// deployed site it shows from the committed file, and the agent tools are
// not there at all.
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import type { CanvasAgent } from '../../src/modules/canvas/island/agent'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

declare global {
  interface Window {
    /** The canvas tools in the open canvas (`island/agent.ts`). */
    __studioCanvas?: CanvasAgent
  }
}

const posix = (file: string) => file.split(path.sep).join('/')
mkdirSync('.e2e', { recursive: true })

const PROTOTYPE = 'cvd0000000000001'
const VIEW = 'cvd0000000000002'
const FLOW = 'cvd0000000000003'
const BRIEF = 'cvd0000000000004'
const BOARD = 'cvd0000000000005'
const SMALL = 'cvd0000000000006'
const BROKEN = 'cvd0000000000007'
const LIVE = 'cvd0000000000008'
const READER = 'cvd0000000000009'
const SWAP = 'cvd000000000000a'
const BROKEN_DOC = 'cvd000000000000b'
const LIVE_DOC = 'cvd000000000000c'
const SMALL_DOC = 'cvd000000000000d'
const at = (id: string) => `/prototypes/${PROTOTYPE}/artifacts/${id}`

const scene = (id: string, elements: unknown[]) =>
  `${JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: id,
      elements,
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    },
    null,
    2,
  )}\n`
const item = (id: string, link: string, x: number, height = 338) => ({
  id,
  type: 'embeddable',
  link,
  x,
  y: 0,
  width: 480,
  height,
  strokeColor: 'transparent',
  customData: { frame: true, hideLinkIcon: true },
  seed: 1,
  version: 1,
  versionNonce: 1,
  index: `a${id}`,
})
const box = (id: string, x: number, y: number) => ({
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
})
// 2000 × 338: a view, a diagram, a card and an item whose file is gone.
const BOARD_ELEMENTS = [
  item('view', at(VIEW), 0),
  item('flow', at(FLOW), 520),
  item('brief', at(BRIEF), 1040, 88),
  item('gone', at('cvd000000000000z'), 1520, 88),
]
const doc = (id: string, title: string, body: string) =>
  `---\nstudioId: ${id}\n---\n\n# ${title}\n\n${body}\n`

const dir = mkdtempSync(path.join('.e2e', 'canvas-documents-'))
const prototypeDir = path.join(dir, 'ben', 'docs')
cpSync('tests/fixtures/prototypes', dir, { recursive: true })
mkdirSync(prototypeDir, { recursive: true })
const write = (file: string, text: string) =>
  writeFileSync(path.join(prototypeDir, file), text)
write(
  'meta.json',
  JSON.stringify({
    title: 'Docs',
    studioId: PROTOTYPE,
    ownerContributorId: 'ben0000000000002',
    systemId: null,
  }),
)
write(
  'Main.vue',
  `<!-- @studio-id ${VIEW} -->\n<template><h1>Main view</h1></template>\n`,
)
write('Flow.mermaid', `%% @studio-id ${FLOW}\nflowchart LR\n  A --> B\n`)
write('Brief.md', doc(BRIEF, 'Brief', 'The brief.'))
write('Board.excalidraw', scene(BOARD, BOARD_ELEMENTS))
write('Small.excalidraw', scene(SMALL, [item('only', at(VIEW), 0)]))
write(
  'Broken.excalidraw',
  `{ "studioId": "${BROKEN}", "elements": [ { "id": "a" `,
)
write('Live.excalidraw', scene(LIVE, [box('one', 0, 0)]))
write('Reader.md', doc(READER, 'Reader', '![The board](./Board.excalidraw)'))
write('Swap.md', doc(SWAP, 'Swap', '![A canvas](./Board.excalidraw)'))
write(
  'BrokenDoc.md',
  doc(BROKEN_DOC, 'Broken doc', '![Broken](./Broken.excalidraw)'),
)
write('LiveDoc.md', doc(LIVE_DOC, 'Live doc', '![Live](./Live.excalidraw)'))
write(
  'SmallDoc.md',
  doc(SMALL_DOC, 'Small doc', '![Small](./Small.excalidraw)'),
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

const newPage = useBrowser()
const pages: Page[] = []
afterEach(async () => {
  for (const page of pages.splice(0)) await page.close().catch(() => {})
})
async function documentPage() {
  const page = await newPage()
  pages.push(page)
  await page.route('https://esm.sh/**', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  return page
}
const preview = (page: Page) => page.locator('.canvas-preview')
async function read(page: Page, studio: RunningStudio, id: string) {
  await page.goto(`${studio.url}prototypes/${PROTOTYPE}/artifacts/${id}`)
}
async function revealed(page: Page) {
  await expect
    .poll(() => preview(page).getAttribute('data-canvas-opening'), {
      timeout: 60_000,
    })
    .toBe('ready')
}
const sizeOf = async (locator: Locator) => {
  const { width, height } = (await locator.boundingBox())!
  return { width: Math.round(width), height: Math.round(height) }
}

describe('a canvas in a document, in the studio running locally', () => {
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer({ ...BEN, STUDIO_PROTOTYPES: posix(dir) })
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[CV-109] [CV-110] a fitted, read-only picture of the whole scene, its items live, only the Open link active', async () => {
    const page = await documentPage()
    await read(page, studio, READER)
    await revealed(page)
    const frame = await sizeOf(preview(page))
    // The whole scene is 2000 × 338, fitted to 90% of the frame.
    const zoom = 0.9 * Math.min(frame.width / 2000, frame.height / 338)
    const view = page.locator('.canvas-preview [data-canvas-embed-id="view"]')
    await expect
      .poll(async () => (await sizeOf(view)).width)
      .toBeCloseTo(480 * zoom, -1)
    // No toolbar, menu, save status or agent tools on screen.
    for (const selector of [
      '.App-toolbar',
      '[data-testid="main-menu-trigger"]',
      '[data-save-status]',
      '.layer-ui__wrapper',
      '.zoom-actions',
    ])
      expect(
        await page
          .locator(`.canvas-preview ${selector}`)
          .filter({ visible: true })
          .count(),
      ).toBe(0)
    expect(await page.evaluate(() => typeof window.__studioCanvas)).toBe(
      'undefined',
    )
    // No pointer input reaches the scene; the frame's Open link does.
    const middle = await preview(page).boundingBox()
    expect(
      await page.evaluate(
        ([x, y]) => {
          const hit = document.elementFromPoint(x!, y!)
          return Boolean(hit?.closest('.canvas-scene'))
        },
        [middle!.x + middle!.width / 2, middle!.y + middle!.height / 2],
      ),
    ).toBe(false)
    const open = page
      .locator('figure.my-6')
      .getByRole('link', { name: /The board/ })
    expect(await open.getAttribute('href')).toContain(`/artifacts/${BOARD}`)
    // Its items: a live view, a live diagram, a card, and Not found.
    await expect
      .poll(
        () =>
          view
            .locator('[data-preview-state]')
            .getAttribute('data-preview-state'),
        { timeout: 30_000 },
      )
      .toBe('ready')
    await expect
      .poll(() =>
        page
          .locator(
            '.canvas-preview [data-canvas-embed-id="flow"] [data-diagram-state]',
          )
          .getAttribute('data-diagram-state'),
      )
      .toBe('ready')
    await expect
      .poll(() =>
        page
          .locator('.canvas-preview [data-canvas-embed-id="brief"]')
          .textContent(),
      )
      .toContain('Brief')
    await expect
      .poll(() =>
        page
          .locator('.canvas-preview [data-canvas-embed-id="gone"]')
          .textContent(),
      )
      .toContain('Not found')
  })

  test('[CV-109] a small scene is never shown above 100%', async () => {
    const page = await documentPage()
    await read(page, studio, SMALL_DOC)
    await revealed(page)
    const only = page.locator('.canvas-preview [data-canvas-embed-id="only"]')
    await expect.poll(async () => (await sizeOf(only)).width).toBe(480)
  })

  test('[CV-111] it opens like the page: a quiet surface, the status after 200 ms, one reveal, the frame’s size kept', async () => {
    const page = await documentPage()
    // The canvas file arrives slowly.
    await page.route(
      (url) =>
        url.pathname.endsWith('/_studio/files/source') &&
        url.searchParams.get('artifact') === BOARD,
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.continue()
      },
    )
    await page.addInitScript(() => {
      const seen: string[] = []
      ;(window as unknown as { openings: string[] }).openings = seen
      new MutationObserver(() => {
        const state = document
          .querySelector('[data-canvas-opening]')
          ?.getAttribute('data-canvas-opening')
        if (state && seen.at(-1) !== state) seen.push(state)
      }).observe(document, { subtree: true, childList: true, attributes: true })
    })
    await read(page, studio, READER)
    // The document's figure, around the embed's frame.
    const figure = page.locator('figure.my-6')
    const status = figure
      .getByRole('status')
      .filter({ hasText: 'Opening canvas' })
    await expect.poll(() => status.count(), { timeout: 30_000 }).toBe(1)
    const loading = await sizeOf(figure)
    await expect.poll(() => status.isVisible()).toBe(true)
    await revealed(page)
    expect(await sizeOf(figure)).toEqual(loading)
    expect(
      await page.evaluate(
        () => (window as unknown as { openings: string[] }).openings,
      ),
    ).toEqual(['loading', 'ready'])
  })

  test('[CV-112] it follows the colour mode and its file live, without opening again; another canvas opens afresh', async () => {
    const page = await documentPage()
    await read(page, studio, LIVE_DOC)
    await revealed(page)
    await page.evaluate(() => {
      const seen: string[] = []
      ;(window as unknown as { openings: string[] }).openings = seen
      new MutationObserver(() => {
        const state = document
          .querySelector('.canvas-preview')
          ?.getAttribute('data-canvas-opening')
        if (state && seen.at(-1) !== state) seen.push(state)
      }).observe(document, { subtree: true, attributes: true })
    })
    const dark = () =>
      page.evaluate(() =>
        document
          .querySelector('.canvas-preview .excalidraw')
          ?.classList.contains('theme--dark'),
      )
    expect(await dark()).toBe(false)
    await page.getByRole('button', { name: 'Color mode' }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Dark' }).click()
    await expect.poll(dark).toBe(true)

    // An agent adds a view to the canvas file.
    write(
      'Live.excalidraw',
      scene(LIVE, [box('one', 0, 0), item('added', at(VIEW), 400)]),
    )
    await expect
      .poll(
        () =>
          page
            .locator('.canvas-preview [data-canvas-embed-id="added"]')
            .count(),
        { timeout: 30_000 },
      )
      .toBe(1)
    expect(
      await page.evaluate(
        () => (window as unknown as { openings: string[] }).openings,
      ),
    ).not.toContain('loading')

    // The document now embeds another canvas: it opens afresh.
    await read(page, studio, SWAP)
    await revealed(page)
    write('Swap.md', doc(SWAP, 'Swap', '![A canvas](./Small.excalidraw)'))
    await expect
      .poll(
        () =>
          page.locator('.canvas-preview [data-canvas-embed-id="only"]').count(),
        { timeout: 30_000 },
      )
      .toBe(1)
    await revealed(page)
  })

  test('[CV-113] a canvas that can’t load says so', async () => {
    const page = await documentPage()
    await read(page, studio, BROKEN_DOC)
    await expect
      .poll(
        () => page.locator('figure.my-6').getByRole('alert').textContent(),
        {
          timeout: 30_000,
        },
      )
      .toBe('This canvas could not load. Open it to inspect its source.')
  })
})

describe('a canvas in a document on the deployed site', () => {
  let site: RunningStudio & { directory: string }
  beforeAll(async () => {
    // The build refuses a broken canvas, as it should.
    for (const file of ['Broken.excalidraw', 'BrokenDoc.md'])
      rmSync(path.join(prototypeDir, file), { force: true })
    site = await startStaticSite('/studio-canvas-docs/', {
      STUDIO_PROTOTYPES: posix(dir),
    })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[CV-109] shows the committed canvas, fitted and read-only', async () => {
    const page = await documentPage()
    await read(page, site, READER)
    await revealed(page)
    await expect
      .poll(() =>
        page
          .locator('.canvas-preview [data-canvas-embed-id="brief"]')
          .textContent(),
      )
      .toContain('Brief')
  })

  test('[CV-135] the agent tools are not shipped to the deployed site', async () => {
    const page = await documentPage()
    await page.goto(`${site.url}prototypes/${PROTOTYPE}/artifacts/${BOARD}`)
    await expect
      .poll(() => page.locator('.canvas').getAttribute('data-canvas-opening'), {
        timeout: 60_000,
      })
      .toBe('ready')
    expect(await page.evaluate(() => typeof window.__studioCanvas)).toBe(
      'undefined',
    )
    const files = (folder: string): string[] =>
      readdirSync(folder).flatMap((name) => {
        const file = path.join(folder, name)
        return statSync(file).isDirectory() ? files(file) : [file]
      })
    const shipped = files(site.directory).filter((file) => file.endsWith('.js'))
    expect(shipped.length).toBeGreaterThan(0)
    for (const file of shipped)
      expect(readFileSync(file, 'utf8')).not.toContain('__studioCanvas')
  })
})
