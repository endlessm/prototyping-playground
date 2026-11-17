// The Lab's Variants tab: a designer opens a component's Variants and sees
// every example of its examples file side by side, each rendered alone in
// the system's preview document and titled as its Systems page titles it.
// Two columns when the bench is wide, one when it's narrow; an example that
// needs the width takes the whole row. A broken example fails alone, a
// component without examples says which file to add, and locally the grid
// follows the file on disk. The Endless Studios button runs on the real
// systems; the rest on a disposable copy of `tests/fixtures/systems-area`
// with components added to Harbor, as Ben, who maintains it.
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
import type { FrameLocator, Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'lab-variants-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })
const empty = mkdtempSync(path.join('.e2e', 'lab-variants-prototypes-'))

const HARBOR = 'hrbr000000000001'
const ENDLESS_STUDIOS = '8x5spen6xtvp96a9'
const at = (file: string) => path.join(content, 'systems', 'harbor', file)
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  if (!existsSync(at(file)) || readFileSync(at(file), 'utf8') !== text)
    writeFileSync(at(file), text)
}

const BUTTON = `<script setup lang="ts">
defineProps<{ label: string }>()
</script>
<template><button>{{ label }}</button></template>
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
  <Example name="Block">
    <HarborButton label="Board the ferry" style="width: 100%" />
  </Example>
  <Example name="Timetable">
    <table style="width: 720px; table-layout: fixed">
      <tr><td>Ferry</td><td>Dawn</td><td>Dusk</td></tr>
    </table>
  </Example>
  <Example name="Tide"><HarborButton label="Check the tide" /></Example>
</template>
`
function setUp() {
  write('components/button/button.vue', BUTTON)
  write(
    'components/button/button.md',
    '---\ntitle: Button\ndescription: Starts an action.\n---\n\n## When to use\n\nOn the dock.\n',
  )
  write('components/button/button.examples.vue', EXAMPLES)
  write(
    'components/card/card.md',
    '---\ntitle: Card\ndescription: Holds one thing.\n---\n\n## When to use\n\nAlways.\n',
  )
}
setUp()

writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: 'Variants Studio',
    tagline: 'Fixture',
    modules: { prototypes: true, systems: true, contributors: true, lab: true },
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
// The repository's own systems and settings, with no prototypes.
const REAL = {
  STUDIO_PROTOTYPES: posix(empty),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(empty, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 60_000 }).toBe(true)
}
const heading = (scope: Page | Locator, name: string) =>
  scope.getByRole('heading', { name, exact: true })
const example = (page: Page, title: string): FrameLocator =>
  page.frameLocator(`iframe[title="${title}"]`)
const card = (page: Page, title: string): Locator =>
  page.locator('[data-variant]').filter({ has: heading(page, title) })
const frameState = (page: Page, title: string) =>
  page
    .locator('[data-preview-state]')
    .filter({ has: page.locator(`iframe[title="${title}"]`) })
    .getAttribute('data-preview-state')
async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (!found) throw new Error('Not on screen')
  return found
}
const variants = (system: string, slug: string) =>
  `lab/${system}/${slug}/variants`
const code = (page: Page, title: string) =>
  card(page, title).locator('[data-variant-code] pre')
async function showCode(page: Page, title: string) {
  await card(page, title).getByRole('button', { name: 'Show code' }).click()
  await visible(code(page, title))
  return ((await code(page, title).textContent()) ?? '').trim()
}
// The first code block makes Vite optimize Shiki and reload the page.
async function warmUpCode(page: Page) {
  await card(page, 'Default').getByRole('button', { name: 'Show code' }).click()
  await code(page, 'Default')
    .waitFor({ timeout: 120_000 })
    .catch(() => undefined)
  await page.reload()
  await heading(page, 'Default').waitFor({ timeout: 120_000 })
}

const BUTTON_EXAMPLES: [title: string, text: string][] = [
  ['Default', 'Invite Learners'],
  ['Common pairs', 'Save Changes'],
  ['Variants', 'Outline'],
  ['Colors', 'Kids'],
  ['Sizes', 'Extra Large'],
  ['With icons', 'Next Step'],
  ['States', 'Publishing'],
  ['Kids gating', 'Ask a Parent'],
  ['Contrast', 'Watch Trailer'],
  ['Block', 'Log In'],
]

function endlessStudiosScenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    const page = await newPage()
    await page.goto(`${studio.url}${variants(ENDLESS_STUDIOS, 'button')}`)
    await heading(page, 'Default').waitFor({ timeout: 300_000 })
    await warmUpCode(page)
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await studio?.stop()
  })

  test('[LAB-21] every example of the Endless Studios button renders in the grid, titled as on its Systems page', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${variants(ENDLESS_STUDIOS, 'button')}`)
    for (const [title, text] of BUTTON_EXAMPLES) {
      await visible(heading(card(page, title), title))
      await visible(example(page, title).getByText(text, { exact: true }))
    }
    expect(await page.locator('[data-variant]').count()).toBe(
      BUTTON_EXAMPLES.length,
    )
    expect(await page.title()).toContain('Variants — Button — Lab')
    // In the Systems page's order and with its titles.
    const titles = await page
      .locator('[data-variant] h3')
      .evaluateAll((all) => all.map((element) => element.textContent?.trim()))
    expect(titles).toEqual(BUTTON_EXAMPLES.map(([title]) => title))
    await page.goto(`${studio.url}systems/${ENDLESS_STUDIOS}/components/button`)
    await visible(heading(page, 'Block'))
    for (const [title] of BUTTON_EXAMPLES) await visible(heading(page, title))
  })

  test('[LAB-31] each variant shows only its own block, dedented, and copies it', async () => {
    const page = await newPage()
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: new URL(studio.url).origin,
      })
    await page.goto(`${studio.url}${variants(ENDLESS_STUDIOS, 'button')}`)
    await visible(heading(page, 'States'))
    expect(await code(page, 'States').count()).toBe(0)
    expect(await showCode(page, 'States')).toBe(
      [
        '<UButton loading>Publishing</UButton>',
        '<UButton disabled>Publish</UButton>',
        '<UButton color="neutral" variant="outline" disabled>Cancel</UButton>',
      ].join('\n'),
    )
    // Only that variant's code opened.
    expect(await page.locator('[data-variant-code] pre').count()).toBe(1)
    await card(page, 'Block')
      .getByRole('button', { name: 'Copy code for Block', exact: true })
      .click()
    await visible(
      page.locator('[data-slot="title"]').filter({ hasText: 'Code copied' }),
    )
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      '<UButton block icon="i-lucide-log-in">Log In</UButton>',
    )
  })

  test('[LAB-31] a copy the browser blocks says so in plain words, with what to do instead', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${variants(ENDLESS_STUDIOS, 'button')}`)
    await visible(heading(page, 'States'))
    await page.evaluate(() => {
      navigator.clipboard.writeText = () =>
        Promise.reject(
          new DOMException('Document is not focused.', 'NotAllowedError'),
        )
    })
    await card(page, 'States')
      .getByRole('button', { name: 'Copy code for States', exact: true })
      .click()
    await visible(
      page
        .locator('[data-slot="description"]')
        .filter({ hasText: 'Your browser blocked the clipboard.' }),
    )
    expect(await page.getByText(/Document is not focused/).count()).toBe(0)
  })

  test('[LAB-21] the cards of a row line up, their code buttons at the same height', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${variants(ENDLESS_STUDIOS, 'button')}`)
    await visible(heading(page, 'Common pairs'))
    const showCodeOf = (title: string) =>
      card(page, title).getByRole('button', { name: 'Show code' })
    await visible(showCodeOf('Common pairs'))
    const [left, right] = await Promise.all([
      box(card(page, 'Default')),
      box(card(page, 'Common pairs')),
    ])
    // Side by side, in one row of two columns.
    expect(Math.abs(left.y - right.y)).toBeLessThan(2)
    expect(right.x).toBeGreaterThan(left.x)
    const [a, b] = await Promise.all([
      box(showCodeOf('Default')),
      box(showCodeOf('Common pairs')),
    ])
    expect(Math.abs(a.y - b.y)).toBeLessThan(2)
  })
}

function harborScenarios(
  start: () => Promise<RunningStudio>,
  { local }: { local: boolean },
) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    const page = await newPage()
    await page.goto(`${studio.url}${variants(HARBOR, 'button')}`)
    await heading(page, 'Default').waitFor({ timeout: 300_000 })
    await warmUpCode(page)
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address = variants(HARBOR, 'button')) {
    setUp()
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    return page
  }

  test('[LAB-21] two columns on a wide bench; an example that needs the width takes the row', async () => {
    const page = await open()
    await visible(example(page, 'Default').getByText('Moor the boat'))
    await visible(example(page, 'With icon').getByText('⚓ Anchor'))
    const first = await box(card(page, 'Default'))
    const second = await box(card(page, 'With icon'))
    expect(second.y).toBeCloseTo(first.y, 0)
    expect(second.x).toBeGreaterThan(first.x + first.width / 2)
    // A stretched button and a fixed-width table each span both columns.
    const row = first.width + second.width
    for (const wide of ['Block', 'Timetable'])
      await expect
        .poll(async () => (await box(card(page, wide))).width, {
          timeout: 60_000,
        })
        .toBeGreaterThan(row)
    expect((await box(card(page, 'Tide'))).width).toBeCloseTo(first.width, 0)
  })

  test('[LAB-21] one column on a narrow window', async () => {
    const page = await open()
    await page.setViewportSize({ width: 760, height: 900 })
    await visible(example(page, 'With icon').getByText('⚓ Anchor'))
    const first = await box(card(page, 'Default'))
    const second = await box(card(page, 'With icon'))
    expect(second.x).toBeCloseTo(first.x, 0)
    expect(second.y).toBeGreaterThan(first.y + first.height - 1)
  })

  test('[LAB-22] an example that throws fails alone, with its error in its place', async () => {
    const page = await open()
    await expect
      .poll(() => frameState(page, 'Broken'), { timeout: 60_000 })
      .toBe('error')
    await visible(
      card(page, 'Broken').getByText('This example couldn’t render.'),
    )
    expect(await frameState(page, 'Default')).toBe('ready')
    await visible(example(page, 'Tide').getByText('Check the tide'))
    // Its code still shows, to see what broke.
    expect(await showCode(page, 'Broken')).toBe(
      '<HarborButton :label="missing.boom" />',
    )
  })

  test('[LAB-22] a component without examples says which file to add', async () => {
    const page = await open(variants(HARBOR, 'card'))
    await visible(page.getByText('card.examples.vue'))
    await visible(page.getByText(/No examples yet/))
    expect(await page.locator('[data-variant]').count()).toBe(0)
  })

  test.runIf(local)(
    '[LAB-23] [LAB-31] the grid and each variant’s code follow the examples file as it changes on disk',
    async () => {
      const page = await open()
      await visible(example(page, 'Default').getByText('Moor the boat'))
      write(
        'components/button/button.examples.vue',
        EXAMPLES.replace(
          '</template>\n',
          '  <Example name="GoAshore"><HarborButton label="Go ashore" /></Example>\n</template>\n',
        ).replace('Moor the boat', 'Moor the dinghy'),
      )
      await visible(heading(page, 'Go ashore'))
      await visible(example(page, 'Go ashore').getByText('Go ashore'))
      await visible(example(page, 'Default').getByText('Moor the dinghy'))
      await card(page, 'Go ashore')
        .getByRole('button', { name: 'Show code' })
        .click()
      await expect
        .poll(
          async () =>
            (
              (await code(page, 'Go ashore')
                .textContent()
                .catch(() => '')) ?? ''
            ).trim(),
          { timeout: 60_000 },
        )
        .toBe('<HarborButton label="Go ashore" />')
      setUp()
    },
  )
}

describe(
  'the Endless Studios button, running locally',
  { timeout: 180_000 },
  () => {
    endlessStudiosScenarios(() => startDevServer(REAL))
  },
)

describe('the Endless Studios button, deployed', { timeout: 180_000 }, () => {
  endlessStudiosScenarios(() => startStaticSite('/', REAL))
})

describe('in the studio running locally', { timeout: 180_000 }, () => {
  harborScenarios(() => startDevServer(BEN), { local: true })
})

describe('the deployed site', { timeout: 180_000 }, () => {
  harborScenarios(() => startStaticSite('/', ENV), { local: false })
})
