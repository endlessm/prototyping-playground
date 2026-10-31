// Canvases: a designer opens an `.excalidraw` file and draws on it with
// Excalidraw's tools, in the studio's trimmed menu, look and colour mode.
// The studio runs as Ben (a contributor) on a disposable copy of the
// fixtures: his own canvases are editable, Bernardo's are read-only, and the
// deployed site opens every canvas read-only. Excalidraw's fonts come from
// its CDN; the scenarios answer those requests themselves. They draw without
// saving, so each starts from the same files: their saves are answered here
// and never reach the disk (`canvas-saving.test.ts` covers saving).
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const posix = (file: string) => file.split(path.sep).join('/')
mkdirSync('.e2e', { recursive: true })

const SKETCHES = 'skch000000000001'
const BOARD = 'bard000000000001'
const EMPTY = 'empty00000000001'
const SECOND = 'secnd00000000001'
const BROKEN = 'brkn000000000001'
const NEWER = 'newr000000000001'
const PLAIN = 'p1a1n00000000001'
const THEIRS = 'thrs000000000001'

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
const shape = (id: string, type: string, x: number, y: number, more = {}) => ({
  id,
  type,
  x,
  y,
  width: 400,
  height: 300,
  seed: 1,
  version: 1,
  versionNonce: 1,
  index: `a${id}`,
  ...more,
})
// 3000 px wide: it opens fitted, below 100%.
const BOARD_ELEMENTS = [
  shape('1', 'text', 0, 0, {
    text: 'Welcome board',
    originalText: 'Welcome board',
    fontSize: 36,
    fontFamily: 6,
    width: 260,
    height: 45,
  }),
  shape('2', 'rectangle', 2600, 1200),
  shape('3', 'embeddable', 1200, 0, {
    link: `/prototypes/${SKETCHES}/artifacts/vnne000000000001`,
  }),
]

// Each server gets content of its own, inside the checkout (the studio's
// file service and preview documents serve files from the checkout only).
function content(name: string, { broken }: { broken: boolean }) {
  const dir = mkdtempSync(path.join('.e2e', `${name}-`))
  cpSync('tests/fixtures/prototypes', dir, { recursive: true })
  const write = (file: string, text: string) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), text)
  }
  write(
    'ben/sketches/meta.json',
    JSON.stringify({
      title: 'Sketches',
      studioId: SKETCHES,
      ownerContributorId: 'ben0000000000002',
      systemId: null,
    }),
  )
  write('ben/sketches/Board.excalidraw', scene(BOARD, BOARD_ELEMENTS))
  write('ben/sketches/Empty.excalidraw', scene(EMPTY, []))
  write(
    'ben/sketches/Second.excalidraw',
    scene(SECOND, [shape('4', 'ellipse', 0, 0)]),
  )
  write('bernardo/plain/Theirs.excalidraw', scene(THEIRS, []))
  // The build refuses these, so only the dev server gets them.
  if (broken) {
    write(
      'ben/sketches/Broken.excalidraw',
      JSON.stringify({ type: 'excalidraw', studioId: BROKEN }),
    )
    write(
      'ben/sketches/Newer.excalidraw',
      scene(NEWER, [shape('5', 'diamond', 0, 0)], { studioVersion: 2 }),
    )
  }
  return dir
}
const devContent = content('canvas', { broken: true })
const staticContent = content('canvas-static', { broken: false })
afterAll(() => {
  rmSync(devContent, { recursive: true, force: true })
  rmSync(staticContent, { recursive: true, force: true })
})

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
const fontRequests: string[] = []
// A page that answers Excalidraw's font requests itself and records them,
// and whose saves never reach the disk.
async function canvasPage() {
  const page = await newPage()
  await page.route('https://esm.sh/**', (route) => {
    fontRequests.push(route.request().url())
    return route.fulfill({ status: 404, body: '' })
  })
  await page.route(
    (url) => url.pathname.endsWith('/_studio/files/source'),
    (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({ json: { version: 'unsaved', warnings: [] } })
        : route.fallback(),
  )
  return page
}
const address = (studio: RunningStudio, prototype: string, artifact: string) =>
  `${studio.url}prototypes/${prototype}/artifacts/${artifact}`
const canvas = (page: Page) => page.locator('.canvas')
async function opened(page: Page) {
  await expect
    .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
      timeout: 60_000,
    })
    .toBe('ready')
}
async function open(page: Page, studio: RunningStudio, artifact: string) {
  await page.goto(address(studio, SKETCHES, artifact))
  await opened(page)
}
async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 30_000 }).toBe(true)
}
const toolbar = (page: Page) => page.locator('.App-toolbar')
const zoom = (page: Page) => page.locator('.reset-zoom-button').textContent()
const tool = (page: Page, name: string) =>
  page.getByRole('radio', { name, exact: true })
