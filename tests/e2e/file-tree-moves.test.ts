// Arranging a prototype's files in its tree: dragging rows before, after or
// into a folder, Alt+↑/↓ from the keyboard, the order saved in meta.json and
// the artifact the prototype opens with; renames and moves, in the studio or
// outside it, repairing the references in other files; and a row dragged out
// carrying its permanent link. The studio runs as Ben (a contributor) on a
// disposable copy inside the checkout.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'moves-'))
const posix = (file: string) => file.split(path.sep).join('/')

const DEMO = 'mvp0000000000001'
const SHARED = 'mvp0000000000002'
const HOME = 'mvv0000000000001'
const ABOUT = 'mvv0000000000002'
const DETAILS = 'mvv0000000000003'
const SIGN_IN = 'mvv0000000000004'
const BRIEF = 'mvd0000000000001'
const BOARD = 'mvv0000000000005'

const at = (file: string) => path.join(content, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  if (existsSync(at(file)) && read(file) === text) return
  writeFileSync(at(file), text)
}
const view = (id: string, heading: string, more = '') =>
  `<!-- @studio-id ${id} -->\n<script setup lang="ts">\nimport { PrototypeLink } from '#studio/prototype'\n</script>\n\n<template>\n  <h1>${heading}</h1>${more}\n</template>\n`
const meta = (title: string, id: string, owner: string) =>
  `${JSON.stringify({ title, studioId: id, ownerContributorId: owner, systemId: null }, null, 2)}\n`

const FILES: Record<string, string> = {
  'ben/demo/meta.json': meta('Demo', DEMO, 'ben0000000000002'),
  'ben/demo/Home.vue': view(
    HOME,
    'Home',
    '\n  <PrototypeLink to="flows/Details">Details</PrototypeLink>',
  ),
  'ben/demo/About.vue': view(ABOUT, 'About'),
  'ben/demo/flows/Details.vue': view(DETAILS, 'Details'),
  'ben/demo/flows/Sign in.vue': view(SIGN_IN, 'Sign in'),
  'ben/demo/notes/Brief.md': `---\nstudioId: ${BRIEF}\n---\n\n# Brief\n\nSee [the details](../flows/Details.vue).\n`,
  'ada/shared/meta.json': meta('Shared', SHARED, 'ada0000000000001'),
  'ada/shared/Board.vue': view(BOARD, 'Board'),
}
/** Puts the fixtures back and removes anything a scenario added. */
function reset() {
  const keep = new Set(Object.keys(FILES).map((file) => at(file)))
  const prune = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if ([...keep].some((file) => file.startsWith(full + path.sep)))
          prune(full)
        else rmSync(full, { recursive: true })
      } else if (!keep.has(full)) rmSync(full)
    }
  }
  prune(content)
  for (const [file, text] of Object.entries(FILES)) write(file, text)
}
reset()

const BEN = {
  STUDIO_PROTOTYPES: posix(content),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_LAUNCH_LOG: path.resolve(
    content,
    '..',
    `${path.basename(content)}.log`,
  ),
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(BEN.STUDIO_LAUNCH_LOG, { force: true })
})

const nav = (page: Page, title = 'Demo') =>
  page.getByRole('navigation', { name: title })
const link = (page: Page, name: string, title = 'Demo') =>
  nav(page, title).getByRole('link', { name, exact: true })
const row = (page: Page, name: string, title = 'Demo') =>
  nav(page, title).getByRole('treeitem', { name, exact: true })
const labels = (page: Page, title = 'Demo') =>
  nav(page, title).getByRole('treeitem').allTextContents()
const toast = (page: Page, text: string) => page.getByText(text).first()
// Changes come back from the dev server; this computer is often busy.
const WAIT = { timeout: 30_000 }
const savedOrder = () => JSON.parse(read('ben/demo/meta.json')).order
/** The saved order of what the tree shows (meta.json is hidden). */
const shownOrder = () =>
  (savedOrder() as string[]).filter((entry) => entry !== 'meta.json')

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}

