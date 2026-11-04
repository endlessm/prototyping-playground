// Organizing prototypes from their header and their cards: renaming in place
// or in a dialog (the folder follows, the link stays), duplicating (the copy
// opens) or making a rebuild copy for another system, archiving and
// restoring, and deleting to the computer's trash. The studio runs as Ben (a
// contributor) on a disposable copy inside the checkout; the programs it
// would start are noted in a log instead, as if no code editor were
// installed. The deployed site is built from the same content and leaves
// the archived prototype out.
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
const content = mkdtempSync(path.join('.e2e', 'organize-'))
const posix = (file: string) => file.split(path.sep).join('/')
const launchLog = path.resolve(content, '..', `${path.basename(content)}.log`)

const DEMO = 'rgp0000000000001'
const OLD = 'rgp0000000000002'
const SHARED = 'rgp0000000000003'
const STYLED = 'rgp0000000000004'
const HOME = 'rgv0000000000001'
const DETAILS = 'rgv0000000000002'
const SKETCH = 'rgv0000000000003'
const BOARD = 'rgv0000000000004'
const NOTES = 'rgd0000000000001'
const ENDLESS = '8x5spen6xtvp96a9'
const BEN_ID = 'ben0000000000002'

const at = (file: string) => path.join(content, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
const json = (file: string) => JSON.parse(read(file))
const view = (id: string, heading: string) =>
  `<!-- @studio-id ${id} -->\n<template>\n  <h1>${heading}</h1>\n</template>\n`
const meta = (
  title: string,
  id: string,
  owner: string,
  more: Record<string, unknown> = {},
) =>
  `${JSON.stringify({ formatVersion: 1, title, created: '2026-01-02', studioId: id, ownerContributorId: owner, systemId: null, ...more }, null, 2)}\n`

// A comment on Home, kept by the comments module in the prototype.
const comment = (id: string) =>
  `${JSON.stringify(
    {
      formatVersion: 1,
      id,
      artifact: HOME,
      artifactTitle: 'Home',
      anchor: { kind: 'artifact' },
      status: 'open',
      messages: [
        {
          id: `m${id.slice(1)}`,
          author: { contributor: BEN_ID },
          body: 'Looks good.',
          createdAt: '2026-11-01T10:00:00.000Z',
        },
      ],
    },
    null,
    2,
  )}
`

const FILES: Record<string, string> = {
  'ben/demo/meta.json': meta('Demo', DEMO, BEN_ID),
  'ben/demo/Home.vue': view(HOME, 'Home screen'),
  'ben/demo/flows/Details.vue': view(DETAILS, 'Details screen'),
  'ben/demo/.comments/c0mm000000000001.json': comment('c0mm000000000001'),
  'ben/demo/.comments/c0mm000000000002.json': comment('c0mm000000000002'),
  'ben/demo/Notes.md': `---\nstudioId: ${NOTES}\n---\n\n# Notes\n\nSee [the old sketch](/prototypes/${OLD}/artifacts/${SKETCH}) and [details](./flows/Details.vue).\n`,
  'ben/old/meta.json': meta('Old', OLD, BEN_ID, { status: 'archived' }),
  'ben/old/Sketch.vue': view(SKETCH, 'Old sketch heading'),
  'ben/styled/meta.json': meta('Styled', STYLED, BEN_ID, {
    systemId: ENDLESS,
  }),
  'ada/shared/meta.json': meta('Shared', SHARED, 'ada0000000000001'),
  'ada/shared/Board.vue': view(BOARD, 'Board'),
}
const FOLDERS = ['ben/demo', 'ben/old', 'ben/styled', 'ada/shared']

/** Puts the fixtures back and removes anything a scenario added. */
function reset() {
  for (const owner of ['ada', 'ben']) {
    mkdirSync(at(owner), { recursive: true })
    for (const name of readdirSync(at(owner)))
      if (!FOLDERS.includes(`${owner}/${name}`))
        rmSync(at(`${owner}/${name}`), { recursive: true, force: true })
  }
  for (const [file, text] of Object.entries(FILES)) {
    mkdirSync(path.dirname(at(file)), { recursive: true })
    if (!existsSync(at(file)) || read(file) !== text)
      writeFileSync(at(file), text)
  }
  writeFileSync(launchLog, '')
}
reset()

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(launchLog, { force: true })
})

