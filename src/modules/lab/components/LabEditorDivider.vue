<script setup lang="ts">
// The bar between the Playground's code editor and its stage. Drag it, or
// focus it and use the arrow keys (Shift for bigger steps); a double click
// goes back to the default width. The width is the editor's, in pixels; 0
// is the default.
defineProps<{ label: string }>()
const width = defineModel<number>({ required: true })

const MIN = 280
// Room left for the stage and the dials beside it.
const ROOM = 560
const STEP = 20
const BIG_STEP = 80

const bar = useTemplateRef('bar')
const editor = () => bar.value?.previousElementSibling as HTMLElement | null
const current = () => editor()?.getBoundingClientRect().width ?? MIN
const maximum = () => {
  const grid = bar.value?.parentElement?.getBoundingClientRect().width ?? 0
  return Math.max(MIN, grid - ROOM)
}
function set(next: number) {
  width.value = Math.round(Math.min(Math.max(next, MIN), maximum()))
}

const dragging = ref(false)
function start(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture(event.pointerId)
  dragging.value = true
  const from = event.clientX
  const initial = current()
  const move = (next: PointerEvent) => set(initial + next.clientX - from)
  const stop = () => {
    dragging.value = false
    handle.removeEventListener('pointermove', move)
    handle.removeEventListener('pointerup', stop)
    handle.removeEventListener('pointercancel', stop)
  }
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', stop)
  handle.addEventListener('pointercancel', stop)
}
function key(event: KeyboardEvent) {
  const step = event.shiftKey ? BIG_STEP : STEP
  if (event.key === 'ArrowLeft') set(current() - step)
  else if (event.key === 'ArrowRight') set(current() + step)
  else if (event.key === 'Home') set(MIN)
  else if (event.key === 'End') set(maximum())
  else return
  event.preventDefault()
}
</script>

<template>
  <div
    ref="bar"
    role="separator"
    aria-orientation="vertical"
    tabindex="0"
    :aria-label="label"
    :aria-valuenow="Math.round(width || current())"
    :aria-valuemin="MIN"
    class="group sticky top-4 h-[min(75vh,48rem)] w-3 cursor-col-resize touch-none items-stretch justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
    @pointerdown="start"
    @keydown="key"
    @dblclick="width = 0"
  >
    <span
      class="w-0.5 rounded-full bg-(--ui-border) transition-colors duration-150 ease-out group-hover:bg-(--ui-border-accented)"
      :class="{ 'bg-primary group-hover:bg-primary': dragging }"
    />
  </div>
</template>
