// Comments on canvases, end to end: commenting on a sticky note, an item,
// a shape, an arrow, a text and an empty spot; comment mode keeping every
// press from Excalidraw while the wheel still pans and zooms; pins that
// follow panning, zooming and elements moved by the person or an agent's
// tool, in the same frame; a deleted element's "Target not found"; the
// canvas file never changed by commenting; Ben's canvas, read-only for Ada,
// still open to comments; and the toolbar clear of the canvas's own
// controls. The studio runs as Ada on a disposable copy of
// tests/fixtures/comments.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import type { CanvasAgent } from '../../src/modules/canvas/island/agent'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

declare global {
  interface Window {
    /** The canvas tools in the open canvas (`island/agent.ts`). */
    __studioCanvas?: CanvasAgent
  }
}

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'comments-canvas-'))
cpSync('tests/fixtures/comments', content, { recursive: true })
const env = {
  STUDIO_PROTOTYPES: content.split(path.sep).join('/'),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
  STUDIO_GITHUB: '',
}

const REVIEW = 'rvw0000000000c01'
const BOARD_VIEW = 'b0ard0000000c001'
const BOARD = 'rvwc000000000c01'
const NOTES = 'b3nf000000000c01'
const WALL = 'b3nc000000000c01'
const review = path.join(content, 'ada', 'review')
const notes = path.join(content, 'ben', 'notes')
const BOARD_FILE = path.join(review, 'Board.excalidraw')
const WALL_FILE = path.join(notes, 'Wall.excalidraw')
const BOARD_TEXT = readFileSync(BOARD_FILE, 'utf8')
const WALL_TEXT = readFileSync(WALL_FILE, 'utf8')

const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Comment tools' })
const commentButton = (page: Page) =>
  toolbar(page).getByRole('button', { name: 'Comment', exact: true })
const composer = (page: Page) =>
  page.getByRole('dialog', { name: 'New comment' })
const thread = (page: Page, number: number) =>
  page.getByRole('dialog', { name: `Comment ${number}` })
const pin = (page: Page, number: number) =>
  page.getByRole('button', { name: new RegExp(`^Comment ${number} by `) })
const allComments = (page: Page) =>
  toolbar(page).getByRole('button', { name: /^All comments/ })
const list = (page: Page) =>
  page.getByRole('complementary', { name: 'Comments' })
const hoverLabel = (page: Page) => page.locator('[data-comment-hover-label]')
const canvas = (page: Page) => page.locator('.canvas')

type StoredThread = {
  id: string
  artifact: string
  anchor: Record<string, unknown>
  messages: { body: string }[]
}
const threadsOf = (folder: string) => path.join(folder, '.comments')
function stored(folder: string): StoredThread[] {
  const threads = threadsOf(folder)
  if (!existsSync(threads)) return []
  return readdirSync(threads)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(path.join(threads, name), 'utf8')))
}
const storedWith = (folder: string, body: string) =>
  stored(folder).find(({ messages }) => messages[0]?.body === body)

