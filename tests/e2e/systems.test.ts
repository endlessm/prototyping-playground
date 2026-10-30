// The Systems area: a designer opens Systems, finds a system as a card or a
// row (archived ones apart), and moves through its navigation: Overview,
// Libraries, Context and Skills, with the Theme, Assets and Components
// branches listing what the system has. A system's maintainer edits its
// Context and Skills in source mode; others read. The deployed site shows
// active systems only, read-only. The studio runs as Ben, who maintains
// Harbor, on a disposable copy of `tests/fixtures/systems-area` inside the
// checkout.
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
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
const content = mkdtempSync(path.join('.e2e', 'systems-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'
const ATTIC = 'attc000000000003'
const STUDIO = 'Systems Studio'

writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: STUDIO,
    tagline: 'Fixture',
    modules: { prototypes: true, systems: true, contributors: true },
    systems: ['attic', 'harbor', 'lantern'],
    defaultSystem: HARBOR,
    admins: ['ada0000000000001'],
    systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
  }),
)

const at = (file: string) => path.join(content, 'systems', file)
const read = (file: string) => readFileSync(at(file), 'utf8')
const VOICE = read('harbor/context/voice.md')
const reset = () => writeFileSync(at('harbor/context/voice.md'), VOICE)
const THEME = read('harbor/styles/theme.css')
const resetTheme = () => writeFileSync(at('harbor/styles/theme.css'), THEME)
// A real font for the font preview, from Endless Studios' Fontsource package.
cpSync(
  'node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2',
  at('harbor/assets/fonts/Harbor.woff2'),
)

const ENV = {
  STUDIO_CONFIG: posix(path.join(content, 'studio.config.json')),
  STUDIO_SYSTEMS: posix(path.join(content, 'systems')),
  STUDIO_PROTOTYPES: posix(path.join(content, 'prototypes')),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}
const BEN = {
  ...ENV,
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function hidden(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 30_000 }).toBe(false)
}
const heading = (page: Page, name: string) =>
  page.getByRole('heading', { name, exact: true })
const link = (scope: Page | ReturnType<Page['locator']>, name: string) =>
  scope.getByRole('link', { name, exact: true })
const button = (scope: Page | ReturnType<Page['locator']>, name: string) =>
  scope.getByRole('button', { name, exact: true })
const nav = (page: Page, name: string) =>
  page.getByRole('complementary', { name })
const region = (page: Page, name: string) =>
  page.getByRole('region', { name, exact: true })
const tooltip = (page: Page, text: string) =>
  page.locator('[data-slot="content"]').filter({ hasText: text })
const editor = (page: Page, file: string) =>
  page.getByRole('textbox', { name: `Source of ${file}` })
const systemsPath = (file: string) => posix(path.join(content, 'systems', file))
const query = (page: Page) => new URL(page.url()).search
const theme = (page: Page) => page.frameLocator('iframe[data-theme-frame]')

