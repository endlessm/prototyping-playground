// Playground: a designer tries a component's props with controls built
// from its `defineProps`, and the real component file updates in the
// system's preview document without the frame reloading. Changed values
// live in the address, so a reload or a shared link restores them, a value
// that no longer fits is ignored, and Reset clears them. Components the
// panel can't start say why. On a disposable copy of
// `tests/fixtures/systems-area` with an Endless Studios-like button and
// components that each need a message, against the dev server and the
// static build.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
const content = mkdtempSync(path.join('.e2e', 'lab-playground-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const STUDIO = 'Playground Studio'
const HARBOR = 'hrbr000000000001'
function write(file: string, text: string) {
  const at = path.join(content, 'systems', 'harbor', file)
  mkdirSync(path.dirname(at), { recursive: true })
  writeFileSync(at, text)
}

// Shaped like the Endless Studios button: a label, unions for its look,
// a loading switch and an object only code can set.
write(
  'components/button/button.vue',
  `<script setup lang="ts">
withDefaults(
  defineProps<{
    /** The button's text. */
    label?: string
    /** A semantic role from the theme. */
    color?: 'primary' | 'neutral' | 'error'
    variant?: 'solid' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    /** Shows a spinner and disables the button. */
    loading?: boolean
    /** Theme overrides for its parts. */
    ui?: { base?: string }
  }>(),
  { label: 'Moor the boat', color: 'primary', variant: 'solid', size: 'md' },
)
</script>
<template>
  <button
    :data-color="color"
    :data-variant="variant"
    :data-size="size"
    :disabled="loading"
  >{{ loading ? 'Loading' : label }}</button>
</template>
`,
)
write(
  'components/card/card.md',
  '---\ntitle: Card\ndescription: Holds one thing.\n---\n\n## When to use\n\nAlways.\n',
)
write('components/Broken.vue', '<script setup lang="ts">\nconst = \n')
write(
  'components/dialog/dialog.vue',
  `<script setup lang="ts">
defineProps<{
  title: string
  /** The dialog's buttons. */
  actions: { label: string }[]
}>()
</script>
<template><div role="dialog">{{ title }}</div></template>
`,
)
write(
  'components/chip/chip.vue',
  `<script setup lang="ts">
defineProps<{ tone: 'calm' | 'loud' }>()
</script>
<template><span>Chip {{ tone }}</span></template>
`,
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
    systemMaintainers: {},
  }),
)

