// Comments on a view, end to end: comment mode over a running view, a
// comment pinned to an element and kept as a file in the prototype, the pin
// following the view as it scrolls, resizes and hot-updates, named states,
// the thread with a reply and Resolve, the open page following
// `yarn comments`, and the deployed site with none of it. The studio runs as
// Ada on a disposable copy of tests/fixtures/comments inside the checkout
// (preview documents serve files from the checkout only).
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { FrameLocator, Locator, Page } from 'playwright'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'comments-'))
cpSync('tests/fixtures/comments', content, { recursive: true })
const folder = path.join(content, 'ada', 'review')
const threadsFolder = path.join(folder, '.comments')
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
const FULL = 'sta0000000000c01'
const EMPTY = 'stb0000000000c01'
const ADA = 'ada0000000000001'

const address = (studio: RunningStudio, artifact: string) =>
  `${studio.url}prototypes/${REVIEW}/artifacts/${artifact}`
const view = (page: Page): FrameLocator =>
  page.locator('iframe[data-preview-frame]').contentFrame()
const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Comment tools' })
const commentButton = (page: Page) =>
  toolbar(page).getByRole('button', { name: 'Comment', exact: true })
const hint = (page: Page) =>
  page.getByRole('status').filter({ hasText: 'Click anything to comment.' })
const composer = (page: Page) =>
  page.getByRole('dialog', { name: 'New comment' })
const thread = (page: Page, number: number) =>
  page.getByRole('dialog', { name: `Comment ${number}` })
const pin = (page: Page, number: number) =>
  page.getByRole('button', { name: new RegExp(`^Comment ${number} by `) })
const notFound = 'Target not found. It was removed or changed.'
const allComments = (page: Page) =>
  toolbar(page).getByRole('button', { name: /^All comments/ })
const list = (page: Page) =>
  page.getByRole('complementary', { name: 'Comments' })
const tab = (page: Page, name: 'Open' | 'Resolved') =>
  list(page).getByRole('tab', { name: new RegExp(`^${name}`) })
/** The list's row for the thread whose first message is `text`. */
const row = (page: Page, text: string) =>
  list(page).getByRole('listitem').filter({ hasText: text }).getByRole('button')
const isFocused = (locator: Locator) =>
  locator.evaluate((element) => element === document.activeElement)
/** Presses Tab (or Shift+Tab) until `target` has focus. */
async function tabTo(page: Page, target: Locator, back = false) {
  for (let step = 0; step < 80; step++) {
    if ((await target.count()) && (await isFocused(target))) return
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab')
  }
  throw new Error('Tab never reached the element')
}

async function ready(page: Page) {
  await expect
    .poll(
      () =>
        page
          .locator('[data-preview-session]')
          .getAttribute('data-preview-state'),
      { timeout: 120_000 },
    )
    .toBe('ready')
}
async function sees(frame: FrameLocator, text: string, timeout = 60_000) {
  await expect
    .poll(() => frame.getByText(text, { exact: true }).isVisible(), {
      timeout,
    })
    .toBe(true)
}
async function open(page: Page, studio: RunningStudio, artifact = FULL) {
  await page.goto(address(studio, artifact))
  await ready(page)
  await sees(view(page), 'Remember the deadline')
  await expect.poll(() => commentButton(page).isEnabled()).toBe(true)
}

type StoredThread = {
  id: string
  artifact: string
  status: string
  anchor: Record<string, unknown>
  resolvedBy?: { contributor: string; agent?: boolean }
  messages: { body: string; author: { contributor: string; agent?: boolean } }[]
}
function stored(): StoredThread[] {
  if (!existsSync(threadsFolder)) return []
  return readdirSync(threadsFolder)
    .filter((name) => name.endsWith('.json'))
    .map((name) =>
      JSON.parse(readFileSync(path.join(threadsFolder, name), 'utf8')),
    )
}

/** Comments on `target` in comment mode, and waits for its pin. */
async function comment(page: Page, target: Locator, text: string) {
  if ((await commentButton(page).getAttribute('aria-pressed')) !== 'true')
    await commentButton(page).click()
  await expect.poll(() => hint(page).isVisible()).toBe(true)
  await target.click()
  await expect.poll(() => composer(page).isVisible()).toBe(true)
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
  await expect.poll(() => composer(page).isVisible()).toBe(false)
  await expect
    .poll(() => stored().some(({ messages }) => messages[0]?.body === text))
    .toBe(true)
}

