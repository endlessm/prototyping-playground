// The Playground's controls as DialKit dials, and the class dials Inspect
// gives a selected element: which tokens become dials, how a dial writes a
// token back into one class attribute, and how an element on the stage is
// found in its component's source. [LAB-05] [LAB-06] [LAB-07]
import { describe, expect, test } from 'vitest'
import type { PropDoc } from '../../tooling/systems/props'
import { controlFor } from '../../src/modules/lab/utils/playground'
import {
  dialShows,
  dialsSignature,
  fromDial,
  propsConfig,
  shownValue,
  UNSET,
} from '../../src/modules/lab/utils/dials'
import {
  attributeAt,
  bestClassAttribute,
  classConfig,
  classDial,
  classDials,
  elementRange,
  findElementSource,
  rewriteToken,
  tokenFor,
} from '../../src/modules/lab/utils/classDials'

const prop = (fields: Partial<PropDoc> & { name: string; type: string }) => ({
  required: false,
  default: null,
  description: '',
  ...fields,
})
const WORDS = { default: 'Default', choose: 'Choose' }

describe('[LAB-05] prop controls as dials', () => {
  const label = controlFor(prop({ name: 'label', type: 'string' }), 'Save')
  const color = controlFor(
    prop({
      name: 'color',
      type: '"primary" | "neutral"',
      default: '"primary"',
    }),
  )
  const tone = controlFor(prop({ name: 'tone', type: '"calm" | "loud"' }))
  const tier = controlFor(
    prop({ name: 'tier', type: '"a" | "b"', required: true }),
  )
  const loading = controlFor(prop({ name: 'loading', type: 'boolean' }))
  const level = controlFor(prop({ name: 'level', type: 'number' }))
  const ui = controlFor(prop({ name: 'ui', type: '{ base?: string }' }))
  const controls = [label, color, tone, tier, loading, level, ui]

  test('each control the panel can change is a dial at its shown value', () => {
    expect(propsConfig(controls, { loading: true }, WORDS)).toEqual({
      label: { type: 'text', default: 'Save' },
      color: {
        type: 'select',
        options: [
          { value: 'primary', label: 'primary' },
          { value: 'neutral', label: 'neutral' },
        ],
        default: 'primary',
      },
      tone: {
        type: 'select',
        options: [
          { value: UNSET, label: 'Default' },
          { value: 'calm', label: 'calm' },
          { value: 'loud', label: 'loud' },
        ],
        default: UNSET,
      },
      tier: {
        type: 'select',
        options: [
          { value: UNSET, label: 'Choose' },
          { value: 'a', label: 'a' },
          { value: 'b', label: 'b' },
        ],
        default: UNSET,
      },
      loading: true,
      level: { type: 'text', default: '' },
    })
  })

  test('an emptied seeded prop shows as left out, a text one as empty', () => {
    expect(shownValue(tone, { tone: '' })).toBeUndefined()
    expect(shownValue(label, { label: '' })).toBe('')
    expect(shownValue(label, {})).toBe('Save')
  })

  test('a dial’s value reads back as the control’s value', () => {
    expect(fromDial(tone, UNSET)).toBeUndefined()
    expect(fromDial(tone, 'loud')).toBe('loud')
    expect(fromDial(loading, true)).toBe(true)
    expect(fromDial(level, ' 12 ')).toBe(12)
    expect(fromDial(level, '')).toBeUndefined()
    expect(fromDial(level, '1.')).toBe('invalid')
    expect(fromDial(label, '')).toBeUndefined()
  })

  test('a number being typed keeps its text until it reads as one', () => {
    expect(dialShows(level, '1.', 1)).toBe(true)
    expect(dialShows(level, '2', 1)).toBe(false)
    expect(dialShows(label, '', undefined)).toBe(true)
  })

  test('only a new set of dials changes the signature, not their values', () => {
    expect(dialsSignature(controls)).toBe(dialsSignature([...controls]))
    expect(dialsSignature([label])).not.toBe(dialsSignature([label, color]))
  })
})