const ENV = {
  STUDIO_CONFIG: posix(path.join(content, 'studio.config.json')),
  STUDIO_SYSTEMS: posix(path.join(content, 'systems')),
  STUDIO_PROTOTYPES: posix(path.join(content, 'prototypes')),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

const playground = (slug: string) => `lab/${HARBOR}/${slug}/playground`

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
const stage = (page: Page): FrameLocator =>
  page.frameLocator('iframe[data-preview-frame]')
const query = (page: Page) => () =>
  Object.fromEntries(new URL(page.url()).searchParams)
const select = async (page: Page, name: string, option: string) => {
  await page.getByRole('combobox', { name, exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

function scenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    // The first visit builds the component data and the preview document.
    const page = await newPage()
    await page.goto(`${studio.url}${playground('button')}`)
    await stage(page)
      .getByRole('button', { name: 'Moor the boat' })
      .waitFor({ timeout: 300_000 })
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address: string) {
    const page = await newPage()
    await page.goto(`${studio.url}${address}`)
    return page
  }

  test('[LAB-05] changing the controls updates the button in place, without reloading the frame', async () => {
    const page = await open(playground('button'))
    const button = stage(page).locator('button')
    await visible(stage(page).getByRole('button', { name: 'Moor the boat' }))
    expect(await button.getAttribute('data-color')).toBe('primary')
    // Marks on the document and the element show whether either was replaced.
    await button.evaluate((element) => {
      ;(element as unknown as { mark: boolean }).mark = true
      ;(window as unknown as { mark: boolean }).mark = true
    })

    await select(page, 'color', 'neutral')
    await expect.poll(() => button.getAttribute('data-color')).toBe('neutral')
    await select(page, 'variant', 'outline')
    await expect.poll(() => button.getAttribute('data-variant')).toBe('outline')
    await select(page, 'size', 'lg')
    await expect.poll(() => button.getAttribute('data-size')).toBe('lg')
    await page
      .getByRole('textbox', { name: 'label', exact: true })
      .fill('Cast off')
    await expect.poll(() => button.textContent()).toBe('Cast off')
    await page.getByRole('switch', { name: 'loading', exact: true }).click()
    await expect.poll(() => button.textContent()).toBe('Loading')
    expect(await button.isDisabled()).toBe(true)

    expect(
      await button.evaluate((element) => ({
        element: (element as unknown as { mark?: boolean }).mark,
        document: (window as unknown as { mark?: boolean }).mark,
      })),
    ).toEqual({ element: true, document: true })
    await expect.poll(query(page)).toEqual({
      color: 'neutral',
      variant: 'outline',
      size: 'lg',
      label: 'Cast off',
      loading: 'true',
    })
    expect(await page.title()).toBe(`Playground — Button — Lab — ${STUDIO}`)
  })

  test('[LAB-05] props only code can set are listed with their type', async () => {
    const page = await open(playground('button'))
    const row = page.getByRole('listitem').filter({ hasText: 'Set in code' })
    await visible(row)
    expect(await row.textContent()).toContain('ui')
    expect(await row.textContent()).toContain('{ base?: string')
  })

  test('[LAB-05] each control is labelled with its prop, its description on hover', async () => {
    const page = await open(playground('button'))
    await visible(page.getByRole('combobox', { name: 'color', exact: true }))
    await page.getByText('color', { exact: true }).hover()
    await visible(
      page
        .locator('[data-slot="content"]')
        .filter({ hasText: 'A semantic role from the theme.' }),
    )
  })

  test('[LAB-05] a shared address restores its values, ignores bad ones, and Reset clears them', async () => {
    const page = await open(
      `${playground('button')}?color=error&size=huge&loading=maybe&sparkle=1&label=Ahoy`,
    )
    const button = stage(page).locator('button')
    await expect.poll(() => button.textContent()).toBe('Ahoy')
    expect(await button.getAttribute('data-color')).toBe('error')
    expect(await button.getAttribute('data-size')).toBe('md')
    expect(await button.isDisabled()).toBe(false)
    expect(
      await page
        .getByRole('combobox', { name: 'color', exact: true })
        .textContent(),
    ).toContain('error')

    await page.reload()
    await expect.poll(() => button.textContent()).toBe('Ahoy')
    expect(await button.getAttribute('data-color')).toBe('error')

    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect.poll(query(page)).toEqual({})
    await expect.poll(() => button.textContent()).toBe('Moor the boat')
    expect(await button.getAttribute('data-color')).toBe('primary')
  })

  test('[LAB-05] a component without a component file names the file to add', async () => {
    const page = await open(playground('card'))
    await visible(page.getByText(/Playground needs a component file/))
    await visible(page.getByText('card.vue', { exact: true }))
  })

  test('[LAB-05] props that can’t be read say so, with Try again', async () => {
    const page = await open(playground('broken'))
    await visible(page.getByText('Playground can’t read the props of Broken.'))
    await visible(page.getByText(/^Broken\.vue: /))
    await visible(page.getByRole('button', { name: 'Try again' }))
  })

  test('[LAB-05] a required prop the panel can’t fill blocks the stage, naming it', async () => {
    const page = await open(playground('dialog'))
    await visible(page.getByText(/can only be set in code/))
    await visible(page.getByText('actions', { exact: true }).first())
    expect(await page.locator('iframe[data-preview-frame]').count()).toBe(0)
  })

  test('[LAB-05] a required choice waits for a value, then starts the component', async () => {
    const page = await open(playground('chip'))
    await visible(page.getByText(/Choose a value for/))
    expect(await page.locator('iframe[data-preview-frame]').count()).toBe(0)
    await select(page, 'tone', 'loud')
    await visible(stage(page).getByText('Chip loud'))
    await expect.poll(query(page)).toEqual({ tone: 'loud' })
  })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(ENV))
})

describe('on the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV))
})