const centre = async (locator: Locator) => {
  const box = await locator.boundingBox()
  return box && { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
/** How far a pin sits from the middle of the element it was put on. */
async function offset(page: Page, number: number, target: Locator) {
  const [a, b] = await Promise.all([centre(pin(page, number)), centre(target)])
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity
}

const ANCHORS = {
  invite: {
    kind: 'button',
    label: 'Button "Invite students"',
    at: { x: 0.5, y: 0.5 },
    selector: '[data-testid="invite"]',
    tag: 'button',
    path: 'main > button',
    text: 'Invite students',
  },
  deadline: {
    kind: 'paragraph',
    label: 'Paragraph "Remember the deadline"',
    at: { x: 0.05, y: 0.5 },
    selector: '[data-testid="deadline"]',
    tag: 'p',
    path: 'main > p',
    text: 'Remember the deadline',
  },
  bottom: {
    kind: 'paragraph',
    label: 'Paragraph "Bottom of the board"',
    at: { x: 0.05, y: 0.5 },
    selector: '#bottom',
    tag: 'p',
    path: 'main > p#bottom',
    text: 'Bottom of the board',
  },
  removed: {
    kind: 'paragraph',
    label: 'Paragraph "A removed note"',
    at: { x: 0.5, y: 0.5 },
    selector: '[data-testid="removed"]',
    tag: 'p',
    path: 'main > p',
    text: 'A removed note',
  },
}
let seeded = 0
/** Writes a thread file as an earlier session would have left it. */
function seed({
  artifact = FULL,
  anchor,
  messages,
  status = 'open',
}: {
  artifact?: string
  anchor: Record<string, unknown>
  messages: string[]
  status?: 'open' | 'resolved'
}) {
  mkdirSync(threadsFolder, { recursive: true })
  seeded++
  const id = `5eed${String(seeded).padStart(12, '0')}`
  const time = (second: number) =>
    new Date(Date.UTC(2026, 10, 3, 10, seeded, second)).toISOString()
  const thread = {
    formatVersion: 1,
    id,
    artifact,
    artifactTitle: 'Board · Full',
    anchor,
    status,
    ...(status === 'resolved'
      ? { resolvedBy: { contributor: ADA }, resolvedAt: time(59) }
      : {}),
    messages: messages.map((body, index) => ({
      id: `${index}${id.slice(1)}`,
      author: { contributor: ADA },
      body,
      createdAt: time(index),
    })),
  }
  writeFileSync(
    path.join(threadsFolder, `${id}.json`),
    `${JSON.stringify(thread, null, 2)}\n`,
  )
  return id
}

const runComments = (...args: string[]) =>
  spawnSync(process.execPath, ['src/modules/comments/cli.ts', ...args], {
    encoding: 'utf8',
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => !key.startsWith('VITEST') && !key.startsWith('GIT_'),
        ),
      ),
      ...env,
    },
  })

