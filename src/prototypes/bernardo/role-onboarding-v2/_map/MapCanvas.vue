<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { shelfId } from './layout'
import MapArea from './MapArea.vue'
import MapArrows from './MapArrows.vue'
import MapGhost from './MapGhost.vue'
import MapLegend from './MapLegend.vue'
import MapPrograms from './MapPrograms.vue'
import MapTile from './MapTile.vue'
import MapZoom from './MapZoom.vue'
import { useMapState } from './state'
import { canPan, clampView, fitView, panBy, scaleRange, stepScale, ZOOM_BAR_BAND, zoomTo, type View } from './zoom'

// The map drawn at its design size inside a stage that zooms and pans. It opens fitted, so the whole story shows
// without scrolling at any preview width; arrows and labels live in the stage, so they stay aligned at every scale.
const { story, layout, shown, layers } = useMapState()

const frame = ref<HTMLElement>()
const space = reactive({ width: 0, height: 0, top: ZOOM_BAR_BAND })
const map = computed(() => ({ width: layout.value.width, height: layout.value.height }))
const view = ref<View>({ x: 0, y: 0, scale: 1 })
/** Set once the reviewer zooms or drags, so resizing the preview keeps their view instead of refitting. */
const zoomed = ref(false)
/** Only the buttons animate; dragging and the wheel follow the pointer at once. */
const animate = ref(false)
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    space.width = entry.contentRect.width
    space.height = entry.contentRect.height
  })
  if (frame.value) observer.observe(frame.value)
})

onBeforeUnmount(() => observer?.disconnect())

function fit() {
  zoomed.value = false
  view.value = fitView(space, map.value)
}

watch(
  () => [space.width, space.height],
  () => {
    animate.value = false
    if (zoomed.value) view.value = clampView(view.value, space, map.value)
    else fit()
  },
)

// A new story (Story ↔ Explore) is a different map, so it always opens fitted.
watch(layout, () => {
  animate.value = false
  fit()
})

const range = computed(() => scaleRange(space, map.value))
const pannable = computed(() => canPan(view.value, space, map.value))

function step(direction: 1 | -1) {
  animate.value = true
  zoomed.value = true
  const scale = stepScale(view.value.scale, direction, space, map.value)
  view.value = zoomTo(view.value, scale, { x: space.width / 2, y: space.height / 2 }, space, map.value)
}

function refit() {
  animate.value = true
  fit()
}

// Ctrl/⌘ + wheel (and a trackpad pinch, which the browser reports the same way) zooms around the pointer. A plain
// wheel is left alone.
function onWheel(event: WheelEvent) {
  if (!(event.ctrlKey || event.metaKey) || !frame.value) return
  event.preventDefault()
  const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
  const box = frame.value.getBoundingClientRect()
  const at = { x: event.clientX - box.left, y: event.clientY - box.top }
  animate.value = false
  zoomed.value = true
  view.value = zoomTo(view.value, view.value.scale * Math.exp(-delta * 0.002), at, space, map.value)
}

/** Presses on these keep their own meaning (select a tile, press a button), so they never start a drag. */
const INTERACTIVE = 'button, a, input, select, textarea, [role="button"], [role="toolbar"]'
const drag = ref<{ pointer: number; x: number; y: number; from: View } | null>(null)

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !pannable.value || !frame.value) return
  if ((event.target as Element | null)?.closest(INTERACTIVE)) return
  event.preventDefault()
  frame.value.setPointerCapture(event.pointerId)
  animate.value = false
  drag.value = { pointer: event.pointerId, x: event.clientX, y: event.clientY, from: view.value }
}

function onPointerMove(event: PointerEvent) {
  const current = drag.value
  if (!current || event.pointerId !== current.pointer) return
  zoomed.value = true
  view.value = panBy(current.from, event.clientX - current.x, event.clientY - current.y, space, map.value)
}

function onPointerUp(event: PointerEvent) {
  if (!drag.value || event.pointerId !== drag.value.pointer) return
  if (frame.value?.hasPointerCapture(event.pointerId)) frame.value.releasePointerCapture(event.pointerId)
  drag.value = null
}

const stageStyle = computed(() => {
  const { x, y, scale } = view.value
  return {
    width: `${map.value.width}px`,
    height: `${map.value.height}px`,
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
  }
})

const areas = computed(() => layout.value.areaOrder.filter((id) => shown.value.places.has(id)))
const tiles = computed(() => Object.keys(layout.value.nodes).filter((id) => shown.value.nodes.has(id)))
/** The Organizations whose Programs shelf shows: those on the map, while the Programs layer is on. */
const shelves = computed(() =>
  layers.programs
    ? Object.values(story.value.places)
        .filter((place) => place.kind === 'Organization' && shown.value.places.has(place.id))
        .filter((place) => layout.value.boxes[shelfId(place.id)])
        .map((place) => place.id)
    : [],
)
</script>

<template>
  <div
    ref="frame"
    class="relative overflow-hidden bg-default"
    :class="{ 'cursor-grab touch-none': pannable, 'cursor-grabbing select-none': drag }"
    role="region"
    aria-label="Roles map"
    @wheel="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      class="absolute top-0 left-0 origin-top-left"
      :class="{ 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out': animate }"
      :style="stageStyle"
    >
      <MapArea v-for="id in areas" :id="id" :key="id" />
      <MapArrows />
      <MapPrograms v-for="id in shelves" :key="id" :place="id" />
      <MapTile v-for="id in tiles" :id="id" :key="id" />
      <MapGhost />
      <MapLegend />
    </div>
    <MapZoom :scale="view.scale" :min="range[0]" :max="range[1]" @out="step(-1)" @in="step(1)" @fit="refit" />
  </div>
</template>

