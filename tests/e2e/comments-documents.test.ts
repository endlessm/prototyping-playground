// Comments on documents and diagrams, end to end: quoting selected text
// while reading (the "Comment" button) and in comment mode, commenting on a
// document's blocks and a diagram's steps, arrows and empty spots, and pins
// that find their target again after the file is edited or redrawn and
// follow the reader's scrolling. The studio runs as Ada on a disposable copy
// of the documents and diagrams fixtures.
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
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'comments-documents-'))
cpSync('tests/fixtures/documents', content, { recursive: true })
cpSync(
  'tests/fixtures/diagrams/ada/flows',
  path.join(content, 'ada', 'flows'),
  {
    recursive: true,
  },
)
const notes = path.join(content, 'ada', 'notes')
const flows = path.join(content, 'ada', 'flows')
const BRIEF_FILE = path.join(notes, 'Brief.md')
const SIGN_IN_FILE = path.join(flows, 'Sign-in.mermaid')
const BRIEF_TEXT = readFileSync(BRIEF_FILE, 'utf8')
const SIGN_IN_TEXT = readFileSync(SIGN_IN_FILE, 'utf8')

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

const NOTES = 'd0c5000000000001'
const BRIEF = 'd0c5000000000002'
const FLOWS = 'd1a6000000000001'
const SIGN_IN = 'd1a6000000000002'
const ADA = 'ada0000000000001'

const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Comment tools' })
const commentButton = (page: Page) =>
  toolbar(page).getByRole('button', { name: 'Comment', exact: true })
const composer = (page: Page) =>
  page.getByRole('dialog', { name: 'New comment' })
const pin = (page: Page, number: number) =>
  page.getByRole('button', { name: new RegExp(`^Comment ${number} by `) })
const offerButton = (page: Page) =>
  page.getByRole('button', { name: 'Comment on the selected text' })
const hoverLabel = (page: Page) => page.locator('[data-comment-hover-label]')
const scroller = (page: Page) => page.locator('[data-document-scroll]')
const step = (page: Page, text: string) =>
  page.locator('[data-diagram-state] svg g.node').filter({ hasText: text })

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

let seeded = 0
/** Writes a thread file as an earlier session would have left it. */
function seed(
  folder: string,
  artifact: string,
  anchor: Record<string, unknown>,
  body: string,
) {
  mkdirSync(threadsOf(folder), { recursive: true })
  seeded++
  const id = `5eed${String(seeded).padStart(12, '0')}`
  const thread = {
    formatVersion: 1,
    id,
    artifact,
    artifactTitle: 'Seeded',
    anchor,
    status: 'open',
    messages: [
      {
        id: `0${id.slice(1)}`,
        author: { contributor: ADA },
        body,
        createdAt: new Date(Date.UTC(2026, 10, 4, 10, seeded)).toISOString(),
      },
    ],
  }
  writeFileSync(
    path.join(threadsOf(folder), `${id}.json`),
    `${JSON.stringify(thread, null, 2)}\n`,
  )
}

const centre = async (locator: Locator) => {
  const box = await locator.boundingBox()
  return box && { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const distance = (
  a: { x: number; y: number } | null,
  b: { x: number; y: number } | null,
) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity)

/** Where some words of the document end, as the pin of a quote sits. */
const textEnd = (page: Page, text: string) =>
  page.evaluate((words) => {
    const article = document.querySelector('[data-document-scroll] article')!
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent!.indexOf(words)
      if (at === -1) continue
      const range = document.createRange()
      range.setStart(node, at)
      range.setEnd(node, at + words.length)
      const rects = range.getClientRects()
      const last = rects[rects.length - 1]!
      return { x: last.right, y: last.top + last.height / 2 }
    }
    return null
  }, text)

