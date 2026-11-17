<script setup lang="ts">
import {
  slotId,
  type KnobHighlight,
} from '../../../../tooling/preview/protocol'
import {
  KNOB_FAMILIES,
  knobLabel,
  type KnobTheme,
} from '../../../../tooling/preview/knobs'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'
import type { BreakdownChanges } from '../composables/useBreakdownChanges'
import { pieceKnobs } from '../utils/knobs'
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

const found = computed(() =>
  pieceKnobs(props.node, props.classes, props.theme, props.elsewhere),
)
const owner = computed(() => found.value.owner)
const knobs = computed(() => found.value.knobs)
const label = (knob: (typeof knobs.value)[number]) =>
  knobLabel(knob, (family) => t(`lab.knobs.families.${family}`))

function hover(knob: (typeof knobs.value)[number], on: boolean) {
  emit(
    'highlight',
    on
      ? {
          target: slotId(owner.value, knob.slot),
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
