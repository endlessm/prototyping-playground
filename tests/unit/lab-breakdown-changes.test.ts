// A Breakdown's unsaved changes: each knob moved on a piece is one change,
// kept until Reset, with the classes the preview receives (overrides) and
// the count Save shows. Moving a knob back to where it started is no change.
import { describe, expect, test } from 'vitest'
import { useBreakdownChanges } from '../../src/modules/lab/composables/useBreakdownChanges'
import type { Knob } from '../../tooling/preview/knobs'

const corners: Knob = {
  id: 'base.corners',
  slot: 'base',
  family: 'corners',
  value: 'md',
  className: 'rounded-md',
}
const padding: Knob = {
  id: 'base.paddingX',
  slot: 'base',
  family: 'paddingX',
  value: '2.5',
  className: 'px-2.5',
}

describe('unsaved changes', () => {
  test('each knob moved is one pending change, its classes sent by node and slot', () => {
    const changes = useBreakdownChanges()
    expect(changes.pending.value).toBe(0)
    expect(changes.overrides.value).toEqual({})
    changes.set('root>UButton', corners, 'lg')
    changes.set('root>UButton', corners, 'xl')
    changes.set('root>UButton', padding, '4')
    changes.set(
      'root>StudioSidebar>USidebar',
      { ...corners, slot: 'root' },
      'none',
    )
    expect(changes.pending.value).toBe(3)
    expect(changes.overrides.value).toEqual({
      'root>UButton': { base: 'rounded-xl px-4' },
      'root>StudioSidebar>USidebar': { root: 'rounded-none' },
    })
    expect(changes.valueOf('root>UButton', corners)).toBe('xl')
    expect(changes.valueOf('root>UButton', { ...corners, slot: 'label' })).toBe(
      null,
    )
  })

  test('a knob moved back to where it started is no longer a change', () => {
    const changes = useBreakdownChanges()
    changes.set('root>UButton', corners, 'xl')
    // The preview now renders the new value, which the knob reads back.
    changes.set('root>UButton', { ...corners, value: 'xl' }, 'md')
    expect(changes.pending.value).toBe(0)
    expect(changes.overrides.value).toEqual({})
  })

  test('Reset discards them all, and all() lists them for saving', () => {
    const changes = useBreakdownChanges()
    changes.set('root>UButton', corners, 'xl')
    expect(changes.all()).toEqual([
      {
        node: 'root>UButton',
        slot: 'base',
        family: 'corners',
        value: 'xl',
        original: 'md',
        className: 'rounded-xl',
      },
    ])
    changes.reset()
    expect(changes.pending.value).toBe(0)
    expect(changes.all()).toEqual([])
    expect(changes.overrides.value).toEqual({})
  })
})
