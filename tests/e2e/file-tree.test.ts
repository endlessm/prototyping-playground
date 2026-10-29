// A prototype's file tree: the real files and folders, live from disk, with
// readable names; filtering, folding, "Show all files"; creating, renaming
// and deleting (to the Recycle Bin or the Trash) from the mouse and the keyboard;
// and each row's menu. Someone else's prototype and the deployed site get
// read-only trees. The studio runs as Ben (a contributor) on a disposable
// copy inside the checkout; the programs it would start (the file browser)
// are noted in a log instead, as if no code editor were installed. Wording
// and programs follow the computer the scenarios run on.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'tree-'))
const posix = (file: string) => file.split(path.sep).join('/')
const launchLog = path.resolve(content, '..', `${path.basename(content)}.log`)

const DEMO = 'ftp0000000000001'
const SHARED = 'ftp0000000000002'
const HOME = 'ftv0000000000001'
const SIGN_IN = 'ftv0000000000002'
const DETAILS = 'ftv0000000000003'
const BOARD = 'ftv0000000000004'

const at = (file: string) => path.join(content, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  // Rewritten only when it differs, so the watcher isn't flooded.
  if (existsSync(at(file)) && read(file) === text) return
  writeFileSync(at(file), text)
}
const view = (id: string, heading: string) =>
  `<!-- @studio-id ${id} -->\n<template>\n  <h1>${heading}</h1>\n</template>\n`
const meta = (title: string, id: string, owner: string) =>
  `${JSON.stringify({ title, studioId: id, ownerContributorId: owner, systemId: null }, null, 2)}\n`

const FILES: Record<string, string> = {
  'ben/demo/meta.json': meta('Demo', DEMO, 'ben0000000000002'),
  'ben/demo/Home.vue': view(HOME, 'Home'),
  'ben/demo/flows/sign-in.vue': view(SIGN_IN, 'Sign in'),
  'ben/demo/flows/Details.vue': view(DETAILS, 'Details'),
  'ben/demo/_parts/Helper.vue': '<template><p>Helper</p></template>\n',
  'ben/demo/logo.png': 'png',
  'ada/shared/meta.json': meta('Shared', SHARED, 'ada0000000000001'),
  'ada/shared/Board.vue': view(BOARD, 'Board'),
}
/** Puts the fixtures back and removes anything a scenario added. */
function reset() {
  for (const [file, text] of Object.entries(FILES)) write(file, text)
  mkdirSync(at('ben/demo/drafts'), { recursive: true })
  const keep = new Set(Object.keys(FILES).map((file) => at(file)))
  const prune = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (full === at('ben/demo/drafts')) {
          for (const inner of readdirSync(full))
            rmSync(path.join(full, inner), { recursive: true })
          continue
        }
        const wanted = [...keep].some((file) =>
          file.startsWith(full + path.sep),
        )
        if (wanted) prune(full)
        else rmSync(full, { recursive: true })
      } else if (!keep.has(full)) rmSync(full)
    }
  }
  prune(content)
  writeFileSync(launchLog, '')
}
reset()

const WINDOWS = process.platform === 'win32'
const APPLE = process.platform === 'darwin'
const REVEAL = WINDOWS
  ? 'Show in Explorer'
  : APPLE
    ? 'Reveal in Finder'
    : 'Show in folder'
const TRASH = WINDOWS ? 'the Recycle Bin' : 'the Trash'
const SOURCE_KEY = APPLE ? "⌘'" : "Ctrl+'"
/** What showing a file in the file browser starts here. */
function revealed(file: string) {
  const full = path.resolve(at(file))
  if (WINDOWS) return { command: 'explorer.exe', args: [`/select,${full}`] }
  if (APPLE) return { command: '/usr/bin/open', args: ['-R', full] }
  return { command: 'xdg-open', args: [path.dirname(full)] }
}

const NEW_ITEMS = ['New view', 'New canvas', 'New folder']

