// The Manual and Context & Skills: a designer reads the Manual's chapters
// beside their navigation, switches to the Platform's and modules' guidance,
// searches it, opens files from the right-click menu and, as an Admin, edits
// a chapter in source mode. Turned off, the Manual leaves the rail and the
// guidance stays. The deployed site reads the same pages, read-only.
//
// The studio runs on copies of the real modules with fixture chapters
// (`tests/fixtures/manual/pages`) and a fixture Platform folder, inside the
// checkout, as Ada (an Admin), with programs noted instead of started.
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
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

const FIXTURES = 'tests/fixtures/manual'
mkdirSync('.e2e', { recursive: true })
// The modules sit at the same depth as src/modules, so their relative
// imports still resolve; the Platform folder and the rest sit beside them.
const modules = mkdtempSync(path.join('.e2e', 'manual-'))
const content = `${modules}-content`
mkdirSync(content)
const posix = (file: string) => file.split(path.sep).join('/')
const platform = path.join(content, 'platform')
const pages = path.join(modules, 'documentation', 'pages')
const launchLog = path.resolve(content, 'launches.log')

cpSync('src/modules', modules, { recursive: true })
rmSync(pages, { recursive: true, force: true })
cpSync(path.join(FIXTURES, 'pages'), pages, { recursive: true })
cpSync(path.join(FIXTURES, 'platform'), platform, { recursive: true })
// A module without a README, and a module contract beside a README.
rmSync(path.join(modules, 'contributors', 'README.md'), { force: true })
writeFileSync(
  path.join(modules, 'prototypes', 'VIEWS.md'),
  '# View contract\n\nEvery view is a `.vue` file.\n',
)
const real = JSON.parse(readFileSync('studio.config.json', 'utf8'))
const config = (documentation: boolean) => {
  const file = path.join(content, `studio.config.${documentation}.json`)
  writeFileSync(
    file,
    JSON.stringify({
      ...real,
      modules: { ...real.modules, documentation, canvas: true },
      admins: ['ada0000000000001'],
    }),
  )
  return posix(file)
}

const env = (documentation = true) => ({
  STUDIO_MODULES: posix(modules),
  STUDIO_PLATFORM: posix(platform),
  STUDIO_CONFIG: config(documentation),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_LAUNCH_LOG: launchLog,
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
})

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(modules, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function hidden(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 30_000 }).toBe(false)
}
const title = (page: Page, name: string) =>
  page.getByRole('heading', { name, level: 1, exact: true })
const chapters = (page: Page) =>
  page.getByRole('navigation', { name: 'Chapters' })
const docNav = (page: Page) =>
  page.getByRole('complementary', { name: 'Documentation' })
const menu = (page: Page) => page.getByRole('menu')
const menuItems = async (page: Page) =>
  (await menu(page).getByRole('menuitem').allTextContents()).map((text) =>
    text.replace(/[⌘⌃]?Ctrl\+?'|⌘'/g, '').trim(),
  )
const launches = () => {
  try {
    return readFileSync(launchLog, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { command: string; args: string[] })
  } catch {
    return []
  }
}
const sourceKey = process.platform === 'darwin' ? "Meta+'" : "Control+'"