const menuItem = (page: Page, name: string) =>
  page.locator('.dropdown-menu-item').filter({ hasText: name })
async function openMenu(page: Page) {
  await page.getByTestId('main-menu-trigger').click()
  await visible(page.locator('.dropdown-menu'))
}
// Whether the scene holds nothing, as the page reports it (no message shows).
const empty = (page: Page) =>
  canvas(page).evaluate((node) => node.hasAttribute('data-canvas-empty'))
const message = (page: Page) => page.getByText('This canvas is empty')
// The artifact page's area beside the navigation.
const artifactArea = (page: Page) =>
  page.locator('[id$="-panel-prototype-artifact"] [data-slot="body"]').first()
// Excalidraw's style panel, shown while something is selected.
const stylePanel = (page: Page) =>
  page.locator('.selected-shape-actions .Island').first()
// Focus the drawing surface, the way a click on an empty spot does.
async function focusCanvas(page: Page) {
  const box = (await canvas(page).boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 80)
}

describe('a canvas in the studio running locally', () => {
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

  test('[CV-01] [CV-04] [CV-07] is listed by its file name with the canvas icon, and needs no design system', async () => {
    const page = await canvasPage()
    const previews: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/_preview/')) previews.push(request.url())
    })
    await open(page, studio, BOARD)
    const link = page.getByRole('link', { name: 'Board', exact: true })
    await visible(link)
    expect(
      await link.locator('.iconify').first().getAttribute('class'),
    ).toMatch(/presentation/)
    expect(previews).toEqual([])
  })

  test('[CV-15] [CV-17] [CV-20] [CV-12] opens behind one quiet status, then reveals once, already editable', async () => {
    const page = await canvasPage()
    // A slow editor download, so the status has time to show.
    await page.route('**/island/mount.ts*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await route.continue()
    })
    await page.addInitScript(() => {
      const log: { at: number; event: string }[] = []
      ;(window as unknown as { openingLog: typeof log }).openingLog = log
      new MutationObserver(() => {
        const root = document.querySelector('.canvas')
        if (!root) return
        const status = root.querySelector('[role="status"]')
        const span = status?.querySelector('span')
        const state = [
          status ? 'status' : '',
          span?.classList.contains('sr-only') ? 'quiet' : '',
          span?.classList.contains('canvas-opening-shimmer') ? 'shown' : '',
          root.getAttribute('aria-busy') ? 'busy' : '',
          root.getAttribute('data-canvas-opening') ?? '',
          document.querySelector('.excalidraw--view-mode') ? 'view-mode' : '',
        ].join(' ')
        if (log.at(-1)?.event !== state)
          log.push({ at: performance.now(), event: state })
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
      })
    })
    await open(page, studio, BOARD)
    const log = await page.evaluate(
      () =>
        (window as unknown as { openingLog: { at: number; event: string }[] })
          .openingLog,
    )
    const first = log.find(({ event }) => event.includes('status'))!
    const shown = log.find(({ event }) => event.includes('shown'))!
    expect(first.event).toMatch(/status quiet\s+busy loading/)
    expect(shown.at - first.at).toBeGreaterThanOrEqual(190)
    // Revealed once, and never hidden again.
    const ready = log.findIndex(({ event }) => event.endsWith('ready'))
    expect(log.slice(ready).every(({ event }) => event.includes('ready'))).toBe(
      true,
    )
    expect(log.some(({ event }) => event.includes('view-mode'))).toBe(false)
    expect(await canvas(page).getAttribute('aria-busy')).toBeNull()
    expect(await page.locator('.canvas-scene').getAttribute('inert')).toBeNull()
    // Only the save status is left.
    expect(
      await page
        .getByRole('status')
        .and(page.locator(':not([data-save-status])'))
        .count(),
    ).toBe(0)
    expect(
      await page
        .locator('.canvas-scene')
        .evaluate((element) => getComputedStyle(element).transitionDuration),
    ).toBe('0.16s')
    await visible(toolbar(page))
  })

  test('[CV-16] [CV-20] with reduced motion the status is static and the scene appears without a fade', async () => {
    const page = await canvasPage()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/island/mount.ts*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await route.continue()
    })
    await page.goto(address(studio, SKETCHES, BOARD))
    const shimmer = page.locator('.canvas-opening-shimmer')
    await visible(shimmer)
    expect(
      await shimmer.evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe('none')
    expect(
      await page
        .locator('.canvas-scene')
        .evaluate((element) => getComputedStyle(element).transitionProperty),
    ).toBe('none')
    await opened(page)
  })

  test('[CV-21] the opening completes when the tab runs no animation frames', async () => {
    const page = await canvasPage()
    await page.addInitScript(() => {
      window.requestAnimationFrame = () => 0
    })
    await open(page, studio, EMPTY)
  })

  test('[CV-22] a file that is not a canvas says so, with the reason', async () => {
    const page = await canvasPage()
    await page.goto(address(studio, SKETCHES, BROKEN))
    const alert = page.getByRole('alert')
    await visible(alert)
    expect(await alert.textContent()).toContain(
      'This canvas couldn’t be opened. Ask your agent to fix the file.',
    )
    expect(await alert.textContent()).toContain(
      'This isn’t a canvas file: it has no list of elements.',
    )
  })

  test('[CV-23] [CV-27] [CV-31] an empty canvas of your own fills the page with no message, frame or file menu, as in React, and drawing on it fills it', async () => {
    const page = await canvasPage()
    await open(page, studio, EMPTY)
    await expect.poll(() => empty(page)).toBe(true)
    // React's hint is painted under Excalidraw and never seen; none here.
    await page.waitForTimeout(1000)
    expect(await message(page).count()).toBe(0)
    // Edge to edge beside the navigation: no padding, border or "…" menu.
    expect(
      await canvas(page).evaluate(
        (node) => getComputedStyle(node).borderTopWidth,
      ),
    ).toBe('0px')
    const area = (await artifactArea(page).boundingBox())!
    const box = (await canvas(page).boundingBox())!
    expect(Math.abs(box.x - area.x)).toBeLessThan(1)
    expect(Math.abs(box.y - area.y)).toBeLessThan(1)
    expect(Math.abs(box.width - area.width)).toBeLessThan(1)
    expect(Math.abs(box.height - area.height)).toBeLessThan(1)
    expect(
      await page.getByRole('button', { name: 'File actions' }).count(),
    ).toBe(0)
    for (const name of [
      'Selection',
      'Hand (panning tool) — H',
      'Rectangle',
      'Diamond',
      'Ellipse',
      'Arrow',
      'Line',
      'Draw',
      'Text',
      'Eraser',
    ])
      expect(await tool(page, name).count(), name).toBe(1)
    await focusCanvas(page)
    await page.keyboard.press('r')
    await expect.poll(() => tool(page, 'Rectangle').isChecked()).toBe(true)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      box.x + box.width / 2 + 200,
      box.y + box.height / 2 + 150,
      {
        steps: 5,
      },
    )
    await page.mouse.up()
    await expect.poll(() => empty(page)).toBe(false)
  })

  test('[CV-33] new text uses Nunito', async () => {
    const page = await canvasPage()
    await open(page, studio, EMPTY)
    await tool(page, 'Text').check({ force: true })
    const box = (await canvas(page).boundingBox())!
    await page.mouse.click(box.x + 300, box.y + 300)
    const editor = page.locator('textarea.excalidraw-wysiwyg')
    await visible(editor)
    expect(
      await editor.evaluate((element) => getComputedStyle(element).fontFamily),
    ).toMatch(/Nunito/)
  })

  test('[CV-14] Excalidraw’s fonts load from its CDN', async () => {
    const page = await canvasPage()
    fontRequests.length = 0
    await open(page, studio, BOARD)
    await expect
      .poll(() => fontRequests.some((url) => url.includes('@excalidraw')), {
        timeout: 30_000,
      })
      .toBe(true)
  })

  test('[CV-28] [CV-23] [CV-35] someone else’s canvas opens read-only, with a menu holding only Hide controls', async () => {
    const page = await canvasPage()
    await page.goto(address(studio, PLAIN, THEIRS))
    await opened(page)
    await expect.poll(() => empty(page)).toBe(true)
    await page.waitForTimeout(1000)
    expect(await message(page).count()).toBe(0)
    expect(await toolbar(page).count()).toBe(0)
    await openMenu(page)
    expect(
      (await page.locator('.dropdown-menu-item').allTextContents()).map(
        (text) => text.replace(/(Ctrl|⌘).*$/, '').trim(),
      ),
    ).toEqual(['Hide controls'])
    // N adds nothing here.
    await page.keyboard.press('Escape')
    await focusCanvas(page)
    await page.keyboard.press('n')
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(await empty(page)).toBe(true)
  })

  test('[CV-29] a canvas from a newer format opens read-only', async () => {
    const page = await canvasPage()
    await open(page, studio, NEWER)
    expect(await toolbar(page).count()).toBe(0)
    expect(await page.locator('.excalidraw--view-mode').count()).toBe(1)
  })

  test('[CV-34] [CV-37] [CV-38] [CV-39] the menu holds the studio’s trimmed set, with shortcuts for this computer', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await openMenu(page)
    const items = await page.locator('.dropdown-menu-item').allTextContents()
    expect(items).toEqual([
      'UndoCtrl+Z',
      'RedoCtrl+Shift+Z',
      "Toggle gridCtrl+Shift+'",
      'Snap to objectsAlt+S',
      'Help?',
      'Hide controlsCtrl+.',
    ])
    const menu = (await page.locator('.dropdown-menu').textContent()) ?? ''
    expect(menu).toContain('Canvas background')
    expect(
      await page.locator('.dropdown-menu .color-picker__button').count(),
    ).toBeGreaterThan(1)
    for (const gone of [
      'Open',
      'Save to',
      'Export',
      'Reset the canvas',
      'Dark mode',
      'Light mode',
      'Command palette',
    ])
      expect(menu, gone).not.toContain(gone)
    // Undo, Redo and Help live only in the menu.
    for (const corner of ['.undo-redo-buttons', '.help-icon'])
      expect(await page.locator(corner).first().isVisible(), corner).toBe(false)
  })

  test('[CV-36] [CV-52] grid and snap show their state, follow the shortcut, and turn each other off', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await focusCanvas(page)
    await page.keyboard.press("Control+Shift+'")
    await openMenu(page)
    expect(
      await menuItem(page, 'Toggle grid').getAttribute('aria-pressed'),
    ).toBe('true')
    await menuItem(page, 'Snap to objects').click()
    await openMenu(page)
    expect(
      await menuItem(page, 'Toggle grid').getAttribute('aria-pressed'),
    ).toBe('false')
    expect(
      await menuItem(page, 'Snap to objects').getAttribute('aria-pressed'),
    ).toBe('true')
  })

  test('[CV-53] ⌘’ / Ctrl+’ opens the canvas’s source, even over Excalidraw', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    // With a selection, whose style panel holds colour pickers.
    await focusCanvas(page)
    await page.keyboard.press('Control+a')
    await visible(stylePanel(page))
    await page.keyboard.press("Control+'")
    await expect
      .poll(() => new URL(page.url()).searchParams.get('mode'))
      .toBe('source')
  })

  test('[CV-40] [CV-54] the Help dialog opens on ? and lists only shortcuts that work here', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await focusCanvas(page)
    await page.keyboard.press('Shift+?')
    const dialog = page.locator('.HelpDialog')
    await visible(dialog)
    const rows = await dialog
      .locator('.HelpDialog__shortcut')
      .evaluateAll((elements) =>
        elements
          .filter((element) => (element as HTMLElement).offsetParent)
          .map((element) => element.firstElementChild?.textContent?.trim()),
      )
    expect(rows).toContain('Rectangle')
    for (const hidden of [
      'Toggle grid',
      'Insert image',
      'Reset the canvas',
      'Toggle light/dark theme',
      'View mode',
      'Command palette',
    ])
      expect(rows, hidden).not.toContain(hidden)
    expect(
      await dialog.locator('.HelpDialog__header').first().isVisible(),
    ).toBe(false)
  })

  test('[CV-41] [CV-42] Ctrl+. hides every control but the menu; hint lines and toolbar numbers never show', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await tool(page, 'Rectangle').check({ force: true })
    expect(await page.locator('.HintViewer').first().isVisible()).toBe(false)
    expect(
      await page
        .locator('.App-toolbar .ToolIcon__keybinding')
        .first()
        .isVisible(),
    ).toBe(false)
    await focusCanvas(page)
    await page.keyboard.press('Control+.')
    await expect.poll(() => toolbar(page).isVisible()).toBe(false)
    expect(await page.getByTestId('main-menu-trigger').isVisible()).toBe(true)
    await page.keyboard.press('Control+.')
    await visible(toolbar(page))
  })

  test('[CV-43] toolbar controls show a fast tooltip with the name and shortcut keys', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await page
      .locator('.App-toolbar label')
      .filter({ has: tool(page, 'Rectangle') })
      .hover()
    const tip = page.getByRole('tooltip')
    await visible(tip)
    expect(await tip.locator('span').textContent()).toBe('Rectangle')
    expect(await tip.locator('kbd').allTextContents()).toEqual(['R', '2'])
    await page.mouse.down()
    await expect.poll(() => tip.count()).toBe(0)
    await page.mouse.up()
  })

  test('[CV-44] [CV-45] a narrow canvas keeps the desktop layout on one row', async () => {
    const page = await canvasPage()
    await page.setViewportSize({ width: 820, height: 700 })
    await open(page, studio, BOARD)
    expect(await page.locator('.excalidraw--mobile').count()).toBe(0)
    await visible(toolbar(page))
    expect(
      await page.locator('.sidebar-trigger__label').first().isVisible(),
    ).toBe(false)
  })

  test('[CV-46] [CV-50] Excalidraw’s controls wear the studio’s tokens', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    const [island, surface] = await page.evaluate(() => [
      getComputedStyle(document.querySelector('.excalidraw')!)
        .getPropertyValue('--island-bg-color')
        .trim(),
      getComputedStyle(document.documentElement)
        .getPropertyValue('--ui-bg')
        .trim(),
    ])
    expect(island).toBe(surface)
  })

  test('[CV-47] selecting only an item hides the style panel', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    // The item sits after the text; select everything, then only it.
    await focusCanvas(page)
    await page.keyboard.press('Control+a')
    await visible(stylePanel(page))
    const frame = page.locator('.excalidraw__embeddable-container').first()
    const box = (await frame.boundingBox())!
    await page.keyboard.press('Escape')
    await page.mouse.click(box.x + 4, box.y + 4)
    await expect
      .poll(() =>
        page.locator('.canvas-editor').getAttribute('data-items-only'),
      )
      .toBe('')
    expect(await stylePanel(page).isVisible()).toBe(false)
  })

  test('[CV-32] [CV-57] Excalidraw’s own selection, context menu and zoom controls stay; the menu can’t add to the Library', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    // Select the rectangle: its style panel appears at the left.
    await focusCanvas(page)
    await page.keyboard.press('Control+a')
    await visible(stylePanel(page))
    expect(await stylePanel(page).textContent()).toContain('Stroke')
    // The context menu offers grouping, alignment, locking and layers.
    const box = (await canvas(page).boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
      button: 'right',
    })
    const contextMenu = page.locator('.context-menu')
    await visible(contextMenu)
    const items = await contextMenu.locator('button').allTextContents()
    for (const name of ['Group selection', 'Bring to front', 'Lock'])
      expect(
        items.some((item) => item.startsWith(name)),
        name,
      ).toBe(true)
    // Excalidraw offers it for a selection; the studio hides it.
    expect(await contextMenu.textContent()).toContain('Add to library')
    expect(await contextMenu.innerText()).not.toContain('Add to library')
    await page.keyboard.press('Escape')
    // The zoom controls stay.
    const before = Number.parseInt((await zoom(page)) ?? '', 10)
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect
      .poll(async () => Number.parseInt((await zoom(page)) ?? '', 10))
      .toBeGreaterThan(before)
  })

  test('[CV-48] [CV-49] the editor follows the studio’s colour mode from the first paint, and live', async () => {
    const page = await canvasPage()
    await page.addInitScript(() => {
      localStorage.setItem('design-studio:color-mode', 'dark')
      const seen: string[] = []
      ;(window as unknown as { themes: string[] }).themes = seen
      new MutationObserver(() => {
        const editor = document.querySelector('.excalidraw')
        const theme = editor?.classList.contains('theme--dark')
          ? 'dark'
          : editor
            ? 'light'
            : ''
        if (theme && seen.at(-1) !== theme) seen.push(theme)
      }).observe(document, { subtree: true, childList: true, attributes: true })
    })
    await open(page, studio, BOARD)
    expect(
      await page.evaluate(
        () => (window as unknown as { themes: string[] }).themes,
      ),
    ).toEqual(['dark'])
    await page.getByRole('button', { name: 'Color mode' }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Light' }).click()
    await expect
      .poll(() => page.locator('.excalidraw.theme--dark').count())
      .toBe(0)
  })

  test('[CV-51] N adds a sticky note on your own canvas, as one undo step', async () => {
    const page = await canvasPage()
    await open(page, studio, EMPTY)
    await expect.poll(() => empty(page)).toBe(true)
    await focusCanvas(page)
    await page.keyboard.press('n')
    await expect.poll(() => empty(page)).toBe(false)
    await visible(stylePanel(page))
    await page.keyboard.press('Control+z')
    await expect.poll(() => empty(page)).toBe(true)
  })

  test('[CV-54] [CV-58] tools answer their letters; there is no image tool', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await focusCanvas(page)
    await page.keyboard.press('r')
    await expect.poll(() => tool(page, 'Rectangle').isChecked()).toBe(true)
    await page.keyboard.press('o')
    await expect.poll(() => tool(page, 'Ellipse').isChecked()).toBe(true)
    expect(await page.getByRole('radio', { name: /image/i }).count()).toBe(0)
    // 9 would ask for an image file.
    let chooser = false
    page.on('filechooser', () => (chooser = true))
    await page.keyboard.press('9')
    await page.waitForTimeout(500)
    expect(chooser).toBe(false)
    expect(await tool(page, 'Ellipse').isChecked()).toBe(true)
  })

  test('[CV-31] the extra tools hold the frame, the laser pointer and Mermaid to Excalidraw', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await page.locator('.App-toolbar__extra-tools-trigger').click()
    await visible(page.locator('.dropdown-menu-item').first())
    const items = await page.locator('.dropdown-menu-item').allTextContents()
    for (const name of ['Frame tool', 'Laser pointer', 'Mermaid to Excalidraw'])
      expect(
        items.some((item) => item.startsWith(name)),
        name,
      ).toBe(true)
  })

  test('[CV-38] Excalidraw’s command palette is gone, and ⌘K / Ctrl+K over a read-only canvas opens the studio’s search', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await focusCanvas(page)
    await page.keyboard.press('Control+/')
    await page.keyboard.press('Control+Shift+P')
    await page.waitForTimeout(500)
    expect(await page.locator('.CommandPalette').count()).toBe(0)
    // Over an editable canvas Excalidraw keeps ⌘K for its link editor (as
    // in React), which waits on Bernardo's decision (ticket 34).
    await page.goto(address(studio, PLAIN, THEIRS))
    await opened(page)
    await focusCanvas(page)
    await page.keyboard.press('Control+k')
    await visible(page.getByPlaceholder('Search the studio'))
  })

  test('[CV-55] [CV-56] [CV-57] the Library holds only four sticky notes', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await page.locator('.sidebar-trigger').click()
    const sidebar = page.locator('.default-sidebar')
    await visible(sidebar)
    await expect
      .poll(() => sidebar.locator('.library-unit').count(), { timeout: 10_000 })
      .toBe(4)
    expect(
      await sidebar
        .locator('.library-menu-items-container__header--excal')
        .evaluate((element) => getComputedStyle(element, '::after').content),
    ).toBe('"Sticky notes"')
    for (const gone of [
      '.library-menu-browse-button',
      '.library-menu-dropdown-container',
    ])
      expect(await sidebar.locator(gone).first().isVisible(), gone).toBe(false)
  })

  test('[CV-18] [CV-25] [CV-24] [CV-84] opens fitted, pans and zooms with the wheel, and comes back where you left it', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    const fitted = Number.parseInt((await zoom(page)) ?? '', 10)
    expect(fitted).toBeLessThan(100)
    const key = `design-studio:canvas-camera:${BOARD}`
    const box = (await canvas(page).boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(120, 80)
    await expect
      .poll(() => page.evaluate((name) => localStorage.getItem(name), key))
      .not.toBeNull()
    const panned = JSON.parse(
      (await page.evaluate((name) => localStorage.getItem(name), key))!,
    )
    expect(panned.zoom * 100).toBeCloseTo(fitted, -1)
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -200)
    await page.keyboard.up('Control')
    await expect
      .poll(async () => Number.parseInt((await zoom(page)) ?? '', 10))
      .toBeGreaterThan(fitted)
    await new Promise((resolve) => setTimeout(resolve, 600))
    const left = await zoom(page)
    await page.reload()
    await opened(page)
    expect(await zoom(page)).toBe(left)
    // A damaged position is ignored: the canvas fits again.
    await page.evaluate(
      (name) => localStorage.setItem(name, '{"scrollX":null,"zoom":0}'),
      key,
    )
    await page.reload()
    await opened(page)
    expect(Number.parseInt((await zoom(page)) ?? '', 10)).toBe(fitted)
  })

  test('[CV-85] the canvas contains overscroll, so a sideways swipe never goes back a page', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    expect(
      await canvas(page).evaluate(
        (element) => getComputedStyle(element).overscrollBehaviorX,
      ),
    ).toBe('none')
  })

  test('[CV-13] opening another canvas starts a fresh editor', async () => {
    const page = await canvasPage()
    await open(page, studio, BOARD)
    await focusCanvas(page)
    await page.keyboard.press('Control+.')
    await expect.poll(() => toolbar(page).isVisible()).toBe(false)
    await page.getByRole('link', { name: 'Second', exact: true }).click()
    await expect.poll(() => page.url()).toContain(SECOND)
    await opened(page)
    await visible(toolbar(page))
  })
})