const launched = () =>
  readFileSync(launchLog, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { command: string; args: string[] })

const BEN = {
  STUDIO_PROTOTYPES: posix(content),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_LAUNCH_LOG: launchLog,
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(launchLog, { force: true })
})

const nav = (page: Page, title = 'Demo') =>
  page.getByRole('navigation', { name: title })
const link = (page: Page, name: string, title = 'Demo') =>
  nav(page, title).getByRole('link', { name, exact: true })
const row = (page: Page, name: string, title = 'Demo') =>
  nav(page, title).getByRole('treeitem', { name, exact: true })
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true })
const field = (page: Page) => page.getByRole('textbox', { name: 'Name' })
const labels = (page: Page, title = 'Demo') =>
  nav(page, title).getByRole('treeitem').allTextContents()
const menuItems = async (page: Page) =>
  (await page.getByRole('menuitem').allTextContents()).map((text) =>
    text.trim(),
  )
const toast = (page: Page, text: string) => page.getByText(text).first()

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function gone(locator: { count: () => Promise<number> }) {
  await expect.poll(() => locator.count(), { timeout: 30_000 }).toBe(0)
}

describe('in the studio running locally', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(artifact = HOME, prototype = DEMO) {
    const page = await newPage()
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(
      `${studio.url}prototypes/${prototype}/artifacts/${artifact}`,
    )
    await visible(
      prototype === DEMO ? link(page, 'Home') : link(page, 'Board', 'Shared'),
    )
    // The real files have arrived from the file service.
    await expect
      .poll(() =>
        nav(page, prototype === DEMO ? 'Demo' : 'Shared').getAttribute(
          'aria-busy',
        ),
      )
      .toBeNull()
    return page
  }

  /** Goes to an address inside the app, which stays open. */
  const go = (page: Page, to: string) =>
    page.evaluate((address) => {
      const app = (
        document.querySelector('#__nuxt') as unknown as {
          __vue_app__: {
            config: {
              globalProperties: { $router: { push: (to: string) => unknown } }
            }
          }
        }
      ).__vue_app__
      return app.config.globalProperties.$router.push(address)
    }, to)

  test('[SH-68] [SH-71] [SH-73] [SH-61] [PR-48] [PR-49] the tree lists artifacts and their folders by readable name, the open one current', async () => {
    reset()
    const page = await open(SIGN_IN)
    await expect
      .poll(() => labels(page))
      .toEqual(['Drafts', 'Flows', 'Details', 'Sign In', 'Home'])
    expect(await page.getByRole('tree', { name: 'Artifacts' }).count()).toBe(1)
    const current = link(page, 'Sign In')
    expect(await current.getAttribute('aria-current')).toBe('page')
    expect(await current.getAttribute('title')).toBe('sign-in.vue')
    expect(await row(page, 'Flows').getAttribute('aria-expanded')).toBe('true')
    expect(await link(page, 'Home').getAttribute('aria-current')).toBeNull()
  })

  test('[SH-70] the tree follows files added, renamed and removed on disk', async () => {
    reset()
    const page = await open()
    write('ben/demo/flows/Extra.vue', view('ftv0000000000009', 'Extra'))
    await visible(link(page, 'Extra'))
    rmSync(at('ben/demo/flows/Extra.vue'))
    await gone(link(page, 'Extra'))
    mkdirSync(at('ben/demo/later'))
    await visible(row(page, 'Later'))
  })

  test('[SH-74] [SH-75] [PR-53] folders fold, all at once from the header, and stay as left while the app is open', async () => {
    reset()
    const page = await open()
    await row(page, 'Flows').click()
    await gone(link(page, 'Details'))
    // The header's tools show while the pointer is over the tree.
    await nav(page).hover()
    await button(page, 'Expand all').click()
    await visible(link(page, 'Details'))
    await button(page, 'Collapse all').click()
    await gone(link(page, 'Details'))
    // Away and back, in the app: the folder is still closed.
    await go(page, `/prototypes/${SHARED}/artifacts/${BOARD}`)
    await visible(link(page, 'Board', 'Shared'))
    await go(page, `/prototypes/${DEMO}/artifacts/${HOME}`)
    await visible(link(page, 'Home'))
    expect(await link(page, 'Details').count()).toBe(0)
    // Opening an artifact inside opens its folders.
    await go(page, `/prototypes/${DEMO}/artifacts/${DETAILS}`)
    await visible(link(page, 'Details'))
  })

  test('[SH-76] [PR-52] the filter matches names, titles and paths; Escape clears, then closes', async () => {
    reset()
    const page = await open()
    await nav(page).hover()
    await button(page, 'Filter').click()
    const filter = page.getByRole('textbox', { name: 'Filter artifacts' })
    await filter.fill('sign')
    await expect.poll(() => labels(page)).toEqual(['Flows', 'Sign In'])
    await filter.fill('nothing like it')
    await visible(nav(page).getByText('No matching artifacts.'))
    await button(page, 'Clear filter').click()
    expect(await filter.inputValue()).toBe('')
    await filter.fill('home')
    await expect.poll(() => labels(page)).toEqual(['Home'])
    await filter.press('Escape')
    expect(await filter.inputValue()).toBe('')
    await filter.press('Escape')
    await gone(filter)
  })

  test('[SH-77] [PR-50] "Show all files" lists every file, is remembered, and other files open in your editor', async () => {
    reset()
    const page = await open()
    await button(page, 'Prototype actions').click()
    await page.getByRole('menuitemcheckbox', { name: 'Show all files' }).click()
    await visible(page.getByRole('tree', { name: 'Files' }))
    for (const name of ['_parts', 'Helper.vue', 'logo.png', 'meta.json'])
      await visible(row(page, name))
    // In your code editor, or, without one, in the file browser.
    await row(page, 'meta.json').click()
    await expect
      .poll(() => launched().at(-1))
      .toEqual(revealed('ben/demo/meta.json'))
    // Remembered in this browser, for every prototype.
    await page.reload()
    await visible(row(page, 'meta.json'))
    await page.goto(`${studio.url}prototypes/${SHARED}/artifacts/${BOARD}`)
    await visible(row(page, 'meta.json', 'Shared'))
    await button(page, 'Prototype actions').click()
    await page.getByRole('menuitemcheckbox', { name: 'Show all files' }).click()
    await gone(row(page, 'meta.json', 'Shared'))
  })

  test('[SH-78] [SH-79] [PR-54] [PR-55] New makes a view or a folder with an inline name field; a new view opens right away', async () => {
    reset()
    const page = await open()
    await button(page, 'New').click()
    // Each installed file type (here views and canvases), then Folder.
    expect(await menuItems(page)).toEqual(NEW_ITEMS)
    await page.getByRole('menuitem', { name: 'New view' }).click()
    await visible(field(page))
    expect(await field(page).inputValue()).toBe('untitled')
    expect(
      await field(page).evaluate((input: HTMLInputElement) =>
        input.value.slice(input.selectionStart!, input.selectionEnd!),
      ),
    ).toBe('untitled')
    await field(page).fill('Checkout')
    await field(page).press('Enter')
    await visible(link(page, 'Checkout'))
    expect(read('ben/demo/Checkout.vue')).toMatch(
      /^<!-- @studio-id [0-9a-z]{16} -->/,
    )
    const id = /@studio-id (\w+)/.exec(read('ben/demo/Checkout.vue'))![1]
    await expect.poll(() => page.url()).toContain(`/artifacts/${id}`)
    expect(await link(page, 'Checkout').getAttribute('aria-current')).toBe(
      'page',
    )

    // Escape cancels.
    await button(page, 'New').click()
    await page.getByRole('menuitem', { name: 'New folder' }).click()
    expect(await field(page).inputValue()).toBe('new-folder')
    await field(page).press('Escape')
    await gone(field(page))
    expect(existsSync(at('ben/demo/new-folder'))).toBe(false)

    // A folder's own menu makes things inside it.
    await row(page, 'Flows').click({ button: 'right' })
    expect((await menuItems(page)).slice(0, NEW_ITEMS.length)).toEqual(
      NEW_ITEMS,
    )
    await page.getByRole('menuitem', { name: 'New folder' }).click()
    await field(page).fill('steps')
    await field(page).press('Enter')
    await visible(row(page, 'Steps'))
    expect(existsSync(at('ben/demo/flows/steps'))).toBe(true)
  })

  test('[SH-80] [PR-56] [SH-87] [PR-61] F2 or Rename renames in place; the open artifact keeps its page', async () => {
    reset()
    const page = await open(DETAILS)
    await link(page, 'Details').focus()
    await page.keyboard.press('F2')
    await visible(field(page))
    expect(await field(page).inputValue()).toBe('Details.vue')
    expect(
      await field(page).evaluate((input: HTMLInputElement) =>
        input.value.slice(input.selectionStart!, input.selectionEnd!),
      ),
    ).toBe('Details')
    await page.keyboard.type('Summary')
    await page.keyboard.press('Enter')
    await visible(link(page, 'Summary'))
    expect(existsSync(at('ben/demo/flows/Summary.vue'))).toBe(true)
    expect(page.url()).toContain(`/artifacts/${DETAILS}`)
    expect(await link(page, 'Summary').getAttribute('aria-current')).toBe(
      'page',
    )

    // From the menu, and Escape leaves the name as it was.
    await row(page, 'Flows').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('journeys')
    await field(page).press('Escape')
    await gone(field(page))
    expect(existsSync(at('ben/demo/flows'))).toBe(true)
  })

  test('[SH-81] [SH-82] [PR-44] [PR-60] [SH-87] [PR-61] Delete asks first, moves to the trash and says so; the page leaves a deleted artifact', async () => {
    reset()
    // Hidden from the tree; its folder's delete names it.
    write('ben/demo/flows/notes.txt', 'notes')
    const page = await open(SIGN_IN)
    await link(page, 'Sign In').focus()
    await page.keyboard.press('Delete')
    const dialog = page.getByRole('dialog', { name: 'Delete “Sign In”?' })
    await visible(dialog)
    await visible(
      dialog.getByText(`It moves to ${TRASH}, where you can restore it.`),
    )
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await visible(toast(page, `Moved “Sign In” to ${TRASH}`))
    expect(existsSync(at('ben/demo/flows/sign-in.vue'))).toBe(false)
    expect(existsSync('.trash')).toBe(false)
    // The page goes to the prototype's first artifact.
    await expect.poll(() => page.url()).not.toContain(SIGN_IN)
    await gone(link(page, 'Sign In'))

    // A folder's delete names the hidden files that go with it, once the
    // tree has its files again.
    await expect.poll(() => nav(page).getAttribute('aria-busy')).toBeNull()
    await row(page, 'Flows').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const folder = page.getByRole('dialog', { name: 'Delete “Flows”?' })
    await visible(
      folder.getByText(
        `The folder and everything in it move to ${TRASH}, where you can restore them. This includes 1 file the tree isn’t showing: notes.txt.`,
      ),
    )
    await folder.getByRole('button', { name: 'Cancel' }).click()
    await gone(folder)
    expect(existsSync(at('ben/demo/flows/notes.txt'))).toBe(true)
  })

  test('[PR-62] [SH-89] a refused name says why, and a clash with a hidden file says how to see it', async () => {
    reset()
    const page = await open()
    await row(page, 'Drafts').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('_parts')
    await field(page).press('Enter')
    await visible(
      toast(
        page,
        'Something named “_parts” already exists there. It’s hidden: choose Show all files in the … menu.',
      ),
    )
    await row(page, 'Drafts').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('a/b')
    await field(page).press('Enter')
    await visible(
      toast(page, 'Names can’t contain slashes or start with a dot.'),
    )
  })

  test('[SH-62] [SH-63] [SH-64] [SH-65] [SH-66] [SH-90] [PR-63] [PR-126] a file’s menu: source, editor, file browser, link, path, lo-fi, rename, delete', async () => {
    reset()
    const page = await open()
    await link(page, 'Details').click({ button: 'right' })
    expect(await menuItems(page)).toEqual([
      `Edit source${SOURCE_KEY}`,
      'Open in editor',
      REVEAL,
      'Copy link',
      'Copy path',
      'Make lo-fi',
      'Rename',
      'Delete',
    ])
    await page.getByRole('menuitem', { name: 'Copy link' }).click()
    await visible(toast(page, 'Link copied'))
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `${studio.url}prototypes/${DEMO}/artifacts/${DETAILS}`,
    )

    await link(page, 'Details').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Copy path' }).click()
    await visible(toast(page, 'Path copied'))
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `${posix(content)}/ben/demo/flows/Details.vue`,
    )

    await link(page, 'Details').click({ button: 'right' })
    await page.getByRole('menuitem', { name: REVEAL }).click()
    await expect
      .poll(() => launched().at(-1))
      .toEqual(revealed('ben/demo/flows/Details.vue'))

    // No code editor: the file browser instead, and what else to do.
    await link(page, 'Details').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Open in editor' }).click()
    await visible(
      toast(page, 'You can also use Edit source, or copy its path.'),
    )
    expect(launched().length).toBe(2)

    await link(page, 'Details').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Make lo-fi' }).click()
    await expect
      .poll(() => read('ben/demo/flows/Details.vue'))
      .toMatch(/^<!-- @lofi -->/)

    await link(page, 'Details').click({ button: 'right' })
    await page.getByRole('menuitem', { name: /Edit source/ }).click()
    await expect
      .poll(() => page.url())
      .toContain(`/artifacts/${DETAILS}?mode=source`)
  })

  test('[SH-92] [PR-63] someone else’s prototype has a read-only tree', async () => {
    reset()
    const page = await open(BOARD, SHARED)
    expect(await button(page, 'New').count()).toBe(0)
    await link(page, 'Board', 'Shared').click({ button: 'right' })
    expect(await menuItems(page)).toEqual([
      `View source${SOURCE_KEY}`,
      'Open in editor',
      REVEAL,
      'Copy link',
      'Copy path',
    ])
    await page.keyboard.press('Escape')
    await link(page, 'Board', 'Shared').focus()
    await page.keyboard.press('F2')
    await page.keyboard.press('Delete')
    expect(await field(page).count()).toBe(0)
    expect(await page.getByRole('dialog').count()).toBe(0)
  })
})

describe('the deployed site', { timeout: 300_000 }, () => {
  const newPage = useBrowser()
  let site: Awaited<ReturnType<typeof startStaticSite>>
  beforeAll(async () => {
    reset()
    site = await startStaticSite('/', { STUDIO_PROTOTYPES: posix(content) })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[SH-67] [SH-69] [PR-64] the tree lists the published artifacts in order, with copy-only menus', async () => {
    const page = await newPage()
    await page.goto(`${site.url}prototypes/${DEMO}/artifacts/${HOME}`)
    await visible(link(page, 'Home'))
    expect(await labels(page)).toEqual(['Flows', 'Details', 'Sign In', 'Home'])
    expect(await button(page, 'New').count()).toBe(0)
    expect(await button(page, 'Prototype actions').count()).toBe(1)
    await link(page, 'Details').click({ button: 'right' })
    expect(await menuItems(page)).toEqual(['Copy link', 'Copy path'])
  })
})