describe('in the studio running locally', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address = 'systems') {
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    return page
  }

  test('[SY-01] [SY-02] [SY-09] the rail’s Systems button opens the collection', async () => {
    const page = await open('')
    const rail = page.getByRole('navigation', { name: 'Main' })
    await visible(link(rail, 'Systems'))
    await link(rail, 'Systems').click()
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe('/systems')
    await visible(heading(page, 'Systems'))
    await visible(
      page.getByText(
        'Components, styles, assets, and guidance for your prototypes.',
      ),
    )
    expect(await page.title()).toBe(`Systems — ${STUDIO}`)
  })

  test('[SY-10] [SY-11] [SY-12] [SY-13] [SY-15] [SY-18] [SY-14] cards show each system, the default first, archived ones apart', async () => {
    const page = await open()
    const active = page.getByRole('list', { name: 'Systems', exact: true })
    await visible(active)
    const cards = active.getByRole('listitem')
    await expect.poll(() => cards.count()).toBe(2)
    const harbor = cards.nth(0)
    expect(await harbor.innerText()).toContain('Harbor')
    expect(await harbor.getByText('Default', { exact: true }).isVisible()).toBe(
      true,
    )
    expect(await harbor.innerText()).toContain('Screens for the dock team.')
    expect(await harbor.innerText()).toContain('Used by 4 prototypes')
    const lantern = cards.nth(1)
    expect(await lantern.innerText()).toContain(
      'Components, theme, assets, and guidance for your prototypes.',
    )
    expect(await lantern.innerText()).toContain('Used by 0 prototypes')

    await visible(region(page, 'Archived'))
    const archived = page.getByRole('list', { name: 'Archived systems' })
    expect(await archived.getByRole('listitem').count()).toBe(1)
    expect(await archived.innerText()).toContain('Attic')
    // The built-in Studio system and its Platform badge are gone.
    expect(await page.getByText('Platform', { exact: true }).count()).toBe(0)
    expect(await page.getByText('Studio', { exact: true }).count()).toBe(0)

    await harbor.click()
    await visible(heading(page, 'Harbor'))
    expect(new URL(page.url()).pathname).toBe(`/systems/${HARBOR}`)
  })

  test('[SY-10] the cards or list choice is shared and remembered', async () => {
    const page = await open()
    await visible(button(page, 'List'))
    await button(page, 'List').click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('design-studio:collection-view'),
        ),
      )
      .toBe('list')
    expect(await button(page, 'List').getAttribute('aria-pressed')).toBe('true')
    await page.reload()
    await visible(button(page, 'List'))
    expect(await button(page, 'List').getAttribute('aria-pressed')).toBe('true')
    const rows = page
      .getByRole('list', { name: 'Systems', exact: true })
      .getByRole('listitem')
    await expect.poll(() => rows.count()).toBe(2)
    expect(await rows.nth(0).innerText()).toContain('Used by 4 prototypes')
    await button(page, 'Cards').click()
  })

  test('[SY-16] [SY-17] [SY-18] search filters by name, description and “Default”, kept in the address', async () => {
    const page = await open()
    const search = page.getByRole('searchbox', { name: 'Search systems' })
    await visible(search)
    await search.fill('lant')
    await expect.poll(() => query(page)).toBe('?q=lant')
    const list = page.getByRole('list', { name: 'Systems', exact: true })
    await expect.poll(() => list.getByRole('listitem').count()).toBe(1)
    expect(await list.innerText()).toContain('Lantern')
    // Nothing archived matches, so the section goes.
    await hidden(region(page, 'Archived'))

    await search.fill('default')
    await expect.poll(() => list.innerText()).toContain('Harbor')
    expect(await list.getByRole('listitem').count()).toBe(1)

    await search.fill('retired')
    await visible(region(page, 'Archived'))

    await page.goto(`${studio.url}systems?q=nothing-like-this`)
    await visible(page.getByText('No matching systems'))
    await visible(page.getByText('Try a different search.'))
    await link(page, 'View all systems').click()
    await expect.poll(() => query(page)).toBe('')
    await visible(page.getByRole('list', { name: 'Systems', exact: true }))

    await search.fill('harbor')
    await button(page, 'Clear search').click()
    await expect.poll(() => search.inputValue()).toBe('')
    await expect.poll(() => query(page)).toBe('')
  })

  test('[SY-19] [SY-42] [SY-44] each card has its actions menu: copy its link and, locally, its folder', async () => {
    const page = await open()
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    const trigger = button(page, 'Actions for Harbor')
    await visible(page.getByRole('list', { name: 'Systems', exact: true }))
    expect(await trigger.count()).toBe(1)
    await trigger.click()
    await page.getByRole('menuitem', { name: 'Copy link' }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${studio.url}systems/${HARBOR}`)
    await trigger.click()
    await page.getByRole('menuitem', { name: 'Copy path' }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${systemsPath('harbor')}/`)
  })

  test('[SY-20] [SY-61] only Admins create systems; Harbor’s maintainer may rename it, nothing more', async () => {
    const page = await open()
    await visible(page.getByRole('list', { name: 'Systems', exact: true }))
    const items = async (name: string) => {
      const trigger = button(page, `Actions for ${name}`)
      // Who you are arrives after the page; the menu grows when it does.
      await expect
        .poll(
          async () => {
            await trigger.click()
            const texts = await page.getByRole('menuitem').allTextContents()
            await page.keyboard.press('Escape')
            await expect.poll(() => page.getByRole('menu').count()).toBe(0)
            return texts.length >= 4 ? texts : []
          },
          { timeout: 60_000 },
        )
        .not.toEqual([])
      await trigger.click()
      const texts = await page.getByRole('menuitem').allTextContents()
      await page.keyboard.press('Escape')
      await expect.poll(() => page.getByRole('menu').count()).toBe(0)
      return texts
    }
    expect(await items('Harbor')).toEqual([
      'Open in editor',
      expect.stringMatching(/^(Show in|Reveal in)/),
      'Copy link',
      'Copy path',
      'Rename',
    ])
    expect(await items('Lantern')).toEqual([
      'Open in editor',
      expect.stringMatching(/^(Show in|Reveal in)/),
      'Copy link',
      'Copy path',
    ])
    expect(await button(page, 'New system').count()).toBe(0)
  })

  test('[SY-04] Home links to up to three active systems and the whole collection', async () => {
    const page = await open('')
    const block = region(page, 'Systems')
    await visible(block)
    await visible(link(block, 'Harbor'))
    expect(await link(block, 'Lantern').isVisible()).toBe(true)
    expect(await link(block, 'Attic').count()).toBe(0)
    await link(block, 'Systems').click()
    await visible(heading(page, 'Systems'))
  })

  test('[SY-05] [SY-06] [SY-31] [SY-32] [SY-33] a system opens with its own navigation, in order, at its permanent address', async () => {
    const page = await open(`systems/${HARBOR}`)
    const panel = nav(page, 'Harbor')
    await visible(panel)
    expect(await page.title()).toBe(`Harbor — Systems — ${STUDIO}`)
    await visible(panel.getByText('Default system'))
    expect(await button(panel, 'Actions for Harbor').count()).toBe(1)
    // No system switcher or back link: the rail's Systems button returns.
    expect(await link(panel, 'Systems').count()).toBe(0)

    const order = await panel
      .locator('[data-nav-entry]')
      .evaluateAll((entries) =>
        entries.map((entry) => entry.getAttribute('data-nav-entry')),
      )
    expect(order).toEqual([
      'Overview',
      'Libraries',
      'Context',
      'Skills',
      'Theme',
      'Assets',
      'Components',
    ])
    for (const name of [
      'Overview',
      'Libraries',
      'Voice and tone',
      'Signing in',
      'Build flow',
      'Colors',
      'Radius',
      'Fonts',
      'Icons',
      'Images',
      'Button',
    ])
      expect(await link(panel, name).isVisible(), name).toBe(true)

    await link(panel, 'Libraries').click()
    await visible(heading(page, 'Libraries'))
    expect(new URL(page.url()).pathname).toBe(`/systems/${HARBOR}/libraries`)
    expect(await page.title()).toBe(`Libraries — Harbor — Systems — ${STUDIO}`)
  })

  test('[SY-08] the navigation stays in place between a system’s pages, and each page starts at the top', async () => {
    const page = await open(`systems/${HARBOR}`)
    const panel = nav(page, 'Harbor')
    await visible(panel)
    await panel.evaluate((element) => {
      ;(element as HTMLElement & { kept?: boolean }).kept = true
    })
    await link(panel, 'Libraries').click()
    await visible(heading(page, 'Libraries'))
    await link(panel, 'Voice and tone').click()
    await visible(heading(page, 'Voice and tone'))
    expect(
      await panel.evaluate(
        (element) => (element as HTMLElement & { kept?: boolean }).kept,
      ),
    ).toBe(true)
  })

  test('[SY-34] [SY-35] branches open by default, fold, and stay as left for the session', async () => {
    const page = await open(`systems/${HARBOR}`)
    const panel = nav(page, 'Harbor')
    const theme = button(panel, 'Theme')
    await visible(theme)
    expect(await theme.getAttribute('aria-expanded')).toBe('true')
    await theme.click()
    await hidden(link(panel, 'Colors'))
    expect(await theme.getAttribute('aria-expanded')).toBe('false')
    // Moving to another page keeps it folded.
    await link(panel, 'Libraries').click()
    await visible(heading(page, 'Libraries'))
    expect(await theme.getAttribute('aria-expanded')).toBe('false')

    await button(panel, 'Expand all').hover()
    await visible(tooltip(page, 'Expand all'))
    await button(panel, 'Expand all').click()
    await visible(link(panel, 'Colors'))
    await button(panel, 'Collapse all').click()
    await hidden(link(panel, 'Colors'))
    await hidden(link(panel, 'Voice and tone'))

    // Opening a page inside a folded branch opens it.
    await link(panel, 'Context').click()
    await visible(heading(page, 'Context'))
    await visible(link(panel, 'Voice and tone'))
    // A reload starts again with every branch open.
    await page.reload()
    await visible(link(nav(page, 'Harbor'), 'Colors'))
  })

  test('[SY-36] [SY-85] [SY-35] searching the navigation filters by names and paths; Escape clears, then closes', async () => {
    const page = await open(`systems/${HARBOR}`)
    const panel = nav(page, 'Harbor')
    await visible(button(panel, 'Search'))
    await button(panel, 'Search').click()
    const field = panel.getByRole('searchbox', { name: 'Search system' })
    await visible(field)
    await expect
      .poll(() => field.evaluate((node) => node === document.activeElement))
      .toBe(true)

    await field.fill('voice')
    await visible(link(panel, 'Voice and tone'))
    expect(await link(panel, 'Button').isVisible()).toBe(false)
    expect(await link(panel, 'Overview').isVisible()).toBe(false)
    expect(await button(panel, 'Collapse all').isDisabled()).toBe(true)

    // File paths match too.
    await field.fill('flows/sign')
    await visible(link(panel, 'Signing in'))
    expect(await link(panel, 'Voice and tone').isVisible()).toBe(false)

    // Libraries match by their names and descriptions.
    await field.fill('icon catalog')
    await visible(link(panel, 'Libraries'))

    await field.fill('nothing-like-this')
    await visible(panel.getByText('No matching items.'))
    await button(panel, 'Clear search').click()
    await expect.poll(() => field.inputValue()).toBe('')
    await visible(link(panel, 'Button'))

    await field.fill('voice')
    await field.press('Escape')
    await expect.poll(() => field.inputValue()).toBe('')
    await visible(field)
    await field.press('Escape')
    await hidden(field)
  })

  test('[SY-37] [SY-38] [SY-32] [SY-33] an empty system shows its empty branches, with Libraries and Assets still there', async () => {
    const page = await open(`systems/${LANTERN}`)
    const panel = nav(page, 'Lantern')
    await visible(panel)
    expect(await panel.getByText('Default system').count()).toBe(0)
    await visible(panel.getByText('No tokens yet'))
    // Context, Skills and Components.
    await expect.poll(() => panel.getByText('Empty folder').count()).toBe(3)
    for (const name of ['Libraries', 'Fonts', 'Icons', 'Images'])
      expect(await link(panel, name).isVisible(), name).toBe(true)
  })

  test('[SY-39] branches show their folder and items their file when hovered', async () => {
    const page = await open(`systems/${HARBOR}`)
    const panel = nav(page, 'Harbor')
    await visible(button(panel, 'Components'))
    expect(await button(panel, 'Components').getAttribute('title')).toBe(
      systemsPath('harbor/components/'),
    )
    expect(await link(panel, 'Voice and tone').getAttribute('title')).toBe(
      systemsPath('harbor/context/voice.md'),
    )
    expect(await link(panel, 'Colors').getAttribute('title')).toBe(
      systemsPath('harbor/styles/theme.css'),
    )
  })

  test('[SY-40] right-clicking a page offers its file actions, without rename or delete', async () => {
    const page = await open(`systems/${HARBOR}`)
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    const panel = nav(page, 'Harbor')
    await visible(link(panel, 'Overview'))
    await link(panel, 'Overview').click({ button: 'right' })
    const menu = page.getByRole('menu')
    await visible(menu)
    const edit = menu.getByRole('menuitem', { name: /Edit source/ })
    expect(await edit.textContent()).toContain("Ctrl+'")
    expect(await menu.getByRole('menuitem', { name: /Rename/ }).count()).toBe(0)
    expect(await menu.getByRole('menuitem', { name: /Delete/ }).count()).toBe(0)
    await menu.getByRole('menuitem', { name: 'Copy path' }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(systemsPath('harbor/system.ts'))

    await link(panel, 'Colors').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Copy link' }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${studio.url}systems/${HARBOR}/colors`)
  })

  test('[SY-63] [SY-64] [SY-65] [SY-66] [SY-68] [SY-101] the Overview sums up guidance, toolkit and use', async () => {
    const page = await open(`systems/${HARBOR}`)
    await visible(heading(page, 'Harbor'))
    await visible(page.getByText('Screens for the dock team.'))

    const instructions = region(page, 'Instructions')
    const text = async (block: ReturnType<Page['locator']>) =>
      (await block.innerText()).replace(/\s+/g, ' ')
    expect(await text(instructions)).toContain('2 Context documents')
    expect(await text(instructions)).toContain('1 Skills')
    expect(await text(instructions)).toContain(
      'Read the voice guide before writing copy.',
    )

    const toolkit = region(page, 'Toolkit')
    expect(await text(toolkit)).toContain('1 Components')
    expect(await text(toolkit)).toContain('3 Theme tokens')
    // Local fonts, icons and images, and the copied app's images.
    expect(await text(toolkit)).toContain('6 Assets')
    expect(await text(toolkit)).toContain('Plain Vue with Harbor’s theme.')
    expect(await text(toolkit)).toContain(
      'Color modes: Light only. This system stays in light mode while Studio follows its global color mode.',
    )

    const usage = region(page, 'Where it’s used')
    expect(await text(usage)).toContain('4 Active prototypes')
    const recent = usage.getByRole('listitem')
    expect(await recent.count()).toBe(3)
    expect(await recent.nth(0).innerText()).toContain('Cargo search')
    expect(await recent.nth(0).innerText()).toContain('ben')
    expect(await recent.nth(2).innerText()).toContain('Crane booking')
    expect(
      await usage
        .getByRole('link', { name: /Cargo search/ })
        .getAttribute('href'),
    ).toBe('/prototypes/dck0000000000004')
    expect(
      await link(usage, 'View prototypes using this system').getAttribute(
        'href',
      ),
    ).toBe(`/prototypes?system=${HARBOR}`)
  })

  test('[SY-63] [SY-64] [SY-65] [SY-66] an empty system’s Overview says what is missing', async () => {
    const page = await open(`systems/${LANTERN}`)
    await visible(heading(page, 'Lantern'))
    await visible(page.getByText('The guidance and code included in Lantern.'))
    await visible(page.getByText('No system instructions have been added yet.'))
    await visible(
      page.getByText(
        'Color modes: Light and dark. Follows Studio’s global color mode.',
      ),
    )
    await visible(
      page.getByText(
        'No active prototypes use this system yet. Choose Lantern when creating a prototype.',
      ),
    )
  })

  test('[SY-80] [SY-81] [SY-82] [SY-83] Libraries lists each library with its version, docs and related pages', async () => {
    const page = await open(`systems/${HARBOR}/libraries`)
    await visible(page.getByText('The sources and tools behind Harbor.'))
    const list = page.getByRole('list', { name: 'System libraries' })
    const vue = list.getByRole('listitem').filter({ hasText: 'Vue' }).first()
    expect(await vue.innerText()).toMatch(/v3\.\d+\.\d+/)
    const docs = link(vue, 'Vue documentation')
    expect(await docs.getAttribute('href')).toBe('https://vuejs.org/guide/')
    expect(await docs.getAttribute('target')).toBe('_blank')
    expect(await link(vue, 'Button').getAttribute('href')).toBe(
      `/systems/${HARBOR}/components/button`,
    )

    const icons = list.getByRole('listitem').filter({ hasText: 'Harbor Icons' })
    expect(await icons.innerText()).toContain('Not installed')
    expect(await icons.innerText()).toContain(
      'Ask your agent to install this dependency.',
    )
    expect(await link(icons, 'Icons').getAttribute('href')).toBe(
      `/systems/${HARBOR}/icons`,
    )
    expect(await icons.getAttribute('id')).toBe('harbor-icons')
  })

  test('[SY-84] a system with no libraries says how to add one', async () => {
    const page = await open(`systems/${LANTERN}/libraries`)
    await visible(page.getByText('No libraries added yet'))
    await visible(
      page.getByText(
        'Ask your agent to add a library when your system needs more capabilities.',
      ),
    )
  })

  test('[SY-121] [SY-123] [SY-130] Context explains itself, and its documents read in the studio’s style', async () => {
    reset()
    const page = await open(`systems/${HARBOR}/context`)
    await visible(heading(page, 'Context'))
    await visible(
      page.getByText(
        'Knowledge, principles, and standing requirements shared by people and agents.',
      ),
    )
    await visible(
      page.getByText('Select a file in navigation to read or edit it.'),
    )
    await visible(
      page.getByText(
        'Agent instructions must point to the relevant files. Being listed here does not automatically load them into a conversation.',
      ),
    )

    await link(nav(page, 'Harbor'), 'Voice and tone').click()
    await visible(heading(page, 'Voice and tone'))
    expect(new URL(page.url()).pathname).toBe(
      `/systems/${HARBOR}/context/voice`,
    )
    expect(await page.title()).toBe(
      `Voice and tone — Context — Harbor — Systems — ${STUDIO}`,
    )
    const article = page.getByRole('article')
    expect(await article.locator('strong').innerText()).toBe('plainly')
    expect(await article.getByRole('table').isVisible()).toBe(true)
    // Raw HTML shows as text and never runs.
    await visible(article.getByText("<script>alert('raw HTML stays text')"))
    // The studio's own look, never the system's theme.
    expect(await page.locator('.harbor-theme').count()).toBe(0)

    await link(nav(page, 'Harbor'), 'Signing in').click()
    await visible(heading(page, 'Signing in'))
    expect(new URL(page.url()).pathname).toBe(
      `/systems/${HARBOR}/context/flows/sign-in`,
    )
  })

  test('[SY-123] an empty section asks the agent for material', async () => {
    const page = await open(`systems/${LANTERN}/skills`)
    await visible(heading(page, 'Skills'))
    await visible(
      page.getByText('No files yet. Ask your agent to add useful material.'),
    )
  })

  test('[SY-122] Skills list one entry per skill, opening its SKILL.md, and its documents link on', async () => {
    const page = await open(`systems/${HARBOR}`)
    const panel = nav(page, 'Harbor')
    await visible(link(panel, 'Build flow'))
    expect(await link(panel, 'SKILL').count()).toBe(0)
    await link(panel, 'Build flow').click()
    await visible(heading(page, 'Build a flow'))
    expect(new URL(page.url()).pathname).toBe(
      `/systems/${HARBOR}/skills/build-flow/SKILL`,
    )
    await link(page.getByRole('article'), 'the steps').click()
    await visible(heading(page, 'Steps'))
    expect(new URL(page.url()).pathname).toBe(
      `/systems/${HARBOR}/skills/build-flow/references/steps`,
    )
  })

  test('[SY-86] [SY-87] [SY-88] [SY-91] Colors are measured inside Harbor’s own preview document and follow edits to its stylesheet', async () => {
    resetTheme()
    const page = await open(`systems/${HARBOR}/colors`)
    await visible(heading(page, 'Colors'))
    const frame = theme(page)
    const sea = frame.locator('[data-token="--color-sea"]')
    await expect
      .poll(() => sea.getAttribute('data-value'), { timeout: 60_000 })
      .toBe('#0a7ea4')
    expect(await sea.innerText()).toBe('#0a7ea4')
    // The value shows in full on hover.
    expect(await sea.getAttribute('title')).toBe('#0a7ea4')
    // A name with no ramp step is one of the other colours.
    await visible(frame.getByRole('heading', { name: 'Other colors' }))
    // The document is Harbor's: its theme class and stylesheet, light only.
    expect(
      await frame
        .locator('html')
        .evaluate((html) => [
          html.classList.contains('harbor-theme'),
          getComputedStyle(html).colorScheme,
        ]),
    ).toEqual([true, 'light'])
    expect(await page.locator('.harbor-theme').count()).toBe(0)
    // The swatch is painted with the token.
    expect(
      await frame
        .locator('[data-swatch="--color-sea"]')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe('rgb(10, 126, 164)')
    // The frame is as tall as what it shows.
    await expect
      .poll(
        () =>
          page
            .locator('iframe[data-theme-frame]')
            .evaluate((node) => node.getBoundingClientRect().height),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(150)

    writeFileSync(
      at('harbor/styles/theme.css'),
      THEME.replace('#0a7ea4', '#123456'),
    )
    await expect
      .poll(() => sea.getAttribute('data-value'), { timeout: 60_000 })
      .toBe('#123456')
    resetTheme()
  })

  test('[SY-89] [SY-90] Typography always renders and notes what isn’t declared; Radius samples each value', async () => {
    const page = await open(`systems/${HARBOR}/typography`)
    await visible(heading(page, 'Typography'))
    const frame = theme(page)
    await visible(
      frame.getByText('This system does not declare font sizes in its theme.'),
    )
    await visible(
      frame.getByText(
        'This system does not declare font weights in its theme.',
      ),
    )
    await visible(link(nav(page, 'Harbor'), 'Typography'))

    await link(nav(page, 'Harbor'), 'Radius').click()
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe(`/systems/${HARBOR}/radius`)
    const card = frame.locator('[data-token-row="--radius-card"]')
    await visible(card)
    await expect
      .poll(() =>
        card
          .locator('div div')
          .first()
          .evaluate((node) => getComputedStyle(node).borderRadius),
      )
      .toBe('12px')
    expect(
      await frame
        .locator('[data-token="--radius-card"]')
        .getAttribute('data-value'),
    ).toBe('12px')
  })

  test('[SY-92] ⌘’ inside a theme page opens the stylesheet all theme pages share', async () => {
    const page = await open(`systems/${HARBOR}/radius`)
    const frame = theme(page)
    const row = frame.locator('[data-token-row="--radius-card"]')
    await visible(row)
    await row.click()
    await page.keyboard.press("Control+'")
    await visible(editor(page, systemsPath('harbor/styles/theme.css')))
    expect(query(page)).toBe('?mode=source')
  })

  test('[SY-93] [SY-94] [SY-95] [SY-100] Icons lists the icon library, the system’s icon sample and its local icons', async () => {
    const page = await open(`systems/${HARBOR}/icons`)
    await visible(heading(page, 'Icons'))
    const libraries = page.getByRole('list', { name: 'Icons libraries' })
    const harborIcons = libraries.getByRole('link', {
      name: 'Harbor Icons in Libraries',
    })
    await visible(harborIcons)
    expect(await harborIcons.innerText()).toContain('Icon library')
    expect(await harborIcons.getAttribute('href')).toBe(
      `/systems/${HARBOR}/libraries#harbor-icons`,
    )
    // The sample: usage, a link to every icon, and a grid.
    await visible(page.getByText('<UIcon name="i-lucide-anchor" />'))
    expect(await link(page, 'Browse all icons').getAttribute('href')).toBe(
      'https://lucide.dev/icons/',
    )
    await visible(page.getByText('i-lucide-ship', { exact: true }))

    await visible(heading(page, 'Local icons'))
    const local = page.getByRole('list', { name: 'Local icons' })
    const anchor = local.getByRole('link', { name: /icons\/anchor\.svg/ })
    await visible(anchor)
    await expect
      .poll(() =>
        anchor
          .locator('img')
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0)
  })

  test('[SY-170] [SY-95] the copied app images show on Images and Icons, apart from local ones', async () => {
    const page = await open(`systems/${HARBOR}/images`)
    await visible(heading(page, 'App images'))
    const app = page.getByRole('list', { name: 'App images' })
    const dock = app.getByRole('link', { name: /assets\/images\/dock\.svg/ })
    await visible(dock)
    await expect
      .poll(() =>
        dock
          .locator('img')
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0)
    await visible(
      page
        .getByRole('list', { name: 'Local images' })
        .getByRole('link', { name: /marks\/wave\.svg/ }),
    )
    await page.goto(`${studio.url}systems/${HARBOR}/icons`)
    await visible(
      page
        .getByRole('list', { name: 'App icons' })
        .getByRole('link', { name: /Icons\/bell\.svg/ }),
    )
  })

  test('[SY-97] [SY-99] an asset opens its preview page, as a picture in the studio’s look, with no editing', async () => {
    const page = await open(`systems/${HARBOR}/images`)
    await page
      .getByRole('list', { name: 'Local images' })
      .getByRole('link', { name: /marks\/wave\.svg/ })
      .click()
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe(`/systems/${HARBOR}/images/marks/wave.svg`)
    await visible(heading(page, 'wave.svg'))
    await visible(page.getByText('marks/wave.svg', { exact: true }))
    await visible(page.getByText(systemsPath('harbor/assets/marks/wave.svg')))
    const picture = page.getByRole('img', { name: 'marks/wave.svg' })
    await expect
      .poll(() =>
        picture.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0)
    // An SVG shows as a picture: its script never runs.
    expect(await page.title()).not.toBe('executed')
    expect(await page.locator('.harbor-theme').count()).toBe(0)
    await page.keyboard.press("Control+'")
    await page.waitForTimeout(300)
    expect(await page.getByRole('textbox').count()).toBe(0)
    // The breadcrumb leads back.
    await link(page, 'Images').last().click()
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe(`/systems/${HARBOR}/images`)
  })

  test('[SY-98] a font previews under a name of its own, says when it can’t, and is unloaded on leaving', async () => {
    const page = await open(`systems/${HARBOR}/fonts/fonts/Harbor.woff2`)
    await visible(heading(page, 'Harbor.woff2'))
    const sample = page.getByText(
      'The quick brown fox jumps over the lazy dog.',
    )
    await visible(sample)
    const family = await sample.evaluate(
      (node) => getComputedStyle(node.parentElement!).fontFamily,
    )
    expect(family).toMatch(/^"?studio-asset-/)
    const loaded = () =>
      page.evaluate(
        () =>
          [...document.fonts].filter((font) =>
            font.family.replace(/"/g, '').startsWith('studio-asset-'),
          ).length,
      )
    expect(await loaded()).toBe(1)

    await link(page, 'Fonts').last().click()
    await visible(heading(page, 'Local fonts'))
    await expect.poll(loaded).toBe(0)

    await page
      .getByRole('list', { name: 'Local fonts' })
      .getByRole('link', { name: /Broken\.woff2/ })
      .click()
    await visible(page.getByText('This font could not be previewed.'))
  })

  test('[SY-96] an asset page with nothing to list says how to add some', async () => {
    const page = await open(`systems/${LANTERN}/fonts`)
    await visible(heading(page, 'Fonts'))
    await visible(page.getByText('No local fonts added'))
    await visible(
      page.getByText(
        'Ask your agent to bring in your product’s font files and connect them to this system’s theme.',
      ),
    )
    await page.goto(`${studio.url}systems/${LANTERN}/icons/missing.svg`)
    await visible(page.getByText('Page not found'))
  })

  test('[SY-07] unknown systems, pages and documents are not found', async () => {
    const page = await open('systems/zzzz000000000000')
    await visible(page.getByText('Page not found'))
    await page.goto(`${studio.url}systems/${HARBOR}/nowhere`)
    await visible(page.getByText('Page not found'))
    // The system keeps its navigation around it.
    await visible(nav(page, 'Harbor'))
    await page.goto(`${studio.url}systems/${HARBOR}/context/missing`)
    await visible(page.getByText('Page not found'))
  })

  test('[SY-114] [SY-115] [SY-118] [SY-119] a maintainer edits a Context document in source mode and saves it', async () => {
    reset()
    const page = await open(`systems/${HARBOR}/context/voice`)
    await visible(heading(page, 'Voice and tone'))
    await page.keyboard.press("Control+'")
    const file = systemsPath('harbor/context/voice.md')
    await visible(editor(page, file))
    expect(query(page)).toBe('?mode=source')
    await visible(page.getByText('Loading editor…').or(editor(page, file)))
    expect(await button(page, 'Save').isDisabled()).toBe(true)

    await editor(page, file).click()
    await page.keyboard.press('Control+A')
    await page.keyboard.insertText('# Voice and tone\n\nSaved in the studio.\n')
    await visible(page.getByText('Unsaved changes', { exact: true }))
    await page.keyboard.press('Control+S')
    await visible(page.getByText('Saved', { exact: true }))
    expect(read('harbor/context/voice.md')).toBe(
      '# Voice and tone\n\nSaved in the studio.\n',
    )
    await button(page, 'Done').click()
    await hidden(editor(page, file))
    await visible(page.getByText('Saved in the studio.'))
    reset()
  })

  test('[SY-115] the Overview’s source is the system’s declaration, and a theme page’s is its stylesheet', async () => {
    const page = await open(`systems/${HARBOR}?mode=source`)
    await visible(editor(page, systemsPath('harbor/system.ts')))
    await page.goto(`${studio.url}systems/${HARBOR}/colors?mode=source`)
    await visible(editor(page, systemsPath('harbor/styles/theme.css')))
  })

  test('[SY-119] someone who doesn’t maintain the system reads its source, and is told why', async () => {
    const page = await open(`systems/${ATTIC}/context/old?mode=source`)
    const file = systemsPath('attic/context/old.md')
    await visible(editor(page, file))
    await visible(page.getByText('Read-only', { exact: true }))
    await visible(
      page.getByText(
        "The Attic system isn't available for this: it is archived.",
      ),
    )
    const response = await fetch(`${studio.url}_studio/files/system-source`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: LANTERN,
        path: 'system.ts',
        content: 'x',
        base: 'x',
      }),
    })
    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe(
      'Only an Admin or a maintainer of the Lantern system can do this. You are recognised, but not one of its maintainers.',
    )
    // Only the system's own source files are reachable.
    const outside = await fetch(
      `${studio.url}_studio/files/system-source?system=${HARBOR}&path=../lantern/system.ts`,
    )
    expect(outside.status).toBe(404)
    const app = await fetch(
      `${studio.url}_studio/files/system-source?system=${HARBOR}&path=app.ts`,
    )
    expect(app.status).toBe(404)
  })

  test('[SY-127] a skill’s source picks among its files; others open in an editor', async () => {
    const page = await open(
      `systems/${HARBOR}/skills/build-flow/SKILL?mode=source`,
    )
    await visible(
      editor(page, systemsPath('harbor/skills/build-flow/SKILL.md')),
    )
    const picker = page.getByRole('combobox', { name: 'Skill source file' })
    await picker.click()
    await page.getByRole('option', { name: 'references/steps.md' }).click()
    await visible(
      editor(page, systemsPath('harbor/skills/build-flow/references/steps.md')),
    )
    await picker.click()
    await page.getByRole('option', { name: 'logo.png' }).click()
    await visible(
      page.getByText(
        'This supporting file cannot be edited as text in Studio.',
      ),
    )
  })

  test('[PR-124] a skill’s script opens read-only as its text, highlighted, under its path; binary files are no page', async () => {
    const page = await open(`systems/${HARBOR}/skills/build-flow/SKILL`)
    await visible(heading(page, 'Build a flow'))
    await link(page.getByRole('article'), 'the check').click()
    const file = systemsPath('harbor/skills/build-flow/scripts/check.mjs')
    await visible(editor(page, file))
    expect(new URL(page.url()).pathname).toBe(
      `/systems/${HARBOR}/skills/build-flow/scripts/check.mjs`,
    )
    await visible(page.getByText(file, { exact: true }))
    await visible(page.getByText('Read-only', { exact: true }))
    expect(
      await editor(page, file).evaluate(
        (node) => (node as HTMLElement).isContentEditable,
      ),
    ).toBe(false)
    // JavaScript: the keyword is coloured, unlike plain text.
    const plain = await editor(page, file).evaluate(
      (node) => getComputedStyle(node).color,
    )
    await expect
      .poll(() =>
        editor(page, file)
          .getByText('const', { exact: true })
          .evaluate((node) => getComputedStyle(node).color),
      )
      .not.toBe(plain)
    await expect.poll(() => page.title()).toContain('check.mjs')

    await page.goto(`${studio.url}systems/${HARBOR}/skills/build-flow/logo.png`)
    await visible(page.getByText('Page not found'))
  })
})

