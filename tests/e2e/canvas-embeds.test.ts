// Items on a canvas: views, named states and diagrams of the canvas's own
// prototype show live, as pictures of the view at 1440 px; documents and
// other canvases show as cards; links to nothing, to another prototype or
// to a view whose system is missing say so. Items are placed by dragging a
// row from the navigation or pasting a link, and they follow their files.
// The studio runs as Ben on a disposable copy of the fixtures. Canvas saves
// are answered here and recorded, so the files on disk stay as written
// (`canvas-saving.test.ts` covers saving); the scenarios that change files
// do it on disk, as an agent would.
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const posix = (file: string) => file.split(path.sep).join('/')
mkdirSync('.e2e', { recursive: true })

const PROTOTYPE = 'cvembprt00000001'
const HOME = 'cvemhme000000001'
const MEMBER = 'cvemstmb00000001'
const FLOW = 'cvemdgrm00000001'
const NOTES = 'cvemn0te00000001'
const OTHER = 'cvem0thr00000001'
const BOARD = 'cvembrd000000001'
const SINGLE = 'cvemsng000000001'
const MANY = 'cvemmny000000001'
const DROP = 'cvemdr0p00000001'
const CRASH = 'cvemcrsh00000001'
const MOVED = 'cvemmvd000000001'
const MOVED_BOARD = 'cvemmvdbrd000001'
const SCREENS = ['cvemscr000000001', 'cvemscr000000002', 'cvemscr000000003']
const TRACER = 'tracer0000000001'
const TRACER_HOME = 'vhme000000000001'

const address = (artifact: string, prototype = PROTOTYPE) =>
  `/prototypes/${prototype}/artifacts/${artifact}`

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
// An item as the studio writes it: sized, styled and marked.
const item = (
  id: string,
  link: string,
  x: number,
  y: number,
  height = 338,
) => ({
  id,
  type: 'embeddable',
  x,
  y,
  width: 480,
  height,
  link,
  strokeColor: 'transparent',
  roundness: null,
  customData: { frame: true, hideLinkIcon: true },
  seed: 1,
  version: 1,
  versionNonce: 1,
  index: `a${id}`,
})
const label = (id: string, text: string, x: number, y: number) => ({
  id,
  type: 'text',
  x,
  y,
  width: 200,
  height: 25,
  text,
  originalText: text,
  fontSize: 20,
  fontFamily: 6,
  seed: 1,
  version: 1,
  versionNonce: 1,
  index: `a${id}`,
})

const view = (id: string, heading: string, more = '') =>
  `<!-- @studio-id ${id} -->${more}
<script setup lang="ts">
defineProps<{ name?: string }>()
</script>

<template>
  <main style="font-family: sans-serif">
    <h1>{{ name ? '${heading}, ' + name : '${heading}' }}</h1>
    <a href="#bottom" style="color: rgb(200, 10, 10)">A red link</a>
    <button type="button">Press</button>
  </main>
</template>
`

