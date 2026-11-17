import { computed, ref } from 'vue'
import type {
  PreviewNodeProps,
  PreviewOverrides,
} from '../../../../tooling/preview/protocol'
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

/** A prop the dial panel set on an instance, not saved yet. */
export interface PropChange {
  /** The tag's node ID. */
  node: string
  prop: string
  /** Its new value; null leaves it to the component's default. */
  value: string | number | boolean | null
}

const keyOf = (node: string, knob: Pick<Knob, 'slot' | 'family'>) =>
  `${node}\n${knob.slot}\n${knob.family}`
const propKeyOf = (node: string, prop: string) => `${node}\n${prop}`

/**
 * A Breakdown's unsaved changes, kept in memory for the page: what the
 * knobs moved, the classes every preview receives for them (`overrides`),
 * the props the dial panel set (`nodeProps`), how many there are
 * (`pending`), Reset (`reset`) and the lists Save writes (`all`,
 * `allProps`).
 */
export function useBreakdownChanges() {
  const changes = ref<Record<string, BreakdownChange>>({})
  const props = ref<Record<string, PropChange>>({})

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
  const nodeProps = computed<PreviewNodeProps>(() => {
    const result: PreviewNodeProps = {}
    for (const change of Object.values(props.value))
      (result[change.node] ??= {})[change.prop] = change.value
    return result
  })
  const pending = computed(
    () => Object.keys(changes.value).length + Object.keys(props.value).length,
  )

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

  /**
   * Sets an instance's prop; back to the value it starts from (`start`,
   * null for the component's default), it is no change.
   */
  function setProp(
    node: string,
    prop: string,
    value: PropChange['value'],
    start: PropChange['value'],
  ) {
    const key = propKeyOf(node, prop)
    const next = Object.fromEntries(
      Object.entries(props.value).filter(([other]) => other !== key),
    )
    if (value !== start) next[key] = { node, prop, value }
    props.value = next
  }
  /** The value an instance's prop was set to, or undefined when unchanged. */
  const propValueOf = (node: string, prop: string) =>
    props.value[propKeyOf(node, prop)]?.value

  return {
    overrides,
    nodeProps,
    pending,
    set,
    valueOf,
    setProp,
    propValueOf,
    reset: () => {
      changes.value = {}
      props.value = {}
    },
    all: () => Object.values(changes.value).map((change) => ({ ...change })),
    allProps: () => Object.values(props.value).map((change) => ({ ...change })),
    /** Keeps only these changes pending, as a save leaves the unsaved ones. */
    keepOnly: (
      kept: Pick<BreakdownChange, 'node' | 'slot' | 'family'>[],
      keptProps: Pick<PropChange, 'node' | 'prop'>[] = [],
    ) => {
      const keys = new Set(kept.map((change) => keyOf(change.node, change)))
      changes.value = Object.fromEntries(
        Object.entries(changes.value).filter(([key]) => keys.has(key)),
      )
      const propKeys = new Set(
        keptProps.map((change) => propKeyOf(change.node, change.prop)),
      )
      props.value = Object.fromEntries(
        Object.entries(props.value).filter(([key]) => propKeys.has(key)),
      )
    },
  }
}
