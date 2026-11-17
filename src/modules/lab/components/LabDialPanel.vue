<script setup lang="ts">
import { Folder, SelectControl } from 'dialkit/vue'
import dialkitStyles from 'dialkit/styles.css?inline'
import { knobLabel, type KnobTheme } from '../../../../tooling/preview/knobs'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'
import type { PropDoc } from '../../../../tooling/systems/props'
import type { BreakdownChanges } from '../composables/useBreakdownChanges'
import type { ComponentInstance } from '../experiments/instances'
import { cardFile, pieceElsewhere, treeNodes } from '../utils/breakdown'
import { knobChoices, pieceKnobs } from '../utils/knobs'
import LabDialProps from './LabDialProps.vue'

// The dial panel beside the component alone on a Breakdown's canvas: a
// DialKit panel with a folder for each piece that has knobs or is the Lab's
// own component, named as its card is, holding the knobs the inspector
// offers as selects over the theme's own values and, for the component, a
// Props folder (`LabDialProps.vue`). It reads and moves the page's unsaved
// changes, so the inspector, Reset, the count and Save see the same ones.
// DialKit's controls are laid out here rather than through its root, whose
// labels rewrite names (`UButton` reads "U Button") and whose Copy and
// versions toolbar keeps a second set of values the studio wouldn't save.
// Loaded with DialKit when the component view first opens.
const props = defineProps<{
  tree: BreakdownNode
  /** The classes each Nuxt UI piece's theme slots render with, by node ID. */
  classes: Record<string, Record<string, string> | undefined>
  measured: boolean
  theme: KnobTheme
  changes: BreakdownChanges
  systemFolder: string
  name: string
  /** The tags that are the Lab's component, with what each writes. */
  instances?: ComponentInstance[]
  /** The component's props, as its Playground reads them. */
  propDocs?: PropDoc[]
}>()
const { t } = useI18n()

// The studio is light only (ADR 0005), so the panel is too; should a dark
// mode return, Nuxt UI's `dark` class on the page turns it dark with it.
const root = import.meta.client ? document.documentElement : null
const dark = ref(root?.classList.contains('dark') ?? false)
useMutationObserver(
  root,
  () => void (dark.value = root?.classList.contains('dark') ?? false),
  { attributes: true, attributeFilter: ['class'] },
)

// DialKit's stylesheet, scoped to its own `.dialkit-*` classes, without
// the web font it fetches from Google: its numbers fall back to the
// system's monospace font, and nothing leaves for a third party.
useHead({
  style: [
    {
      key: 'dialkit',
      innerHTML: dialkitStyles.replace(/@import url\([^)]*\);?/g, ''),
    },
  ],
})

const pieces = computed(() =>
  treeNodes(props.tree).flatMap((node) => {
    if (node.slot) return []
    const elsewhere = cardFile(
      pieceElsewhere(props.tree, node.id),
      props.systemFolder,
    )
    const { owner, knobs } = pieceKnobs(
      node,
      props.classes,
      props.theme,
      elsewhere,
    )
    const instance = props.propDocs?.length
      ? props.instances?.find((each) => each.node === node.id)
      : undefined
    return knobs.length || instance ? [{ node, owner, knobs, instance }] : []
  }),
)

const pixels = (value: string) => t('lab.knobs.pixels', { value })
const family = (key: string) => t(`lab.knobs.families.${key}`)
</script>

<template>
  <section
    :aria-label="t('lab.dial.panel', { name })"
    class="dialkit-root"
    data-mode="inline"
    :data-theme="dark ? 'dark' : 'light'"
  >
    <div class="dialkit-panel" data-mode="inline">
      <div class="dialkit-panel-wrapper">
        <Folder :title="t('lab.dial.title')" is-root inline>
          <Folder
            v-for="(piece, index) in pieces"
            :key="piece.node.id"
            :title="piece.node.name"
            :default-open="pieces.length <= 3 || index === 0"
          >
            <SelectControl
              v-for="knob in piece.knobs"
              :key="knob.id"
              :label="knobLabel(knob, family)"
              :value="changes.valueOf(piece.owner, knob) ?? knob.value"
              :options="
                knobChoices(
                  knob,
                  changes.valueOf(piece.owner, knob) ?? knob.value,
                  theme,
                  pixels,
                )
              "
              @change="changes.set(piece.owner, knob, $event)"
            />
            <LabDialProps
              v-if="piece.instance && propDocs"
              :instance="piece.instance"
              :docs="propDocs"
              :changes="changes"
            />
          </Folder>
          <p
            v-if="measured && !pieces.length"
            class="px-1 py-2 text-xs text-muted"
          >
            {{ t('lab.dial.none') }}
          </p>
        </Folder>
      </div>
    </div>
  </section>
</template>