/** Selects some words of the document with the mouse, as a reader does. */
async function select(page: Page, text: string, kept = true) {
  await page.getByText(text).first().waitFor()
  const ends = await page.evaluate((words) => {
    const article = document.querySelector('[data-document-scroll] article')!
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent!.indexOf(words)
      if (at === -1) continue
      node.parentElement!.scrollIntoView({ block: 'center' })
      const char = (index: number) => {
        const range = document.createRange()
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        return range.getBoundingClientRect()
      }
      const first = char(at)
      const last = char(at + words.length - 1)
      return {
        from: { x: first.left + 1, y: first.top + first.height / 2 },
        to: { x: last.right - 1, y: last.top + last.height / 2 },
      }
    }
    throw new Error(`The document has no "${words}"`)
  }, text)
  await page.mouse.move(ends.from.x, ends.from.y)
  await page.mouse.down()
  await page.mouse.move(ends.to.x, ends.to.y, { steps: 8 })
  await page.mouse.up()
  // In comment mode the composer takes focus, and the selection with it.
  if (kept)
    expect(await page.evaluate(() => getSelection()?.toString())).toBe(text)
}

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

/** The drawing's own area (its view box) in the window. */
const drawingArea = (page: Page) =>
  page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>(
      '[data-diagram-state] svg[id]',
    )!
    const matrix = svg.getScreenCTM()!
    const view = svg.viewBox.baseVal
    const start = new DOMPoint(view.x, view.y).matrixTransform(matrix)
    const end = new DOMPoint(
      view.x + view.width,
      view.y + view.height,
    ).matrixTransform(matrix)
    return {
      left: start.x,
      top: start.y,
      width: end.x - start.x,
      height: end.y - start.y,
    }
  })

