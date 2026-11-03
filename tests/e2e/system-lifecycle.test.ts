// An Admin creates a system, renames it, makes it the default, archives,
// restores and deletes another, from the Systems area's New system dialog
// and the systems' "…" menus. Each change restarts the dev server behind a
// status screen and confirms itself on the page after the reload. Deleting
// a system leaves its prototype waiting for a rebuild. The studio runs as
// Ada on a disposable copy of the systems-area fixture's systems, with one
// prototype of Ada's on Lantern. A scenario that builds on an earlier one's
// change finds it on disk, and makes it itself, through the studio's own
// lifecycle, when the earlier one didn't.
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
import { get } from 'node:http'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import {
  applyPlan,
  planCreate,
  planLifecycle,
  type LifecycleOptions,
} from '../../tooling/systems/lifecycle'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'lifecycle-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area/systems', path.join(content, 'systems'), {
  recursive: true,
})

// Harbor has references left to review after a rename; Lantern has a
// setup record, so it offers no setup.
const declare = (key: string, change: (source: string) => string) => {
  const file = path.join(content, 'systems', key, 'system.ts')
  writeFileSync(file, change(readFileSync(file, 'utf8')))
}
declare('harbor', (source) =>
  source.replace(
    "status: 'active',",
    "status: 'active',\n  renameReview: ['prototypes/ada/beacon/Notes.md'],",
  ),
)
declare('lantern', (source) =>
  source.replace(
    "status: 'active',",
    "status: 'active',\n  setup: { stage: 'theme', summary: 'Started from Nuxt UI.' },",
  ),
)
const launchLog = path.resolve(content, '..', `${path.basename(content)}.log`)
writeFileSync(launchLog, '')

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
  STUDIO_LAUNCH_LOG: launchLog,
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
}
const RESTART = { timeout: 280_000 }

const config = () => JSON.parse(readFileSync(configFile, 'utf8'))
const meta = () =>
  JSON.parse(readFileSync(path.join(beacon, 'meta.json'), 'utf8'))
const systemsAt = (...parts: string[]) =>
  path.join(content, 'systems', ...parts)
/** A string field of a system's declaration. */
const declared = (key: string, field: string) =>
  new RegExp(`${field}: '([^']*)'`).exec(
    readFileSync(systemsAt(key, 'system.ts'), 'utf8'),
  )?.[1]