const WINDOWS = process.platform === 'win32'
const APPLE = process.platform === 'darwin'
const REVEAL = WINDOWS
  ? 'Show in Explorer'
  : APPLE
    ? 'Reveal in Finder'
    : 'Show in folder'
const BROWSER = WINDOWS
  ? 'File Explorer'
  : APPLE
    ? 'Finder'
    : 'your file manager'
const TRASH = WINDOWS ? 'the Recycle Bin' : 'the Trash'

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

const WAIT = { timeout: 30_000 }
async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function gone(locator: { count: () => Promise<number> }) {
  await expect.poll(() => locator.count(), WAIT).toBe(0)
}
const heading = (page: Page, title: string) =>
  page.getByRole('heading', { level: 1, name: title, exact: true })
const actions = (page: Page) =>
  page.getByRole('button', { name: 'Prototype actions', exact: true })
const menuItems = async (page: Page) =>
  (await page.getByRole('menuitem').allTextContents()).map((text) =>
    text.trim(),
  )
/** Closes an open menu, which holds the page's pointer until it is gone. */
async function close(page: Page) {
  await page.keyboard.press('Escape')
  await gone(page.getByRole('menu'))
}
const item = (page: Page, name: string) =>
  page.getByRole('menuitem', { name, exact: true })
const dialog = (page: Page) => page.getByRole('dialog')
const toast = (page: Page, text: string) => page.getByText(text).first()
const clipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText())
const launched = () =>
  readFileSync(launchLog, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { command: string; args: string[] })
const path_ = (page: Page) => new URL(page.url()).pathname