function content(name: string) {
  const dir = mkdtempSync(path.join('.e2e', `${name}-`))
  cpSync('tests/fixtures/prototypes', dir, { recursive: true })
  const write = (file: string, text: string) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), text)
  }
  const meta = (folder: string, studioId: string, systemId: null) =>
    write(
      `${folder}/meta.json`,
      JSON.stringify({
        title: 'Board',
        studioId,
        ownerContributorId: 'ben0000000000002',
        systemId,
      }),
    )
  meta('ben/board', PROTOTYPE, null)
  write(
    'ben/board/Home.vue',
    view(HOME, 'Welcome', `\n<!-- @studio-state ${MEMBER} Member -->`)
      .replace(
        'defineProps',
        `import { usePrototypeArtifactHref } from '#studio/prototype'
const href = usePrototypeArtifactHref()
defineProps`,
      )
      .replace(
        '</script>',
        `</script>

<script lang="ts">
export const states = [{ title: 'Member', props: { name: 'Ana' } }]
</script>`,
      )
      .replace(
        '</main>',
        `  <p>Screen 1 lives at {{ href('screens/Screen 1') }}</p>
  </main>`,
      ),
  )
  for (const [n, id] of SCREENS.entries())
    write(`ben/board/screens/Screen ${n + 1}.vue`, view(id, `Screen ${n + 1}`))
  write('ben/board/Moved.vue', view(MOVED, 'Before the move'))
  write(
    'ben/board/Flow.mermaid',
    `%% @studio-id ${FLOW}\nflowchart LR\n  start[Sign in] --> home[Home]\n`,
  )
  write(
    'ben/board/Notes.md',
    `---\nstudioId: ${NOTES}\n---\n\n# Notes\n\nWhat we learned.\n`,
  )
  write('ben/board/Other.excalidraw', scene(OTHER, []))
  write(
    'ben/board/Board.excalidraw',
    scene(BOARD, [
      item('home', address(HOME), 0, 0),
      item('member', address(MEMBER), 560, 0),
      item('flow', address(FLOW), 1120, 0),
      item('notes', address(NOTES), 0, 420, 88),
      item('other', address(OTHER), 560, 420, 88),
      item('gone', address('cvemg0ne00000001'), 1120, 420, 88),
      item('away', address(TRACER_HOME, TRACER), 0, 560, 88),
    ]),
  )
  write(
    'ben/board/Single.excalidraw',
    scene(SINGLE, [item('home', address(HOME), 0, 0)]),
  )
  write(
    'ben/board/Many.excalidraw',
    scene(
      MANY,
      SCREENS.map((id, n) => item(`s${n}`, address(id), n * 520, 0)),
    ),
  )
  write(
    'ben/board/Drop.excalidraw',
    scene(DROP, [label('hint', 'Drop here', 0, 0)]),
  )
  write(
    'ben/board/Crash.excalidraw',
    scene(CRASH, [item('flow', address(FLOW), 0, 0)]),
  )
  write(
    'ben/board/Moved board.excalidraw',
    scene(MOVED_BOARD, [item('moved', address(MOVED), 0, 0)]),
  )
  return dir
}
const devContent = content('canvas-embeds')
afterAll(() => rmSync(devContent, { recursive: true, force: true }))

const BEN = {
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

// The dev server and this computer are often busy.
const WAIT = { timeout: 30_000 }
const newPage = useBrowser()

/** A page that answers fonts and saves itself, recording what was saved. */
async function canvasPage() {
  const page = await newPage()
  const saved: string[] = []
  await page.route('https://esm.sh/**', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  await page.route(
    (url) => url.pathname.endsWith('/_studio/files/source'),
    (route) => {
      if (route.request().method() !== 'PUT') return route.fallback()
      saved.push(
        (route.request().postDataJSON() as { content: string }).content,
      )
      return route.fulfill({ json: { version: 'unsaved', warnings: [] } })
    },
  )
  return Object.assign(page, { saved })
}
const canvas = (page: Page) => page.locator('.canvas')
async function open(
  page: Page,
  studio: RunningStudio,
  artifact: string,
  prototype = PROTOTYPE,
) {
  await page.goto(`${studio.url}${address(artifact, prototype).slice(1)}`)
  await expect
    .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
      timeout: 60_000,
    })
    .toBe('ready')
}
const itemBox = (page: Page, id: string) =>
  page.locator(`[data-canvas-embed-id="${id}"]`)
const items = (page: Page) => page.locator('[data-canvas-embed-id]')
const header = (page: Page, name: string) =>
  canvas(page).getByRole('link', { name: `Open ${name}`, exact: true })
async function visible(locator: Locator) {
  await expect.poll(() => locator.isVisible(), WAIT).toBe(true)
}
async function previewReady(box: Locator) {
  await expect
    .poll(
      () =>
        box.locator('[data-preview-state]').getAttribute('data-preview-state'),
      WAIT,
    )
    .toBe('ready')
}
const frameText = (box: Locator) =>
  box
    .frameLocator('iframe[data-preview-frame]')
    .locator('h1')
    .textContent({ timeout: 30_000 })
/** Selects an item by clicking its body, which falls through to the canvas. */
async function select(page: Page, box: Locator) {
  const area = (await box.boundingBox())!
  await page.mouse.click(area.x + area.width / 2, area.y + area.height * 0.7)
  await expect
    .poll(() => page.locator('.canvas-editor').getAttribute('data-items-only'))
    .toBe('')
}
const stored = (text: string | undefined) =>
  (
    JSON.parse(text ?? '{"elements":[]}') as {
      elements: Record<string, unknown>[]
    }
  ).elements
const read = (file: string) => readFileSync(path.join(devContent, file), 'utf8')

