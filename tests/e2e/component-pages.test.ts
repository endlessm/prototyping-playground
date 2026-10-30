// Component pages: a designer opens one of a system's components and reads
// its guidance, live examples (each in the system's preview document) with
// their code, where it comes from, and its props read from its code. Parts
// a component lacks say which file to add; files that can't load say so
// without hiding the rest. Locally, the page follows its files on disk, and
// source mode edits them in tabs. The deployed site shows the same pages,
// read-only. The studio runs as Ben, who maintains Harbor, on a disposable
// copy of `tests/fixtures/systems-area` with components added.
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
import type { FrameLocator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'components-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const HARBOR = 'hrbr000000000001'
const at = (file: string) => path.join(content, 'systems', 'harbor', file)
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  if (!existsSync(at(file)) || readFileSync(at(file), 'utf8') !== text)
    writeFileSync(at(file), text)
}

const LONG_TYPE = Array.from({ length: 12 }, (_, i) => `'harbor-${i}'`).join(
  ' | ',
)
const BUTTON = `<script setup lang="ts">
withDefaults(
  defineProps<{
    /** What the button says. */
    label: string
    tone?: 'calm' | 'loud'
    kind?: ${LONG_TYPE}
  }>(),
  { tone: 'calm' },
)
</script>
<template><button class="rounded bg-sky-700 px-3 py-1 text-white">{{ label }}</button></template>
`
const PAGE = `---
title: Button
description: Starts an action.
source: Harbor's own button, drawn for the docks.
docs: https://docs.harbor.example/button
---

## When to use

For actions on the dock.
`
const EXAMPLES = `<script setup lang="ts">
import { Example } from '#studio/examples'
import HarborButton from './button.vue'
const missing = undefined as unknown as { boom: string }
</script>

<template>
  <Example name="Default"><HarborButton label="Moor the boat" /></Example>
  <Example name="WithIcon"><HarborButton label="⚓ Anchor" /></Example>
  <Example name="Broken"><HarborButton :label="missing.boom" /></Example>
</template>
`
function setUp() {
  write('components/button/button.vue', BUTTON)
  write('components/button/button.md', PAGE)
  write('components/button/button.examples.vue', EXAMPLES)
  write(
    'components/card/card.md',
    '---\ntitle: Card\ndescription: Holds one thing.\n---\n\n## When to use\n\nAlways.\n',
  )
  write('components/Badge.vue', '<template><span>Badge</span></template>\n')
  write('components/Broken.vue', '<script setup lang="ts">\nconst = \n')
  write(
    'overview.vue',
    '<template><p class="harbor-own">Harbor’s own words, in its own look.</p></template>\n',
  )
}
setUp()

writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: 'Components Studio',
    tagline: 'Fixture',
    modules: { prototypes: true, systems: true, contributors: true },
    systems: ['attic', 'harbor', 'lantern'],
    defaultSystem: HARBOR,
    admins: ['ada0000000000001'],
    systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
  }),
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
const heading = (page: Page, name: string) =>
  page.getByRole('heading', { name, exact: true })
const tooltip = (page: Page, text: string) =>
  page.locator('[data-slot="content"][data-side]').filter({ hasText: text })
const example = (page: Page, title: string): FrameLocator =>
  page.frameLocator(`iframe[title="${title}"]`)
const frameState = (page: Page, title: string) =>
  page
    .locator('[data-preview-state]')
    .filter({ has: page.locator(`iframe[title="${title}"]`) })
    .getAttribute('data-preview-state')
const button = `systems/${HARBOR}/components/button`