const lifecycle: LifecycleOptions = {
  root: process.cwd(),
  systemsFolder: ENV.STUDIO_SYSTEMS,
  configFile: ENV.STUDIO_CONFIG,
  prototypesFolder: ENV.STUDIO_PROTOTYPES,
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(launchLog, { force: true })
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
    // Read on a loaded page: mid-reload the screen isn't drawn yet.
    try {
      await expect
        .poll(async () => {
          // A reload that met neither server shows the browser's error
          // page, where nothing of the studio runs; a person reloads it.
          if (page.url().startsWith('chrome-error:'))
            await page.reload().catch(() => undefined)
          return page
            .evaluate(
              () =>
                document.readyState === 'complete' &&
                !document.getElementById('studio-system-transition') &&
                !sessionStorage.getItem('design-studio:system-transition'),
            )
            .catch(() => false)
        }, RESTART)
        .toBe(true)
    } catch (error) {
      // What the page shows, and what the dev server did meanwhile.
      const seen = await page
        .evaluate(async () => ({
          address: location.href,
          state: document.readyState,
          pending: sessionStorage.getItem('design-studio:system-transition'),
          // DIAGNOSTIC
          app: document.documentElement.dataset.studioApp ?? null,
          reloading: document.documentElement.dataset.studioReloading ?? null,
          answers: await fetch('/_studio/settings', { cache: 'no-store' })
            .then((r) => r.json())
            .then((j) => j.instance)
            .catch(() => 'none'),
          headings: [...document.querySelectorAll('h1,h2,h3')]
            .map((h) => h.textContent)
            .slice(0, 12),
          servedBy:
            document
              .querySelector('meta[name="studio-instance"]')
              ?.getAttribute('content') ?? null,
        }))
        .catch((failure: Error) => failure.message)
      throw new Error(
        `The change did not settle: ${JSON.stringify(seen)}\nThe dev server printed:\n${studio.log().slice(-8000)}`,
        { cause: error },
      )
    }
    // The page shows the studio that runs now, which alone answers.
    await onlyServer(() =>
      page
        .evaluate(
          () =>
            document
              .querySelector('meta[name="studio-instance"]')
              ?.getAttribute('content') ?? '',
        )
        .catch(() => ''),
    )
  }

  /** The dev server that answers, as `_studio/settings` names it. */
  const instance = () =>
    new Promise<string>((resolve) => {
      // A connection of its own each time, so it can reach either server.
      get(`${studio.url}_studio/settings`, { agent: false }, (response) => {
        let body = ''
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () => {
          try {
            resolve(JSON.parse(body).instance ?? '')
          } catch {
            resolve('')
          }
        })
      }).on('error', () => resolve(''))
    })
  /**
   * Waits until only the dev server `expected()` names answers. On Linux the
   * outgoing one answers beside the new one for a moment after a restart,
   * so the next page could still come from it.
   */
  async function onlyServer(expected: () => Promise<string>) {
    let streak = 0
    let id = ''
    let answered = ''
    await expect
      .poll(
        async () => {
          id = await expected()
          answered = await instance()
          streak = id && answered === id ? streak + 1 : 0
          return streak >= 10
        },
        { ...RESTART, interval: 100 },
      )
      .toBe(true)
      .catch((error: Error) => {
        throw new Error(
          `Waiting for only the dev server ${JSON.stringify(id)}, the last answer named ${JSON.stringify(answered)}.\nThe dev server printed:\n${studio.log().slice(-8000)}`,
          { cause: error },
        )
      })
  }
  /** Makes a change behind the studio's back and waits out its restart. */
  async function arrange(change: () => Promise<unknown>) {
    const before = await instance()
    await change()
    let next = ''
    await expect
      .poll(async () => {
        next = await instance()
        return Boolean(next) && next !== before
      }, RESTART)
      .toBe(true)
    await onlyServer(async () => next)
  }
  /** The ID of the system in `key`, called `label`, made now if no earlier scenario did. */
  async function systemIn(key: string, label: string) {
    if (!config().systems.includes(key))
      await arrange(() =>
        applyPlan(lifecycle, planCreate(lifecycle, { key, label })),
      )
    return declared(key, 'studioId')!
  }
  /** Lantern active, or archived with Beacon, whatever the scenario before left. */
  async function lantern(status: 'active' | 'archived') {
    if ((declared('lantern', 'status') ?? 'active') === status) return
    await arrange(() =>
      applyPlan(
        lifecycle,
        planLifecycle(
          lifecycle,
          status === 'archived' ? 'archive' : 'restore',
          'lantern',
          { restorePrototypes: true },
        ),
      ),
    )
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

  test('[SY-24] a page whose application fails to load during the restart loads again by itself', async () => {
    const page = await newPage()
    // A change the server running now has already applied, on a page that
    // got its document but not its modules, as between two servers.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1')
        sessionStorage.setItem(
          'design-studio:system-transition',
          JSON.stringify({
            operation: 'default',
            name: 'Harbor',
            started: Date.now(),
            from: 'an-earlier-server',
          }),
        )
      }
    })
    let loads = 0
    await page.route(`${studio.url}**`, (route) => {
      const request = route.request()
      if (request.resourceType() === 'document') loads++
      if (loads === 1 && request.resourceType() === 'script')
        return route.abort('connectionrefused')
      return route.continue()
    })
    await page.goto(`${studio.url}systems`)
    await settled(page)
    expect(loads).toBeGreaterThanOrEqual(2)
    await visible(page.getByRole('heading', { name: 'Systems', exact: true }))
  })

  test('[SY-43] Open in editor and Show in Explorer open the system’s folder', async () => {
    const page = await open('systems')
    await menuOf(page, 'Harbor')
    await choose(page, 'Open in editor')
    // As if no code editor were installed: the folder is shown instead.
    await visible(toast(page, 'No supported code editor is installed'))
    const launched = () =>
      readFileSync(launchLog, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as { args: string[] })
    await expect
      .poll(() => launched().at(-1)?.args.at(-1), { timeout: 30_000 })
      .toBe(path.resolve(systemsAt('harbor')))
    await menuOf(page, 'Harbor')
    await page.getByRole('menuitem', { name: /^(Show in|Reveal in)/ }).click()
    await expect.poll(() => launched().length, { timeout: 30_000 }).toBe(2)
  })

  test('[SY-47] [SY-71] [SY-76] [SY-78] a populated system offers setup behind a disclosure, and lists references left to review', async () => {
    const page = await open(`systems/${HARBOR}`)
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    const notice = page.getByRole('note', {
      name: 'Some references need review',
    })
    await visible(notice)
    await visible(notice.getByText('prototypes/ada/beacon/Notes.md'))
    await button(notice, 'Copy cleanup instructions').click()
    await visible(toast(page, 'Cleanup instructions copied'))
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('remove renameReview')

    expect(
      await page.getByRole('heading', { name: 'Instructions' }).count(),
    ).toBe(1)
    await button(page, 'Curate or bring in a system').click()
    const build = page.getByRole('textbox', {
      name: /^What do you want to build/,
    })
    await visible(build)
    await build.fill('A berth planner')
    await page.getByRole('tab', { name: 'Start from Nuxt UI' }).click()
    await expect.poll(() => build.inputValue()).toBe('')
    await page.getByRole('tab', { name: 'Bring in a Vue app' }).click()
    await expect.poll(() => build.inputValue()).toBe('A berth planner')
    await expect
      .poll(() => page.locator('[data-setup-prompt]').textContent())
      .toContain('A berth planner')
    await button(page, 'Copy prompt').click()
    await visible(button(page, 'Prompt copied'))
    await visible(
      page.getByText('Paste into your agent’s chat and send to continue.'),
    )
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('Bring my existing Vue app into “Harbor” (system “harbor”)')
  })

  test('[SY-79] a system with a setup record offers no setup', async () => {
    const page = await open(`systems/${LANTERN}`)
    await visible(page.getByRole('heading', { name: 'Instructions' }))
    expect(await button(page, 'Curate or bring in a system').count()).toBe(0)
    expect(
      await page
        .getByText('This system is empty. Choose how you want to build it.')
        .count(),
    ).toBe(0)
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

  test('[SY-20] [SY-41] an Admin’s command palette has New system and the actions on the system you are in', async () => {
    const page = await open(`systems/${LANTERN}`)
    await visible(button(page, 'Actions for Lantern'))
    const palette = async () => {
      await page.keyboard.press('Control+k')
      const input = page.getByPlaceholder('Search the studio')
      await visible(input)
      return input
    }
    const input = await palette()
    await input.fill('Lantern')
    for (const name of [
      'Rename Lantern',
      'Make Lantern the default system',
      'Archive Lantern',
      'Delete Lantern',
    ])
      await visible(page.getByRole('option', { name, exact: true }))
    await input.fill('New system')
    await page.getByRole('option', { name: 'New system', exact: true }).click()
    await visible(dialog(page).getByText('New system').first())
    await expect.poll(() => new URL(page.url()).search).toBe('')
    await button(dialog(page), 'Cancel').click()
    await expect.poll(() => dialog(page).count()).toBe(0)
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
    const created = Object.keys(config().systemMaintainers).find(
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
    const created = await systemIn('cove', 'Cove')
    const page = await open(`systems/${created}`)
    await menuOf(page, 'Cove')
    await choose(page, 'Rename')
    await visible(dialog(page).getByText('Enter the new name.'))
    const name = dialog(page).getByRole('textbox', { name: 'Name' })
    await expect.poll(() => name.inputValue()).toBe('Cove')
    await name.fill('Cove Works')
    // The restart as Linux can meet it: Nuxt starts the new server on the
    // same port while the old one still answers, so a page from the new one
    // may run modules from the outgoing one. Here, once the new server is
    // up, Nuxt's configuration modules name the outgoing server until the
    // page has loaded once after seeing the new one answer. The studio must
    // load again until its application comes from the new one.
    const before = await instance()
    const outgoing = { seen: false, done: false, replaying: false, next: '' }
    const trace: string[] = [] // DIAGNOSTIC
    await page.context().grantPermissions(['local-network-access'])
    await page.route(`${studio.url}**`, async (route) => {
      const request = route.request()
      if (request.url().endsWith('/_studio/settings')) {
        if (request.method() !== 'GET') return route.continue()
        const response = await route.fetch().catch(() => undefined)
        if (!response) return route.abort('connectionrefused')
        const answered = await response.json().catch(() => ({}))
        trace.push(`${Date.now()} settings ${answered.instance}`)
        if (
          outgoing.replaying &&
          ![before, undefined].includes(answered.instance)
        )
          outgoing.seen = true
        return route.fulfill({ response })
      }
      if (request.resourceType() === 'document') {
        outgoing.next = await instance()
        trace.push(
          `${Date.now()} doc next=${outgoing.next} seen=${outgoing.seen}`,
        )
        if (outgoing.seen) outgoing.done = true
        outgoing.replaying =
          !outgoing.done && ![before, ''].includes(outgoing.next)
      }
      if (
        !outgoing.replaying ||
        !request.url().includes('/_nuxt/@id/virtual:nuxt:')
      )
        return route.continue()
      const response = await route.fetch().catch(() => undefined)
      if (!response) return route.abort('connectionrefused')
      // Not kept: with the real module's ETag, the next load would get a 304
      // and run this copy again.
      const { etag: _etag, ...headers } = response.headers()
      await route.fulfill({
        response,
        headers: { ...headers, 'cache-control': 'no-store' },
        body: (await response.text()).replaceAll(outgoing.next, before),
      })
    })
    await button(dialog(page), 'Save').click()
    await settled(page).finally(() =>
      console.log(`DIAGNOSTIC before=${before}\n${trace.join('\n')}`),
    )
    // The studio settled on the new server's application. Settling on the
    // outgoing one's would show the confirmation on a page that loads again,
    // and lose it.
    expect(
      await page.evaluate(() => document.documentElement.dataset.studioApp),
    ).toBe(await instance())
    await page.unrouteAll({ behavior: 'ignoreErrors' })
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
    const created = await systemIn('cove-works', 'Cove Works')
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
    await button(dialog(page), 'Close').last().click()
  })

  test('[SY-41] [SY-49] [SY-51] [SY-52] [SY-53] archiving takes the system’s prototypes along and returns to the collection', async () => {
    await lantern('active')
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
    await lantern('archived')
    const defaultSystem = config().defaultSystem
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
    // Restoring never changes the default.
    expect(config().defaultSystem).toBe(defaultSystem)
  })

  test.runIf(process.platform === 'win32')(
    '[SY-56] [CL-09] a folder another program holds is reported in the dialog before anything moves',
    async () => {
      await lantern('active')
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
    await lantern('active')
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
