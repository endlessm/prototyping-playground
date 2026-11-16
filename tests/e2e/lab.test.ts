// The Lab: a designer opens a system's components from the rail, picks one
// from the list beside the bench, and moves between its Overview, Variants
// and Playground tabs, each at its own address. Overview reads as the
// component's Systems page does, and the two link to each other. The
// studio runs as Ben, who maintains Harbor, on a disposable copy of
// `tests/fixtures/systems-area` with components added to Harbor and to
// Lantern, so two active systems have components.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'lab-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const STUDIO = 'Lab Studio'
const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'
function write(system: string, file: string, text: string) {
  const at = path.join(content, 'systems', system, file)
  mkdirSync(path.dirname(at), { recursive: true })
  writeFileSync(at, text)
}

write(
  'harbor',
  'components/button/button.vue',
  `<script setup lang="ts">
withDefaults(
  defineProps<{
    /** What the button says. */
    label: string
    tone?: 'calm' | 'loud'
  }>(),
  { tone: 'calm' },
)
</script>
<template><button>{{ label }}</button></template>
`,
)
write(
  'harbor',
  'components/button/button.md',
  `---
title: Button
description: Starts an action.
source: Harbor's own button, drawn for the docks.
---

## When to use

For actions on the dock.
`,
)
write(
  'harbor',
  'components/button/button.examples.vue',
  `<script setup lang="ts">
import { Example } from '#studio/examples'
import HarborButton from './button.vue'
</script>

<template>
  <Example name="Default"><HarborButton label="Moor the boat" /></Example>
</template>
`,
)
write(
  'harbor',
  'components/card/card.md',
  '---\ntitle: Card\ndescription: Holds one thing.\n---\n\n## When to use\n\nAlways.\n',
)
write(
  'lantern',
  'components/lamp/lamp.md',
  '---\ntitle: Lamp\ndescription: Lights the way.\n---\n\n## When to use\n\nAt night.\n',
)

writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: STUDIO,
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

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
const heading = (page: Page, name: string) =>
  page.getByRole('heading', { name, exact: true })
const link = (scope: Page | Locator, name: string) =>
  scope.getByRole('link', { name, exact: true })
const components = (page: Page) =>
  page.getByRole('navigation', { name: 'Components' })
const tabs = (page: Page) =>
  page.getByRole('navigation', { name: 'Component tabs' })
const pathname = (page: Page) => () => new URL(page.url()).pathname
const button = `/lab/${HARBOR}/button`

// Both studios answer the same way; only how they start differs.
function scenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    // The first page builds the component data; later pages are quicker.
    const page = await newPage()
    await page.goto(`${studio.url}${button.slice(1)}`)
    await heading(page, 'Button').waitFor({ timeout: 300_000 })
    await page.close()
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address: string) {
    const page = await newPage()
    await page.goto(`${studio.url}${address.replace(/^\//, '')}`)
    return page
  }

  test('[LAB-01] the rail’s Lab button lands on the default system’s first component', async () => {
    const page = await open('/prototypes')
    const rail = page.getByRole('navigation', { name: 'Main' })
    await visible(link(rail, 'Lab'))
    await link(rail, 'Lab').click()
    await expect.poll(pathname(page), { timeout: 30_000 }).toBe(button)
    await visible(heading(page, 'Button'))
    await visible(page.getByText('Starts an action.'))
    expect(await page.title()).toBe(`Overview — Button — Lab — ${STUDIO}`)
  })

  test('[LAB-02] the list highlights the open component and its search filters it', async () => {
    const page = await open(button)
    await visible(link(components(page), 'Button'))
    expect(
      await link(components(page), 'Button').getAttribute('aria-current'),
    ).toBe('page')
    expect(
      await link(components(page), 'Card').getAttribute('aria-current'),
    ).toBeNull()
    await page.getByRole('searchbox', { name: 'Search components' }).fill('car')
    await visible(link(components(page), 'Card'))
    await expect.poll(() => link(components(page), 'Button').count()).toBe(0)
    await page.getByRole('searchbox', { name: 'Search components' }).fill('zzz')
    await visible(page.getByText('No matching components.'))
  })

  test('[LAB-02] a second active system with components can be picked', async () => {
    const page = await open(button)
    const picker = page.getByRole('combobox', { name: 'System' })
    await visible(picker)
    await picker.click()
    await page.getByRole('option', { name: 'Lantern' }).click()
    await expect
      .poll(pathname(page), { timeout: 30_000 })
      .toBe(`/lab/${LANTERN}/lamp`)
    await visible(heading(page, 'Lamp'))
    await visible(link(components(page), 'Lamp'))
  })

  test('[LAB-03] each tab has its own address, title and history entry', async () => {
    const page = await open(button)
    await visible(link(tabs(page), 'Overview'))
    expect(
      await link(tabs(page), 'Overview').getAttribute('aria-current'),
    ).toBe('page')
    await link(tabs(page), 'Variants').click()
    await expect.poll(pathname(page)).toBe(`${button}/variants`)
    await expect
      .poll(() => page.title())
      .toBe(`Variants — Button — Lab — ${STUDIO}`)
    expect(
      await link(tabs(page), 'Variants').getAttribute('aria-current'),
    ).toBe('page')
    await link(tabs(page), 'Playground').click()
    await expect.poll(pathname(page)).toBe(`${button}/playground`)
    await expect
      .poll(() => page.title())
      .toBe(`Playground — Button — Lab — ${STUDIO}`)
    // Moving to another component keeps the tab.
    await link(components(page), 'Card').click()
    await expect.poll(pathname(page)).toBe(`/lab/${HARBOR}/card/playground`)
    await page.goBack()
    await expect.poll(pathname(page)).toBe(`${button}/playground`)
    await page.goBack()
    await expect.poll(pathname(page)).toBe(`${button}/variants`)
    await page.goBack()
    await expect.poll(pathname(page)).toBe(button)
    await visible(heading(page, 'When to use'))
  })

  test('[LAB-03] an unknown component or system says Page not found, with the list kept', async () => {
    const page = await open(`/lab/${HARBOR}/gone`)
    await visible(page.getByText('Page not found'))
    await visible(link(components(page), 'Button'))
    expect(await page.title()).toBe(`Page not found — Lab — ${STUDIO}`)
    await page.goto(`${studio.url}lab/nosuchsystem0000/button`)
    await visible(page.getByText('Page not found'))
    await visible(link(components(page), 'Button'))
  })

  test('[LAB-04] Overview shows the guide, Source and Props, and links to Systems and back', async () => {
    const page = await open(button)
    await visible(heading(page, 'When to use'))
    await visible(page.getByText('For actions on the dock.'))
    await visible(heading(page, 'Source'))
    await visible(page.getByText("Harbor's own button, drawn for the docks."))
    await visible(page.getByRole('button', { name: /^Props/ }))
    await link(page, 'Open in Systems').click()
    await expect
      .poll(pathname(page), { timeout: 30_000 })
      .toBe(`/systems/${HARBOR}/components/button`)
    await visible(heading(page, 'Examples'))
    await link(page, 'Open in Lab').click()
    await expect.poll(pathname(page), { timeout: 30_000 }).toBe(button)
    await visible(link(tabs(page), 'Overview'))
  })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(BEN))
})

describe('the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV))
})
