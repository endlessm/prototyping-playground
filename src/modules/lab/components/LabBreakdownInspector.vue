<script setup lang="ts">
import type { KnobHighlight } from '../../../../tooling/preview/protocol'
import {
  KNOB_FAMILIES,
  knobLabel,
  knobsOf,
  type KnobTheme,
} from '../../../../tooling/preview/knobs'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'
import type { BreakdownChanges } from '../composables/useBreakdownChanges'
import LabKnob from './LabKnob.vue'

// The selected piece's knobs, in the Breakdown's toolbar: one for each
// thing the classes of its theme slots set, or a note when there is
// nothing to adjust. A theme slot's card offers that slot's knobs; changes
// are kept on the Nuxt UI piece the slot belongs to. A piece whose tag
// lives in another file has none, and says where it lives: Save writes
// only into the experiment's own file, so its changes could never be kept.
const props = defineProps<{
  node: BreakdownNode
  /**
   * The classes the piece's theme slots render with, as the preview
   * reports them (by the Nuxt UI piece's node ID); undefined until then.
   */
  classes: Record<string, Record<string, string> | undefined>
  measured: boolean
  theme: KnobTheme
  changes: BreakdownChanges
  /** The file holding the piece's tag, when it isn't the Breakdown's own. */
  elsewhere: string | null
  /** Each colour knob class's colour in the preview, by class. */
  swatches: Record<string, string>
}>()
const emit = defineEmits<{ highlight: [knob: KnobHighlight | null] }>()
const { t } = useI18n()

const owner = computed(() =>
  props.node.slot ? props.node.id.split('#')[0]! : props.node.id,
)
// The piece's own theme slots: the one a slot's card names, or those its
// slot cards name; none for a piece whose theme has no slots.
const theirs = computed(() =>
  props.node.slot
    ? [props.node.slot]
    : props.node.children.flatMap(({ kind, slot }) =>
        kind === 'slot' && slot ? [slot] : [],
      ),
)
const knobs = computed(() => {
  if (props.elsewhere) return []
  const slots = props.classes[owner.value]
  if (!slots) return []
  // Only the piece's own theme slots: a Nuxt UI piece may render others
  // inside it (a modal's close button) that aren't pieces of the tree.
  const own = theirs.value.length
    ? Object.fromEntries(theirs.value.map((slot) => [slot, slots[slot] ?? '']))
    : slots
  return knobsOf(own, props.theme)
})
const label = (knob: (typeof knobs.value)[number]) =>
  knobLabel(knob, (family) => t(`lab.knobs.families.${family}`))

function hover(knob: (typeof knobs.value)[number], on: boolean) {
  emit(
    'highlight',
    on
      ? {
          target: `${owner.value}#${knob.slot}`,
          area: KNOB_FAMILIES[knob.family].area,
          color: KNOB_FAMILIES[knob.family].color,
        }
      : null,
  )
}
</script>

<template>
  <div
    v-if="knobs.length"
    role="group"
    :aria-label="t('lab.knobs.inspector', { name: node.name })"
    class="flex min-w-28 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]"
  >
    <LabKnob
      v-for="knob in knobs"
      :key="knob.id"
      :knob="knob"
      :value="changes.valueOf(owner, knob) ?? knob.value"
      :label="label(knob)"
      :theme="theme"
      :swatches="swatches"
      @change="changes.set(owner, knob, $event)"
      @hover="hover(knob, $event)"
    />
  </div>
  <span v-else-if="elsewhere" class="px-2 text-xs whitespace-nowrap text-muted">
    {{ t('lab.knobs.elsewhere', { file: elsewhere }) }}
  </span>
  <span v-else-if="measured" class="px-2 text-xs whitespace-nowrap text-muted">
    {{ t('lab.knobs.none') }}
  </span>
</template>