describe('organizing on the dev server, as Ben', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  /** Opens a prototype once its menu offers `ready`. */
  async function open(prototype = DEMO, title = 'Demo', ready = 'Rename') {
    const page = await newPage()
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`${studio.url}prototypes/${prototype}`)
    await visible(heading(page, title))
    // Who you are has arrived: the menu offers what you may do.
    await expect
      .poll(async () => {
        await actions(page).click()
        await visible(item(page, 'Copy link'))
        const items = await menuItems(page)
        await close(page)
        return items.includes(ready)
      }, WAIT)
      .toBe(true)
    return page
  }

  const menu = async (page: Page) => {
    await actions(page).click()
    await visible(item(page, 'Copy link'))
    return menuItems(page)
  }

  test('[PR-29] the header shows the system, linked to its page, or none, and marks archived prototypes', async () => {
    reset()
    const page = await open()
    const none = page.getByText('System · None')
    await visible(none)
    // Away from the menu's button, whose tooltip shows while it has focus.
    await page.evaluate(() => (document.activeElement as HTMLElement).blur())
    await page.mouse.move(0, 0)
    await none.hover()
    await visible(
      page
        .locator('[data-slot="content"]')
        .filter({ hasText: 'This prototype uses its own components and CSS' }),
    )

    await page.goto(`${studio.url}prototypes/${STYLED}`)
    const system = page.getByRole('link', {
      name: 'Open Endless Studios system',
    })
    await visible(system)
    expect(await system.textContent()).toContain('Endless Studios ↗')
    expect(await system.getAttribute('href')).toBe(`/systems/${ENDLESS}`)

    await page.goto(`${studio.url}prototypes/${OLD}`)
    const marker = page.getByText('Archived', { exact: true })
    await visible(marker)
    await marker.hover()
    await visible(
      page
        .locator('[data-slot="content"]')
        .filter({ hasText: 'The deployed site leaves this prototype out' }),
    )
  })

  test('[PR-30] [PR-32] [PR-33] the owner’s menu: reach, change, delete; the same on right-click; copying and opening it', async () => {
    reset()
    const page = await open()
    const expected = [
      'Open in editor',
      REVEAL,
      'Copy link',
      'Copy path',
      'Rename',
      'Duplicate',
      'Archive',
      'Delete',
    ]
    expect(await menu(page)).toEqual(expected)
    expect(
      await page
        .getByRole('menuitemcheckbox', { name: 'Show all files' })
        .count(),
    ).toBe(1)
    // Show all files, then the three groups, then Delete alone.
    expect(await page.getByRole('menu').getByRole('group').count()).toBe(4)
    await close(page)

    await page.getByText('System · None').click({ button: 'right' })
    await visible(item(page, 'Copy link'))
    expect(await menuItems(page)).toEqual(expected)
    await item(page, 'Copy link').click()
    await visible(toast(page, 'Link copied'))
    expect(await clipboard(page)).toBe(`${studio.url}prototypes/${DEMO}`)

    await menu(page)
    await item(page, 'Copy path').click()
    await visible(toast(page, 'Path copied'))
    expect(await clipboard(page)).toBe(`${posix(content)}/ben/demo`)

    writeFileSync(launchLog, '')
    await menu(page)
    await item(page, 'Open in editor').click()
    await visible(
      toast(
        page,
        `No supported code editor is installed, so the folder is shown in ${BROWSER}. Edit source is available in the studio, or copy its path.`,
      ),
    )
    const folder = path.resolve(at('ben/demo'))
    expect(launched()).toEqual([
      WINDOWS
        ? { command: 'explorer.exe', args: [`/select,${folder}`] }
        : APPLE
          ? { command: '/usr/bin/open', args: ['-R', folder] }
          : { command: 'xdg-open', args: [path.dirname(folder)] },
    ])
  })

  test('[PR-30] someone else’s prototype: only reaching it', async () => {
    reset()
    const page = await open(SHARED, 'Shared', 'Copy path')
    expect(await menu(page)).toEqual([
      'Open in editor',
      REVEAL,
      'Copy link',
      'Copy path',
    ])
    await close(page)
    await heading(page, 'Shared').dblclick()
    expect(
      await page.getByRole('textbox', { name: 'Prototype title' }).count(),
    ).toBe(0)
  })

  test('[PR-34] [PR-36] double-clicking the title renames in place; Escape cancels; a taken name says so', async () => {
    reset()
    const page = await open()
    const title = heading(page, 'Demo')
    await page.mouse.move(0, 0)
    await title.hover()
    await visible(
      page
        .locator('[data-slot="content"]')
        .filter({ hasText: 'Double-click to rename' }),
    )
    const address = path_(page)
    await title.dblclick()
    const field = page.getByRole('textbox', { name: 'Prototype title' })
    await visible(field)
    await field.fill('Ignored')
    await field.press('Escape')
    await visible(heading(page, 'Demo'))
    expect(existsSync(at('ben/ignored'))).toBe(false)

    await heading(page, 'Demo').dblclick()
    await field.fill('Old')
    await field.press('Enter')
    await visible(
      toast(
        page,
        'You already have a prototype named “Old”. Choose a different title.',
      ),
    )
    await visible(heading(page, 'Demo'))

    await heading(page, 'Demo').dblclick()
    await field.fill('Demo Renamed')
    await field.press('Enter')
    await visible(heading(page, 'Demo Renamed'))
    expect(json('ben/demo-renamed/meta.json')).toMatchObject({
      title: 'Demo Renamed',
      studioId: DEMO,
    })
    expect(existsSync(at('ben/demo'))).toBe(false)
    expect(path_(page)).toBe(address)
    await visible(page.getByRole('link', { name: 'Details', exact: true }))
  })

  test('[PR-35] [PR-36] the Rename dialog shows who made it and when, refuses a taken name, and keeps the link', async () => {
    reset()
    const page = await open()
    const address = path_(page)
    await menu(page)
    await item(page, 'Rename').click()
    await visible(dialog(page).getByText('Rename prototype'))
    await visible(
      dialog(page).getByText(
        'Its folder is renamed to match. Its link stays the same.',
      ),
    )
    const field = dialog(page).getByRole('textbox', { name: 'Title' })
    expect(await field.inputValue()).toBe('Demo')
    expect(
      (await dialog(page).locator('dl').innerText()).split(/\s*\n\s*/),
    ).toEqual(['Contributor', 'Ben Okafor', 'Created', 'Jan 2, 2026'])
    await field.fill('Old')
    await dialog(page).getByRole('button', { name: 'Rename' }).click()
    await visible(
      dialog(page)
        .getByRole('alert')
        .getByText(
          'You already have a prototype named “Old”. Choose a different title.',
        ),
    )
    await field.fill('Sign-up Flow')
    await dialog(page).getByRole('button', { name: 'Rename' }).click()
    await gone(dialog(page))
    await visible(heading(page, 'Sign-up Flow'))
    expect(existsSync(at('ben/sign-up-flow/meta.json'))).toBe(true)
    expect(path_(page)).toBe(address)
  })

  test('[PR-37] [PR-38] Duplicate makes a copy with fresh identities and opens it', async () => {
    reset()
    const page = await open()
    await menu(page)
    await item(page, 'Duplicate').click()
    await visible(dialog(page).getByText('Duplicate prototype'))
    expect(
      await dialog(page).getByRole('textbox', { name: 'Title' }).inputValue(),
    ).toBe('Demo copy')
    await visible(dialog(page).getByText('No system — custom styling').first())
    await visible(
      dialog(page).getByText(
        'Copies the existing artifacts, components, and styles.',
      ),
    )
    await dialog(page).getByRole('button', { name: 'Duplicate' }).click()
    await visible(heading(page, 'Demo copy'))
    const copy = json('ben/demo-copy/meta.json')
    expect(copy.studioId).not.toBe(DEMO)
    expect(copy.status).toBeUndefined()
    await expect
      .poll(() => path_(page), WAIT)
      .toMatch(new RegExp(`^/prototypes/${copy.studioId}/artifacts/`))
    expect(read('ben/demo-copy/Home.vue')).not.toContain(HOME)
    expect(read('ben/demo/Home.vue')).toContain(HOME)
  })

  test('[PR-39] [PR-40] a copy for another system asks first, keeps its system, and says how to rebuild it', async () => {
    reset()
    const page = await open()
    await menu(page)
    await item(page, 'Duplicate').click()
    await dialog(page).getByRole('combobox', { name: 'System' }).click()
    await page.getByRole('option', { name: 'Endless Studios' }).click()
    await visible(
      dialog(page).getByText(
        'Choosing a different system creates a copy for your agent to rebuild. It does not convert the existing code.',
      ),
    )
    await dialog(page).getByRole('button', { name: 'Continue' }).click()
    await visible(dialog(page).getByText('Create a copy for a system rebuild?'))
    await visible(
      dialog(page).getByText('No system — custom styling → Endless Studios'),
    )
    await dialog(page).getByRole('button', { name: 'Back' }).click()
    await visible(dialog(page).getByText('Duplicate prototype'))
    await dialog(page).getByRole('button', { name: 'Continue' }).click()
    await dialog(page)
      .getByRole('button', { name: 'Create rebuild copy' })
      .click()
    await visible(heading(page, 'Demo copy'))
    expect(json('ben/demo-copy/meta.json')).toMatchObject({
      systemId: null,
      rebuild: { targetSystemId: ENDLESS, sourcePrototypeId: DEMO },
    })
    const notice = page.getByRole('note', { name: 'Rebuild needed' })
    await visible(notice)
    await visible(
      notice.getByText(
        'Target: Endless Studios. The current system stays assigned until your agent rebuilds this copy.',
      ),
    )
    await notice
      .getByRole('button', { name: 'Copy rebuild instructions' })
      .click()
    await visible(
      toast(
        page,
        'Rebuild instructions copied. Paste them into your coding agent.',
      ),
    )
    const instructions = await clipboard(page)
    expect(instructions).toContain(
      `Rebuild the prototype at ${posix(content)}/ben/demo-copy using Endless Studios ("endless-studios").`,
    )
    expect(instructions).toContain(
      `copied from ${posix(content)}/ben/demo (prototype ID ${DEMO})`,
    )
  })

  test('[PR-41] [PR-31] archiving leaves only Restore and Delete; restoring brings it back', async () => {
    reset()
    const page = await open()
    await menu(page)
    await item(page, 'Archive').click()
    await visible(toast(page, 'Archived. The deployed site leaves it out.'))
    await visible(page.getByText('Archived', { exact: true }))
    expect(json('ben/demo/meta.json').status).toBe('archived')
    await actions(page).click()
    await visible(item(page, 'Restore'))
    expect(await menuItems(page)).toEqual(['Restore', 'Delete'])
    expect(
      await page
        .getByRole('menuitemcheckbox', { name: 'Show all files' })
        .count(),
    ).toBe(0)
    await close(page)
    await heading(page, 'Demo').dblclick()
    expect(
      await page.getByRole('textbox', { name: 'Prototype title' }).count(),
    ).toBe(0)

    await actions(page).click()
    await item(page, 'Restore').click()
    await visible(toast(page, 'Restored'))
    await gone(page.getByText('Archived', { exact: true }))
    expect(json('ben/demo/meta.json').status).toBeUndefined()
  })

  test('[PR-43] [CM-60] deleting from inside asks first, says how many comments go with it, moves it to the trash and goes back to the Prototypes page', async () => {
    reset()
    const page = await open()
    await menu(page)
    await item(page, 'Delete').click()
    await visible(dialog(page).getByText('Delete “Demo”?'))
    await visible(
      dialog(page).getByText(
        `Everything in it moves to ${TRASH}, where you can restore it. Its link stops working until you do.`,
      ),
    )
    await visible(dialog(page).getByText('That includes 2 comments.'))
    await dialog(page).getByRole('button', { name: 'Cancel' }).click()
    await gone(dialog(page))
    expect(existsSync(at('ben/demo/meta.json'))).toBe(true)

    await menu(page)
    await item(page, 'Delete').click()
    await dialog(page).getByRole('button', { name: 'Delete prototype' }).click()
    await expect.poll(() => path_(page), WAIT).toBe('/prototypes')
    await visible(toast(page, `Moved “Demo” to ${TRASH}`))
    expect(existsSync(at('ben/demo'))).toBe(false)
  })

  test('[PR-11] [PR-43] a card offers the same actions, and deleting from the gallery keeps the page and its search', async () => {
    reset()
    const page = await newPage()
    await page.goto(`${studio.url}prototypes?q=demo`)
    const card = page
      .getByRole('listitem')
      .filter({ has: page.getByText('Demo', { exact: true }) })
    await visible(card)
    const more = page.getByRole('button', { name: 'Actions for Demo' })
    await expect
      .poll(async () => {
        await card.hover()
        await more.click()
        await visible(item(page, 'Copy link'))
        const items = await menuItems(page)
        await close(page)
        return items
      }, WAIT)
      .toEqual([
        'Open in editor',
        REVEAL,
        'Copy link',
        'Copy path',
        'Rename',
        'Duplicate',
        'Archive',
        'Delete',
      ])
    await card.hover()
    await more.click()
    await item(page, 'Delete').click()
    await dialog(page).getByRole('button', { name: 'Delete prototype' }).click()
    await visible(toast(page, `Moved “Demo” to ${TRASH}`))
    await gone(card)
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(
      '/prototypes?q=demo',
    )
    expect(existsSync(at('ben/demo'))).toBe(false)
  })
})

