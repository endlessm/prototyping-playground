// Playground: a designer tries a component's props with DialKit dials built
// from its `defineProps`, seeded from its Default example or a sample so it
// never opens empty, and the real component file updates in the system's
// preview document without the frame reloading. Changed values
// live in the address, so a reload or a shared link restores them, a value
// that no longer fits is ignored, and Reset clears them. Components the
// panel can't start say why. Hovering a dial shows what it changes on the
// stage, and Inspect selects an element there. Locally the component's code
// sits beside the stage as a draft only the stage renders, with class dials
// for the selected element, Save and Discard. On a disposable copy of
// `tests/fixtures/systems-area` with an Endless Studios-like button and
// components that each need a message, against the dev server and the
// static build.
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
// Shaped like the Endless Studios alert: its Default example writes its
// copy and look as attributes, inside a wrapper the seeds skip.
write(
  'components/alert/alert.vue',
  `<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  color?: 'info' | 'warning'
  dismissible?: boolean
}>()
</script>
<template>
  <div role="alert" :data-color="color">
    <strong>{{ title }}</strong> <span>{{ description }}</span>
    <button v-if="dismissible">Dismiss</button>
  </div>
</template>
`,
)
write(
  'components/alert/alert.examples.vue',
  `<script setup lang="ts">
import { Example } from '#studio/examples'
import HarborAlert from './alert.vue'
</script>

<template>
  <Example name="Calm"><HarborAlert title="All clear" /></Example>
  <Example name="Default">
    <div class="w-full" title="Wrapper">
      <HarborAlert
        class="w-full"
        color="warning"
        title="Storm due at dusk"
        description="Bring the boats in early."
        dismissible
        :actions="[{ label: 'Ok' }]"
      />
    </div>
  </Example>
</template>
`,
)
// No examples and a label without a default: a sample stands in.
write(
  'components/tag/tag.vue',
  `<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
<template><span>{{ label }}</span></template>
`,
)
// Its own spacing, radius and size classes, for Inspect's class dials.
const PILL = `<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
<template>
  <span class="inline-flex gap-2 rounded-lg px-3 py-1">
    <b class="size-4">*</b>
    <em class="not-italic">{{ label }}</em>
  </span>
</template>
`
write('components/pill/pill.vue', PILL)
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
// Locally, as Ben, who maintains Harbor and so may change its files; the
// drafts stay in the disposable copy.
const DRAFTS = path.join(content, 'drafts')
const BEN = {
  ...ENV,
  STUDIO_DRAFTS_DIR: posix(DRAFTS),
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

const playground = (slug: string) => `lab/${HARBOR}/${slug}/playground`
const harborFile = (file: string) =>
  path.join(content, 'systems', 'harbor', file)
const PILL_FILE = 'components/pill/pill.vue'
const pillDraft = () => path.join(DRAFTS, HARBOR, PILL_FILE)

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
const stage = (page: Page): FrameLocator =>
  page.frameLocator('iframe[data-preview-frame]')
const query = (page: Page) => () =>
  Object.fromEntries(new URL(page.url()).searchParams)
// One prop's dial, in the Props panel DialKit draws.
const dial = (page: Page, name: string) =>
  page.locator(`[data-lab-dial="props:${name}"]`)
const text = (page: Page, name: string) => dial(page, name).getByRole('textbox')
const select = async (page: Page, name: string, option: string) => {
  await dial(page, name).getByRole('button').click()
  await page.getByRole('option', { name: option, exact: true }).click()
}
// A boolean dial is a pair of radios, Off and On.
const turn = (page: Page, name: string, on: boolean) =>
  dial(page, name)
    .getByRole('radio', { name: on ? 'On' : 'Off', exact: true })
    .click()
const isOn = (page: Page, name: string) =>
  dial(page, name)
    .getByRole('radio', { name: 'On', exact: true })
    .getAttribute('aria-checked')
const stageLabel = (page: Page) => page.locator('[data-lab-stage-label]')
const inspect = (page: Page) =>
  page.getByRole('switch', { name: 'Inspect', exact: true })
const markedDials = (page: Page) => () =>
  page
    .locator('[data-lab-marked]')
    .evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.labDial),
    )

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

  test('[LAB-05] changing the dials updates the button in place, without reloading the frame', async () => {
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
    await text(page, 'label').fill('Cast off')
    await expect.poll(() => button.textContent()).toBe('Cast off')
    await turn(page, 'loading', true)
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

  test('[LAB-05] it opens with its Default example’s values, keeps the address empty, and Reset returns to them', async () => {
    const page = await open(playground('alert'))
    const alert = stage(page).getByRole('alert')
    await visible(alert.getByText('Storm due at dusk'))
    await visible(alert.getByText('Bring the boats in early.'))
    await visible(alert.getByRole('button', { name: 'Dismiss' }))
    expect(await alert.getAttribute('data-color')).toBe('warning')
    expect(query(page)()).toEqual({})
    const title = text(page, 'title')
    expect(await title.inputValue()).toBe('Storm due at dusk')
    expect(await isOn(page, 'dismissible')).toBe('true')

    await title.fill('Fog by morning')
    await visible(alert.getByText('Fog by morning'))
    await select(page, 'color', 'Default')
    await expect.poll(() => alert.getAttribute('data-color')).toBeNull()
    await expect.poll(query(page)).toEqual({
      title: 'Fog by morning',
      color: '',
    })
    // Set back to its seed, a value leaves the address again.
    await title.fill('Storm due at dusk')
    await expect.poll(query(page)).toEqual({ color: '' })

    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect.poll(query(page)).toEqual({})
    await expect.poll(() => alert.getAttribute('data-color')).toBe('warning')
    await visible(alert.getByText('Storm due at dusk'))
    // The dials follow the address back.
    await expect
      .poll(() => dial(page, 'color').getByRole('button').textContent())
      .toContain('warning')
  })

  test('[LAB-05] a text prop with nothing to start from shows a sample from its name', async () => {
    const page = await open(playground('tag'))
    await visible(stage(page).getByText('Label', { exact: true }))
    await expect.poll(() => text(page, 'label').inputValue()).toBe('Label')
    expect(query(page)()).toEqual({})
    expect(await page.getByText(/^Nothing shows/).count()).toBe(0)
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
    expect(await dial(page, 'ui').count()).toBe(0)
  })

  test('[LAB-05] each dial is labelled from its prop and described by its name and description, shown under it', async () => {
    const page = await open(playground('button'))
    const color = dial(page, 'color').getByRole('button')
    await visible(color)
    expect(await color.textContent()).toContain('Color')
    await visible(page.getByText('A semantic role from the theme.'))
    await expect
      .poll(() =>
        color.evaluate((element) =>
          (element.getAttribute('aria-describedby') ?? '')
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent?.trim())
            .join(' '),
        ),
      )
      .toBe('color · A semantic role from the theme.')
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

  test('[LAB-05] the stage stays in view while the dials scroll, on wide and narrow screens', async () => {
    for (const size of [
      { width: 1280, height: 600 },
      { width: 390, height: 700 },
    ]) {
      const page = await open(playground('button'))
      await page.setViewportSize(size)
      const frame = page.locator('iframe[data-preview-frame]')
      await visible(stage(page).getByRole('button', { name: 'Moor the boat' }))
      await page
        .getByRole('listitem')
        .filter({ hasText: 'Set in code' })
        .scrollIntoViewIfNeeded()
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
    await expect
      .poll(() => dial(page, 'color').getByRole('button').textContent())
      .toContain('error')

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

  test('[LAB-05] an overlay in the stage closes with Escape, its dial follows and the keyboard comes back to the studio', async () => {
    const page = await open(playground('sheet'))
    const on = dial(page, 'open').getByRole('radio', { name: 'On' })
    await visible(on)
    await on.click()
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
    await expect.poll(() => isOn(page, 'open')).toBe('false')
    await expect
      .poll(() => on.evaluate((element) => element === document.activeElement))
      .toBe(true)
  })

  test('[LAB-05] its close button closes it too, with Inspect off, and the open dial follows', async () => {
    const page = await open(`${playground('sheet')}?open=true`)
    await inspect(page).click()
    await stage(page).getByRole('button', { name: 'Close' }).click()
    await expect.poll(query(page)).toEqual({})
    await expect.poll(() => isOn(page, 'open')).toBe('false')
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

  test('[LAB-05] without a prop the panel can change, there is no Reset; while the stage can’t start, the dials are disabled', async () => {
    const gauge = await open(playground('gauge'))
    await visible(
      gauge.getByRole('listitem').filter({ hasText: 'Set in code' }),
    )
    expect(await gauge.getByRole('button', { name: 'Reset' }).count()).toBe(0)

    const dialog = await open(playground('dialog'))
    await visible(dial(dialog, 'title'))
    expect(
      await dial(dialog, 'title').evaluate(
        (element) => element.closest('[inert]') !== null,
      ),
    ).toBe(true)
    expect(
      await dialog
        .getByRole('button', { name: 'Reset', exact: true })
        .isDisabled(),
    ).toBe(true)
  })

  test('[LAB-05] a value that makes the component throw shows its error on the stage, and another value brings it back', async () => {
    const page = await open(`${playground('meter')}?level=3`)
    await visible(stage(page).getByText('Level 3'))
    const level = text(page, 'level')
    await level.fill('11')
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'This component couldn’t render.' })
    await visible(alert)
    expect(await alert.textContent()).toContain('The meter only goes to 10.')
    // The dials stay usable while the stage shows the error.
    await level.fill('5')
    await visible(stage(page).getByText('Level 5'))
    await expect.poll(() => alert.count()).toBe(0)
    await expect.poll(query(page)).toEqual({ level: '5' })
  })

  test('[LAB-06] hovering a dial shows on the stage what it changes', async () => {
    const page = await open(playground('button'))
    await visible(stage(page).getByRole('button', { name: 'Moor the boat' }))
    await dial(page, 'label').hover()
    await expect
      .poll(() => stageLabel(page).textContent())
      .toBe('Props › label = Moor the boat')
    // A dial for something without text of its own outlines the component.
    await dial(page, 'size').hover()
    await expect
      .poll(() => stageLabel(page).textContent())
      .toBe('Props › size = md')
    await page.mouse.move(0, 0)
    await expect.poll(() => stageLabel(page).count()).toBe(0)
  })

  test('[LAB-06] Inspect selects an element instead of using it, marks the dials that change it, and Escape clears it', async () => {
    const page = await open(`${playground('sheet')}?open=true`)
    expect(await inspect(page).getAttribute('aria-checked')).toBe('true')
    await stage(page).getByRole('button', { name: 'Close' }).click()
    // The click selected the button; the sheet is still open.
    await expect
      .poll(() => stageLabel(page).textContent())
      .toMatch(/^<button> · \d+×\d+$/)
    expect(await stage(page).getByRole('dialog').count()).toBe(1)
    await visible(
      page.getByRole('status').filter({ hasText: /^Selected <button>/ }),
    )

    const button = await open(playground('button'))
    await stage(button).getByRole('button', { name: 'Moor the boat' }).click()
    await expect.poll(markedDials(button)).toEqual(['props:label'])
    await button.keyboard.press('Escape')
    await expect.poll(() => stageLabel(button).count()).toBe(0)
    await expect.poll(markedDials(button)).toEqual([])
  })

  test.runIf(local)(
    '[LAB-05] the stage follows the component file on disk and keeps the chosen values',
    async () => {
      const page = await open(`${playground('buoy')}?name=North`)
      await visible(stage(page).getByText('Buoy North'))
      write('components/buoy/buoy.vue', BUOY('Marker'))
      await visible(stage(page).getByText('Marker North'))
      await expect.poll(query(page)).toEqual({ name: 'North' })
      await expect.poll(() => text(page, 'name').inputValue()).toBe('North')
    },
  )

  test.runIf(!local)(
    '[LAB-07] the deployed site has no code editor and no class dials',
    async () => {
      const page = await open(playground('pill'))
      await visible(stage(page).getByText('Label'))
      // Harbor's stylesheet isn't Tailwind: the pill has no padding to click.
      await stage(page).locator('span.inline-flex').dispatchEvent('click')
      await expect
        .poll(() => stageLabel(page).textContent())
        .toMatch(/^<span> inline-flex/)
      expect(await page.getByRole('region', { name: /^Code of/ }).count()).toBe(
        0,
      )
      expect(await page.locator('[data-lab-dial^="element:"]').count()).toBe(0)
    },
  )

  test.runIf(local)(
    '[LAB-07] the code sits beside the stage as a draft: the stage renders it, the file waits for Save',
    async () => {
      const page = await open(playground('pill'))
      const editor = page.getByRole('region', { name: 'Code of pill.vue' })
      await visible(editor.getByText('All changes saved'))
      await visible(stage(page).getByText('Label'))
      await editor.getByText('{{ label }}').click()
      await page.keyboard.press('End')
      await page.keyboard.type(' ahoy')
      await visible(stage(page).getByText('Label ahoy'))
      await visible(editor.getByText('Unsaved changes in pill.vue'))
      expect(readFileSync(harborFile(PILL_FILE), 'utf8')).toBe(PILL)
      await expect.poll(() => existsSync(pillDraft())).toBe(true)

      await page.keyboard.press('ControlOrMeta+s')
      await visible(editor.getByText('All changes saved'))
      await expect
        .poll(() => readFileSync(harborFile(PILL_FILE), 'utf8'))
        .toContain('{{ label }}</em> ahoy')
      await expect.poll(() => existsSync(pillDraft())).toBe(false)
      writeFileSync(harborFile(PILL_FILE), PILL)
    },
  )

  test.runIf(local)(
    '[LAB-07] Inspect jumps to the element’s code, its class dials rewrite the draft, and Discard brings the file back',
    async () => {
      const page = await open(playground('pill'))
      const editor = page.getByRole('region', { name: 'Code of pill.vue' })
      await visible(editor.getByText('All changes saved'))
      const pill = stage(page).locator('span.inline-flex')
      // Harbor's stylesheet isn't Tailwind: the pill has no padding to click.
      await pill.dispatchEvent('click')
      await expect
        .poll(() => stageLabel(page).textContent())
        .toMatch(/^<span> inline-flex gap-2 rounded-lg px-3 py-1 · /)
      // The whole element block, opening tag to closing tag.
      await expect
        .poll(() => editor.locator('.cm-studio-marked').count())
        .toBe(4)
      await expect
        .poll(() =>
          page
            .locator('[data-lab-dial^="element:"]')
            .evaluateAll((rows) =>
              rows.map((row) => (row as HTMLElement).dataset.labDial),
            ),
        )
        .toEqual([
          'element:Spacing',
          'element:Spacing.gap',
          'element:Spacing.paddingX',
          'element:Spacing.paddingY',
          'element:Radius',
          'element:Radius.radius',
        ])
      // Hovering a spacing dial shows its space and size.
      await page.locator('[data-lab-dial="element:Spacing.paddingX"]').hover()
      await expect
        .poll(() => stageLabel(page).textContent())
        .toMatch(/^Spacing › paddingX = px-3 · \d+px$/)

      await page
        .locator('[data-lab-dial="element:Spacing.paddingX"] [role="slider"]')
        .focus()
      await page.keyboard.press('ArrowRight')
      await visible(editor.getByText('Unsaved changes in pill.vue'))
      await expect
        .poll(() =>
          existsSync(pillDraft()) ? readFileSync(pillDraft(), 'utf8') : '',
        )
        .toContain('class="inline-flex gap-2 rounded-lg px-3.5 py-1"')
      expect(readFileSync(harborFile(PILL_FILE), 'utf8')).toBe(PILL)
      // The stage renders the draft.
      await expect.poll(() => pill.getAttribute('class')).toContain('px-3.5')

      await editor.getByRole('button', { name: 'Discard', exact: true }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Discard', exact: true })
        .click()
      await visible(editor.getByText('All changes saved'))
      await expect.poll(() => existsSync(pillDraft())).toBe(false)
      await expect
        .poll(() => pill.getAttribute('class'))
        .toBe('inline-flex gap-2 rounded-lg px-3 py-1')
    },
  )

  test.runIf(local)(
    '[LAB-07] the bar between the code and the stage resizes from the keyboard and remembers its width',
    async () => {
      const page = await open(playground('pill'))
      await page.setViewportSize({ width: 1700, height: 900 })
      const bar = page.getByRole('separator', {
        name: 'Resize the code editor',
      })
      await visible(bar)
      const width = async () =>
        Math.round(
          (await page
            .getByRole('region', { name: 'Code of pill.vue' })
            .boundingBox())!.width,
        )
      const before = await width()
      await bar.focus()
      await page.keyboard.press('ArrowRight')
      await expect.poll(width).toBe(before + 20)
      await page.keyboard.press('Shift+ArrowLeft')
      await expect.poll(width).toBe(before - 60)
      await page.reload()
      await visible(bar)
      await expect.poll(width).toBe(before - 60)
      await bar.dblclick()
      await expect.poll(width).toBe(before)
    },
  )
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(BEN), { local: true })
})

describe('on the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV), { local: false })
})
