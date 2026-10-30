// An Admin creates a system, renames it, makes it the default, archives,
// restores and deletes another, from the Systems area's New system dialog
// and the systems' "…" menus. Each change restarts the dev server behind a
// status screen and confirms itself on the page after the reload. Deleting
// a system leaves its prototype waiting for a rebuild. The studio runs as
// Ada on a disposable copy of the systems-area fixture's systems, with one
// prototype of Ada's on Lantern.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  watch,
  writeFileSync,
  type FSWatcher,
} from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'lifecycle-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area/systems', path.join(content, 'systems'), {
  recursive: true,
})

const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'
const BEACON = 'bcn0000000000001'
const HOME = 'vw0000000000000b'
const ADA_ID = 'ada0000000000001'

const configFile = path.join(content, 'studio.config.json')
writeFileSync(
  configFile,
  JSON.stringify(
    {
      formatVersion: 1,
      name: 'Lifecycle Studio',
      tagline: 'Fixture',
      modules: { prototypes: true, systems: true, contributors: true },
      systems: ['attic', 'harbor', 'lantern'],
      defaultSystem: HARBOR,
      admins: [ADA_ID],
      systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
    },
    null,
    2,
  ),
)
const beacon = path.join(content, 'prototypes/ada/beacon')
mkdirSync(beacon, { recursive: true })
writeFileSync(
  path.join(beacon, 'meta.json'),
  JSON.stringify({
    formatVersion: 1,
    title: 'Beacon',
    created: '2026-10-20',
    studioId: BEACON,
    ownerContributorId: ADA_ID,
    systemId: LANTERN,
  }),
)
writeFileSync(
  path.join(beacon, 'Home.vue'),
  `<!-- @studio-id ${HOME} -->\n<template><h1>Beacon home</h1></template>\n`,
)

const ENV = {
  STUDIO_CONFIG: posix(configFile),
  STUDIO_SYSTEMS: posix(path.join(content, 'systems')),
  STUDIO_PROTOTYPES: posix(path.join(content, 'prototypes')),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
}
const RESTART = { timeout: 240_000 }

const config = () => JSON.parse(readFileSync(configFile, 'utf8'))
const meta = () =>
  JSON.parse(readFileSync(path.join(beacon, 'meta.json'), 'utf8'))
const systemsAt = (...parts: string[]) =>
  path.join(content, 'systems', ...parts)

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 60_000 }).toBe(true)
}
const button = (scope: Page | ReturnType<Page['locator']>, name: string) =>
  scope.getByRole('button', { name, exact: true })
const dialog = (page: Page) => page.getByRole('dialog')
const toast = (page: Page, text: string) => page.getByText(text).first()
const cover = (page: Page) => page.locator('#studio-system-transition')

