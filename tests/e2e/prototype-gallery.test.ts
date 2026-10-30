// The Prototypes gallery and creating prototypes. Locally the studio runs as
// Ben (a contributor) on a disposable copy of tests/fixtures/gallery inside
// the checkout: it starts empty, then the fixtures arrive on disk. Ada has
// Checkout Flow and the archived Old Ideas; Ben has Settings Panel,
// Onboarding and Empty Box (no artifacts). The deployed site is built from
// the same fixtures, and once more from nothing.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
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

const { name: studioName } = JSON.parse(
  readFileSync('studio.config.json', 'utf8'),
)
const FIXTURES = 'tests/fixtures/gallery'
const CHECKOUT = 'gc00000000000001'
const ONBOARDING = 'gc00000000000002'
const EMPTY_BOX = 'gc00000000000005'

mkdirSync('.e2e', { recursive: true })
const posix = (file: string) => file.split(path.sep).join('/')
const content = mkdtempSync(path.join('.e2e', 'gallery-'))
const nothing = mkdtempSync(path.join('.e2e', 'gallery-empty-'))
afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(nothing, { recursive: true, force: true })
})

const contributors = {
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}
const BEN = {
  ...contributors,
  STUDIO_PROTOTYPES: posix(content),
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

async function visible(
  locator: { isVisible: () => Promise<boolean> },
  timeout = 30_000,
) {
  await expect.poll(() => locator.isVisible(), { timeout }).toBe(true)
}

// Contributors' photos come from GitHub; offline, initials stand in.
async function offline(page: Page) {
  await page.route('https://github.com/**', (route) => route.abort())
  return page
}

async function openGallery(page: Page, url: string, query = '') {
  await page.goto(`${url}prototypes${query}`)
  await visible(
    page.getByRole('heading', { level: 1, name: 'Prototypes' }),
    60_000,
  )
}

const gallery = (page: Page) => page.getByRole('list', { name: 'Prototypes' })
const archived = (page: Page) => page.getByRole('region', { name: 'Archived' })
// The titles in a list, in order: each card's or row's link is named by
// its title, and described by who made it and when.
const titles = (list: ReturnType<Page['getByRole']>) =>
  list
    .getByRole('listitem')
    .getByRole('link')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('aria-label') ?? ''),
    )
const item = (page: Page, title: string) =>
  page
    .getByRole('listitem')
    .filter({ has: page.getByText(title, { exact: true }) })
const search = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search prototypes' })
const newButton = (page: Page) =>
  page.getByRole('button', { name: 'New prototype' })
const query = (page: Page) => new URL(page.url()).search