describe('on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
  })
  beforeEach(() => {
    rmSync(threadsFolder, { recursive: true, force: true })
  })

  test('[CM-4] [CM-8] [CM-10] hovering outlines an element with its name, and a click posts a comment pinned to it', async () => {
    const page = await newPage()
    await open(page, studio)
    await commentButton(page).click()
    await expect.poll(() => hint(page).isVisible()).toBe(true)
    await view(page).getByTestId('invite').hover()
    await expect
      .poll(() => page.locator('[data-comment-hover-label]').textContent())
      .toBe('Button "Invite students"')

    await view(page).getByTestId('invite').click()
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    expect(await composer(page).textContent()).toContain('Enter to post')
    const field = composer(page).getByRole('textbox', { name: 'Comment' })
    await expect
      .poll(() =>
        field.evaluate((element) => element === document.activeElement),
      )
      .toBe(true)
    await page.keyboard.type('Make this the main action.')
    await page.keyboard.press('Enter')

    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    expect(await pin(page, 1).getAttribute('aria-label')).toBe(
      'Comment 1 by Ada Lovelace: Make this the main action.',
    )
    await expect
      .poll(() => offset(page, 1, view(page).getByTestId('invite')))
      .toBeLessThan(3)
    // The thread is a file in the prototype, Prettier's JSON, on the state.
    const [saved] = stored()
    expect(saved).toMatchObject({
      formatVersion: 1,
      artifact: FULL,
      artifactTitle: 'Board · Full',
      status: 'open',
      anchor: {
        kind: 'button',
        label: 'Button "Invite students"',
        selector: '[data-testid="invite"]',
        tag: 'button',
        text: 'Invite students',
      },
      messages: [
        {
          author: { contributor: ADA },
          body: 'Make this the main action.',
        },
      ],
    })
    // Where on the button: near its middle, where the pointer pressed.
    const at = saved!.anchor.at as { x: number; y: number }
    expect(Math.abs(at.x - 0.5)).toBeLessThan(0.1)
    expect(Math.abs(at.y - 0.5)).toBeLessThan(0.1)
    expect(
      readFileSync(path.join(threadsFolder, `${saved!.id}.json`), 'utf8'),
    ).toBe(`${JSON.stringify(saved, null, 2)}\n`)
  })

  test('[CM-5] in comment mode no click reaches the view: no button action, no navigation, no focus change', async () => {
    const page = await newPage()
    await open(page, studio)
    await commentButton(page).click()
    await expect.poll(() => hint(page).isVisible()).toBe(true)
    const pages = page.context().pages().length

    await view(page).getByTestId('invite').click()
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    await page.keyboard.press('Escape')
    await view(page).getByRole('link', { name: 'Help' }).click()
    await view(page).getByRole('textbox', { name: 'Notes' }).click()
    await page.waitForTimeout(500)
    await sees(view(page), 'Invited 0')
    expect(page.context().pages().length).toBe(pages)
    expect(page.url()).toBe(address(studio, FULL))
    expect(
      await view(page)
        .getByRole('textbox', { name: 'Notes' })
        .evaluate((element) => element.ownerDocument.activeElement === element),
    ).toBe(false)

    // Leaving comment mode leaves nothing behind: the view works as before.
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await expect.poll(() => hint(page).isVisible()).toBe(false)
    expect(await view(page).locator('[data-studio-tool-cursor]').count()).toBe(
      0,
    )
    await view(page).getByTestId('invite').click()
    await sees(view(page), 'Invited 1')
  })

  test('[CM-22] a pin follows the view as it scrolls and as the window resizes', async () => {
    const page = await newPage()
    await open(page, studio)
    await comment(page, view(page).getByTestId('invite'), 'Bigger, please.')
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    const button = view(page).getByTestId('invite')

    await view(page)
      .locator('html')
      .evaluate(() => window.scrollTo(0, 40))
    await expect.poll(() => offset(page, 1, button)).toBeLessThan(3)
    // Scrolled out of the view, the pin goes too.
    await view(page)
      .locator('html')
      .evaluate(() => window.scrollTo(0, 1500))
    await expect.poll(() => pin(page, 1).count()).toBe(0)
    await view(page)
      .locator('html')
      .evaluate(() => window.scrollTo(0, 0))
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)

    await page.setViewportSize({ width: 900, height: 640 })
    await expect.poll(() => offset(page, 1, button)).toBeLessThan(3)
  })

  test('[CM-23] a pin survives a hot update, says “Target not found” while its element is gone, and comes back with it', async () => {
    const file = path.join(folder, 'Board.vue')
    const original = readFileSync(file, 'utf8')
    try {
      const page = await newPage()
      await open(page, studio)
      await comment(
        page,
        view(page).getByTestId('deadline'),
        'Say which deadline.',
      )
      await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
      const before = await view(page)
        .locator('html')
        .getAttribute('data-preview-runtime')

      // Something new above it moves it down; the pin goes with it.
      writeFileSync(
        file,
        original.replace(
          '<p>Invited {{ count }}</p>',
          '<p>Invited {{ count }}</p>\n    <p style="height: 80px">A new note</p>',
        ),
      )
      await sees(view(page), 'A new note', 30_000)
      expect(
        await view(page).locator('html').getAttribute('data-preview-runtime'),
      ).toBe(before)
      await expect
        .poll(() => offset(page, 1, view(page).getByTestId('deadline')))
        .toBeLessThan(3)

      await pin(page, 1).click()
      await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
      writeFileSync(
        file,
        original.replace(
          '<p data-testid="deadline">Remember the deadline</p>\n',
          '',
        ),
      )
      await expect
        .poll(() => thread(page, 1).getByText(notFound).isVisible(), {
          timeout: 30_000,
        })
        .toBe(true)
      expect(await pin(page, 1).count()).toBe(0)

      writeFileSync(file, original)
      await expect
        .poll(() => thread(page, 1).getByText(notFound).count(), {
          timeout: 30_000,
        })
        .toBe(0)
      await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    } finally {
      writeFileSync(file, original)
    }
  })

  test('[CM-18] [CM-29] a named state shows only its own pins, numbered across the whole view', async () => {
    const page = await newPage()
    await open(page, studio, FULL)
    await comment(page, view(page).getByTestId('invite'), 'On the full state.')
    await page.goto(address(studio, EMPTY))
    await ready(page)
    await sees(view(page), 'No students yet')
    await expect.poll(() => commentButton(page).isEnabled()).toBe(true)
    await page.waitForTimeout(500)
    expect(await pin(page, 1).count()).toBe(0)

    await comment(page, view(page).getByTestId('deadline'), 'On the empty one.')
    await expect.poll(() => pin(page, 2).isVisible()).toBe(true)
    expect(
      stored().find(({ messages }) => messages[0]!.body === 'On the empty one.')
        ?.artifact,
    ).toBe(EMPTY)

    await page.goto(address(studio, FULL))
    await ready(page)
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    expect(await pin(page, 2).count()).toBe(0)
  })

  test('[CM-31] [CM-34] a thread takes a reply and is resolved, and stays so after a reload', async () => {
    const page = await newPage()
    await open(page, studio)
    await comment(page, view(page).getByTestId('invite'), 'Who gets invited?')
    await page.keyboard.press('Escape')
    await expect.poll(() => hint(page).isVisible()).toBe(false)

    // Hovering previews the first message.
    await pin(page, 1).hover()
    await expect
      .poll(() => pin(page, 1).getByText('Who gets invited?').isVisible())
      .toBe(true)
    await pin(page, 1).click()
    const popover = thread(page, 1)
    await expect.poll(() => popover.isVisible()).toBe(true)
    await popover.getByRole('textbox', { name: 'Reply' }).fill('The class.')
    await page.keyboard.press('Enter')
    await expect
      .poll(() => popover.getByText('The class.', { exact: true }).isVisible())
      .toBe(true)
    await expect
      .poll(() => stored()[0]?.messages.map(({ body }) => body))
      .toEqual(['Who gets invited?', 'The class.'])

    await popover.getByRole('button', { name: 'Resolve' }).click()
    await expect.poll(() => popover.isVisible()).toBe(false)
    await expect.poll(() => pin(page, 1).count()).toBe(0)
    await expect
      .poll(() =>
        page
          .getByText('Comment resolved', { exact: true })
          .filter({ visible: true })
          .count(),
      )
      .toBe(1)
    expect(stored()[0]).toMatchObject({
      status: 'resolved',
      resolvedBy: { contributor: ADA },
    })

    await page.reload()
    await ready(page)
    await sees(view(page), 'Remember the deadline')
    await page.waitForTimeout(1000)
    expect(await pin(page, 1).count()).toBe(0)
  })

  test('[CM-2] the shortcut turns comment mode on and off from the view and from the studio, but not while typing in the view', async () => {
    const page = await newPage()
    await open(page, studio)
    await view(page).getByRole('heading').click()
    await page.keyboard.press('Control+Alt+KeyM')
    await expect.poll(() => hint(page).isVisible()).toBe(true)

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
    await page.keyboard.press('Control+Alt+KeyM')
    await expect.poll(() => hint(page).isVisible()).toBe(false)
    await page.keyboard.press('Control+Alt+KeyM')
    await expect.poll(() => hint(page).isVisible()).toBe(true)
    await page.keyboard.press('Control+Alt+KeyM')
    await expect.poll(() => hint(page).isVisible()).toBe(false)

    await view(page).getByRole('textbox', { name: 'Notes' }).click()
    await page.keyboard.press('Control+Alt+KeyM')
    await page.waitForTimeout(300)
    expect(await hint(page).isVisible()).toBe(false)
  })

  test('[CM-7] Esc cancels the draft, then closes the thread, then leaves comment mode', async () => {
    const page = await newPage()
    await open(page, studio)
    await comment(page, view(page).getByTestId('invite'), 'First.')

    await view(page).getByTestId('deadline').click()
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => composer(page).isVisible()).toBe(false)
    expect(await hint(page).isVisible()).toBe(true)

    await pin(page, 1).click()
    await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => thread(page, 1).isVisible()).toBe(false)
    expect(await hint(page).isVisible()).toBe(true)

    await page.keyboard.press('Escape')
    await expect.poll(() => hint(page).isVisible()).toBe(false)
  })

  test('[CM-52] an agent’s resolve with `yarn comments` takes the pin off the open page without a reload', async () => {
    const page = await newPage()
    await open(page, studio)
    await comment(page, view(page).getByTestId('invite'), 'Agent, fix this.')
    await page.keyboard.press('Escape')
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    const runtime = await page.evaluate(() => performance.timeOrigin)

    const id = stored()[0]!.id
    const result = runComments('resolve', id, '--reply', 'Fixed the label.')
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(stored()[0]).toMatchObject({
      status: 'resolved',
      resolvedBy: { contributor: ADA, agent: true },
    })
    await expect.poll(() => pin(page, 1).count(), { timeout: 30_000 }).toBe(0)
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(runtime)
  })

  test('[CM-55] a colleague’s comment arriving with a pull shows on the open page without a reload', async () => {
    const page = await newPage()
    await open(page, studio)
    expect(await pin(page, 1).count()).toBe(0)
    const runtime = await page.evaluate(() => performance.timeOrigin)

    // A pull writes the thread file to disk, as Git does.
    seed({ anchor: ANCHORS.invite, messages: ['Pulled in from Ada.'] })
    await expect
      .poll(() => pin(page, 1).isVisible(), { timeout: 30_000 })
      .toBe(true)
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(runtime)
  })

  test('[CM-40] [CM-41] [CM-42] [CM-43] All comments lists the threads under Open and Resolved, and choosing one scrolls to it and opens it, without resizing the view', async () => {
    seed({
      anchor: ANCHORS.invite,
      messages: ['Make this the main action.', 'Agreed.'],
    })
    seed({
      anchor: { ...ANCHORS.bottom, quote: 'Bottom of' },
      messages: ['Is this the end?'],
    })
    seed({
      anchor: ANCHORS.deadline,
      messages: ['Which deadline?'],
      status: 'resolved',
    })
    const page = await newPage()
    await open(page, studio)
    await expect
      .poll(() => allComments(page).getAttribute('aria-label'))
      .toBe('All comments, 2 open')
    const frame = page.locator('iframe[data-preview-frame]')
    const before = await frame.boundingBox()

    await allComments(page).click()
    await expect.poll(() => list(page).isVisible()).toBe(true)
    expect(await allComments(page).getAttribute('aria-pressed')).toBe('true')
    expect(await tab(page, 'Open').textContent()).toContain('2')
    expect(await tab(page, 'Resolved').textContent()).toContain('1')
    const first = row(page, 'Make this the main action.')
    const text = (await first.textContent()) ?? ''
    for (const part of [
      '1',
      'Button "Invite students"',
      'Ada Lovelace',
      '1 reply',
    ])
      expect(text).toContain(part)
    expect(await row(page, 'Is this the end?').textContent()).toContain(
      'Bottom of',
    )
    expect(await row(page, 'Which deadline?').count()).toBe(0)

    // The list sits over the page: the view keeps its size, and the
    // toolbar moves left of the list.
    expect(await frame.boundingBox()).toEqual(before)
    const [bar, panel] = await Promise.all([
      toolbar(page).boundingBox(),
      list(page).boundingBox(),
    ])
    expect(panel!.width).toBeCloseTo(340, 0)
    expect(bar!.x + bar!.width).toBeLessThanOrEqual(panel!.x)

    // The bottom paragraph is out of sight until its row is chosen.
    expect(await pin(page, 2).count()).toBe(0)
    await row(page, 'Is this the end?').click()
    await expect.poll(() => thread(page, 2).isVisible()).toBe(true)
    await expect.poll(() => pin(page, 2).isVisible()).toBe(true)
    expect(
      await thread(page, 2).getByText('Bottom of', { exact: true }).isVisible(),
    ).toBe(true)

    await tab(page, 'Resolved').click()
    await expect.poll(() => row(page, 'Which deadline?').isVisible()).toBe(true)
    expect(await row(page, 'Make this the main action.').count()).toBe(0)
  })

  test('[CM-29] the list shows every state’s comments, and choosing one on another state switches to it', async () => {
    seed({ anchor: ANCHORS.invite, messages: ['On the full state.'] })
    seed({
      artifact: EMPTY,
      anchor: ANCHORS.deadline,
      messages: ['On the empty state.'],
    })
    const page = await newPage()
    await open(page, studio, FULL)
    await allComments(page).click()
    const other = row(page, 'On the empty state.')
    await expect.poll(() => other.isVisible()).toBe(true)
    expect(await other.textContent()).toContain('Empty')
    expect(await pin(page, 2).count()).toBe(0)

    await other.click()
    await expect.poll(() => page.url()).toContain(`/artifacts/${EMPTY}`)
    await sees(view(page), 'No students yet')
    await expect.poll(() => thread(page, 2).isVisible()).toBe(true)
    await expect.poll(() => pin(page, 2).isVisible()).toBe(true)
  })

  test('[CM-17] “Comment on the whole view” comments without pointing, listed with no pin', async () => {
    const page = await newPage()
    await open(page, studio)
    await allComments(page).click()
    await list(page)
      .getByRole('button', { name: 'Comment on the whole view' })
      .click()
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    expect(await composer(page).textContent()).toContain('The whole view')
    await page.keyboard.type('The spacing feels loose overall.')
    await page.keyboard.press('Enter')
    await expect.poll(() => stored()[0]?.anchor).toEqual({ kind: 'artifact' })
    expect(stored()[0]?.artifact).toBe(FULL)
    const listed = row(page, 'The spacing feels loose overall.')
    await expect.poll(() => listed.isVisible()).toBe(true)
    expect(await listed.textContent()).toContain('The whole view')
    expect(await pin(page, 1).count()).toBe(0)

    await listed.click()
    await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
    expect(await thread(page, 1).getByText(notFound).count()).toBe(0)
  })

  test('[CM-28] a thread whose target is gone stays listed with “Target not found”', async () => {
    seed({ anchor: ANCHORS.removed, messages: ['This note goes.'] })
    const page = await newPage()
    await open(page, studio)
    await allComments(page).click()
    const listed = row(page, 'This note goes.')
    await expect
      .poll(() => listed.getByText('Target not found').isVisible())
      .toBe(true)
    await listed.click()
    await expect
      .poll(() => thread(page, 1).getByText(notFound).isVisible())
      .toBe(true)
  })

  test('[CM-45] Copy for agent puts the view’s open comments on the clipboard as agent text, with what the page can’t find', async () => {
    const invite = seed({
      anchor: ANCHORS.invite,
      messages: ['Make this the main action.', 'And say who is invited.'],
    })
    const removed = seed({
      anchor: ANCHORS.removed,
      messages: ['This note goes.'],
    })
    seed({ anchor: ANCHORS.deadline, messages: ['Done.'], status: 'resolved' })
    const page = await newPage()
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    await open(page, studio)
    await toolbar(page).getByRole('button', { name: 'Copy for agent' }).click()
    await expect
      .poll(() =>
        page
          .getByText('Copied 2 open comments for your agent', { exact: true })
          .filter({ visible: true })
          .isVisible(),
      )
      .toBe(true)
    // Windows' clipboard hands text back with CRLF line endings.
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied.replace(/\r\n/g, '\n'))
      .toBe(`## 2 open comments on View "Board"

File: ${content.split(path.sep).join('/')}/ada/review/Board.vue
Address: /prototypes/${REVIEW}/artifacts/b0ard0000000c001

### 1. Button "Invite students" · ${invite}
State: Full
Path: main > button
- Ada Lovelace: Make this the main action.
- Ada Lovelace: And say who is invited.

### 2. Paragraph "A removed note" · ${removed}
State: Full
Target not found: it was removed or changed since.
- Ada Lovelace: This note goes.

Reply or resolve with \`yarn comments reply <id> "…"\` and \`yarn comments resolve <id>\`.
`)
  })

  test('[CM-66] a pin is a button named with its number, author and first words', async () => {
    seed({
      anchor: ANCHORS.invite,
      messages: [
        'Please make this button much bigger and bolder so it stands out.',
      ],
    })
    const page = await newPage()
    await open(page, studio)
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    expect(await pin(page, 1).getAttribute('aria-label')).toBe(
      'Comment 1 by Ada Lovelace: Please make this button much bigger and bolder…',
    )
  })

  test('[CM-25] [CM-27] Hide comments hides every pin, and resolved pins show only on the Resolved tab', async () => {
    seed({ anchor: ANCHORS.invite, messages: ['Still to do.'] })
    seed({
      anchor: ANCHORS.deadline,
      messages: ['Done already.'],
      status: 'resolved',
    })
    const page = await newPage()
    await open(page, studio)
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await page.waitForTimeout(300)
    expect(await pin(page, 2).count()).toBe(0)

    await toolbar(page).getByRole('button', { name: 'Hide comments' }).click()
    await expect.poll(() => pin(page, 1).count()).toBe(0)
    await toolbar(page).getByRole('button', { name: 'Show comments' }).click()
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)

    await allComments(page).click()
    await tab(page, 'Resolved').click()
    await expect.poll(() => pin(page, 2).isVisible()).toBe(true)
    await tab(page, 'Open').click()
    await expect.poll(() => pin(page, 2).count()).toBe(0)
  })

  test('[CM-30] the open thread is kept in the address, without new history entries, and a reload reopens it', async () => {
    const id = seed({ anchor: ANCHORS.invite, messages: ['Link to me.'] })
    const page = await newPage()
    await open(page, studio)
    const entries = await page.evaluate(() => history.length)
    await pin(page, 1).click()
    await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
    await expect
      .poll(() => new URL(page.url()).searchParams.get('comment'))
      .toBe(id)
    await thread(page, 1).getByRole('button', { name: 'Close' }).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.has('comment'))
      .toBe(false)
    expect(await page.evaluate(() => history.length)).toBe(entries)

    await page.goto(`${address(studio, FULL)}?comment=${id}`)
    await ready(page)
    await expect.poll(() => thread(page, 1).isVisible()).toBe(true)
    expect(await thread(page, 1).textContent()).toContain('Link to me.')
  })

  test('[CM-44] [CM-67] the list works from the keyboard alone: comment on the whole view, reply and resolve, with focus kept in place', async () => {
    const page = await newPage()
    await open(page, studio)
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
    await tabTo(page, allComments(page))
    await page.keyboard.press('Enter')
    await expect.poll(() => list(page).isVisible()).toBe(true)

    const whole = list(page).getByRole('button', {
      name: 'Comment on the whole view',
    })
    await tabTo(page, whole)
    await page.keyboard.press('Enter')
    await expect
      .poll(() =>
        isFocused(composer(page).getByRole('textbox', { name: 'Comment' })),
      )
      .toBe(true)
    await page.keyboard.type('Read from the keyboard.')
    await page.keyboard.press('Enter')
    await expect.poll(() => stored().length).toBe(1)
    // Focus goes back to where it came from.
    await expect.poll(() => isFocused(whole)).toBe(true)

    const listed = row(page, 'Read from the keyboard.')
    await tabTo(page, listed)
    await page.keyboard.press('Enter')
    const popover = thread(page, 1)
    await expect
      .poll(() => isFocused(popover.getByRole('textbox', { name: 'Reply' })))
      .toBe(true)
    await page.keyboard.type('And answered.')
    await page.keyboard.press('Enter')
    await expect
      .poll(() => stored()[0]?.messages.map(({ body }) => body))
      .toEqual(['Read from the keyboard.', 'And answered.'])

    await tabTo(page, popover.getByRole('button', { name: 'Resolve' }), true)
    await page.keyboard.press('Enter')
    await expect.poll(() => stored()[0]?.status).toBe('resolved')
    await expect.poll(() => popover.count()).toBe(0)
    // Its row has left the Open tab; focus stays in the list.
    await expect
      .poll(() =>
        list(page).evaluate((element) =>
          element.contains(document.activeElement),
        ),
      )
      .toBe(true)
  })

  test('[CM-11] in comment mode, selecting text in a view quotes it', async () => {
    const page = await newPage()
    await open(page, studio)
    await commentButton(page).click()
    await expect.poll(() => hint(page).isVisible()).toBe(true)
    expect(await hint(page).textContent()).toContain('Select text to quote it.')
    const box = await view(page).getByTestId('deadline').boundingBox()
    await page.mouse.move(box!.x + 1, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width - 4, box!.y + box!.height / 2, {
      steps: 8,
    })
    await page.mouse.up()
    await expect.poll(() => composer(page).isVisible()).toBe(true)
    expect(await composer(page).textContent()).toContain(
      'Remember the deadline',
    )
    await page.keyboard.type('Which one?')
    await page.keyboard.press('Enter')
    await expect
      .poll(() => stored()[0]?.anchor)
      .toMatchObject({
        quote: 'Remember the deadline',
        selector: '[data-testid="deadline"]',
      })

    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    await pin(page, 1).click()
    expect(
      await thread(page, 1)
        .locator('blockquote')
        .textContent()
        .then((text) => text?.trim()),
    ).toBe('Remember the deadline')
    await allComments(page).click()
    expect(await row(page, 'Which one?').textContent()).toContain(
      '“Remember the deadline”',
    )
  })

  test('[CM-68] with reduced motion, pins and the list appear without animation', async () => {
    seed({ anchor: ANCHORS.invite, messages: ['Calm, please.'] })
    const page = await newPage()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, studio)
    await expect.poll(() => pin(page, 1).isVisible()).toBe(true)
    expect(
      await pin(page, 1).evaluate(
        (element) => getComputedStyle(element).transitionDuration,
      ),
    ).toBe('0s')
    await allComments(page).click()
    expect(
      await list(page).evaluate((element) => ({
        transition: getComputedStyle(element).transitionDuration,
        animations: element.getAnimations({ subtree: true }).length,
      })),
    ).toEqual({ transition: '0s', animations: 0 })
  })
})