describe('items on a canvas in the studio running locally', () => {
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer({
      ...BEN,
      STUDIO_PROTOTYPES: posix(devContent),
    })
  })
  afterAll(async () => {
    await studio?.stop()
  })

  // The first page compiles the canvas and the first preview document on a
  // cold dev server.
  test(
    '[CV-67] [CV-68] [CV-66] a view shows live, laid out at 1440 px, scaled to the item and cropped, taking no input',
    {
      timeout: 180_000,
    },
    async () => {
      const page = await canvasPage()
      await open(page, studio, SINGLE)
      const box = itemBox(page, 'home')
      await previewReady(box)
      expect(await frameText(box)).toBe('Welcome')
      const layout = await box.evaluate((element) => {
        const frame = element.querySelector('iframe')!
        const body = frame.closest('[inert]')!
        return {
          frameWidth: frame.offsetWidth,
          transform: (frame.parentElement as HTMLElement).style.transform,
          preview: (
            element.querySelector('[data-preview-state]') as HTMLElement
          ).style.height,
          inert: body !== null,
          pointer: getComputedStyle(body).pointerEvents,
        }
      })
      // 478 px inside the border, 300 px below the header.
      expect(layout.frameWidth).toBe(1440)
      expect(
        Number(/scale\(([\d.]+)\)/.exec(layout.transform)?.[1]),
      ).toBeCloseTo(478 / 1440, 5)
      expect(layout.preview).toBe('300px')
      expect(layout.inert).toBe(true)
      expect(layout.pointer).toBe('none')
      // A click on the preview selects the item instead of pressing its button.
      await select(page, box)
      expect(
        await page.evaluate(
          () => document.activeElement?.tagName.toLowerCase() ?? '',
        ),
      ).not.toBe('iframe')
    },
  )

  test('[CV-68] a taller item shows more of the view at the same scale', async () => {
    const page = await canvasPage()
    await open(page, studio, SINGLE)
    const box = itemBox(page, 'home')
    await previewReady(box)
    const layout = () =>
      box.evaluate((element) => ({
        transform: (
          element.querySelector('iframe')!.parentElement as HTMLElement
        ).style.transform,
        height: (element.querySelector('[data-preview-state]') as HTMLElement)
          .style.height,
      }))
    const before = await layout()
    expect(before.height).toBe('300px')
    // Resized through the agent tools, as a drag on its handle would.
    type Tools = { __studioCanvas?: { update: (args: unknown) => unknown } }
    await expect
      .poll(() =>
        page.evaluate(() => typeof (window as unknown as Tools).__studioCanvas),
      )
      .toBe('object')
    await page.evaluate(() =>
      (window as unknown as Tools).__studioCanvas!.update({
        id: 'home',
        height: 538,
      }),
    )
    await expect.poll(async () => (await layout()).height).toBe('500px')
    expect((await layout()).transform).toBe(before.transform)
  })

  test('[CV-69] [CV-86] the title bar names the item, opens it in one click, and a wheel over it pans the canvas', async () => {
    const page = await canvasPage()
    await open(page, studio, SINGLE)
    const bar = header(page, 'Home')
    await visible(bar)
    expect(await bar.textContent()).toContain('Home')
    const before = (await bar.boundingBox())!
    await page.mouse.move(before.x + 20, before.y + before.height / 2)
    await page.mouse.wheel(0, -120)
    await expect
      .poll(async () => (await bar.boundingBox())!.y, WAIT)
      .toBeGreaterThan(before.y + 50)
    // The pointer reaches the title bar through Excalidraw's layers, so
    // one click opens the item without selecting it first.
    const moved = (await bar.boundingBox())!
    const point = { x: moved.x + 20, y: moved.y + moved.height / 2 }
    await page.mouse.move(point.x, point.y)
    expect(
      await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest('[data-open]')?.textContent,
        point,
      ),
    ).toContain('Home')
    expect(await bar.evaluate((element) => element.matches(':hover'))).toBe(
      true,
    )
    await page.mouse.click(point.x, point.y)
    await expect.poll(() => page.url(), WAIT).toContain(address(HOME))
  })

  test('[CV-70] [CV-71] [CV-08] [CV-72] [CV-73] [PR-94] states are titled “View · State”; documents and canvases are cards; broken links say why', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await visible(header(page, 'Home · Member'))
    await previewReady(itemBox(page, 'member'))
    expect(await frameText(itemBox(page, 'member'))).toBe('Welcome, Ana')
    // The navigation helpers work in a view on a canvas.
    await visible(
      itemBox(page, 'member')
        .frameLocator('iframe[data-preview-frame]')
        .getByText(`Screen 1 lives at ${address(SCREENS[0]!)}`),
    )
    const card = (id: string) => itemBox(page, id)
    expect(await card('notes').innerText()).toMatch(/Notes\s+Document\s+Open/)
    expect(await card('other').innerText()).toMatch(/Other\s+Canvas\s+Open/)
    expect(await card('gone').innerText()).toMatch(
      /Not found\s+This file was moved or deleted\. Ask your agent to fix the link\./,
    )
    expect(await card('gone').getByRole('link').count()).toBe(0)
    expect(await card('away').innerText()).toMatch(
      /Another prototype\s+A canvas shows only its own prototype\. Copy the view here\./,
    )
    expect(
      await card('away')
        .getByText('A canvas shows only its own prototype.')
        .getAttribute('title'),
    ).toBe(
      'A canvas shows only its own prototype. Copy the view into this prototype, then link that.',
    )
    // A card's Open opens the artifact.
    await card('notes')
      .getByRole('link', { name: 'Open Notes', exact: true })
      .click()
    await expect.poll(() => page.url(), WAIT).toContain(address(NOTES))
  })

  test('[CV-67] a diagram shows live on the canvas', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await expect
      .poll(
        () =>
          itemBox(page, 'flow')
            .locator('[data-diagram-state]')
            .getAttribute('data-diagram-state'),
        WAIT,
      )
      .toBe('ready')
    expect(await itemBox(page, 'flow').locator('svg').count()).toBeGreaterThan(
      0,
    )
  })

  test('[CV-75] a preview that crashes says so without breaking the canvas, and tries again when its file changes', async () => {
    const page = await canvasPage()
    const broken = /DiagramEmbed\.vue/
    await page.route(broken, (route) => route.abort())
    await open(page, studio, CRASH)
    const box = itemBox(page, 'flow')
    await visible(
      box.getByText(
        'This preview could not render. Open the file to inspect it.',
      ),
    )
    await visible(header(page, 'Flow'))
    await page.unroute(broken)
    writeFileSync(
      path.join(devContent, 'ben/board/Flow.mermaid'),
      `%% @studio-id ${FLOW}\nflowchart LR\n  start[Sign in] --> home[Home] --> done[Done]\n`,
    )
    await expect
      .poll(
        () =>
          box
            .locator('[data-diagram-state]')
            .getAttribute('data-diagram-state'),
        WAIT,
      )
      .toBe('ready')
  })

  test('[CV-76] a preview that is still loading shows a muted placeholder of the same size', async () => {
    const page = await canvasPage()
    await page.route(/_preview\//, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      await route.continue()
    })
    await open(page, studio, SINGLE)
    const box = itemBox(page, 'home')
    const status = box.getByRole('status')
    await visible(status)
    expect(await status.textContent()).toContain('Loading preview…')
    const area = await box.evaluate((element) => {
      const body = element.querySelector('[data-preview-state]')!
      return [body.clientWidth, body.clientHeight]
    })
    expect(area).toEqual([478, 300])
  })

  test('[CV-77] [CV-78] [CV-81] zoomed far out items show their names; far off screen they stop painting but keep running; panning never re-renders them', async () => {
    const page = await canvasPage()
    await open(page, studio, SINGLE)
    const box = itemBox(page, 'home')
    await previewReady(box)
    await box.evaluate((element) => {
      ;(window as unknown as { mutations: number }).mutations = 0
      new MutationObserver(
        (records) =>
          ((window as unknown as { mutations: number }).mutations +=
            records.length),
      ).observe(element, { subtree: true, childList: true, attributes: true })
      ;(element.querySelector('iframe') as unknown as { mark: number }).mark = 1
    })
    // A short pan keeps the item in view: nothing inside it changes.
    const area = (await canvas(page).boundingBox())!
    await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2)
    for (let step = 0; step < 5; step++) await page.mouse.wheel(40, 0)
    await page.waitForTimeout(300)
    expect(
      await page.evaluate(
        () => (window as unknown as { mutations: number }).mutations,
      ),
    ).toBe(0)
    // Far away: not painted, but the same preview is still there.
    for (let step = 0; step < 12; step++) await page.mouse.wheel(0, 600)
    const body = box.locator('[inert]').first()
    await expect
      .poll(
        () => body.evaluate((element) => getComputedStyle(element).visibility),
        WAIT,
      )
      .toBe('hidden')
    expect(
      await box.evaluate(
        (element) =>
          (element.querySelector('iframe') as unknown as { mark?: number })
            ?.mark,
      ),
    ).toBe(1)
    // Zoomed far out, back in view: its name in large type.
    const fresh = await canvasPage()
    await open(fresh, studio, SINGLE)
    await fresh.mouse.move(area.x + area.width / 2, area.y + area.height / 2)
    await fresh.keyboard.down('Control')
    for (let step = 0; step < 20; step++) await fresh.mouse.wheel(0, 100)
    await fresh.keyboard.up('Control')
    const zoom = await fresh.locator('.reset-zoom-button').textContent()
    expect(Number.parseInt(zoom ?? '100')).toBeLessThan(12)
    const overview = itemBox(fresh, 'home').locator('.canvas-overview')
    await visible(overview)
    expect(await overview.textContent()).toBe('Home')
  })

  test('[CV-79] previews coming into view go live one at a time', async () => {
    const page = await canvasPage()
    await page.addInitScript(() => {
      const times: number[] = []
      ;(window as unknown as { liveAt: number[] }).liveAt = times
      new MutationObserver((records) => {
        for (const record of records)
          for (const node of record.addedNodes)
            if (
              node instanceof Element &&
              (node.matches('iframe[data-preview-frame]') ||
                node.querySelector('iframe[data-preview-frame]'))
            )
              times.push(performance.now())
      }).observe(document, { subtree: true, childList: true })
    })
    await open(page, studio, MANY)
    await expect
      .poll(() => page.locator('iframe[data-preview-frame]').count(), WAIT)
      .toBe(3)
    const times = await page.evaluate(
      () => (window as unknown as { liveAt: number[] }).liveAt,
    )
    expect(times).toHaveLength(3)
    for (let n = 1; n < times.length; n++)
      expect(times[n]! - times[n - 1]!).toBeGreaterThanOrEqual(100)
  })

  test('[CV-82] a view keeps its own link colours on the canvas', async () => {
    const page = await canvasPage()
    await open(page, studio, SINGLE)
    const box = itemBox(page, 'home')
    await previewReady(box)
    expect(
      await box
        .frameLocator('iframe[data-preview-frame]')
        .getByText('A red link')
        .evaluate((element) => getComputedStyle(element).color),
    ).toBe('rgb(200, 10, 10)')
  })

  test('[CV-60] [CV-63] [CV-64] a row dragged from the navigation lands as an item centered where it was dropped, outside the undo history', async () => {
    const page = await canvasPage()
    await open(page, studio, DROP)
    const nav = page.getByRole('navigation', { name: 'Board' })
    await expect.poll(() => nav.getAttribute('aria-busy'), WAIT).toBeNull()
    const row = nav.getByRole('treeitem', { name: 'Home', exact: true })
    const area = (await canvas(page).boundingBox())!
    const drop = { x: area.width / 2, y: area.height / 2 }
    await row.dragTo(canvas(page), { targetPosition: drop })
    await visible(header(page, 'Home'))
    const placed = (await items(page).first().boundingBox())!
    // Centered on the drop point (within the grid's snapping).
    expect(
      Math.abs(placed.x + placed.width / 2 - (area.x + drop.x)),
    ).toBeLessThan(25)
    expect(
      Math.abs(placed.y + placed.height / 2 - (area.y + drop.y)),
    ).toBeLessThan(25)
    await expect.poll(() => page.saved.length, WAIT).toBeGreaterThan(0)
    const [element] = stored(page.saved.at(-1)).filter(
      (entry) => entry.type === 'embeddable',
    )
    expect(element).toMatchObject({
      link: address(HOME),
      width: 480,
      height: 338,
      strokeColor: 'transparent',
      customData: { frame: true, hideLinkIcon: true },
    })
    expect(element!.roundness ?? null).toBeNull()
    // Placing and sizing are one step: one undo takes the item away.
    await page.mouse.click(area.x + 60, area.y + area.height / 2)
    await page.keyboard.press('Control+z')
    await expect.poll(() => items(page).count(), WAIT).toBe(0)
  })

  test('[CV-61] [CV-62] a copied link pasted over the canvas becomes an item; a link to another site doesn’t', async () => {
    const page = await canvasPage()
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    await open(page, studio, DROP)
    const area = (await canvas(page).boundingBox())!
    const spot = { x: area.x + area.width / 2, y: area.y + area.height / 2 }
    const paste = async (text: string) => {
      await page.evaluate((value) => navigator.clipboard.writeText(value), text)
      await page.mouse.click(spot.x, spot.y)
      await page.keyboard.press('Control+v')
    }
    await paste('https://example.com/some/page')
    await page.waitForTimeout(500)
    expect(await items(page).count()).toBe(0)
    await page.keyboard.press('Escape')
    await paste(`${studio.url.replace(/\/$/, '')}${address(NOTES)}`)
    await visible(items(page).first())
    expect(await items(page).first().innerText()).toMatch(/Notes\s+Document/)
    const placed = (await items(page).first().boundingBox())!
    expect(placed.height).toBeLessThan(placed.width / 2)
  })

  test('[CV-65] items select, move, copy and delete like any element; a deleted preview goes at once', async () => {
    const page = await canvasPage()
    await open(page, studio, SINGLE)
    const box = itemBox(page, 'home')
    await previewReady(box)
    await select(page, box)
    const before = (await header(page, 'Home').boundingBox())!
    await page.keyboard.press('Shift+ArrowRight')
    await expect
      .poll(async () => (await header(page, 'Home').boundingBox())!.x, WAIT)
      .toBeGreaterThan(before.x)
    await page.keyboard.press('Control+d')
    await expect.poll(() => items(page).count(), WAIT).toBe(2)
    await page.keyboard.press('Delete')
    await expect.poll(() => items(page).count(), WAIT).toBe(1)
    await select(page, itemBox(page, 'home'))
    await page.keyboard.press('Delete')
    await expect.poll(() => items(page).count(), WAIT).toBe(0)
    expect(await page.locator('iframe[data-preview-frame]').count()).toBe(0)
  })

  test('[CV-83] [CV-101] items follow their files: an edit shows in the preview, and a renamed file keeps its item with its new name', async () => {
    const page = await canvasPage()
    await open(page, studio, MOVED_BOARD)
    const box = itemBox(page, 'moved')
    await previewReady(box)
    expect(await frameText(box)).toBe('Before the move')
    writeFileSync(
      path.join(devContent, 'ben/board/Moved.vue'),
      view(MOVED, 'After an edit'),
    )
    await expect.poll(() => frameText(box), WAIT).toBe('After an edit')
    renameSync(
      path.join(devContent, 'ben/board/Moved.vue'),
      path.join(devContent, 'ben/board/Arrived.vue'),
    )
    await visible(header(page, 'Arrived'))
    await previewReady(box)
    expect(await frameText(box)).toBe('After an edit')
    // The canvas itself never changed.
    expect(read('ben/board/Moved board.excalidraw')).toContain(address(MOVED))
  })
})