describe('the deployed site', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let site: RunningStudio & { directory: string }
  let log = ''
  beforeAll(async () => {
    reset()
    site = await startStaticSite('/', BEN, (output) => (log = output))
  }, 600_000)
  afterAll(async () => {
    await site?.stop()
  })

  function emitted(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name)
      return entry.isDirectory() ? emitted(file) : [file]
    })
  }

  test('[PR-73] [CL-105] leaves the archived prototype and its files out entirely, and says how many', () => {
    expect(log).toContain(
      'Left out of the deployed site: 1 archived prototype.',
    )
    const files = emitted(site.directory).filter((file) =>
      /\.(js|json|html|txt|css)$/.test(file),
    )
    const texts = files.map((file) => readFileSync(file, 'utf8'))
    expect(texts.some((text) => text.includes(DEMO))).toBe(true)
    // Only the active document that links to it names it.
    expect(
      files
        .filter((file) => readFileSync(file, 'utf8').includes(OLD))
        .map((file) => path.basename(file).split('.')[0]),
    ).toEqual([NOTES])
    expect(texts.some((text) => text.includes('Old sketch heading'))).toBe(
      false,
    )
  })

  test('[PR-74] [CL-105] warns about active content linking to it', () => {
    expect(log).toContain(
      `${posix(content)}/ben/demo/Notes.md links to the archived prototype “Old”; the deployed site leaves it out and shows a placeholder there.`,
    )
  })

  test('[PR-75] a link to it finds a placeholder saying it may be archived', async () => {
    const page = await newPage()
    await page.goto(`${site.url}prototypes/${OLD}/artifacts/${SKETCH}`)
    await visible(page.getByText('Page not found'))
    await visible(
      page.getByText(
        'If it was archived, it isn’t on the deployed site. Run the studio locally to open it.',
      ),
    )
  })

  test('[PR-30] [PR-29] the deployed menu only copies the link; no archived marker or rename', async () => {
    const page = await newPage()
    await page.goto(`${site.url}prototypes/${DEMO}/artifacts/${HOME}`)
    await visible(heading(page, 'Demo'))
    await actions(page).click()
    await visible(item(page, 'Copy link'))
    expect(await menuItems(page)).toEqual(['Copy link'])
  })
})
