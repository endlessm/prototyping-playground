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
// Modal-like: open, it takes the focus and keeps Tab inside, and Escape or
// its close button ask to close it, as a v-model:open overlay does.
write(
  'components/sheet/sheet.vue',
  `<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps<{
  /** Whether it shows. */
  open?: boolean
}>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const close = ref<HTMLButtonElement>()
function onKey(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') emit('update:open', false)
  if (event.key === 'Tab') {
    event.preventDefault()
    close.value?.focus()
  }
}
document.addEventListener('keydown', onKey)
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (open) close.value?.focus()
  },
  { immediate: true },
)
</script>
<template>
  <div v-if="open" role="dialog" aria-label="Sheet">
    <button ref="close" @click="emit('update:open', false)">Close</button>
  </div>
</template>
`,
)
write(
  'components/gauge/gauge.vue',
  `<script setup lang="ts">
defineProps<{ marks?: number[] }>()
</script>
<template><span>Gauge</span></template>
`,
)
// Its content comes from a slot alone, so nothing shows on the stage.
write(
  'components/frame/frame.vue',
  `<script setup lang="ts">
defineProps<{ padded?: boolean }>()
</script>
<template><div><slot /></div></template>
`,
)
// Throws past 10, so a value can break it and another bring it back.
write(
  'components/meter/meter.vue',
  `<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ level?: number }>()
const shown = computed(() => {
  if ((props.level ?? 0) > 10) throw new Error('The meter only goes to 10.')
  return \`Level \${props.level ?? 0}\`
})
</script>
<template><span>{{ shown }}</span></template>
`,
)
// Edited on disk while its playground is open.
const BUOY = (word: string) => `<script setup lang="ts">
defineProps<{ name?: string }>()
</script>
<template><p>{{ '${word}' }} {{ name }}</p></template>
`
write('components/buoy/buoy.vue', BUOY('Buoy'))

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

