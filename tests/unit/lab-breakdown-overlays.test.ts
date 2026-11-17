// What a Breakdown makes adjustable beyond a piece's theme slots: an overlay
// (a modal, a popover) shows open in the Breakdown's preview, so its theme
// slots render and have knobs, while a tag that says whether it is open
// keeps saying so; a Nuxt UI piece whose theme is one class string, with no
// slots (a container, a link), has knobs on its own element, written into
// its `class`. And the colour knobs' swatches travel on the preview channel
// as plain strings. Fixture sources read with the real Endless Studios
// system.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import { writeBreakdownChanges } from '../../src/modules/lab/experiments/writer'
import { instrument } from '../../tooling/preview/breakdown'
import {
  isHostMessage,
  isPreviewMessage,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
} from '../../tooling/preview/protocol'
import { fileTags, nuxtUiCatalog } from '../../tooling/systems/breakdown'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry'

const ROOT = path.resolve(import.meta.dirname, '../..')
const FILE = path.join(ROOT, 'src/prototypes/ben/modal-experiments/View.vue')
let endless: InstalledSystem

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  endless = systems.find(({ key }) => key === 'endless-studios')!
})

const instrumented = (template: string) =>
  instrument(`<template>\n${template}\n</template>\n`, FILE, {
    system: endless,
    root: ROOT,
    follow: () => false,
  })
const tags = (template: string) => {
  const found = fileTags(`<template>\n${template}\n</template>\n`, FILE, {
    system: endless,
    nuxtUi: nuxtUiCatalog(endless, ROOT),
    follow: () => false,
  })
  if (!found.tags) throw new Error(found.problem)
  return found.tags
}

describe('an overlay in a Breakdown', () => {
  test('[LAB-BD-30] shows open, so its theme slots render', () => {
    for (const tag of [
      'UModal',
      'USlideover',
      'UPopover',
      'UTooltip',
      'UDropdownMenu',
    ])
      expect(instrumented(`<${tag} title="Hi" />`), tag).toMatch(
        new RegExp(`<${tag} title="Hi" default-open `),
      )
    expect(instrumented('<UButton label="Hi" />')).not.toContain('default-open')
  })

  test('[LAB-BD-30] one that says whether it is open keeps saying so', () => {
    for (const written of [
      ':open="shown"',
      'v-model:open="shown"',
      'default-open',
      ':default-open="false"',
    ])
      expect(
        instrumented(`<UModal ${written} title="Hi" />`),
        written,
      ).not.toMatch(/ default-open :ui/)
  })
})

describe('a Nuxt UI piece without theme slots', () => {
  test('[LAB-BD-31] reports its own element as its base, its overrides through its class', () => {
    const [container] = tags('<UContainer class="py-4"><p /></UContainer>')
    expect(container).toMatchObject({ rootSlot: 'base', slotless: true })
    const copy = instrumented('<UContainer class="py-4"><p /></UContainer>')
    expect(copy).not.toContain(':ui=')
    expect(copy).toContain('$lab.cls($,`UContainer`,`base`)')
    expect(copy).toContain('$lab.hook($,`UContainer`,2)')
    const [link] = tags('<ULink to="/">Home</ULink>')
    expect(link).toMatchObject({ rootSlot: 'base', slotless: true })
    const [button] = tags('<UButton />')
    expect(button!.slotless).toBeUndefined()
  })

  test('[LAB-BD-31] Save writes its changes into its class', () => {
    const source =
      '<template>\n<UContainer class="px-4 py-4"><p /></UContainer>\n</template>\n'
    const written = writeBreakdownChanges(
      source,
      [
        {
          node: 'root>UContainer',
          slot: 'base',
          family: 'paddingX',
          className: 'px-8',
        },
        {
          node: 'root>UContainer',
          slot: 'base',
          family: 'fill',
          className: 'bg-muted',
        },
      ],
      {
        tags: tags('<UContainer class="px-4 py-4"><p /></UContainer>'),
        theme: { colors: [] },
      },
    )
    expect(written.skipped).toEqual([])
    expect(written.source).toContain(
      '<UContainer class="py-4 px-8 bg-muted"><p /></UContainer>',
    )
  })
})

describe('the swatches messages', () => {
  const envelope = {
    channel: PREVIEW_CHANNEL,
    version: PREVIEW_VERSION,
    session: 'session-a',
    runtime: 'runtime-a',
    artifact: 'vhme000000000001',
  }

  test('[LAB-KN-23] the studio asks for colour classes; the document answers their colours', () => {
    expect(
      isHostMessage({
        ...envelope,
        kind: 'swatches',
        classes: ['bg-primary', 'bg-primary/10', 'text-secondary-700'],
      }),
    ).toBe(true)
    expect(
      isPreviewMessage({
        ...envelope,
        kind: 'swatches',
        swatches: {
          'bg-primary': 'rgb(255, 105, 0)',
          'bg-primary/10': 'oklab(0.7 0.1 0.1 / 0.1)',
        },
      }),
    ).toBe(true)
  })

  test('[LAB-KN-23] refuse anything but knob colour classes and short colour strings', () => {
    const asks = (classes: unknown) =>
      isHostMessage({ ...envelope, kind: 'swatches', classes })
    expect(asks(['rounded-xl'])).toBe(false)
    expect(asks(['bg-primary"; x'])).toBe(false)
    expect(asks('bg-primary')).toBe(false)
    const answers = (swatches: unknown) =>
      isPreviewMessage({ ...envelope, kind: 'swatches', swatches })
    expect(answers({ 'bg-primary': 4 })).toBe(false)
    expect(answers({ 'bg-primary': 'red\u0000' })).toBe(false)
    expect(answers({ 'bg-primary': 'r'.repeat(500) })).toBe(false)
    expect(answers(JSON.parse('{"__proto__": "red"}'))).toBe(false)
  })
})