describe('the gallery on the dev server, as Ben', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[PR-09] [PR-18] [SH-22] an empty studio offers to start a prototype, then shows the ones that arrive', async () => {
    const page = await offline(await newPage())
    await page.goto(studio.url)
    const yours = page.getByRole('region', { name: 'Your prototypes' })
    await visible(yours, 60_000)
    expect(
      await yours.getByRole('button', { name: 'New prototype' }).count(),
    ).toBe(1)
    expect(
      await yours
        .getByRole('link', { name: 'Your prototypes' })
        .getAttribute('href'),
    ).toBe('/prototypes')

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Prototypes' })
      .click()
    await visible(page.getByText('No prototypes yet'))
    await visible(
      page.getByText(
        'A working sketch of an idea: real screens you can click through.',
      ),
    )
    // Nothing to search or arrange yet; creating is still there.
    expect(await search(page).count()).toBe(0)
    expect(await page.getByRole('group', { name: 'View as' }).count()).toBe(0)
    expect(await newButton(page).count()).toBe(1)

    cpSync(FIXTURES, content, { recursive: true })
    await expect
      .poll(() => titles(gallery(page)), { timeout: 30_000 })
      .toEqual(['Settings Panel', 'Onboarding', 'Checkout Flow', 'Empty Box'])
  })

  test('[SH-123] contributor links filter active and archived prototypes locally', async () => {
    const page = await newPage()
    await openGallery(page, studio.url, '?contributor=ada')
    await expect.poll(() => titles(gallery(page))).toEqual(['Checkout Flow'])
    await expect.poll(() => titles(archived(page))).toEqual(['Old Ideas'])
    await openGallery(page, studio.url, '?contributor=ben')
    await expect
      .poll(() => titles(gallery(page)))
      .toEqual(['Settings Panel', 'Onboarding', 'Empty Box'])
    expect(await archived(page).count()).toBe(0)
  })

  test('[PR-01] [PR-02] [PR-04] [SH-100] [SH-103] cards, newest first, show who made each and when', async () => {
    const page = await offline(await newPage())
    await openGallery(page, studio.url)
    expect(await page.title()).toBe(`Prototypes — ${studioName}`)
    await visible(
      page.getByText(
        'Explore ideas, build interactive prototypes, and document your thinking.',
      ),
    )
    await expect
      .poll(() => titles(gallery(page)))
      .toEqual(['Settings Panel', 'Onboarding', 'Checkout Flow', 'Empty Box'])
    const card = item(page, 'Onboarding')
    expect(await card.getByText('Ben', { exact: true }).count()).toBe(1)
    expect(await card.getByText('Oct 25, 2026').count()).toBe(1)
    // The GitHub photo failed to load: the initials stand in.
    await visible(card.getByText('BO', { exact: true }))

    // The whole card is the link. The address changes only once the
    // prototype's page has loaded, which on a cold dev server takes seconds.
    await card.click()
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe(`/prototypes/${ONBOARDING}/artifacts/gv00000000000002`)
  })

  test('[PR-03] [PR-05] [SH-99] [SH-101] list view rows, remembered across reloads and shared with other tabs', async () => {
    const page = await offline(await newPage())
    await openGallery(page, studio.url)
    const other = await page.context().newPage()
    await openGallery(other, studio.url)

    const toggle = page.getByRole('group', { name: 'View as' })
    await toggle.getByRole('button', { name: 'List' }).click()
    const row = item(page, 'Checkout Flow')
    await visible(row.getByText('Ada · Oct 20, 2026'))
    expect(
      await toggle
        .getByRole('button', { name: 'List' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
    // The other tab follows.
    await visible(item(other, 'Checkout Flow').getByText('Ada · Oct 20, 2026'))

    await page.reload()
    await visible(item(page, 'Checkout Flow').getByText('Ada · Oct 20, 2026'))
    await page.getByRole('button', { name: 'Cards' }).click()
    // Cards show the maker's picture; rows don't.
    await visible(item(page, 'Checkout Flow').getByText('AL', { exact: true }))
  })

  test('[PR-06] search by title, contributor or folder, kept in the address without adding history', async () => {
    const page = await newPage()
    await openGallery(page, studio.url)
    const before = await page.evaluate(() => history.length)
    await search(page).fill('onb')
    await expect.poll(() => titles(gallery(page))).toEqual(['Onboarding'])
    expect(query(page)).toBe('?q=onb')
    await search(page).pressSequentially('o', { delay: 50 })
    await expect.poll(() => query(page)).toBe('?q=onbo')
    expect(await page.evaluate(() => history.length)).toBe(before)

    for (const [text, found] of [
      ['ada', ['Checkout Flow']],
      ['Okafor', ['Settings Panel', 'Onboarding', 'Empty Box']],
      ['agent-settings', ['Settings Panel']],
    ] as const) {
      await search(page).fill(text)
      await expect.poll(() => titles(gallery(page))).toEqual(found)
    }
    // Archived ones are searched too.
    await search(page).fill('ada')
    await expect.poll(() => titles(archived(page))).toEqual(['Old Ideas'])

    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect.poll(() => query(page)).toBe('')
    expect(await search(page).inputValue()).toBe('')
    expect(await titles(gallery(page))).toHaveLength(4)
  })

  test('[PR-07] [PR-10] the system filter combines with search; an unknown system is still listed', async () => {
    const page = await newPage()
    await openGallery(page, studio.url, '?q=e')
    const filters = page.getByRole('button', { name: 'Filters', exact: true })
    await filters.click()
    await page.getByRole('combobox', { name: 'System' }).click()
    await page.getByRole('option', { name: 'Endless Studios' }).click()
    await expect.poll(() => query(page)).toBe('?q=e&system=endless-studios')
    await expect
      .poll(() => titles(gallery(page)))
      .toEqual(['Settings Panel', 'Checkout Flow'])
    await page.keyboard.press('Escape')
    await visible(page.getByRole('button', { name: 'Filters, 1 active' }))

    await openGallery(page, studio.url, '?system=retired-kit')
    await visible(page.getByText('No matches'))
    await visible(page.getByText('Try a different search or system.'))
    await page.getByRole('button', { name: 'Filters, 1 active' }).click()
    await expect
      .poll(() => page.getByRole('combobox', { name: 'System' }).textContent())
      .toContain('retired-kit')
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'View all prototypes' }).click()
    await expect.poll(() => query(page)).toBe('')
    await expect.poll(() => titles(gallery(page))).toHaveLength(4)
  })

  test('[PR-08] [SH-102] archived prototypes sit apart, marked, with what archiving means', async () => {
    const page = await newPage()
    await openGallery(page, studio.url)
    await expect.poll(() => titles(archived(page))).toEqual(['Old Ideas'])
    const opacity = await item(page, 'Old Ideas').evaluate(
      (element) =>
        getComputedStyle(element.firstElementChild ?? element).opacity,
    )
    expect(Number(opacity)).toBeLessThan(1)
    await page.getByRole('button', { name: 'About archived items' }).hover()
    await visible(
      page.locator('[data-slot="content"]').filter({
        hasText: 'Archived items are excluded from the deployed site.',
      }),
    )
  })

  test('[PR-11] each card has an actions menu with what you may do', async () => {
    const page = await newPage()
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await openGallery(page, studio.url)
    await item(page, 'Checkout Flow').hover()
    await page
      .getByRole('button', { name: 'Actions for Checkout Flow' })
      .click()
    // Someone else's prototype: Ben may only reach it (ticket 13's menu).
    expect(await page.getByRole('menuitem').allTextContents()).toEqual([
      'Open in editor',
      process.platform === 'win32'
        ? 'Show in Explorer'
        : process.platform === 'darwin'
          ? 'Reveal in Finder'
          : 'Show in folder',
      'Copy link',
      'Copy path',
    ])
    await page.getByRole('menuitem', { name: 'Copy link' }).click()
    await visible(page.getByText('Link copied').first())
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `${studio.url}prototypes/${CHECKOUT}`,
    )
  })

  test('[PR-18] Home: your three newest, then the newest by others, archived left out', async () => {
    const page = await newPage()
    await page.goto(studio.url)
    const yours = page.getByRole('region', { name: 'Your prototypes' })
    await expect
      .poll(() => titles(yours), { timeout: 60_000 })
      .toEqual(['Settings Panel', 'Onboarding', 'Empty Box'])
    const team = page.getByRole('region', { name: 'Latest from the team' })
    await expect.poll(() => titles(team)).toEqual(['Checkout Flow'])
    await visible(team.getByText('Ada'))
    await team.getByRole('link', { name: 'Latest from the team' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/prototypes')
  })

  test('[PR-27] an empty prototype stays at its address and says what to add', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${EMPTY_BOX}`)
    await visible(page.getByText('This prototype is empty'), 60_000)
    expect(new URL(page.url()).pathname).toBe(`/prototypes/${EMPTY_BOX}`)
    expect(await page.getByText('Page not found').count()).toBe(0)
    await visible(page.getByRole('heading', { level: 1, name: 'Empty Box' }))
    expect(await page.title()).toBe(`Empty Box — ${studioName}`)
    await visible(
      page.getByText(`In ${posix(content)}/ben/empty-box/, build`, {
        exact: false,
      }),
    )
  })

  test('[PR-12] [PR-13] [PR-14] [PR-15] [PR-16] the New prototype dialog validates, creates and opens it', async () => {
    const page = await newPage()
    await openGallery(page, studio.url)
    await newButton(page).click()
    const dialog = page.getByRole('dialog', { name: 'New prototype' })
    const title = dialog.getByRole('textbox', { name: 'Title' })
    await visible(title)
    await expect
      .poll(() =>
        title.evaluate((element) => element === document.activeElement),
      )
      .toBe(true)
    expect(await title.getAttribute('placeholder')).toBe('Agent Config')
    const system = dialog.getByRole('combobox', { name: 'System' })
    expect(await system.textContent()).toContain('Endless Studios')
    await visible(
      dialog.getByText(
        'Provides components, styles, and guidance for this prototype.',
      ),
    )

    await dialog.getByRole('button', { name: 'Create' }).click()
    await visible(dialog.getByText('Add a title.'))
    await title.fill('Onboarding')
    await dialog.getByRole('button', { name: 'Create' }).click()
    await visible(
      dialog.getByText(
        'You already have a prototype named “Onboarding”. Choose a different title.',
      ),
    )

    await system.click()
    await page
      .getByRole('option', { name: 'No system — custom styling' })
      .click()
    await visible(
      dialog.getByText(
        'Start with your own components and CSS. No existing system library or theme is assigned.',
      ),
    )
    await title.fill('Agent Config')
    await dialog.getByRole('button', { name: 'Create' }).click()

    const folder = path.join(content, 'ben/agent-config')
    await expect
      .poll(() => existsSync(path.join(folder, 'meta.json')))
      .toBe(true)
    const meta = JSON.parse(
      readFileSync(path.join(folder, 'meta.json'), 'utf8'),
    )
    expect(meta).toMatchObject({
      title: 'Agent Config',
      ownerContributorId: 'ben0000000000002',
      systemId: null,
    })
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toMatch(
        new RegExp(`^/prototypes/${meta.studioId}/artifacts/[0-9a-z]{16}$`),
      )
    await visible(page.getByText('This view is empty'), 60_000)
    expect(await page.getByRole('dialog').count()).toBe(0)
  })
})

describe('the gallery on the deployed site', () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    site = await startStaticSite('/gallery/', {
      ...contributors,
      STUDIO_PROTOTYPES: FIXTURES,
    })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[SH-123] [PR-73] deployed contributor filters exclude archived prototypes', async () => {
    const page = await newPage()
    await openGallery(page, site.url, '?contributor=ada')
    await expect.poll(() => titles(gallery(page))).toEqual(['Checkout Flow'])
    expect(await archived(page).count()).toBe(0)
    expect(
      await page.getByRole('link', { name: 'Old Ideas', exact: true }).count(),
    ).toBe(0)
  })

  test('[PR-08] [PR-12] [PR-11] lists active prototypes only, with nothing to create and only Copy link', async () => {
    const page = await offline(await newPage())
    await openGallery(page, site.url)
    await expect
      .poll(() => titles(gallery(page)))
      .toEqual(['Settings Panel', 'Onboarding', 'Checkout Flow', 'Empty Box'])
    expect(await archived(page).count()).toBe(0)
    expect(await newButton(page).count()).toBe(0)
    await item(page, 'Onboarding').hover()
    await page.getByRole('button', { name: 'Actions for Onboarding' }).click()
    expect(await page.getByRole('menuitem').allTextContents()).toEqual([
      'Copy link',
    ])
  })

  test('[PR-18] Home shows the five newest as Latest prototypes', async () => {
    const page = await newPage()
    await page.goto(site.url)
    const latest = page.getByRole('region', { name: 'Latest prototypes' })
    await expect
      .poll(() => titles(latest), { timeout: 60_000 })
      .toEqual(['Settings Panel', 'Onboarding', 'Checkout Flow', 'Empty Box'])
    expect(
      await page.getByRole('region', { name: 'Your prototypes' }).count(),
    ).toBe(0)
  })

  test('[PR-27] an empty prototype shows its empty state', async () => {
    const page = await newPage()
    await page.goto(`${site.url}prototypes/${EMPTY_BOX}`)
    await visible(page.getByText('This prototype is empty'), 60_000)
    expect(await page.getByText('Page not found').count()).toBe(0)
  })
})

describe('an empty deployed site', () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    site = await startStaticSite('/gallery-empty/', {
      ...contributors,
      STUDIO_PROTOTYPES: posix(nothing),
    })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[PR-09] [PR-18] says prototypes will show up, and that nothing is published yet', async () => {
    const page = await newPage()
    await openGallery(page, site.url)
    await visible(page.getByText('No prototypes yet'))
    await visible(
      page.getByText('Prototypes your team makes will show up here.'),
    )
    await page.goto(site.url)
    const block = page.getByRole('region', { name: 'Prototypes' })
    await visible(block.getByText('Nothing published yet.'), 60_000)
  })
})
