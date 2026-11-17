<script setup lang="ts">
import { Folder, SelectControl, TextControl, Toggle } from 'dialkit/vue'
import { isSettableProp } from '../../../../tooling/preview/protocol'
import type { PropDoc } from '../../../../tooling/systems/props'
import type { ComponentInstance } from '../experiments/instances'
import type { BreakdownChanges } from '../composables/useBreakdownChanges'
import {
  literalValue,
  tagControl,
  type ControlValue,
  type PlaygroundControl,
} from '../utils/playground'

// The Props folder of one instance of the Lab's component in the dial
// panel: a control for each prop the Playground would offer (`tagControl`,
// from the component's props metadata), starting from what the tag writes,
// or else the prop's default. Changes go to the page's unsaved changes, so
// the preview, Reset, the count and Save see them. A prop the tag binds to
// code shows read-only, saying so: Save can't write over code.
const props = defineProps<{
  instance: ComponentInstance
  docs: PropDoc[]
  changes: BreakdownChanges
}>()
const { t } = useI18n()

type Row =
  | {
      kind: 'control'
      control: PlaygroundControl
      /** The prop's own default, with nothing written on the tag. */
      fallback: ControlValue | null
    }
  | { kind: 'code'; name: string; code: string }

const rows = computed<Row[]>(() =>
  props.docs.flatMap((doc): Row[] => {
    if (!isSettableProp(doc.name)) return []
    const written = props.instance.attributes[doc.name]
    if (written && 'code' in written)
      return [{ kind: 'code', name: doc.name, code: written.code }]
    const control = tagControl(doc, written?.value)
    if (control.kind === 'code') return []
    return [
      { kind: 'control', control, fallback: tagControl(doc).start ?? null },
    ]
  }),
)

type ControlRow = Row & { kind: 'control' }

// What a control shows: its unsaved value, or its start; a prop left to
// its default shows the default.
function valueOf({ control, fallback }: ControlRow): ControlValue | null {
  const changed = props.changes.propValueOf(props.instance.node, control.name)
  if (changed === undefined) return control.start ?? null
  return changed ?? fallback
}
// A value equal to the prop's default leaves the prop out, so Save drops
// its attribute rather than writing the default out.
function set({ control, fallback }: ControlRow, value: ControlValue | null) {
  props.changes.setProp(
    props.instance.node,
    control.name,
    value === fallback ? null : value,
    control.start === undefined || control.start === fallback
      ? null
      : control.start,
  )
}

const DEFAULT = ''
// Each option named as the code writes it (DialKit would capitalize it).
const options = (row: ControlRow) => [
  ...((row.control.kind === 'select' && row.control.unset) ||
  valueOf(row) === null
    ? [{ value: DEFAULT, label: t('lab.dial.default') }]
    : []),
  ...(row.control.kind === 'select' ? row.control.options : []).map(
    (option) => ({ value: option, label: option }),
  ),
]
function typedNumber(row: ControlRow, text: string) {
  if (!text.trim()) return set(row, null)
  const number = literalValue(text)
  if (typeof number === 'number') set(row, number)
}
function typedText(row: ControlRow, text: string) {
  set(row, text === '' && !row.control.required ? null : text)
}
</script>

<template>
  <Folder :title="t('lab.dial.props')" :default-open="true">
    <template
      v-for="row in rows"
      :key="row.kind === 'code' ? row.name : row.control.name"
    >
      <div
        v-if="row.kind === 'code'"
        role="group"
        :aria-label="t('lab.dial.inCode', { name: row.name })"
        :title="row.code"
        class="flex h-9 items-center justify-between gap-2 rounded-lg bg-(--dial-surface) px-2.5 text-xs"
      >
        <span class="text-(--dial-text-label)">{{ row.name }}</span>
        <span class="truncate text-(--dial-text-tertiary)">{{
          t('lab.dial.code')
        }}</span>
      </div>
      <SelectControl
        v-else-if="row.control.kind === 'select'"
        :label="row.control.name"
        :value="String(valueOf(row) ?? DEFAULT)"
        :options="options(row)"
        @change="set(row, $event === DEFAULT ? null : $event)"
      />
      <Toggle
        v-else-if="row.control.kind === 'switch'"
        :label="row.control.name"
        :checked="valueOf(row) === true"
        @change="set(row, $event)"
      />
      <TextControl
        v-else-if="row.control.kind === 'number'"
        :label="row.control.name"
        :value="String(valueOf(row) ?? '')"
        @change="typedNumber(row, $event)"
      />
      <TextControl
        v-else
        :label="row.control.name"
        :value="String(valueOf(row) ?? '')"
        @change="typedText(row, $event)"
      />
    </template>
  </Folder>
</template>