describe('the static build', () => {
  const newPage = useBrowser()
  let site: RunningStudio & { directory: string }
  const SECRET = 'A review note that never ships.'
  beforeAll(async () => {
    mkdirSync(threadsFolder, { recursive: true })
    const id = 'c0mm00000000c001'
    writeFileSync(
      path.join(threadsFolder, `${id}.json`),
      `${JSON.stringify(
        {
          formatVersion: 1,
          id,
          artifact: FULL,
          artifactTitle: 'Board · Full',
          anchor: {
            kind: 'button',
            label: 'Button "Invite students"',
            at: { x: 0.5, y: 0.5 },
            selector: '[data-testid="invite"]',
            tag: 'button',
            path: 'main > button',
            text: 'Invite students',
          },
          status: 'open',
          messages: [
            {
              id: 'm0mm00000000c001',
              author: { contributor: ADA },
              body: SECRET,
              createdAt: '2026-11-03T10:00:00.000Z',
            },
          ],
        },
        null,
        2,
      )}\n`,
    )
    site = await startStaticSite('/studio-comments/', env)
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[CM-65] the deployed site has no comment tool and no comment text', async () => {
    const page = await newPage()
    await page.goto(address(site, FULL))
    await ready(page)
    await sees(view(page), 'Remember the deadline')
    await page.waitForTimeout(1000)
    expect(await toolbar(page).count()).toBe(0)
    expect(
      await page.getByRole('button', { name: /^Comment \d/ }).count(),
    ).toBe(0)
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const file = path.join(dir, name)
        if (statSync(file).isDirectory()) walk(file)
        else files.push(file)
      }
    }
    walk(site.directory)
    // No thread reaches the build. (The tool's interface strings sit in the
    // shared locale file, like every module's.)
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toContain(SECRET)
    }
  })
})
