import { computed, ref } from 'vue'
import type { PreviewOverrides } from '../../../../tooling/preview/protocol'
import {
  knobClass,
  type Knob,
  type KnobFamily,
} from '../../../../tooling/preview/knobs'

/** One knob moved on one piece, not saved yet. */
export interface BreakdownChange {
  /** The piece's node ID (a Nuxt UI tag's, never a theme slot's). */
  node: string
  /** The theme slot whose classes change. */
  slot: string
  family: KnobFamily
  value: string
  /** The value it had before any change. */
  original: string
  /** The class it writes, such as `rounded-xl`. */
  className: string
}

export type BreakdownChanges = ReturnType<typeof useBreakdownChanges>

const keyOf = (node: string, knob: Pick<Knob, 'slot' | 'family'>) =>
  `${node}\n${knob.slot}\n${knob.family}`

/**
 * A Breakdown's unsaved changes, kept in memory for the page: what the
 * knobs moved, the classes every preview receives for them (`overrides`),
 * how many there are (`pending`), Reset (`reset`) and the list Save writes
 * (`all`).
 */
export function useBreakdownChanges() {
  const changes = ref<Record<string, BreakdownChange>>({})

  const overrides = computed<PreviewOverrides>(() => {
    const result: PreviewOverrides = {}
    for (const change of Object.values(changes.value)) {
      const slots = (result[change.node] ??= {})
      slots[change.slot] = [slots[change.slot], change.className]
        .filter(Boolean)
        .join(' ')
    }
    return result
  })
  const pending = computed(() => Object.keys(changes.value).length)

  /** Moves a piece's knob to a value; back to its start, it is no change. */
  function set(node: string, knob: Knob, value: string) {
    const key = keyOf(node, knob)
    const original = changes.value[key]?.original ?? knob.value
    const next = Object.fromEntries(
      Object.entries(changes.value).filter(([other]) => other !== key),
    )
    if (value !== original)
      next[key] = {
        node,
        slot: knob.slot,
        family: knob.family,
        value,
        original,
        className: knobClass(knob, value),
      }
    changes.value = next
  }

  /** The value a piece's knob was moved to, or null when unchanged. */
  const valueOf = (node: string, knob: Pick<Knob, 'slot' | 'family'>) =>
    changes.value[keyOf(node, knob)]?.value ?? null

  return {
    overrides,
    pending,
    set,
    valueOf,
    reset: () => void (changes.value = {}),
    all: () => Object.values(changes.value).map((change) => ({ ...change })),
  }
}
