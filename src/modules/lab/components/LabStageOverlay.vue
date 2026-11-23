<script setup lang="ts">
import type { Box, BoxKind } from '../utils/boxes'

// What Inspect and the dials draw over the stage, in the studio's page
// rather than the stage's document, so the system's styles never meet the
// studio's. It sits exactly over the frame and clips to it; the boxes are
// in the frame's own viewport coordinates. Margin shows as orange stripes,
// padding and gaps as Cornflower stripes, the way browser tools show space.
const props = defineProps<{
  frame: HTMLIFrameElement | null
  boxes: Box[]
  /** Said beside the first box. */
  label?: string | null
  /** Changes whenever the boxes or the frame may have moved. */
  version: number
}>()

const host = useTemplateRef('host')
const place = computed(() => {
  void props.version
  const frame = props.frame
  const parent = host.value?.parentElement
  if (!frame || !parent) return null
  const outer = parent.getBoundingClientRect()
  const inner = frame.getBoundingClientRect()
  return {
    top: `${inner.top - outer.top + frame.clientTop}px`,
    left: `${inner.left - outer.left + frame.clientLeft}px`,
    width: `${frame.clientWidth}px`,
    height: `${frame.clientHeight}px`,
  }
})

const stripes = (angle: number, rgb: string) =>
  `repeating-linear-gradient(${angle}deg, rgb(${rgb} / 0.45) 0 4px, rgb(${rgb} / 0.15) 4px 8px)`
const ORANGE = '255 105 0'
const CORNFLOWER = '101 86 240'
const LOOK: Record<BoxKind, Record<string, string>> = {
  outline: { outline: `1px dashed rgb(${ORANGE})`, borderRadius: '4px' },
  hover: {
    outline: `1px solid rgb(${CORNFLOWER} / 0.8)`,
    background: `rgb(${CORNFLOWER} / 0.06)`,
    borderRadius: '4px',
  },
  selected: { outline: `2px solid rgb(${ORANGE})` },
  margin: { background: stripes(45, ORANGE) },
  padding: { background: stripes(45, CORNFLOWER) },
  gap: { background: stripes(-45, CORNFLOWER) },
}

const labelAt = computed(() => {
  const first = props.boxes[0]
  if (!first || !props.label) return null
  // Above the box when there's room, otherwise just inside it.
  const top = first.top >= 22 ? first.top - 22 : first.top + 2
  return { top: `${top}px`, left: `${Math.max(2, first.left)}px` }
})
</script>

<template>
  <div
    ref="host"
    aria-hidden="true"
    class="pointer-events-none absolute overflow-hidden"
    :style="place ?? { display: 'none' }"
  >
    <div
      v-for="(box, index) in boxes"
      :key="index"
      class="absolute"
      :style="{
        top: `${box.top}px`,
        left: `${box.left}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        ...LOOK[box.kind],
      }"
    />
    <p
      v-if="labelAt"
      data-lab-stage-label
      class="absolute max-w-[calc(100%-4px)] truncate rounded-full bg-inverted px-2 py-0.5 font-mono text-xs leading-4 text-inverted"
      :style="labelAt"
    >
      {{ label }}
    </p>
  </div>
</template>