describe('on the dev server', { timeout: 150_000 }, () => {
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
    for (const folder of [notes, flows])
      rmSync(threadsOf(folder), { recursive: true, force: true })
    if (readFileSync(BRIEF_FILE, 'utf8') !== BRIEF_TEXT)
      writeFileSync(BRIEF_FILE, BRIEF_TEXT)
    if (readFileSync(SIGN_IN_FILE, 'utf8') !== SIGN_IN_TEXT)
      writeFileSync(SIGN_IN_FILE, SIGN_IN_TEXT)
  })

  async function openBrief() {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${NOTES}/artifacts/${BRIEF}`)
    await expect
      .poll(
        () =>
          page
            .locator('[data-document-state]')
            .getAttribute('data-document-state'),
        { timeout: 180_000 },
      )
      .toBe('ready')
    await expect.poll(() => commentButton(page).isEnabled()).toBe(true)
    return page
  }
  async function openSignIn() {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${FLOWS}/artifacts/${SIGN_IN}`)
    await expect
      .poll(
        () =>
          page
            .locator('[data-diagram-state]')
            .getAttribute('data-diagram-state'),
        { timeout: 180_000 },
      )
      .toBe('ready')
    await expect.poll(() => commentButton(page).isEnabled()).toBe(true)
    return page
  }

  test('[CM-11] [CM-12] selecting text while reading offers "Comment", which quotes it with its context and heading', async () => {
    const page = await openBrief()
    await select(page, 'long section')
    await expect.poll(() => offerButton(page).isVisible()).toBe(true)
    // Beside the selection: just above its end.
    const end = await textEnd(page, 'long section')
    const button = await offerButton(page).boundingBox()
    expect(Math.abs(button!.x + button!.width / 2 - end!.x)).toBeLessThan(4)
    expect(button!.y + button!.height).toBeLessThan(end!.y)

    await offerButton(page).click()
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    expect(await composer(page).textContent()).toContain('long section')
    expect(await composer(page).textContent()).toContain('Text in "Details"')
    const saved = await post(page, 'Say how long.', notes)
    expect(saved.artifact).toBe(BRIEF)
    expect(saved.anchor).toMatchObject({
      kind: 'text',
      label: 'Text in "Details"',
      quote: 'long section',
      block: 'paragraph',
      heading: 'Details',
      headingId: 'details',
      text: 'A long section so the page scrolls.',
    })
    expect(saved.anchor.prefix).toMatch(/Details A $/)
    expect(saved.anchor.suffix).toMatch(/^ so the page scrolls\./)
    // The pin sits at the end of the quote.
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await expect
      .poll(async () =>
        distance(
          await centre(pin(page, 1)),
          await textEnd(page, 'long section'),
        ),
      )
      .toBeLessThan(4)

    // Clicking elsewhere drops the selection and the offer.
    await page.mouse.click(5, 5)
    await expect.poll(() => offerButton(page).isVisible()).toBe(false)
  })

  test('[CM-11] in comment mode a selection opens the composer directly with the quote', async () => {
    const page = await openBrief()
    await commentMode(page)
    await select(page, 'the page scrolls', false)
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    expect(await offerButton(page).isVisible()).toBe(false)
    expect(await composer(page).textContent()).toContain('the page scrolls')
    const saved = await post(page, 'Shorter, please.', notes)
    expect(saved.anchor).toMatchObject({
      kind: 'text',
      quote: 'the page scrolls',
      heading: 'Details',
    })
  })

  test('[CM-23] a quoted comment is found again after the document is edited, text before it included', async () => {
    seed(
      notes,
      BRIEF,
      {
        kind: 'text',
        label: 'Text in "Details"',
        at: { x: 1, y: 0.5 },
        quote: 'long section',
        prefix: 'or visit the method. Details A ',
        suffix: ' so the page scrolls. Line one. Li',
        block: 'paragraph',
        heading: 'Details',
        headingId: 'details',
        index: 0,
        text: 'A long section so the page scrolls.',
      },
      'Say how long.',
    )
    const page = await openBrief()
    await page.getByText('Line one.', { exact: true }).scrollIntoViewIfNeeded()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await expect
      .poll(async () =>
        distance(
          await centre(pin(page, 1)),
          await textEnd(page, 'long section'),
        ),
      )
      .toBeLessThan(4)

    writeFileSync(
      BRIEF_FILE,
      BRIEF_TEXT.replace(
        '## Details\n\nA long section so the page scrolls.',
        '## Details\n\nA paragraph added before it, much longer than one line so that everything after it moves down the page.\n\nNow, a really long section so the page scrolls.',
      ),
    )
    await expect
      .poll(() => page.getByText('A paragraph added before it').isVisible())
      .toBe(true)
    await expect
      .poll(async () =>
        distance(
          await centre(pin(page, 1)),
          await textEnd(page, 'long section'),
        ),
      )
      .toBeLessThan(4)
  })

  test('[CM-13] a heading, a list item, a table row and an embed are commented on as blocks', async () => {
    const page = await openBrief()
    await commentMode(page)
    const article = page.locator('[data-document-scroll] article')

    const goals = article.getByRole('heading', { name: 'Goals', level: 2 })
    await goals.hover()
    await expect
      .poll(() => hoverLabel(page).textContent())
      .toBe('Heading "Goals"')
    await goals.click()
    expect((await post(page, 'Name the goals.', notes)).anchor).toMatchObject({
      kind: 'heading',
      label: 'Heading "Goals"',
      block: 'heading',
      heading: 'Goals',
      headingId: 'goals',
    })

    await article.getByText('Share the notes').click()
    expect((await post(page, 'Who shares?', notes)).anchor).toMatchObject({
      kind: 'list item',
      label: 'List item "Share the notes"',
      heading: 'Goals',
      index: 1,
    })

    await article.getByRole('cell', { name: 'Ada' }).click()
    expect((await post(page, 'Only Ada?', notes)).anchor).toMatchObject({
      kind: 'table row',
      label: 'Table row "Sign in · Ada"',
      text: 'Sign in · Ada',
    })

    const home = article.locator('figure[data-embed="./Home.vue"]')
    await home.scrollIntoViewIfNeeded()
    await home.hover()
    await expect
      .poll(() => hoverLabel(page).textContent())
      .toBe('Embed "Home screen"')
    await home.click()
    expect((await post(page, 'Add the menu.', notes)).anchor).toMatchObject({
      kind: 'embed',
      label: 'Embed "Home screen"',
      embed: './Home.vue',
      heading: 'Screens',
    })
    expect(stored(notes)).toHaveLength(4)
    await expect.poll(() => pin(page, 4).isVisible()).toBe(true)
    await goals.scrollIntoViewIfNeeded()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
  })

  test('[CM-22] a pin follows the reader as it scrolls, and hides once its target is scrolled away', async () => {
    seed(
      notes,
      BRIEF,
      {
        kind: 'paragraph',
        label: 'Paragraph "Line ten."',
        at: { x: 0.05, y: 0.5 },
        block: 'paragraph',
        heading: 'Details',
        headingId: 'details',
        index: 10,
        text: 'Line ten.',
      },
      'Merge these lines.',
    )
    const page = await openBrief()
    const line = page.getByText('Line ten.', { exact: true })
    const near = async () => {
      const box = (await line.boundingBox())!
      return distance(await centre(pin(page, 1)), {
        x: box.x + box.width * 0.05,
        y: box.y + box.height / 2,
      })
    }
    await line.scrollIntoViewIfNeeded()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await expect.poll(near).toBeLessThan(4)
    const before = (await centre(pin(page, 1)))!.y

    await scroller(page).evaluate((element) => element.scrollBy(0, 120))
    await expect
      .poll(async () => before - (await centre(pin(page, 1)))!.y)
      .toBeGreaterThan(100)
    await expect.poll(near).toBeLessThan(4)

    await scroller(page).evaluate((element) => element.scrollTo(0, 0))
    await expect.poll(() => pin(page, 1).isVisible()).toBe(false)
  })

  test('[CM-14] a step and an arrow of a diagram are commented on with their Mermaid IDs', async () => {
    const page = await openSignIn()
    await commentMode(page)
    await step(page, 'Home').hover()
    await expect.poll(() => hoverLabel(page).textContent()).toBe('Step "Home"')
    await step(page, 'Home').click()
    expect((await post(page, 'Which home?', flows)).anchor).toMatchObject({
      kind: 'step',
      label: 'Step "Home"',
      mermaid: 'home',
    })

    const middle = await page.evaluate(() => {
      const path = document.querySelector<SVGPathElement>(
        '[data-diagram-state] svg path[data-id^="L_"]',
      )!
      const point = path
        .getPointAtLength(path.getTotalLength() / 2)
        .matrixTransform(path.getScreenCTM()!)
      return { x: point.x, y: point.y }
    })
    await page.mouse.move(middle.x, middle.y)
    await expect
      .poll(() => hoverLabel(page).textContent())
      .toBe('Arrow "Sign in" → "Home"')
    await page.mouse.click(middle.x, middle.y)
    expect((await post(page, 'Dashed?', flows)).anchor).toMatchObject({
      kind: 'arrow',
      label: 'Arrow "Sign in" → "Home"',
      mermaid: 'start --> home',
    })
    await expect.poll(() => pin(page, 2).isVisible()).toBe(true)
  })

  test('[CM-15] an empty spot of a diagram is a point as fractions of the drawing', async () => {
    const page = await openSignIn()
    await commentMode(page)
    const area = await drawingArea(page)
    const spot = {
      x: area.left + area.width * 0.02,
      y: area.top + area.height * 0.06,
    }
    await page.mouse.move(spot.x, spot.y)
    await expect.poll(() => hoverLabel(page).textContent()).toBe('Empty spot')
    await page.mouse.click(spot.x, spot.y)
    const saved = await post(page, 'Something is missing here.', flows)
    expect(saved.anchor).toMatchObject({ kind: 'spot', label: 'Empty spot' })
    const at = saved.anchor.at as { x: number; y: number }
    expect(Math.abs(at.x - 0.02)).toBeLessThan(0.01)
    expect(Math.abs(at.y - 0.06)).toBeLessThan(0.01)
    await expect
      .poll(async () => distance(await centre(pin(page, 1)), spot))
      .toBeLessThan(3)
  })

  test('[CM-23] a step comment is found again after the diagram is redrawn with its steps reordered', async () => {
    seed(
      flows,
      SIGN_IN,
      {
        kind: 'step',
        label: 'Step "Home"',
        at: { x: 0.5, y: 0.5 },
        mermaid: 'home',
      },
      'Which home?',
    )
    const page = await openSignIn()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await expect
      .poll(async () =>
        distance(await centre(pin(page, 1)), await centre(step(page, 'Home'))),
      )
      .toBeLessThan(3)

    writeFileSync(
      SIGN_IN_FILE,
      SIGN_IN_TEXT.replace(
        '  start[Sign in] --> home[Home]',
        '  home[Home]\n  first[Welcome] --> start[Sign in]\n  start --> home',
      ),
    )
    await expect.poll(() => step(page, 'Welcome').count()).toBe(1)
    await expect
      .poll(async () =>
        distance(await centre(pin(page, 1)), await centre(step(page, 'Home'))),
      )
      .toBeLessThan(3)
  })
})
