<script setup lang="ts">
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'

// One piece of a Breakdown on the canvas: its preview on a dotted inset,
// its name, then its file and the library under it in monospace. The whole
// card is one button, laid over the preview so the preview never takes the
// click: hovering lifts it, and the selected one has a blue outline. It
// carries its piece's node ID as the preview's elements do.
const props = defineProps<{
  node: BreakdownNode
  /** Its file as the card writes it, or null. */
  file: string | null
  selected: boolean
  /** Height of the dotted inset, in CSS pixels; the root's grows with its preview. */
  inset?: number
}>()
const emit = defineEmits<{ select: []; hover: [hovered: boolean] }>()
const { t } = useI18n()

// A theme slot is a key of its piece's `ui`, which is what a designer
// looks for in code.
const line = computed(() =>
  props.node.slot
    ? `ui.${props.node.slot}`
    : [props.file, props.node.library].filter(Boolean).join(' · '),
)
</script>

<template>
  <div
    :data-lab-node="node.id"
    class="group relative flex flex-col rounded-xl border bg-default shadow-xs transition duration-150 hover:-translate-y-0.5 hover:shadow-md has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-primary"
    :class="selected ? 'border-info ring-2 ring-info/70' : 'border-default'"
  >
    <div
      class="pointer-events-none m-1.5 flex items-center justify-center overflow-hidden rounded-lg border border-default bg-[radial-gradient(var(--ui-border-accented)_1px,transparent_1px)] bg-size-[10px_10px]"
      :style="inset ? { height: `${inset}px` } : undefined"
    >
      <slot name="preview" />
    </div>
    <div class="min-w-0 px-3 pt-1 pb-3">
      <p class="truncate text-sm font-semibold text-highlighted">
        {{ node.name }}
      </p>
      <p v-if="line" class="truncate font-mono text-xs text-muted">
        {{ line }}
      </p>
      <p v-if="node.repeated" class="mt-1 text-xs text-muted">
        {{ t('lab.breakdown.repeated') }}
      </p>
    </div>
    <button
      type="button"
      class="absolute inset-0 cursor-pointer rounded-xl outline-none"
      :aria-label="
        line
          ? t('lab.breakdown.piece', { name: node.name, file: line })
          : node.name
      "
      :aria-pressed="selected"
      @click.stop="emit('select')"
      @mouseenter="emit('hover', true)"
      @mouseleave="emit('hover', false)"
      @focus="emit('hover', true)"
      @blur="emit('hover', false)"
    />
  </div>
</template>