describe('a canvas on the deployed site', () => {
  let site: RunningStudio
  beforeAll(async () => {
    site = await startStaticSite('/studio-canvas/', {
      STUDIO_PROTOTYPES: posix(staticContent),
    })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[CV-11] [CV-28] [CV-30] loads Excalidraw only when a canvas opens, and shows the committed file read-only', async () => {
    const page = await canvasPage()
    const scripts: string[] = []
    page.on('response', async (response) => {
      if (response.url().endsWith('.js'))
        scripts.push(await response.text().catch(() => ''))
    })
    await page.goto(site.url)
    await visible(page.getByRole('heading', { level: 1 }))
    expect(
      scripts.some((text) => text.includes('excalidraw-modal-container')),
    ).toBe(false)
    await page.goto(address(site, SKETCHES, BOARD))
    await opened(page)
    expect(
      scripts.some((text) => text.includes('excalidraw-modal-container')),
    ).toBe(true)
    expect(await toolbar(page).count()).toBe(0)
    expect(await page.locator('.excalidraw--view-mode').count()).toBe(1)
    expect(Number.parseInt((await zoom(page)) ?? '', 10)).toBeLessThan(100)
    await openMenu(page)
    expect(
      (await page.locator('.dropdown-menu-item').allTextContents()).map(
        (text) => text.replace(/(Ctrl|⌘).*$/, '').trim(),
      ),
    ).toEqual(['Hide controls'])
  })
})