describe('in the studio running locally', { timeout: 150_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env())
    const page = await newPage()
    await page.goto(`${studio.url}documentation/manual`)
    await title(page, 'Overview').waitFor({ timeout: 180_000 })
    // The first document with code makes Vite optimize the highlighter and
    // reload the page; a README with code takes that reload here.
    await page.goto(`${studio.url}documentation/context/prototypes`)
    await title(page, 'Prototypes').waitFor({ timeout: 180_000 })
    await page.waitForTimeout(10_000)
    await page.reload()
    await title(page, 'Prototypes').waitFor({ timeout: 180_000 })
    await page.close()
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address: string) {
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    return page
  }

  test('[PR-137] /documentation opens the Manual', async () => {
    const page = await open('documentation')
    await visible(title(page, 'Overview'))
    expect(new URL(page.url()).pathname).toBe('/documentation/manual')
  })

  test('[SH-17] /documentation replaces its own history entry, so Back doesn’t bounce', async () => {
    const page = await newPage()
    await page.goto(studio.url)
    await page.goto(`${studio.url}documentation`)
    await visible(title(page, 'Overview'))
    expect(new URL(page.url()).pathname).toBe('/documentation/manual')
    await page.goBack()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  })

  test('[SH-18] Context & Skills addresses: the index opens the Platform, then an owner, its reference files, its documents at any depth, and ?mode=source', async () => {
    const page = await open('documentation/context')
    await visible(title(page, 'Platform guidance'))
    expect(new URL(page.url()).pathname).toBe('/documentation/context/platform')
    for (const [address, heading] of [
      ['prototypes', 'Prototypes'],
      ['prototypes/reference/VIEWS', 'View contract'],
      ['platform/context/working-in-studio', 'Working in the studio'],
      ['platform/context/agents/routing', 'Agent routing'],
    ] as const) {
      await page.goto(`${studio.url}documentation/context/${address}`)
      await visible(title(page, heading))
    }
    await page.goto(
      `${studio.url}documentation/context/platform/context/working-in-studio?mode=source`,
    )
    await visible(page.locator('.cm-content'))
  })

  test('[PR-138] [PR-144] the Manual lists its chapters in order under their sections, beside the open chapter', async () => {
    const page = await open('documentation/manual')
    await visible(title(page, 'Overview'))
    await expect
      .poll(() => page.title())
      .toBe('Overview — Manual — Endless Design Studio')
    await visible(page.getByText('What the studio is and how it is organized.'))
    await visible(page.getByRole('navigation', { name: 'On this page' }))
    const nav = chapters(page)
    // Canvas is on, so its chapter shows; no Lantern module, no chapter.
    // The chapter with broken metadata is skipped.
    expect(await nav.getByRole('link').allTextContents()).toEqual([
      'Overview',
      'Prototypes & systems',
      'Personal & team use',
      'Canvases',
    ])
    expect(
      await nav.getByRole('heading', { level: 3 }).allTextContents(),
    ).toEqual(['Working', 'Capabilities'])

    await nav.getByRole('link', { name: 'Personal & team use' }).click()
    await visible(title(page, 'Personal & team use'))
    expect(new URL(page.url()).pathname).toBe('/documentation/manual/team')
    await expect
      .poll(() => page.title())
      .toBe('Personal & team use — Manual — Endless Design Studio')
    // A reference, not a sequence: no previous or next chapter.
    expect(
      await page.getByRole('link', { name: /previous|next/i }).count(),
    ).toBe(0)

    const missing = await open('documentation/manual/diagrams')
    await visible(missing.getByText('Page not found'))
  })

  test('[PR-138] a link between chapters opens the chapter at its heading', async () => {
    const page = await open('documentation/manual')
    await visible(title(page, 'Overview'))
    await page
      .locator('article')
      .getByRole('link', { name: 'Prototypes & systems' })
      .click()
    await visible(title(page, 'Prototypes & systems'))
    expect(new URL(page.url()).pathname).toBe(
      '/documentation/manual/prototypes',
    )
    expect(new URL(page.url()).hash).toBe('#archive-or-delete')
  })

  test('[PR-139] header tabs switch between the Manual and Context & Skills', async () => {
    const page = await open('documentation/manual')
    const tabs = page.getByRole('navigation', {
      name: 'Documentation sections',
    })
    await visible(tabs.getByRole('link', { name: 'Manual' }))
    await tabs.getByRole('link', { name: 'Context & Skills' }).click()
    await visible(title(page, 'Platform guidance'))
    expect(new URL(page.url()).pathname).toBe('/documentation/context/platform')
    await tabs.getByRole('link', { name: 'Manual' }).click()
    await visible(title(page, 'Overview'))
  })

  test('[PR-141] right-click a chapter: Edit source, Open in editor, the file browser, Copy link and Copy path', async () => {
    const page = await open('documentation/manual')
    await visible(title(page, 'Overview'))
    writeFileSync(launchLog, '')
    await chapters(page)
      .getByRole('link', { name: 'Personal & team use' })
      .click({ button: 'right' })
    await visible(menu(page))
    const reveal =
      process.platform === 'win32'
        ? 'Show in Explorer'
        : process.platform === 'darwin'
          ? 'Reveal in Finder'
          : 'Show in folder'
    expect(await menuItems(page)).toEqual([
      'Edit source',
      'Open in editor',
      reveal,
      'Copy link',
      'Copy path',
    ])
    await menu(page).getByRole('menuitem', { name: 'Open in editor' }).click()
    await expect.poll(() => launches().length, { timeout: 30_000 }).toBe(1)
    // Explorer and Finder select the chapter; xdg-open can only open its
    // folder.
    expect(launches()[0]!.args.join(' ')).toContain(
      process.platform === 'linux' ? path.resolve(pages) : 'team.md',
    )
    await visible(
      page.getByText(/No supported code editor is installed/).first(),
    )

    await chapters(page)
      .getByRole('link', { name: 'Personal & team use' })
      .click({ button: 'right' })
    await menu(page).getByRole('menuitem', { name: 'Edit source' }).click()
    await expect.poll(() => new URL(page.url()).search).toBe('?mode=source')
    expect(new URL(page.url()).pathname).toBe('/documentation/manual/team')
  })

  test('[PR-142] [PR-143] an Admin edits a chapter in source mode, under a shared-documentation banner, and the chapter updates', async () => {
    const file = path.join(pages, 'team.md')
    const before = readFileSync(file, 'utf8')
    try {
      const page = await open('documentation/manual/team')
      await visible(title(page, 'Personal & team use'))
      await page.locator('[data-document-scroll]').click()
      await page.keyboard.press(sourceKey)
      await visible(page.getByRole('note'))
      await expect
        .poll(() => page.getByRole('note').textContent())
        .toBe(
          'Shared platform documentation. Changes affect the studio for everyone on the team.',
        )
      const editor = page.locator('.cm-content')
      await visible(editor)
      await editor.click()
      await page.keyboard.press('Control+End')
      await page.keyboard.type('\nAnyone reads the Manual.\n')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect
        .poll(() => readFileSync(file, 'utf8'))
        .toContain('Anyone reads the Manual.')
      await page.getByRole('button', { name: 'Done' }).click()
      await visible(page.getByText('Anyone reads the Manual.'))

      // An edit on disk shows while the chapter is open.
      writeFileSync(
        file,
        before.replace(
          'Admins change the studio.',
          'Admins change the configuration.',
        ),
      )
      await visible(page.getByText('Admins change the configuration.'))
    } finally {
      writeFileSync(file, before)
    }
  })

  test('[PR-143] a chapter with broken metadata stays out of the Manual and opens in source mode to be fixed', async () => {
    const page = await open('documentation/manual/broken')
    await visible(page.getByText('Page not found'))
    const source = await open('documentation/manual/broken?mode=source')
    await visible(source.locator('.cm-content'))
    await visible(
      source.locator('.cm-content').getByText('Its order is missing.'),
    )

    const file = path.join(pages, 'broken.md')
    const before = readFileSync(file, 'utf8')
    try {
      writeFileSync(
        file,
        before.replace(
          'title: Broken chapter',
          'title: Broken chapter\norder: 6',
        ),
      )
      const manual = await open('documentation/manual')
      await visible(
        chapters(manual).getByRole('link', { name: 'Broken chapter' }),
      )
    } finally {
      writeFileSync(file, before)
    }
  })

  test('[PR-157] Context & Skills lists the Platform, then a branch for each module, with kinds on hover', async () => {
    const page = await open('documentation/context/platform')
    await visible(title(page, 'Platform guidance'))
    await expect
      .poll(() => page.title())
      .toBe('Platform — Context & Skills — Endless Design Studio')
    const platformSection = docNav(page).getByRole('region', {
      name: 'Platform',
    })
    expect(
      (await platformSection.getByRole('link').allInnerTexts()).map((text) =>
        text.trim(),
      ),
    ).toEqual([
      'Platform',
      'README',
      'Agent routing',
      'Working in the studio',
      'Maintain context',
    ])
    const modulesSection = docNav(page).getByRole('region', { name: 'Modules' })
    for (const label of [
      'Canvases',
      'Documents',
      'Manual',
      'Prototypes',
      'Systems',
    ])
      await visible(
        modulesSection.getByRole('link', { name: label, exact: true }),
      )

    const entry = platformSection.getByRole('link', {
      name: /Working in the studio/,
    })
    await entry.hover()
    await visible(entry.getByText('Context', { exact: true }))
    await entry.focus()
    await visible(entry.getByText('Context', { exact: true }))
    const skill = platformSection.getByRole('link', {
      name: /Maintain context/,
    })
    await skill.hover()
    await visible(skill.getByText('Skill', { exact: true }))
  })

  test('[PR-158] module branches stay as left while browsing and open for the current document', async () => {
    const page = await open('documentation/context/platform')
    await visible(title(page, 'Platform guidance'))
    const toggle = (name: string) =>
      docNav(page).getByRole('button', { name: `Show or hide ${name}` })
    await expect
      .poll(() => toggle('Canvas').getAttribute('aria-expanded'))
      .toBe('false')
    await toggle('Canvas').click()
    await expect
      .poll(() => toggle('Canvas').getAttribute('aria-expanded'))
      .toBe('true')
    await docNav(page)
      .getByRole('link', { name: /Working in the studio/ })
      .click()
    await visible(title(page, 'Working in the studio'))
    await expect
      .poll(() => toggle('Canvas').getAttribute('aria-expanded'))
      .toBe('true')

    await page.goto(
      `${studio.url}documentation/context/prototypes/reference/VIEWS`,
    )
    await visible(title(page, 'View contract'))
    await expect
      .poll(() => toggle('Prototypes').getAttribute('aria-expanded'))
      .toBe('true')
  })

  test('[PR-159] search filters owners, entries, kinds and paths; Escape clears, then closes', async () => {
    const page = await open('documentation/context/platform')
    await visible(title(page, 'Platform guidance'))
    await docNav(page).getByRole('button', { name: 'Search' }).click()
    const field = page.getByRole('searchbox', {
      name: 'Search context and skills',
    })
    await visible(field)
    await field.fill('routing')
    await visible(docNav(page).getByRole('link', { name: /Agent routing/ }))
    await hidden(
      docNav(page).getByRole('link', { name: /Working in the studio/ }),
    )
    // A match by path inside a module branch opens it for the search.
    await field.fill('use-canvas')
    const useCanvas = docNav(page).getByRole('link', { name: /Use canvas/ })
    await visible(useCanvas)
    await field.fill('Skill')
    await visible(docNav(page).getByRole('link', { name: /Maintain context/ }))
    await field.fill('nothing like this')
    await visible(docNav(page).getByText('No matching resources'))
    await field.press('Escape')
    await expect.poll(() => field.inputValue()).toBe('')
    await expect
      .poll(() =>
        docNav(page)
          .getByRole('button', { name: 'Show or hide Canvas' })
          .getAttribute('aria-expanded'),
      )
      .toBe('false')
    await field.press('Escape')
    await hidden(field)
  })

  test('[PR-160] an owner without a README lists its Context and Skills', async () => {
    const page = await open('documentation/context/contributors')
    await visible(title(page, 'Contributors & Permissions'))
    await visible(page.getByRole('heading', { name: 'Context', level: 2 }))
    await visible(page.getByText('No context added.'))
    await visible(page.getByRole('heading', { name: 'Skills', level: 2 }))
    await visible(page.getByRole('link', { name: 'Use contributors' }).last())
  })

  test('[PR-161] [PR-111] READMEs and contract files read as documents with "About this context"; their links open in the browser', async () => {
    const page = await open('documentation/context/prototypes/reference/VIEWS')
    await visible(title(page, 'View contract'))
    await expect
      .poll(() => page.title())
      .toBe(
        'View contract — Prototypes — Context & Skills — Endless Design Studio',
      )
    await page.getByText('About this context').click()
    await visible(page.getByText(`${posix(modules)}/prototypes/VIEWS.md`))

    const doc = await open(
      'documentation/context/platform/context/working-in-studio',
    )
    await visible(title(doc, 'Working in the studio'))
    await doc.getByText('About this context').click()
    await visible(doc.getByText('Documents that link here'))
    await doc
      .getByRole('link', { name: 'Platform', exact: true })
      .last()
      .click()
    await visible(title(doc, 'Platform guidance'))

    await doc.goto(
      `${studio.url}documentation/context/platform/context/working-in-studio`,
    )
    await visible(title(doc, 'Working in the studio'))
    await doc
      .locator('article')
      .getByRole('link', { name: 'agent routing' })
      .click()
    await visible(title(doc, 'Agent routing'))
    expect(new URL(doc.url()).pathname).toBe(
      '/documentation/context/platform/context/agents/routing',
    )
    expect(new URL(doc.url()).hash).toBe('#adapters')

    // From the Manual, a link to guidance opens it too.
    const manual = await open('documentation/manual')
    await visible(title(manual, 'Overview'))
    await manual
      .getByRole('link', { name: 'Prototypes module’s README' })
      .click()
    await visible(title(manual, 'Prototypes'))
    expect(new URL(manual.url()).pathname).toBe(
      '/documentation/context/prototypes',
    )
  })

  test('[PR-162] guidance entries have file actions but no create, rename or delete; a skill’s files open from its source', async () => {
    const page = await open('documentation/context/platform')
    await visible(title(page, 'Platform guidance'))
    await docNav(page)
      .getByRole('link', { name: /Working in the studio/ })
      .click({ button: 'right' })
    await visible(menu(page))
    const items = await menuItems(page)
    expect(items.slice(0, 2)).toEqual(['Edit source', 'Open in editor'])
    expect(items.slice(-2)).toEqual(['Copy link', 'Copy path'])
    expect(items.join()).not.toMatch(/Rename|Delete|New/)
    await page.keyboard.press('Escape')

    const skill = await open(
      'documentation/context/platform/skills/maintain-context?mode=source',
    )
    const picker = skill.getByRole('combobox', { name: 'Skill file' })
    await visible(picker)
    await visible(
      skill.locator('.cm-content').getByText('name: maintain-context'),
    )
    await picker.click()
    await skill.getByRole('option', { name: 'references/checklist.md' }).click()
    await visible(
      skill.locator('.cm-content').getByText('Read the owner first.'),
    )
  })

  test('[PR-163] the navigation stays mounted with its search and scroll while documents and source mode change', async () => {
    const page = await open('documentation/context/platform')
    await visible(title(page, 'Platform guidance'))
    await docNav(page).getByRole('button', { name: 'Search' }).click()
    const field = page.getByRole('searchbox', {
      name: 'Search context and skills',
    })
    await field.fill('in the studio')
    await page.evaluate(() => {
      ;(window as unknown as { marker: Element | null }).marker =
        document.querySelector('[aria-label="Documentation"]')
    })
    await docNav(page)
      .getByRole('link', { name: /Working in the studio/ })
      .click()
    await visible(title(page, 'Working in the studio'))
    await page.locator('[data-document-scroll]').click()
    await page.keyboard.press(sourceKey)
    await visible(page.locator('.cm-content'))
    await expect.poll(() => field.inputValue()).toBe('in the studio')
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { marker: Element | null }).marker ===
          document.querySelector('[aria-label="Documentation"]'),
      ),
    ).toBe(true)
  })

  test('[PR-164] older Reference and Knowledge addresses are not found', async () => {
    for (const address of [
      'documentation/reference',
      'documentation/knowledge/platform.core',
      'reference/platform',
    ]) {
      const page = await open(address)
      await visible(page.getByText('Page not found'))
    }
  })
})