describe('[LAB-07] class tokens as dials', () => {
  test('spacing tokens are sliders on the spacing scale', () => {
    expect(classDial('px-4')).toMatchObject({
      key: 'paddingX',
      folder: 'spacing',
      utility: 'px',
      value: 4,
      area: { kind: 'padding', sides: ['left', 'right'] },
      config: [4, 0, 16, 0.5],
    })
    expect(classDial('gap-x-2.5')).toMatchObject({
      key: 'gapX',
      value: 2.5,
      area: { kind: 'gap' },
    })
    expect(classDial('-mt-2')).toMatchObject({
      key: 'marginTop',
      value: -2,
      config: [-2, -16, 16, 0.5],
    })
  })

  test('radius and size tokens are dials too', () => {
    expect(classDial('rounded-lg')).toMatchObject({
      key: 'radius',
      value: 'lg',
    })
    expect(classDial('rounded-t')).toMatchObject({
      key: 'radiusTop',
      value: 'base',
    })
    expect(classDial('w-64')).toMatchObject({ key: 'width', value: 64 })
    expect(classDial('max-w-sm')).toMatchObject({
      key: 'maxWidth',
      value: 'sm',
    })
    expect(classDial('h-1/2')).toMatchObject({ key: 'height', value: '1/2' })
  })

  test('variants, arbitrary values, colours and negative padding are left to code', () => {
    for (const token of [
      'md:p-4',
      'hover:rounded-lg',
      'p-[13px]',
      'text-sm',
      'bg-primary',
      '-p-2',
      'rounded-huge',
      'flex',
    ])
      expect(classDial(token)).toBeNull()
  })

  test('the first token of each utility is the dial', () => {
    expect(
      classDials(['flex', 'p-2', 'p-4', 'rounded-xl', 'md:p-6']).map(
        (dial) => dial.token,
      ),
    ).toEqual(['p-2', 'rounded-xl'])
  })

  test('a dial writes its token back, snapped to its step', () => {
    const padding = classDial('px-4')!
    expect(tokenFor(padding, 6.26)).toBe('px-6.5')
    expect(tokenFor(classDial('-mt-2')!, -3)).toBe('-mt-3')
    expect(tokenFor(classDial('mt-2')!, -1)).toBe('-mt-1')
    expect(tokenFor(classDial('rounded-lg')!, 'base')).toBe('rounded')
    expect(tokenFor(classDial('rounded-t-lg')!, 'full')).toBe('rounded-t-full')
    expect(tokenFor(classDial('w-full')!, 'fit')).toBe('w-fit')
  })

  test('the dials are grouped in folders', () => {
    const config = classConfig(classDials(['p-2', 'rounded-md', 'w-4']), {
      spacing: 'Spacing',
      radius: 'Radius',
      size: 'Size',
    })
    expect(Object.keys(config)).toEqual(['Spacing', 'Radius', 'Size'])
    expect(config.Spacing).toEqual({ padding: [2, 0, 16, 0.5] })
  })
})

const CARD = `<script setup lang="ts">
const tone = 'class="p-9 not-this"'
</script>

<template>
  <article class="rounded-xl p-4 shadow">
    <header class="flex gap-2 px-4">
      <h2 class="text-lg">Title</h2>
      <UButton icon="i-lucide-send" />
    </header>
    <p class="text-sm">Body</p>
    <img class="w-full" src="x.png" />
  </article>
</template>
`

describe('[LAB-06] finding a stage element in its source', () => {
  test('the longest class attribute all on the element, in the template only', () => {
    const found = bestClassAttribute(CARD, [
      'flex',
      'gap-2',
      'px-4',
      'is-open',
    ])!
    expect(found.tokens).toEqual(['flex', 'gap-2', 'px-4'])
    expect(bestClassAttribute(CARD, ['p-9', 'not-this'])).toBeNull()
  })

  test('the whole element block, to its matching close tag or its self-closing end', () => {
    const header = CARD.indexOf('<header')
    const block = elementRange(CARD, header + 10)
    expect(CARD.slice(block.start, block.end)).toMatch(
      /^<header[\s\S]*<\/header>$/,
    )
    const image = elementRange(CARD, CARD.indexOf('class="w-full"'))
    expect(CARD.slice(image.start, image.end)).toBe(
      '<img class="w-full" src="x.png" />',
    )
  })

  test('a button without classes of its own is found by its icon', () => {
    const found = findElementSource(CARD, [
      { classes: ['shrink-0', 'size-5', 'i-lucide:send'], control: false },
      {
        classes: ['inline-flex', 'items-center'],
        control: true,
        icon: 'i-lucide:send',
      },
    ])!
    expect(found.depth).toBe(1)
    expect(CARD.slice(found.block.start, found.block.end)).toBe(
      '<UButton icon="i-lucide-send" />',
    )
  })

  test('an element without a match of its own takes its nearest ancestor’s', () => {
    const found = findElementSource(CARD, [
      { classes: ['font-bold'], control: false },
      { classes: ['text-lg'], control: false },
    ])!
    expect(found.depth).toBe(1)
    expect(found.attribute?.tokens).toEqual(['text-lg'])
  })

  test('a token is rewritten in that one attribute only', () => {
    const header = bestClassAttribute(CARD, ['flex', 'gap-2', 'px-4'])!
    const next = rewriteToken(CARD, header, 'px-4', 'px-6')
    expect(next).toContain('<header class="flex gap-2 px-6">')
    expect(next).toContain('<article class="rounded-xl p-4 shadow">')
    expect(rewriteToken(CARD, header, 'px-9', 'px-6')).toBe(CARD)
    expect(attributeAt(next, header.start)?.tokens).toEqual([
      'flex',
      'gap-2',
      'px-6',
    ])
  })
})