type Where = 'before' | 'after' | 'inside'
/** Where on a row a drop lands: its top or bottom edge, or its middle. */
async function spot(target: Locator, where: Where) {
  const box = (await target.boundingBox())!
  return {
    x: box.width / 2,
    y:
      where === 'before'
        ? 3
        : where === 'after'
          ? box.height - 3
          : box.height / 2,
  }
}
async function drag(source: Locator, target: Locator, where: Where) {
  await source.dragTo(target, { targetPosition: await spot(target, where) })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(artifact = HOME, prototype = DEMO, suffix = '') {
    const page = await newPage()
    await page.goto(
      `${studio.url}prototypes/${prototype}/artifacts/${artifact}${suffix}`,
    )
    const title = prototype === DEMO ? 'Demo' : 'Shared'
    await visible(link(page, prototype === DEMO ? 'Home' : 'Board', title))
    // The real files have arrived from the file service.
    await expect
      .poll(() => nav(page, title).getAttribute('aria-busy'), WAIT)
      .toBeNull()
    return page
  }

  test('[SH-83] [PR-57] [SH-85] [PR-59] dragging a row to another’s edge puts it there, with a line where it will land, and saves the order', async () => {
    reset()
    const page = await open()
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'About',
        'Home',
        'Flows',
        'Details',
        'Sign in',
        'Notes',
        'Brief',
      ])
    // While dragging, the row underneath shows where it will land.
    const source = row(page, 'Home')
    const target = row(page, 'About')
    await source.hover()
    await page.mouse.down()
    const box = (await target.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + 3, { steps: 8 })
    await expect
      .poll(() => target.getAttribute('data-drop'), WAIT)
      .toBe('before')
    await page.mouse.up()
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'Home',
        'About',
        'Flows',
        'Details',
        'Sign in',
        'Notes',
        'Brief',
      ])
    expect(savedOrder()).toEqual([
      'Home.vue',
      'About.vue',
      'meta.json',
      'flows',
      'notes',
    ])
    // Reordering keeps the page on screen; the next opening changes.
    expect(page.url()).toContain(`/artifacts/${HOME}`)
    await drag(row(page, 'About'), row(page, 'Home'), 'before')
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'About',
        'Home',
        'Flows',
        'Details',
        'Sign in',
        'Notes',
        'Brief',
      ])
    await drag(row(page, 'Details'), row(page, 'Sign in'), 'after')
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'About',
        'Home',
        'Flows',
        'Sign in',
        'Details',
        'Notes',
        'Brief',
      ])
    expect(savedOrder()).toContain('flows/Details.vue')
    expect(page.url()).toContain(`/artifacts/${HOME}`)
  })

  test('[SH-85] [PR-59] the first artifact in order is the one the prototype’s address opens', async () => {
    reset()
    const page = await open()
    await page.goto(`${studio.url}prototypes/${DEMO}`)
    await expect.poll(() => page.url(), WAIT).toContain(`/artifacts/${ABOUT}`)
    await drag(row(page, 'Notes'), row(page, 'About'), 'before')
    await expect.poll(() => savedOrder()?.[0], WAIT).toBe('notes')
    await page.goto(`${studio.url}prototypes/${DEMO}`)
    await expect.poll(() => page.url(), WAIT).toContain(`/artifacts/${BRIEF}`)
  })

  test('[SH-83] [PR-57] [SH-88] dropping into a folder moves the file there, the folder highlighted, and repairs links to it', async () => {
    reset()
    const page = await open()
    const notes = row(page, 'Notes')
    await row(page, 'Details').hover()
    await page.mouse.down()
    const box = (await notes.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 8,
    })
    await expect
      .poll(() => notes.getAttribute('data-drop'), WAIT)
      .toBe('inside')
    await page.mouse.up()
    await visible(toast(page, 'Moved. References updated.'))
    await expect
      .poll(() => existsSync(at('ben/demo/notes/Details.vue')), WAIT)
      .toBe(true)
    expect(read('ben/demo/Home.vue')).toContain('to="notes/Details"')
    expect(read('ben/demo/notes/Brief.md')).toContain(
      '[the details](Details.vue)',
    )
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'About',
        'Home',
        'Flows',
        'Sign in',
        'Notes',
        'Brief',
        'Details',
      ])
  })

  test('[SH-83] [PR-57] dropping on the empty space below puts it last at the top level; a folder can’t go inside itself', async () => {
    reset()
    const page = await open()
    const below = nav(page).getByTestId('tree-end')
    await drag(row(page, 'Sign in'), below, 'inside')
    await expect
      .poll(() => existsSync(at('ben/demo/Sign in.vue')), WAIT)
      .toBe(true)
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'About',
        'Home',
        'Flows',
        'Details',
        'Notes',
        'Brief',
        'Sign in',
      ])
    // Onto its own child: nothing happens.
    await drag(row(page, 'Flows'), row(page, 'Details'), 'inside')
    await drag(row(page, 'Flows'), row(page, 'Details'), 'after')
    expect(existsSync(at('ben/demo/flows/Details.vue'))).toBe(true)
    expect(existsSync(at('ben/demo/flows/flows'))).toBe(false)
  })

  test('[SH-84] [PR-58] Alt+↑ and Alt+↓ move the focused row among its siblings; not while filtering', async () => {
    reset()
    const page = await open()
    await link(page, 'About').focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'Home',
        'About',
        'Flows',
        'Details',
        'Sign in',
        'Notes',
        'Brief',
      ])
    // The row keeps focus, so it can go on moving.
    await page.keyboard.press('Alt+ArrowDown')
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'Home',
        'Flows',
        'Details',
        'Sign in',
        'About',
        'Notes',
        'Brief',
      ])
    await page.keyboard.press('Alt+ArrowUp')
    await expect
      .poll(() => labels(page), WAIT)
      .toEqual([
        'Home',
        'About',
        'Flows',
        'Details',
        'Sign in',
        'Notes',
        'Brief',
      ])
    expect(shownOrder()).toEqual(['Home.vue', 'About.vue', 'flows', 'notes'])
    // While filtering, the order shown isn't the folder's: it stays.
    await nav(page).hover()
    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    await page.getByRole('textbox', { name: 'Filter artifacts' }).fill('a')
    await link(page, 'About').focus()
    await page.keyboard.press('Alt+ArrowUp')
    await page.waitForTimeout(500)
    expect(shownOrder()).toEqual(['Home.vue', 'About.vue', 'flows', 'notes'])
  })

  test('[SH-88] [PR-67] renaming says the references were updated, and they were', async () => {
    reset()
    const page = await open(DETAILS)
    await link(page, 'Details').focus()
    await page.keyboard.press('F2')
    const name = page.getByRole('textbox', { name: 'Name' })
    await visible(name)
    await name.fill('Summary')
    await name.press('Enter')
    await visible(toast(page, 'Renamed. References updated.'))
    expect(read('ben/demo/Home.vue')).toContain('to="flows/Summary"')
    expect(read('ben/demo/notes/Brief.md')).toContain('(../flows/Summary.vue)')
    expect(page.url()).toContain(`/artifacts/${DETAILS}`)
  })

  test('[PR-68] [SH-138] a rename outside the studio repairs references, and the open page stays on its file with its search and hash', async () => {
    reset()
    const page = await open(DETAILS, DEMO, '?step=2#top')
    renameSync(at('ben/demo/flows'), at('ben/demo/journeys'))
    await expect
      .poll(() => read('ben/demo/Home.vue'), WAIT)
      .toContain('to="journeys/Details"')
    await expect
      .poll(() => read('ben/demo/notes/Brief.md'), WAIT)
      .toContain('(../journeys/Details.vue)')
    await visible(row(page, 'Journeys'))
    expect(await link(page, 'Details').getAttribute('aria-current')).toBe(
      'page',
    )
    expect(page.url()).toContain(`/artifacts/${DETAILS}?step=2#top`)
    await expect
      .poll(
        () =>
          page
            .frameLocator('iframe')
            .getByRole('heading', { name: 'Details' })
            .isVisible(),
        { timeout: 45_000 },
      )
      .toBe(true)
  })

  test('[SH-86] [PR-65] a row dragged out of the tree carries its permanent link, also where you can’t change the prototype', async () => {
    reset()
    const page = await open()
    const carried = (target: Locator) =>
      target.evaluate((element) => {
        const data = new DataTransfer()
        element.dispatchEvent(
          new DragEvent('dragstart', { dataTransfer: data, bubbles: true }),
        )
        return [data.getData('text/uri-list'), data.getData('text/plain')]
      })
    const address = `${studio.url}prototypes/${DEMO}/artifacts/${DETAILS}`
    expect(await carried(row(page, 'Details'))).toEqual([address, address])
    const shared = await open(BOARD, SHARED)
    expect(await carried(row(shared, 'Board', 'Shared'))).toEqual([
      `${studio.url}prototypes/${SHARED}/artifacts/${BOARD}`,
      `${studio.url}prototypes/${SHARED}/artifacts/${BOARD}`,
    ])
  })

  test('[SH-83] [SH-84] someone else’s prototype can’t be rearranged', async () => {
    reset()
    write('ada/shared/Alpha.vue', view('mvv0000000000006', 'Alpha'))
    const page = await open(BOARD, SHARED)
    await visible(link(page, 'Alpha', 'Shared'))
    await drag(
      row(page, 'Board', 'Shared'),
      row(page, 'Alpha', 'Shared'),
      'before',
    )
    await link(page, 'Board', 'Shared').focus()
    await page.keyboard.press('Alt+ArrowUp')
    await page.waitForTimeout(500)
    expect(await labels(page, 'Shared')).toEqual(['Alpha', 'Board'])
    expect(JSON.parse(read('ada/shared/meta.json')).order).toBeUndefined()
  })
})