type Point = { x: number; y: number }
const centre = async (locator: Locator) => {
  const box = await locator.boundingBox()
  return box && { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const distance = (a: Point | null, b: Point | null) =>
  a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity

/** Where a point of the scene is in the window, as the agent tools see it. */
const onScreen = (page: Page, point: Point) =>
  page.evaluate((point) => {
    const { viewport } = window.__studioCanvas!.context() as {
      viewport: { x: number; y: number; zoom: number }
    }
    const frame = document
      .querySelector('.canvas .excalidraw')!
      .getBoundingClientRect()
    return {
      x: frame.left + (point.x - viewport.x) * viewport.zoom,
      y: frame.top + (point.y - viewport.y) * viewport.zoom,
    }
  }, point)

async function post(page: Page, text: string, folder: string) {
  await expect.poll(() => composer(page).isVisible()).toBe(true)
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
  await expect.poll(() => composer(page).isVisible()).toBe(false)
  await expect.poll(() => Boolean(storedWith(folder, text))).toBe(true)
  return storedWith(folder, text)!
}

async function commentMode(page: Page) {
  if ((await commentButton(page).getAttribute('aria-pressed')) !== 'true')
    await commentButton(page).click()
  await expect
    .poll(() => commentButton(page).getAttribute('aria-pressed'))
    .toBe('true')
}

/** Comments on what is at a point of the scene, in comment mode. */
async function commentAt(
  page: Page,
  point: Point,
  text: string,
  folder = review,
) {
  await commentMode(page)
  const at = await onScreen(page, point)
  await page.mouse.move(at.x, at.y)
  await page.mouse.click(at.x, at.y)
  return post(page, text, folder)
}

describe('on the dev server', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
    rmSync(content, { recursive: true, force: true })
  })
  beforeEach(() => {
    for (const folder of [review, notes])
      rmSync(threadsOf(folder), { recursive: true, force: true })
    if (readFileSync(BOARD_FILE, 'utf8') !== BOARD_TEXT)
      writeFileSync(BOARD_FILE, BOARD_TEXT)
  })

  async function openCanvas(prototype: string, artifact: string) {
    const page = await newPage()
    // Excalidraw's fonts come from its CDN.
    await page.route('https://esm.sh/**', (route) =>
      route.fulfill({ status: 404, body: '' }),
    )
    await page.goto(
      `${studio.url}prototypes/${prototype}/artifacts/${artifact}`,
    )
    await expect
      .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
        timeout: 150_000,
      })
      .toBe('ready')
    await expect
      .poll(() => page.evaluate(() => typeof window.__studioCanvas), {
        timeout: 30_000,
      })
      .toBe('object')
    await expect
      .poll(() => commentButton(page).isEnabled(), { timeout: 30_000 })
      .toBe(true)
    return page
  }
  const openBoard = () => openCanvas(REVIEW, BOARD)

  test('[CM-16] a comment on a sticky note names it by its text and records its element', async () => {
    const page = await openBoard()
    await commentMode(page)
    const at = await onScreen(page, { x: 500, y: 150 })
    await page.mouse.move(at.x, at.y)
    await expect
      .poll(() => hoverLabel(page).textContent())
      .toBe('Sticky note "Ask eng about the empty state"')
    await page.mouse.click(at.x, at.y)
    const saved = await post(page, 'Who answers this?', review)
    expect(saved.artifact).toBe(BOARD)
    expect(saved.anchor).toMatchObject({
      kind: 'note',
      label: 'Sticky note "Ask eng about the empty state"',
      element: 'note',
      text: 'Ask eng about the empty state',
    })
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    expect(distance(await centre(pin(page, 1)), at)).toBeLessThan(4)
    await page.close()
  })
  test('[CM-15] [CM-16] an item, a shape, an arrow, a text and an empty spot are each a target', async () => {
    const page = await openBoard()
    await commentMode(page)
    const labelAt = async (point: Point) => {
      const at = await onScreen(page, point)
      await page.mouse.move(at.x, at.y)
      await expect.poll(() => hoverLabel(page).isVisible()).toBe(true)
      return hoverLabel(page).textContent()
    }
    expect(await labelAt({ x: 80, y: 370 })).toBe('Rectangle')
    expect(await labelAt({ x: 280, y: 370 })).toBe('Arrow')
    expect(await labelAt({ x: 450, y: 272 })).toBe('Text "Review board"')
    expect(await labelAt({ x: 160, y: 120 })).toBe('Item "Board"')
    expect(await labelAt({ x: 700, y: 150 })).toBe('Empty spot')

    const onItem = await commentAt(page, { x: 160, y: 120 }, 'Too busy')
    expect(onItem.anchor).toMatchObject({
      kind: 'item',
      label: 'Item "Board"',
      element: 'item',
      item: `/prototypes/${REVIEW}/artifacts/${BOARD_VIEW}`,
      text: 'Board',
    })
    const onSpot = await commentAt(page, { x: 700, y: 150 }, 'A legend here')
    expect(onSpot.anchor).toMatchObject({ kind: 'spot', label: 'Empty spot' })
    const point = onSpot.anchor.point as Point
    expect(Math.abs(point.x - 700)).toBeLessThan(4)
    expect(Math.abs(point.y - 150)).toBeLessThan(4)
    await expect.poll(() => pin(page, 2).isVisible()).toBe(true)
    expect(
      distance(await centre(pin(page, 2)), await onScreen(page, point)),
    ).toBeLessThan(4)
    await page.close()
  })

  /** The note's place, the selection and the camera, as the tools see them. */
  const sceneState = (page: Page) =>
    page.evaluate(() => {
      const canvas = window.__studioCanvas!
      const note = (
        canvas.describe({ ids: ['note'] }) as {
          elements: { id: string; x: number; y: number }[]
        }
      ).elements.find(({ id }) => id === 'note')!
      const { selection, viewport } = canvas.context() as {
        selection: string[]
        viewport: { x: number; y: number; zoom: number }
      }
      return { note: { x: note.x, y: note.y }, selection, viewport }
    })

  test('comment mode keeps every press from Excalidraw, while the wheel still pans and zooms', async () => {
    const page = await openBoard()
    await commentMode(page)
    const from = await onScreen(page, { x: 500, y: 150 })
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(from.x + 120, from.y + 60, { steps: 6 })
    await page.mouse.up()
    await page.keyboard.press('Escape')
    await expect.poll(() => composer(page).isVisible()).toBe(false)
    const before = await sceneState(page)
    expect(before.note).toEqual({ x: 400, y: 0 })
    expect(before.selection).toEqual([])
    // Still in comment mode: the wheel pans, and with Ctrl it zooms.
    expect(await commentButton(page).getAttribute('aria-pressed')).toBe('true')
    await page.mouse.wheel(120, 80)
    await expect
      .poll(async () => (await sceneState(page)).viewport.x)
      .not.toBe(before.viewport.x)
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -200)
    await page.keyboard.up('Control')
    await expect
      .poll(async () => (await sceneState(page)).viewport.zoom)
      .toBeGreaterThan(before.viewport.zoom)
    const after = await sceneState(page)
    expect(after.note).toEqual({ x: 400, y: 0 })
    expect(after.selection).toEqual([])
    await page.close()
  })

  test('[CM-22] [CM-24] a pin follows panning, zooming and its element moved by the person or an agent, in the same frame', async () => {
    const page = await openBoard()
    // On the item, whose preview Excalidraw places in the page itself: in
    // every frame while a wheel pans or zooms, or an agent's tool moves it,
    // the pin is still a quarter of the way across it.
    await commentAt(page, { x: 80, y: 120 }, 'Left side')
    await commentButton(page).click()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    const frames = (change: 'pan' | 'zoom' | 'agent') =>
      page.evaluate(async (change) => {
        const item = () =>
          document
            .querySelector('.canvas [data-canvas-frame]')!
            .getBoundingClientRect()
        const start = item()
        if (change === 'agent')
          window.__studioCanvas!.move({ id: 'item', dx: 150, dy: 0 })
        else
          document
            .querySelector('.canvas .excalidraw canvas.interactive')!
            .dispatchEvent(
              new WheelEvent('wheel', {
                ...(change === 'pan'
                  ? { deltaX: 90, deltaY: 40 }
                  : { deltaY: -120, ctrlKey: true }),
                clientX: start.left + start.width / 2,
                clientY: start.top + start.height / 2,
                bubbles: true,
                cancelable: true,
              }),
            )
        const seen: { moved: boolean; offset: number }[] = []
        for (let frame = 0; frame < 8; frame++) {
          await new Promise((done) => requestAnimationFrame(done))
          const box = item()
          const pin = [...document.querySelectorAll('button')]
            .find((button) =>
              button.getAttribute('aria-label')?.startsWith('Comment 1 by '),
            )!
            .getBoundingClientRect()
          seen.push({
            moved: box.left !== start.left || box.width !== start.width,
            offset: (pin.left + pin.width / 2 - box.left) / box.width,
          })
        }
        return seen
      }, change)
    for (const change of ['pan', 'zoom', 'agent'] as const) {
      const seen = await frames(change)
      expect(seen.some(({ moved }) => moved)).toBe(true)
      for (const { offset } of seen) expect(offset).toBeCloseTo(0.25, 2)
    }

    // The person drags the note: its pin goes with it.
    await commentAt(page, { x: 560, y: 160 }, 'Bottom right')
    await commentButton(page).click()
    await expect
      .poll(() => commentButton(page).getAttribute('aria-pressed'))
      .toBe('false')
    const grab = await onScreen(page, { x: 450, y: 120 })
    await page.mouse.move(grab.x, grab.y)
    await page.mouse.down()
    await page.mouse.move(grab.x + 100, grab.y + 50, { steps: 8 })
    await page.mouse.up()
    const dragged = (await sceneState(page)).note
    expect(dragged.x).toBeGreaterThan(400)
    await expect
      .poll(async () =>
        distance(
          await centre(pin(page, 2)),
          await onScreen(page, { x: dragged.x + 160, y: dragged.y + 160 }),
        ),
      )
      .toBeLessThan(4)
    await page.close()
  })

  test('[CM-23] a pin follows a change to the file, and says “Target not found” once its element is deleted', async () => {
    const page = await openBoard()
    await commentAt(page, { x: 80, y: 370 }, 'Make it bigger')
    await commentButton(page).click()
    const file = JSON.parse(BOARD_TEXT) as {
      elements: {
        id: string
        x: number
        version: number
        versionNonce: number
      }[]
    }
    const box = file.elements.find(({ id }) => id === 'box')!
    box.x += 60
    box.version += 1
    box.versionNonce += 1
    writeFileSync(BOARD_FILE, `${JSON.stringify(file, null, 2)}\n`)
    await expect
      .poll(
        async () =>
          distance(
            await centre(pin(page, 1)),
            await onScreen(page, { x: 140, y: 370 }),
          ),
        { timeout: 30_000 },
      )
      .toBeLessThan(4)
    // Deleted elsewhere: the thread stays, and says its target is gone.
    file.elements = file.elements.filter(({ id }) => id !== 'box')
    writeFileSync(BOARD_FILE, `${JSON.stringify(file, null, 2)}\n`)
    await expect.poll(() => pin(page, 1).count(), { timeout: 30_000 }).toBe(0)
    await allComments(page).click()
    await expect
      .poll(() =>
        list(page)
          .getByRole('listitem')
          .filter({ hasText: 'Make it bigger' })
          .getByText('Target not found')
          .isVisible(),
      )
      .toBe(true)
    await page.close()
  })

  test('revealing a comment from the list pans the canvas to it', async () => {
    const page = await openBoard()
    await commentAt(page, { x: 500, y: 150 }, 'Look here')
    await commentButton(page).click()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    const middle = (await canvas(page).boundingBox())!
    await page.mouse.move(
      middle.x + middle.width / 2,
      middle.y + middle.height / 2,
    )
    for (let step = 0; step < 6; step++) await page.mouse.wheel(0, 600)
    await expect.poll(() => pin(page, 1).count()).toBe(0)
    await allComments(page).click()
    await list(page)
      .getByRole('listitem')
      .filter({ hasText: 'Look here' })
      .getByRole('button')
      .first()
      .click()
    await expect
      .poll(() => pin(page, 1).isVisible(), { timeout: 10_000 })
      .toBe(true)
    await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
    await page.close()
  })

  test('commenting never changes the canvas file', async () => {
    const page = await openBoard()
    await commentAt(page, { x: 500, y: 150 }, 'On the note')
    await commentAt(page, { x: 700, y: 150 }, 'On a spot')
    await commentButton(page).click()
    await pin(page, 1).click()
    await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
    await page.keyboard.type('A reply')
    await page.keyboard.press('Enter')
    await expect
      .poll(() => storedWith(review, 'On the note')?.messages.length)
      .toBe(2)
    // Longer than the canvas waits before it saves.
    await page.waitForTimeout(2_000)
    expect(readFileSync(BOARD_FILE, 'utf8')).toBe(BOARD_TEXT)
    await page.close()
  })

  test('[CM-19] Ben’s canvas, read-only for Ada, still takes her comments', async () => {
    const page = await openCanvas(NOTES, WALL)
    expect(
      await page.evaluate(
        () =>
          (window.__studioCanvas!.context() as { editable: boolean }).editable,
      ),
    ).toBe(false)
    const saved = await commentAt(page, { x: 100, y: 150 }, 'Love this', notes)
    expect(saved.artifact).toBe(WALL)
    expect(saved.anchor).toMatchObject({
      kind: 'note',
      label: 'Sticky note "Ben’s idea"',
      element: 'wall-note',
    })
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await page.waitForTimeout(1_000)
    expect(readFileSync(WALL_FILE, 'utf8')).toBe(WALL_TEXT)
    await page.close()
  })

  test('[CM-70] the toolbar sits clear of the save status and Excalidraw’s controls', async () => {
    const page = await openBoard()
    // An edit brings the save status up.
    await page.evaluate(() =>
      window.__studioCanvas!.move({ id: 'corner', dx: 10, dy: 0 }),
    )
    await expect
      .poll(() => page.locator('[data-save-status]').isVisible(), {
        timeout: 15_000,
      })
      .toBe(true)
    const covered = () =>
      page.evaluate(() => {
        const bar = document
          .querySelector('[role="toolbar"][aria-label="Comment tools"]')!
          .getBoundingClientRect()
        return [
          ...document.querySelectorAll(
            '[data-save-status], .canvas .excalidraw button, .canvas .excalidraw .ToolIcon, .canvas .excalidraw .zoom-actions',
          ),
        ]
          .map((control) => control.getBoundingClientRect())
          .filter(
            (box) =>
              box.width &&
              box.height &&
              box.left < bar.right &&
              box.right > bar.left &&
              box.top < bar.bottom &&
              box.bottom > bar.top,
          ).length
      })
    expect(await covered()).toBe(0)
    await allComments(page).click()
    await expect.poll(() => list(page).isVisible()).toBe(true)
    expect(await covered()).toBe(0)
    await page.close()
  })
})
