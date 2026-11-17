// The dial panel's knobs: the same a piece's inspector offers, and the
// named choices each select lists, only the theme's own values.
import { describe, expect, test } from 'vitest'
import type { BreakdownNode } from '../../tooling/systems/breakdown'
import { knobChoices, pieceKnobs } from '../../src/modules/lab/utils/knobs'

const theme = { colors: ['primary', 'neutral'], textSizes: { body: 14 } }
const px = (value: string) => `${value} px`

const node = (
  id: string,
  children: Partial<BreakdownNode>[] = [],
): BreakdownNode => ({
  id,
  name: id.split('>').at(-1)!,
  kind: 'component',
  source: 'nuxt-ui',
  file: null,
  library: null,
  repeated: false,
  children: children.map((child) => ({
    id: `${id}#${child.slot}`,
    name: child.slot!,
    kind: 'slot',
    source: 'nuxt-ui',
    file: null,
    library: null,
    repeated: false,
    children: [],
    ...child,
  })),
})

describe('a piece’s knobs', () => {
  test('come from its own theme slots, kept on the piece', () => {
    const button = node('root>UButton', [{ slot: 'base' }])
    const found = pieceKnobs(
      button,
      { 'root>UButton': { base: 'rounded-md px-2', label: 'text-sm' } },
      theme,
      null,
    )
    expect(found.owner).toBe('root>UButton')
    expect(found.knobs.map(({ id }) => id)).toEqual([
      'base.corners',
      'base.paddingX',
    ])
  })

  test('a piece in another file, or not reported yet, has none', () => {
    const button = node('root>UButton', [{ slot: 'base' }])
    const classes = { 'root>UButton': { base: 'rounded-md' } }
    expect(pieceKnobs(button, classes, theme, 'app/Nav.vue').knobs).toEqual([])
    expect(pieceKnobs(button, {}, theme, null).knobs).toEqual([])
  })
})

describe('a knob’s choices', () => {
  test('sizes are named by their class and pixels, spacing by its pixels', () => {
    const corners = knobChoices({ family: 'corners' }, 'md', theme, px)
    expect(corners).toContainEqual({ value: 'lg', label: 'lg · 8 px' })
    expect(corners).toContainEqual({ value: 'full', label: 'full' })
    expect(knobChoices({ family: 'padding' }, '2', theme, px)).toContainEqual({
      value: '1.5',
      label: '6 px',
    })
    expect(knobChoices({ family: 'textSize' }, 'sm', theme, px)).toContainEqual(
      { value: 'body', label: 'body · 14 px' },
    )
    expect(knobChoices({ family: 'weight' }, 'bold', theme, px)).toContainEqual(
      { value: 'semibold', label: 'semibold · 600' },
    )
    expect(knobChoices({ family: 'ring' }, '1', theme, px)).toContainEqual({
      value: '1',
      label: '1 px',
    })
  })

  test('colours are the theme’s own, by name', () => {
    const fills = knobChoices({ family: 'fill' }, 'primary', theme, px)
    expect(fills.map(({ value }) => value)).toContain('primary/10')
    expect(fills.map(({ value }) => value)).not.toContain('red-500')
  })

  test('a value off the theme’s list comes first, so the select can show it', () => {
    const choices = knobChoices({ family: 'padding' }, '13', theme, px)
    expect(choices[0]).toEqual({ value: '13', label: '52 px' })
  })
})