describe('in the studio running locally', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
    // The first page builds the preview document and reads the props;
    // later pages are quicker.
    const page = await newPage()
    await page.goto(`${studio.url}${button}`)
    await heading(page, 'Examples').waitFor({ timeout: 300_000 })
    // The first code block makes Vite optimize Shiki and reload the page.
    await page.getByRole('button', { name: 'Show code' }).click()
    await page
      .getByText("import HarborButton from './button.vue'")
      .waitFor({ timeout: 120_000 })
      .catch(() => undefined)
    await page.reload()
    await heading(page, 'Examples').waitFor({ timeout: 120_000 })
    await page.close()
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address = button) {
    setUp()
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    return page
  }

  test('[SY-102] [SY-103] [SY-104] the page reads title, guidance, Examples, Source, then Props', async () => {
    const page = await open()
    await visible(heading(page, 'Button'))
    await visible(page.getByText('Starts an action.'))
    await visible(heading(page, 'When to use'))
    await visible(page.getByText('For actions on the dock.'))
    const order = await page
      .locator('h1, h2')
      .evaluateAll((all) => all.map((element) => element.textContent?.trim()))
    const index = (text: string) =>
      order.findIndex((entry) => entry?.startsWith(text))
    expect(index('Button')).toBeGreaterThanOrEqual(0)
    expect(index('When to use')).toBeGreaterThan(index('Button'))
    expect(index('Examples')).toBeGreaterThan(index('When to use'))
    expect(index('Source')).toBeGreaterThan(index('Examples'))
    expect(index('Props')).toBeGreaterThan(index('Source'))
    expect(await page.title()).toContain('Button — Components — Harbor')
  })

  test('[SY-105] each example renders alone in the system’s preview document, titled in sentence case', async () => {
    const page = await open()
    await visible(heading(page, 'Default'))
    await visible(heading(page, 'With icon'))
    await visible(example(page, 'Default').getByText('Moor the boat'))
    await visible(example(page, 'With icon').getByText('⚓ Anchor'))
    // Only its own example: the frame doesn't hold the others.
    expect(await example(page, 'Default').getByText('⚓ Anchor').count()).toBe(
      0,
    )
    const src = await page
      .locator('iframe[title="Default"]')
      .getAttribute('src')
    expect(src).toContain(`/_preview/${HARBOR}/`)
  })

  test('[SY-111] an example that throws fails alone, with its error in its place', async () => {
    const page = await open()
    await expect
      .poll(() => frameState(page, 'Broken'), { timeout: 45_000 })
      .toBe('error')
    await visible(page.getByText('This example couldn’t render.'))
    expect(await frameState(page, 'Default')).toBe('ready')
    await visible(example(page, 'Default').getByText('Moor the boat'))
  })

  test('[SY-106] Show code shows the examples file as written', async () => {
    const page = await open()
    const show = page.getByRole('button', { name: 'Show code' })
    await visible(show)
    expect(
      await page.getByText("import HarborButton from './button.vue'").count(),
    ).toBe(0)
    await show.click()
    await visible(page.getByText("import HarborButton from './button.vue'"))
  })

  test('[SY-108] Source links its library, says where it comes from, links its docs and names the file', async () => {
    const page = await open()
    const library = page.getByRole('link', { name: 'Vue in Libraries' })
    await visible(library)
    expect(await library.getAttribute('href')).toBe(
      `/systems/${HARBOR}/libraries#vue`,
    )
    await visible(page.getByText("Harbor's own button, drawn for the docks."))
    const docs = page.getByRole('link', { name: 'Component docs' })
    expect(await docs.getAttribute('href')).toBe(
      'https://docs.harbor.example/button',
    )
    await visible(
      page.getByText(`${posix(at('components/button/button.vue'))}`),
    )
  })

  test('[SY-110] Props start closed, count the props, and read them from the code', async () => {
    const page = await open()
    const props = page.getByRole('button', { name: /^Props/ })
    await visible(props)
    expect(await props.textContent()).toContain('1 component · 3 props')
    expect(await props.getAttribute('aria-expanded')).toBe('false')
    await props.click()
    const table = page.getByRole('table')
    await visible(table)
    const rows = table.locator('tbody').getByRole('row')
    await expect.poll(() => rows.count()).toBe(3)
    expect(await rows.nth(0).textContent()).toContain('label')
    expect(await rows.nth(0).textContent()).toContain('*')
    expect(await rows.nth(1).textContent()).toContain('"calm"')
    // The description is a tooltip on the prop's name.
    await table.getByText('label', { exact: true }).hover()
    await visible(tooltip(page, 'What the button says.'))
    // A long type ends in an ellipsis, whole on focus.
    const long = table.getByText(/^"harbor-0"/)
    await long.focus()
    await visible(tooltip(page, '"harbor-11"'))
    await visible(page.getByText('Also accepts every native attribute'))
  })

  test('[SY-107] missing parts say which file to add', async () => {
    const card = await open(`systems/${HARBOR}/components/card`)
    await visible(heading(card, 'Card'))
    await visible(card.getByText(/No examples yet\. Add card\.examples\.vue/))
    const badge = await open(`systems/${HARBOR}/components/badge`)
    await visible(heading(badge, 'Badge'))
    await visible(badge.getByText(/No page yet\. Add Badge\.md/))
    const props = badge.getByRole('button', { name: /^Props/ })
    await visible(props)
    expect(await props.textContent()).toContain('1 component · 0 props')
    await props.click()
    await visible(
      badge.getByText(
        'Accepts every native attribute of the element it renders.',
      ),
    )
  })

  test('[SY-111] files that can’t load are listed with Try again; the rest still shows', async () => {
    const page = await open(`systems/${HARBOR}/components/broken`)
    await visible(page.getByText('Some component files couldn’t load.'))
    await visible(page.getByText(/^Broken\.vue: /))
    await visible(heading(page, 'Examples'))
    await visible(page.getByRole('button', { name: 'Try again' }))
  })

  test('[SY-112] the page follows its files as they change on disk', async () => {
    const page = await open()
    await visible(heading(page, 'Default'))
    write(
      'components/button/button.md',
      PAGE.replace('For actions on the dock.', 'For every action on the dock.'),
    )
    await visible(page.getByText('For every action on the dock.'))
    write(
      'components/button/button.examples.vue',
      EXAMPLES.replace(
        '</template>\n',
        '  <Example name="Ashore"><HarborButton label="Go ashore" /></Example>\n</template>\n',
      ),
    )
    await visible(heading(page, 'Ashore'))
    await visible(example(page, 'Ashore').getByText('Go ashore'))
  })

  test('[SY-67] the Overview shows the system’s own content, in its own document', async () => {
    const page = await open(`systems/${HARBOR}`)
    const own = example(page, 'Harbor’s own overview')
    await visible(own.getByText('Harbor’s own words, in its own look.'))
  })

  test('[SY-116] [SY-120] source mode opens the files in tabs, without rendering the page', async () => {
    const page = await open(`${button}?mode=source`)
    const tabs = page.getByRole('tablist')
    await visible(tabs)
    for (const name of ['Page', 'Examples', 'Component'])
      await visible(tabs.getByRole('tab', { name }))
    expect(await page.locator('iframe').count()).toBe(0)
    const source = page.getByRole('textbox', {
      name: `Source of ${posix(at('components/button/button.md'))}`,
    })
    await visible(source)
    await source.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' Edited.')
    await tabs.getByRole('tab', { name: 'Examples' }).click()
    const dialog = page.getByRole('dialog', { name: 'Discard your changes?' })
    await visible(dialog)
    await dialog.getByRole('button', { name: 'Keep editing' }).click()
    await visible(source)
    await tabs.getByRole('tab', { name: 'Examples' }).click()
    await visible(dialog)
    await dialog.getByRole('button', { name: 'Discard' }).click()
    await visible(
      page.getByRole('textbox', {
        name: `Source of ${posix(at('components/button/button.examples.vue'))}`,
      }),
    )
  })

  test('[SY-117] [SY-120] a missing examples file can be created from a template; a broken component still opens', async () => {
    const page = await open(`systems/${HARBOR}/components/badge?mode=source`)
    const tabs = page.getByRole('tablist')
    await visible(tabs)
    await tabs.getByRole('tab', { name: 'Examples' }).click()
    await visible(
      page.getByText('This component has no Badge.examples.vue yet.'),
    )
    await visible(
      page.getByText(
        'Create the files this component is missing, from a template.',
      ),
    )
    await page.getByRole('button', { name: 'Create files' }).click()
    await expect
      .poll(() => existsSync(at('components/Badge/Badge.examples.vue')), {
        timeout: 30_000,
      })
      .toBe(true)
    rmSync(at('components/Badge'), { recursive: true, force: true })

    const broken = await open(`systems/${HARBOR}/components/broken?mode=source`)
    await visible(
      broken.getByRole('textbox', {
        name: `Source of ${posix(at('components/Broken.vue'))}`,
      }),
    )
  })
})

describe('the deployed site', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let site: Awaited<ReturnType<typeof startStaticSite>>
  beforeAll(async () => {
    setUp()
    site = await startStaticSite('/', ENV)
  }, 600_000)
  afterAll(async () => {
    await site?.stop()
  })

  test('[SY-105] [SY-110] component pages are published with their examples and props, read-only', async () => {
    const page = await newPage()
    await page.goto(`${site.url}${button}`)
    await visible(heading(page, 'Button'))
    await visible(example(page, 'Default').getByText('Moor the boat'))
    await page.getByRole('button', { name: /^Props/ }).click()
    await visible(page.getByRole('table'))
    await page.goto(`${site.url}${button}?mode=source`)
    await visible(heading(page, 'Button'))
    expect(await page.getByRole('tablist').count()).toBe(0)
  })
})