describe('items on a canvas on the deployed site', () => {
  let site: RunningStudio
  // The build refuses a canvas linking another prototype.
  const staticContent = content('canvas-embeds-static')
  const board = path.join(staticContent, 'ben/board/Board.excalidraw')
  writeFileSync(
    board,
    readFileSync(board, 'utf8').replace(
      `/prototypes/${TRACER}/artifacts/${TRACER_HOME}`,
      address('cvemg0ne00000002'),
    ),
  )
  beforeAll(async () => {
    site = await startStaticSite('/studio-embeds/', {
      ...BEN,
      STUDIO_PROTOTYPES: posix(staticContent),
    })
  })
  afterAll(async () => {
    await site?.stop()
    rmSync(staticContent, { recursive: true, force: true })
  })

  test('[CV-72] [CV-67] a read-only canvas shows its live items, and a link to nothing says it may be archived', async () => {
    const page = await canvasPage()
    await open(page, site, BOARD)
    await previewReady(itemBox(page, 'home'))
    expect(await frameText(itemBox(page, 'home'))).toBe('Welcome')
    expect(await itemBox(page, 'gone').innerText()).toMatch(
      /Not found\s+Not on this site\. It may be archived\. Run the studio locally to see it\./,
    )
    await itemBox(page, 'notes')
      .getByRole('link', { name: 'Open Notes', exact: true })
      .click()
    await expect.poll(() => page.url(), WAIT).toContain(address(NOTES))
  })
})