describe('the deployed site', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let site: Awaited<ReturnType<typeof startStaticSite>>
  beforeAll(async () => {
    site = await startStaticSite('/', ENV)
  }, 600_000)
  afterAll(async () => {
    await site?.stop()
  })

  test('[SY-198] [SY-18] [SY-199] active systems are published, with no local tools; archived ones are not', async () => {
    const page = await newPage()
    await page.goto(`${site.url}systems`)
    const list = page.getByRole('list', { name: 'Systems', exact: true })
    await visible(list)
    await expect.poll(() => list.getByRole('listitem').count()).toBe(2)
    expect(await region(page, 'Archived').count()).toBe(0)
    expect(await page.getByText('Attic').count()).toBe(0)
    await page.goto(`${site.url}systems/${ATTIC}`)
    await visible(page.getByText('Page not found'))
    // Nothing of the archived system is in the build.
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const file = path.join(dir, name)
        return statSync(file).isDirectory() ? files(file) : [file]
      })
    const leaks = files(site.directory).filter(
      (file) =>
        /.(m?js|html|json)$/.test(file) &&
        readFileSync(file, 'utf8').includes('Kept for the record'),
    )
    expect(leaks).toEqual([])
    // Nor the dev-only file service or the source editor.
    const local = files(site.directory).filter((file) => {
      if (!/.(m?js|html|json)$/.test(file)) return false
      // Context & Skills ships the modules' READMEs, whose prose names the
      // dev route; that text is documentation, not the service.
      if (/studio-guidance-documents\.[^\\/]*\.json$/.test(file)) return false
      const text = readFileSync(file, 'utf8')
      return text.includes('_studio/files') || text.includes('cm-gutters')
    })
    expect(local).toEqual([])
  })

  test('[SY-198] [SY-199] [SY-30] [SY-62] system pages read the same, with no editing, creation or local actions', async () => {
    const page = await newPage()
    await page.goto(`${site.url}systems/${HARBOR}/context/voice?mode=source`)
    await visible(heading(page, 'Voice and tone'))
    await page.keyboard.press("Control+'")
    await page.waitForTimeout(300)
    expect(await page.getByRole('textbox').count()).toBe(0)

    const panel = nav(page, 'Harbor')
    await link(panel, 'Overview').click({ button: 'right' })
    await page.waitForTimeout(300)
    expect(
      await page.getByRole('menuitem', { name: /Edit source/ }).count(),
    ).toBe(0)
    expect(
      await page.getByRole('menuitem', { name: 'Copy path' }).count(),
    ).toBe(0)

    await page.goto(`${site.url}systems`)
    await button(page, 'Actions for Harbor').click()
    await visible(page.getByRole('menuitem', { name: 'Copy link' }))
    // [SY-30] [SY-62] Only Copy link, and no New system.
    expect(await page.getByRole('menuitem').allTextContents()).toEqual([
      'Copy link',
    ])
    expect(await button(page, 'New system').count()).toBe(0)

    await page.goto(`${site.url}systems/${HARBOR}/skills/build-flow/SKILL`)
    await visible(heading(page, 'Build a flow'))
    await page.goto(`${site.url}systems/${HARBOR}/libraries`)
    await visible(page.getByText('The sources and tools behind Harbor.'))
  })
  test('[SY-87] [SY-97] [SY-170] Theme values and asset files ship with the site', async () => {
    const page = await newPage()
    await page.goto(`${site.url}systems/${HARBOR}/colors`)
    await expect
      .poll(
        () =>
          theme(page)
            .locator('[data-token="--color-sea"]')
            .getAttribute('data-value'),
        { timeout: 60_000 },
      )
      .toBe('#0a7ea4')
    await page.goto(
      `${site.url}systems/${HARBOR}/images/assets/images/dock.svg`,
    )
    const picture = page.getByRole('img', { name: 'assets/images/dock.svg' })
    await expect
      .poll(
        () => picture.evaluate((image: HTMLImageElement) => image.naturalWidth),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0)
    // Only asset files are published, never the system's source.
    expect(
      readdirSync(path.join(site.directory, '_system-assets', HARBOR)).sort(),
    ).toEqual(['app', 'assets'])
  })

  test('[PR-124] a skill’s script reads as plain monospace text under its path', async () => {
    const page = await newPage()
    await page.goto(
      `${site.url}systems/${HARBOR}/skills/build-flow/scripts/check.mjs`,
    )
    const file = systemsPath('harbor/skills/build-flow/scripts/check.mjs')
    await visible(page.getByText(file, { exact: true }))
    const text = page.locator('pre', { hasText: 'const steps' })
    await visible(text)
    expect(await text.innerText()).toContain(
      '// Checks a Harbor flow before it is shared.',
    )
    expect(
      await text.evaluate((node) => getComputedStyle(node).fontFamily),
    ).toMatch(/mono/i)
    expect(await page.getByRole('textbox').count()).toBe(0)
  })
})