describe('managing systems locally', { timeout: 300_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  let created = ''
  beforeAll(async () => {
    studio = await startDevServer(ENV)
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address: string) {
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    return page
  }
  /** Opens a system's "…" menu on its card in the collection. */
  async function menuOf(page: Page, name: string) {
    const trigger = page.getByRole('button', {
      name: `Actions for ${name}`,
      exact: true,
    })
    // Who you are arrives after the page; the menu grows when it does.
    await visible(trigger.first())
    await expect
      .poll(
        async () => {
          await trigger.first().click()
          const items = await page.getByRole('menuitem').allTextContents()
          if (items.length < 4) await page.keyboard.press('Escape')
          return items.length >= 4
        },
        { timeout: 60_000 },
      )
      .toBe(true)
  }
  async function choose(page: Page, item: string) {
    await page.getByRole('menuitem', { name: item, exact: true }).click()
  }
  /** Waits out the change's restart: the status screen comes and goes. */
  async function settled(page: Page) {
    await expect.poll(() => cover(page).count(), RESTART).toBe(0)
  }

  async function pending(page: Page, started: number) {
    await page.addInitScript((started) => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1')
        sessionStorage.setItem(
          'design-studio:system-transition',
          JSON.stringify({ operation: 'create', name: 'Slowpoke', started }),
        )
      }
    }, started)
    await page.goto(`${studio.url}systems`)
  }

  test('[SY-25] after 30 seconds it offers a reload, without repeating the request', async () => {
    const page = await newPage()
    await pending(page, Date.now() - 31_000)
    await visible(page.getByRole('heading', { name: 'Creating Slowpoke' }))
    await visible(
      page.getByText(
        'This is taking longer than expected. Reload to check the studio. Your request will not be repeated.',
      ),
    )
    await visible(button(page, 'Reload studio'))
  })

  test('[SY-25] a screen older than 2 minutes is discarded', async () => {
    const page = await newPage()
    await pending(page, Date.now() - 121_000)
    await visible(page.getByRole('heading', { name: 'Systems', exact: true }))
    expect(await cover(page).count()).toBe(0)
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem('design-studio:system-transition'),
      ),
    ).toBeNull()
  })

  test('[SY-26] the spinner stops when motion is reduced', async () => {
    const page = await newPage()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await pending(page, Date.now())
    await visible(page.getByRole('heading', { name: 'Creating Slowpoke' }))
    expect(
      await page
        .locator('[data-transition-spinner]')
        .evaluate((spinner) => getComputedStyle(spinner).animationName),
    ).toBe('none')
  })

  test('[SY-20] [SY-21] [SY-22] New system opens its dialog; a name in use is refused there', async () => {
    const page = await open('systems')
    const create = button(page, 'New system')
    await visible(create)
    await create.click()
    await visible(dialog(page))
    await visible(
      dialog(page).getByText(
        'Create a place for your components, theme, assets, and guidance. Then set it up with your agent.',
      ),
    )
    const name = dialog(page).getByRole('textbox', { name: 'Name' })
    await expect
      .poll(() => name.getAttribute('placeholder'))
      .toBe('Your product')
    await expect.poll(() => name.getAttribute('maxlength')).toBe('120')
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName))
      .toBe('INPUT')
    await name.fill('Harbor')
    await button(dialog(page), 'Create').click()
    await visible(
      dialog(page).getByRole('alert').filter({
        hasText: 'There’s already a system called “harbor”.',
      }),
    )
    await settled(page)
    expect(config().systems).toEqual(['attic', 'harbor', 'lantern'])
  })

  test('[SY-24] [SY-27] [SY-28] [SY-70] [SY-73] [SY-78] creating a system covers the studio through the restart and opens its empty Overview with the setup panel', async () => {
    const page = await open('systems')
    await visible(button(page, 'New system'))
    const before = await page.evaluate(() => history.length)
    await button(page, 'New system').click()
    await dialog(page).getByRole('textbox', { name: 'Name' }).fill('Cove')
    await button(dialog(page), 'Create').click()
    await visible(page.getByRole('heading', { name: 'Creating Cove' }))
    const status = cover(page)
    expect(await status.getAttribute('role')).toBe('status')
    expect(await status.getAttribute('aria-live')).toBe('polite')
    expect(
      await page.evaluate(
        () => document.getElementById('__nuxt')?.closest('[inert]') !== null,
      ),
    ).toBe(true)
    await settled(page)
    created = Object.keys(config().systemMaintainers).find(
      (id) => id !== HARBOR,
    )!
    expect(config().systems).toEqual(['attic', 'harbor', 'lantern', 'cove'])
    expect(existsSync(systemsAt('cove/system.ts'))).toBe(true)
    // The address was replaced: no extra history entry.
    expect(new URL(page.url()).pathname).toBe(`/systems/${created}`)
    expect(await page.evaluate(() => history.length)).toBe(before)
    await visible(page.getByRole('heading', { name: 'Cove', exact: true }))
    await visible(
      page.getByText('This system is empty. Choose how you want to build it.'),
    )
    for (const heading of [
      '1. Choose your system foundation',
      '2. Add your setup details',
      '3. Copy and send your prompt',
    ])
      await visible(page.getByRole('heading', { name: heading }))
    await visible(page.getByRole('tab', { name: 'Bring in a Vue app' }))
    await visible(page.getByRole('tab', { name: 'Start from Nuxt UI' }))
    await expect
      .poll(() => page.locator('[data-setup-prompt]').textContent())
      .toContain('(system “cove”)')
    expect(await page.getByText(/shadcn/i).count()).toBe(0)
    // The new system's blocks wait until it has content.
    expect(
      await page.getByRole('heading', { name: 'Instructions' }).count(),
    ).toBe(0)
  })

  test('[SY-45] [SY-46] [SY-59] renaming keeps the address and confirms after the reload', async () => {
    const page = await open(`systems/${created}`)
    await menuOf(page, 'Cove')
    await choose(page, 'Rename')
    await visible(dialog(page).getByText('Enter the new name.'))
    const name = dialog(page).getByRole('textbox', { name: 'Name' })
    await expect.poll(() => name.inputValue()).toBe('Cove')
    await name.fill('Cove Works')
    await button(dialog(page), 'Save').click()
    await settled(page)
    await visible(toast(page, 'System renamed. References updated.'))
    expect(new URL(page.url()).pathname).toBe(`/systems/${created}`)
    expect(existsSync(systemsAt('cove'))).toBe(false)
    expect(readFileSync(systemsAt('cove-works/system.ts'), 'utf8')).toContain(
      `studioId: '${created}'`,
    )
    expect(config().systems).toContain('cove-works')
    // Delivered once.
    await page.reload()
    await visible(
      page.getByRole('heading', { name: 'Cove Works', exact: true }),
    )
    expect(
      await page.getByText('System renamed. References updated.').count(),
    ).toBe(0)
  })

  test('[SY-48] [SY-50] Set as default keeps the page and confirms; the default can’t be archived', async () => {
    const page = await open(`systems/${created}`)
    await menuOf(page, 'Cove Works')
    await choose(page, 'Set as default')
    await settled(page)
    await visible(toast(page, 'Cove Works is now the default system.'))
    expect(new URL(page.url()).pathname).toBe(`/systems/${created}`)
    expect(config().defaultSystem).toBe(created)
    await menuOf(page, 'Cove Works')
    const item = page.getByRole('menuitem', { name: 'Default system' })
    await visible(item)
    expect(await item.getAttribute('data-disabled')).not.toBeNull()
    await choose(page, 'Archive')
    await visible(
      dialog(page).getByText('Cove Works is the default system', {
        exact: true,
      }),
    )
    await visible(
      dialog(page).getByText(
        'Set another system as the default before archiving Cove Works.',
      ),
    )
    expect(await button(dialog(page), 'Archive system').count()).toBe(0)
    await button(dialog(page), 'Close').click()
  })

  test('[SY-41] [SY-49] [SY-51] [SY-52] [SY-53] archiving takes the system’s prototypes along and returns to the collection', async () => {
    const page = await open('systems')
    await menuOf(page, 'Lantern')
    const groups = page.getByRole('menu').getByRole('group')
    await expect.poll(() => groups.count()).toBe(3)
    expect(await groups.nth(0).getByRole('menuitem').allTextContents()).toEqual(
      [
        'Open in editor',
        expect.stringMatching(/^(Show in|Reveal in)/),
        'Copy link',
        'Copy path',
      ],
    )
    expect(await groups.nth(1).getByRole('menuitem').allTextContents()).toEqual(
      ['Rename', 'Set as default', 'Archive'],
    )
    expect(await groups.nth(2).getByRole('menuitem').allTextContents()).toEqual(
      ['Delete'],
    )
    await choose(page, 'Archive')
    await visible(dialog(page).getByText('Archive Lantern?', { exact: true }))
    await visible(dialog(page).getByText('Also archives 1 prototype'))
    await visible(dialog(page).getByRole('link', { name: 'Beacon' }))
    const confirm = button(dialog(page), 'Archive system')
    await expect.poll(() => confirm.isEnabled(), { timeout: 30_000 }).toBe(true)
    await confirm.click()
    await settled(page)
    await visible(toast(page, 'System and associated prototypes archived.'))
    expect(new URL(page.url()).pathname).toBe('/systems')
    expect(meta()).toMatchObject({
      status: 'archived',
      archivedBySystemId: LANTERN,
    })
    await page.goto(`${studio.url}systems/${LANTERN}`)
    await visible(page.getByText('This system is archived'))
    await visible(
      page.getByText(
        'Files are kept locally and excluded from deployment. Choose Restore from the system menu to use it again.',
      ),
    )
    const trigger = page.getByRole('button', { name: 'Actions for Lantern' })
    await trigger.first().click()
    await expect
      .poll(() => page.getByRole('menuitem').allTextContents(), {
        timeout: 30_000,
      })
      .toEqual(['Restore', 'Delete'])
  })

  test('[SY-54] restoring offers the system alone or with its prototypes', async () => {
    const page = await open(`systems/${LANTERN}`)
    const trigger = page.getByRole('button', { name: 'Actions for Lantern' })
    await visible(trigger.first())
    await expect
      .poll(
        async () => {
          await trigger.first().click()
          const found = await page
            .getByRole('menuitem', { name: 'Restore' })
            .count()
          if (!found) await page.keyboard.press('Escape')
          return found
        },
        { timeout: 60_000 },
      )
      .toBe(1)
    await choose(page, 'Restore')
    await visible(dialog(page).getByText('Restore Lantern?', { exact: true }))
    await visible(button(dialog(page), 'Restore system only'))
    const both = button(dialog(page), 'Restore system and prototypes')
    await expect.poll(() => both.isEnabled(), { timeout: 30_000 }).toBe(true)
    await both.click()
    await settled(page)
    await visible(toast(page, 'System restored.'))
    expect(meta().status).toBeUndefined()
    expect(config().defaultSystem).toBe(created)
  })

  test.runIf(process.platform === 'win32')(
    '[SY-56] [CL-09] a folder another program holds is reported in the dialog before anything moves',
    async () => {
      mkdirSync(systemsAt('lantern/held'), { recursive: true })
      let holder: FSWatcher | undefined
      try {
        holder = watch(systemsAt('lantern/held'))
        const page = await open('systems')
        await menuOf(page, 'Lantern')
        await choose(page, 'Delete')
        await visible(
          dialog(page)
            .getByRole('alert')
            .filter({ hasText: 'is in use by another program' }),
        )
        expect(await button(dialog(page), 'Delete system').isEnabled()).toBe(
          false,
        )
        expect(existsSync(systemsAt('lantern/system.ts'))).toBe(true)
      } finally {
        holder?.close()
        rmSync(systemsAt('lantern/held'), { recursive: true, force: true })
      }
    },
  )

  test('[SY-55] [SY-57] [SY-58] [PR-92] deleting lists what depends on it, lands on the collection, and its prototype waits for a rebuild', async () => {
    const page = await open('systems')
    await menuOf(page, 'Lantern')
    await choose(page, 'Delete')
    await visible(dialog(page).getByText('Delete Lantern?', { exact: true }))
    await visible(
      dialog(page).getByText(
        'This permanently deletes the system’s files. Studio cannot undo this.',
      ),
    )
    await visible(
      dialog(page).getByText(
        'Associated prototypes keep their files, but won’t work or deploy until rebuilt with another system.',
      ),
    )
    await visible(dialog(page).getByRole('link', { name: 'Beacon' }))
    const confirm = button(dialog(page), 'Delete system')
    await expect.poll(() => confirm.isEnabled(), { timeout: 30_000 }).toBe(true)
    await confirm.click()
    await visible(page.getByRole('heading', { name: 'Deleting Lantern' }))
    await settled(page)
    await visible(
      toast(page, 'System deleted. Associated prototypes need a rebuild.'),
    )
    expect(new URL(page.url()).pathname).toBe('/systems')
    expect(existsSync(systemsAt('lantern'))).toBe(false)
    expect(config().systems).not.toContain('lantern')
    expect(meta().systemMissing).toEqual({
      systemId: LANTERN,
      label: 'Lantern',
    })
    expect(await page.getByRole('link', { name: /Lantern/ }).count()).toBe(0)

    await page.goto(`${studio.url}prototypes/${BEACON}/artifacts/${HOME}`)
    await visible(page.getByText('Rebuild needed', { exact: true }).first())
    await visible(
      page.getByText(
        'The Lantern system was deleted. Your prototype’s files are preserved. Copy the rebuild instructions from the sidebar to get started with another system.',
      ),
    )
    const notice = page.getByRole('note', { name: 'System deleted' })
    await visible(notice)
    await visible(button(notice, 'Copy rebuild instructions'))
    expect(await page.locator('iframe[data-preview-frame]').count()).toBe(0)
  })
})
