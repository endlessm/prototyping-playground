// A system's Context and Skills in its navigation, on the shared file tree
// as branches: a maintainer makes documents and folders in Context, renames,
// moves (within the section) and deletes them; makes skills through New
// skill; and works inside a skill's folder under the skill rules. Someone
// who doesn't maintain the system gets read-only trees. The studio runs as
// Ben, who maintains Harbor, on a disposable copy of
// `tests/fixtures/systems-area` inside the checkout.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'trees-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'

writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: 'Trees Studio',
    tagline: 'Fixture',
    modules: { prototypes: true, systems: true, contributors: true },
    systems: ['attic', 'harbor', 'lantern'],
    defaultSystem: HARBOR,
    admins: ['ada0000000000001'],
    systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
  }),
)

const at = (file: string) => path.join(content, 'systems', file)
const exists = (file: string) => existsSync(at(file))
const read = (file: string) => readFileSync(at(file), 'utf8')

const BEN = {
  STUDIO_CONFIG: posix(path.join(content, 'studio.config.json')),
  STUDIO_SYSTEMS: posix(path.join(content, 'systems')),
  STUDIO_PROTOTYPES: posix(path.join(content, 'prototypes')),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

async function visible(locator: Locator) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function hidden(locator: Locator) {
  await expect.poll(() => locator.isVisible()).toBe(false)
}
const panel = (page: Page, name = 'Harbor') =>
  page.getByRole('complementary', { name })
const branch = (page: Page, name: 'Context' | 'Skills', system = 'Harbor') =>
  panel(page, system).locator(`[data-nav-entry="${name}"]`)
const row = (scope: Locator, file: string) =>
  scope.locator(`[data-tree-path="${file}"]`)
const link = (scope: Locator, name: string) =>
  scope.getByRole('link', { name, exact: true })
const field = (page: Page) => page.getByRole('textbox', { name: 'Name' })
const pathOf = (page: Page) => new URL(page.url()).pathname
const WINDOWS = process.platform === 'win32'
const TRASH = WINDOWS ? 'the Recycle Bin' : 'the Trash'

describe('in the studio running locally', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  /** A system's page, once its trees have the files from the dev server. */
  async function open(address = `systems/${HARBOR}`, system = 'Harbor') {
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    for (const name of ['Context', 'Skills'] as const) {
      await visible(branch(page, name, system))
      await expect
        .poll(() => branch(page, name, system).getAttribute('aria-busy'))
        .toBeNull()
    }
    return page
  }

  test('[SH-93] Context and Skills are branches: their headings open their pages, fold, and remember their folders', async () => {
    const page = await open()
    const context = branch(page, 'Context')
    await link(context, 'Context').click()
    await expect.poll(() => pathOf(page)).toBe(`/systems/${HARBOR}/context`)

    // A folder folds, and stays folded on another page.
    await visible(link(context, 'Signing in'))
    await row(context, 'flows').click()
    await hidden(link(context, 'Signing in'))
    await link(panel(page), 'Libraries').click()
    await expect.poll(() => pathOf(page)).toBe(`/systems/${HARBOR}/libraries`)
    expect(await link(context, 'Signing in').isVisible()).toBe(false)
    // Expand all opens it again.
    await panel(page).getByRole('button', { name: 'Expand all' }).click()
    await visible(link(context, 'Signing in'))

    // The branch itself folds.
    const toggle = context.getByRole('button', { name: 'Show or hide Context' })
    expect(await toggle.getAttribute('aria-expanded')).toBe('true')
    await toggle.click()
    await hidden(link(context, 'Voice and tone'))
    await toggle.click()
    await visible(link(context, 'Voice and tone'))

    // Each skill is its folder, with its files under it.
    const skills = branch(page, 'Skills')
    await visible(link(skills, 'Build flow'))
    await visible(link(skills, 'steps.md'))
    await visible(link(skills, 'check.mjs'))
    await link(skills, 'check.mjs').click()
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/skills/build-flow/scripts/check.mjs`)
  })

  test('[SH-93] an empty section says so, and someone who doesn’t maintain the system can’t change it', async () => {
    const page = await open(`systems/${LANTERN}`, 'Lantern')
    for (const name of ['Context', 'Skills'] as const) {
      const section = branch(page, name, 'Lantern')
      await visible(section.getByText('Empty folder'))
      expect(
        await section.getByRole('button', { name: 'New', exact: true }).count(),
      ).toBe(0)
    }
  })

  test('[SY-124] Context: New document and New folder, rename, move within the section and delete', async () => {
    const page = await open()
    const context = branch(page, 'Context')
    await context.getByRole('button', { name: 'New', exact: true }).click()
    const menu = page.getByRole('menu')
    await visible(menu.getByRole('menuitem', { name: 'New document' }))
    expect(
      await menu
        .getByRole('menuitem')
        .evaluateAll((items) => items.map((item) => item.textContent?.trim())),
    ).toEqual(['New document', 'New folder'])
    await menu.getByRole('menuitem', { name: 'New document' }).click()
    await field(page).fill('checkout')
    await field(page).press('Enter')
    // It ends in .md, and opens.
    await expect.poll(() => exists('harbor/context/checkout.md')).toBe(true)
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/context/checkout`)
    await visible(page.getByRole('heading', { name: 'Checkout', level: 1 }))

    await context.getByRole('button', { name: 'New', exact: true }).click()
    await page.getByRole('menuitem', { name: 'New folder' }).click()
    await field(page).fill('research')
    await field(page).press('Enter')
    await expect.poll(() => exists('harbor/context/research')).toBe(true)

    // A document keeps .md, and can't become another kind of file.
    await link(context, 'Checkout').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('notes.txt')
    await field(page).press('Enter')
    await visible(
      page
        .getByText('Context documents are Markdown files, and end in .md.')
        .first(),
    )
    await link(context, 'Checkout').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('decisions')
    await field(page).press('Enter')
    await expect.poll(() => exists('harbor/context/decisions.md')).toBe(true)
    // The open page follows its file.
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/context/decisions`)

    // Dragged into a folder of Context; never into Skills.
    await visible(row(context, 'decisions.md'))
    await row(context, 'decisions.md').dragTo(
      row(branch(page, 'Skills'), 'build-flow'),
    )
    await row(context, 'decisions.md').dragTo(row(context, 'research'))
    await expect
      .poll(() => exists('harbor/context/research/decisions.md'))
      .toBe(true)
    expect(exists('harbor/skills/build-flow/decisions.md')).toBe(false)
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/context/research/decisions`)

    // Deleting asks first, goes to the trash, and leaves the page.
    await row(context, 'research/decisions.md').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete “Checkout”?' })
    await visible(dialog)
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect
      .poll(() => exists('harbor/context/research/decisions.md'))
      .toBe(false)
    await visible(page.getByText(`Moved “Checkout” to ${TRASH}`).first())
    await expect.poll(() => pathOf(page)).toBe(`/systems/${HARBOR}/context`)
  })

  test('[SY-125] New skill checks its name and description as you type, then makes the folder and its SKILL.md', async () => {
    const page = await open()
    const skills = branch(page, 'Skills')
    await skills.getByRole('button', { name: 'New', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'New skill' })
    await visible(dialog)
    const create = dialog.getByRole('button', { name: 'Create skill' })
    expect(await create.isDisabled()).toBe(true)

    const name = dialog.getByRole('textbox', { name: 'Name' })
    const description = dialog.getByRole('textbox', { name: 'Description' })
    await visible(dialog.getByText('What it does, and when to use it.'))
    await name.fill('Review')
    await visible(
      dialog.getByText(
        'A skill’s name can use only lowercase letters, numbers and single hyphens, and can’t start or end with a hyphen.',
      ),
    )
    await name.fill('build-flow')
    await description.fill('Reviews a design. Use when asked for a critique.')
    expect(await create.isDisabled()).toBe(false)
    // A name that is taken comes back from the dev server.
    await create.click()
    await visible(dialog.getByRole('alert'))
    expect(await dialog.getByRole('alert').textContent()).toContain(
      'Something named “build-flow” already exists here.',
    )

    await name.fill('review-design')
    await create.click()
    await hidden(dialog)
    await expect
      .poll(() => exists('harbor/skills/review-design/SKILL.md'))
      .toBe(true)
    expect(read('harbor/skills/review-design/SKILL.md')).toBe(
      '---\nname: review-design\ndescription: Reviews a design. Use when asked for a critique.\n---\n\nSay what to do, step by step, and when it applies.\n',
    )
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/skills/review-design/SKILL`)
    await visible(link(skills, 'Review design'))
  })

  test('[SY-20] [SY-41] the command palette offers the system’s actions you may take, and runs them', async () => {
    const page = await open(`systems/${HARBOR}/context`)
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search the studio')
    await visible(input)
    // Ben maintains Harbor: he may rename it, nothing more, and isn't an
    // Admin, so there is no New system.
    await input.fill('Harbor')
    await visible(page.getByRole('option', { name: 'Rename Harbor' }))
    for (const name of ['Archive Harbor', 'Delete Harbor'])
      expect(await page.getByRole('option', { name }).count()).toBe(0)
    await input.fill('New system')
    await expect
      .poll(() => page.getByRole('option', { name: 'New system' }).count())
      .toBe(0)
    await input.fill('Rename Harbor')
    await page.getByRole('option', { name: 'Rename Harbor' }).click()
    const dialog = page.getByRole('dialog', { name: 'Rename system' })
    await visible(dialog)
    await expect.poll(() => new URL(page.url()).search).toBe('')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await hidden(dialog)
  })

  test('[SY-126] inside a skill: New file and New folder; the skill renames and deletes as a whole, and never moves', async () => {
    const page = await open(`systems/${HARBOR}/skills/build-flow/SKILL`)
    const skills = branch(page, 'Skills')
    const skill = row(skills, 'build-flow')
    await visible(skill)
    // A skill's folder can't be dragged anywhere.
    expect(await skill.getAttribute('draggable')).toBe('false')

    await link(skills, 'Build flow').click({ button: 'right' })
    const menu = page.getByRole('menu')
    await visible(menu.getByRole('menuitem', { name: 'New file' }))
    await visible(menu.getByRole('menuitem', { name: 'New folder' }))
    await visible(menu.getByRole('menuitem', { name: 'Rename' }))
    await visible(menu.getByRole('menuitem', { name: 'Delete' }))
    await menu.getByRole('menuitem', { name: 'New file' }).click()
    await field(page).fill('notes.txt')
    await field(page).press('Enter')
    await expect
      .poll(() => exists('harbor/skills/build-flow/notes.txt'))
      .toBe(true)
    // A new text file opens.
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/skills/build-flow/notes.txt`)

    // Renaming the skill renames its folder and its SKILL.md's name.
    await link(skills, 'Build flow').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('Build')
    await field(page).press('Enter')
    await visible(
      page.getByText(/^A skill’s name can use only lowercase letters/).first(),
    )
    await link(skills, 'Build flow').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await field(page).fill('make-flow')
    await field(page).press('Enter')
    await expect
      .poll(() => exists('harbor/skills/make-flow/scripts/check.mjs'))
      .toBe(true)
    // The folder moves first; its SKILL.md's name follows a moment later.
    await expect
      .poll(() => read('harbor/skills/make-flow/SKILL.md'))
      .toMatch(/^---\r?\nname: make-flow\r?\n/)
    // The open page follows into the renamed folder.
    await expect
      .poll(() => pathOf(page))
      .toBe(`/systems/${HARBOR}/skills/make-flow/notes.txt`)

    // Deleting the skill deletes the whole folder.
    await visible(link(skills, 'Make flow'))
    await link(skills, 'Make flow').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete “Make flow”?' })
    await visible(dialog)
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect.poll(() => exists('harbor/skills/make-flow')).toBe(false)
    await expect.poll(() => pathOf(page)).toBe(`/systems/${HARBOR}/skills`)
  })
})