describe('with the Manual turned off', { timeout: 150_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env(false))
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  test('[PR-145] [PR-137] [PR-139] the Manual and its rail button go; Context & Skills stays', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}documentation`)
    await title(page, 'Platform guidance').waitFor({ timeout: 180_000 })
    expect(new URL(page.url()).pathname).toBe('/documentation/context/platform')
    const tabs = page.getByRole('navigation', {
      name: 'Documentation sections',
    })
    await visible(tabs.getByRole('link', { name: 'Context & Skills' }))
    expect(await tabs.getByRole('link', { name: 'Manual' }).count()).toBe(0)
    const rail = page.getByRole('navigation', { name: 'Main' })
    expect(await rail.getByRole('link', { name: 'Manual' }).count()).toBe(0)
    // Its guidance is gone from the browser too.
    expect(
      await docNav(page)
        .getByRole('link', { name: 'Manual', exact: true })
        .count(),
    ).toBe(0)
    await page.goto(`${studio.url}documentation/manual`)
    await visible(page.getByText('Page not found'))
  })
})

describe('on the deployed site', { timeout: 150_000 }, () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    // A broken chapter stops the build, so the site is built without it.
    rmSync(path.join(pages, 'broken.md'))
    site = await startStaticSite('/', env())
  }, 600_000)
  afterAll(async () => {
    await site?.stop()
  })

  test('[PR-138] [PR-141] [PR-157] the Manual and Context & Skills read the same, with Copy link and Copy path only', async () => {
    const page = await newPage()
    await page.goto(`${site.url}documentation/manual/prototypes`)
    await visible(title(page, 'Prototypes & systems'))
    await chapters(page)
      .getByRole('link', { name: 'Overview' })
      .click({ button: 'right' })
    await visible(menu(page))
    expect(await menuItems(page)).toEqual(['Copy link', 'Copy path'])
    await page.keyboard.press('Escape')

    await page.goto(`${site.url}documentation/manual/team?mode=source`)
    await visible(title(page, 'Personal & team use'))
    expect(await page.locator('.cm-content').count()).toBe(0)

    await page.goto(
      `${site.url}documentation/context/platform/context/working-in-studio`,
    )
    await visible(title(page, 'Working in the studio'))
  })
})