function scenarios(
  start: () => Promise<RunningStudio>,
  { local }: { local: boolean },
) {
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
    // With one system in the Lab, the list's header names it.
    await visible(
      page
        .getByRole('complementary', { name: 'Lab' })
        .getByText('Harbor', { exact: true }),
    )
    const row = page.getByRole('listitem').filter({ hasText: 'Set in code' })
    await visible(row)
    expect(await row.textContent()).toContain('ui')
    expect(await row.textContent()).toContain('{ base?: string')
  })

  test('[LAB-05] each control is labelled with its prop and described by the prop’s description, shown under it', async () => {
    const page = await open(playground('button'))
    const color = page.getByRole('combobox', { name: 'color', exact: true })
    await visible(color)
    await visible(page.getByText('A semantic role from the theme.'))
    expect(
      await color.evaluate((element) =>
        (element.getAttribute('aria-describedby') ?? '')
          .split(' ')
          .map((id) => document.getElementById(id)?.textContent?.trim())
          .join(' '),
      ),
    ).toContain('A semantic role from the theme.')
  })

  test('[LAB-05] a stage where nothing shows says why it may be blank', async () => {
    const page = await open(playground('frame'))
    await visible(
      page
        .getByRole('status')
        .filter({ hasText: /Nothing shows with these values yet\./ }),
    )
    const button = await open(playground('button'))
    await visible(stage(button).getByRole('button', { name: 'Moor the boat' }))
    expect(await button.getByText(/^Nothing shows/).count()).toBe(0)
  })

  test('[LAB-05] the stage stays in view while the controls scroll, on wide and narrow screens', async () => {
    for (const size of [
      { width: 1280, height: 600 },
      { width: 390, height: 700 },
    ]) {
      const page = await open(playground('button'))
      await page.setViewportSize(size)
      const frame = page.locator('iframe[data-preview-frame]')
      await visible(stage(page).getByRole('button', { name: 'Moor the boat' }))
      await page.getByText('Set in code').scrollIntoViewIfNeeded()
      await expect
        .poll(async () => {
          const box = await frame.boundingBox()
          return Boolean(box && box.y >= 0 && box.y + 40 < size.height)
        })
        .toBe(true)
    }
  })

  test('[LAB-05] a shared address restores its values, ignores bad ones, and Reset clears them', async () => {
    const page = await open(
      `${playground('button')}?color=error&size=huge&loading=maybe&sparkle=1&label=Ahoy`,
    )
    const button = stage(page).locator('button')
    await expect.poll(() => button.textContent()).toBe('Ahoy')
    // What was ignored leaves the address, so passing it on doesn't spread it.
    await expect.poll(query(page)).toEqual({ color: 'error', label: 'Ahoy' })
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

  test('[LAB-05] an overlay in the stage closes with Escape, its control follows and the keyboard comes back to the studio', async () => {
    const page = await open(playground('sheet'))
    const control = page.getByRole('switch', { name: 'open', exact: true })
    await visible(control)
    await control.focus()
    await page.keyboard.press('Space')
    await visible(stage(page).getByRole('dialog', { name: 'Sheet' }))
    await expect.poll(query(page)).toEqual({ open: 'true' })
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName))
      .toBe('IFRAME')
    // Tab stays inside while the sheet is open, as a modal's focus trap does.
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
      'IFRAME',
    )

    await page.keyboard.press('Escape')
    await expect.poll(() => stage(page).getByRole('dialog').count()).toBe(0)
    await expect.poll(query(page)).toEqual({})
    expect(await control.getAttribute('aria-checked')).toBe('false')
    await expect
      .poll(() =>
        control.evaluate((element) => element === document.activeElement),
      )
      .toBe(true)
  })

  test('[LAB-05] its close button closes it too, and the open control follows', async () => {
    const page = await open(`${playground('sheet')}?open=true`)
    await stage(page).getByRole('button', { name: 'Close' }).click()
    await expect.poll(query(page)).toEqual({})
    await expect
      .poll(() =>
        page
          .getByRole('switch', { name: 'open', exact: true })
          .getAttribute('aria-checked'),
      )
      .toBe('false')
  })

  test('[LAB-05] Reset keeps the keyboard where it was and says it worked', async () => {
    const page = await open(`${playground('button')}?color=error`)
    const reset = page.getByRole('button', { name: 'Reset', exact: true })
    await visible(reset)
    await reset.focus()
    await page.keyboard.press('Enter')
    await expect.poll(query(page)).toEqual({})
    await visible(page.getByRole('status').filter({ hasText: 'Values reset' }))
    expect(await reset.isEnabled()).toBe(true)
    expect(
      await reset.evaluate((element) => element === document.activeElement),
    ).toBe(true)
    await page.keyboard.press('Enter')
    expect(
      await reset.evaluate((element) => element === document.activeElement),
    ).toBe(true)
  })

  test('[LAB-05] without a prop the panel can change, there is no Reset; while the stage can’t start, the controls are disabled', async () => {
    const gauge = await open(playground('gauge'))
    await visible(gauge.getByText('Set in code'))
    expect(await gauge.getByRole('button', { name: 'Reset' }).count()).toBe(0)

    const dialog = await open(playground('dialog'))
    const title = dialog.getByRole('textbox', { name: 'title', exact: true })
    await visible(title)
    expect(await title.isDisabled()).toBe(true)
    expect(
      await dialog
        .getByRole('button', { name: 'Reset', exact: true })
        .isDisabled(),
    ).toBe(true)
  })

  test('[LAB-05] a value that makes the component throw shows its error on the stage, and another value brings it back', async () => {
    const page = await open(`${playground('meter')}?level=3`)
    await visible(stage(page).getByText('Level 3'))
    const level = page.getByRole('spinbutton', { name: 'level', exact: true })
    await level.fill('11')
    await level.press('Enter')
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'This component couldn’t render.' })
    await visible(alert)
    expect(await alert.textContent()).toContain('The meter only goes to 10.')
    // The controls stay usable while the stage shows the error.
    await level.fill('5')
    await level.press('Enter')
    await visible(stage(page).getByText('Level 5'))
    await expect.poll(() => alert.count()).toBe(0)
    await expect.poll(query(page)).toEqual({ level: '5' })
  })

  test.runIf(local)(
    '[LAB-05] the stage follows the component file on disk and keeps the chosen values',
    async () => {
      const page = await open(`${playground('buoy')}?name=North`)
      await visible(stage(page).getByText('Buoy North'))
      write('components/buoy/buoy.vue', BUOY('Marker'))
      await visible(stage(page).getByText('Marker North'))
      await expect.poll(query(page)).toEqual({ name: 'North' })
      expect(
        await page
          .getByRole('textbox', { name: 'name', exact: true })
          .inputValue(),
      ).toBe('North')
    },
  )
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(ENV), { local: true })
})

describe('on the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV), { local: false })
})
