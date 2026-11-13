<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { shelfId } from './layout'
import MapArea from './MapArea.vue'
import MapArrows from './MapArrows.vue'
import MapLegend from './MapLegend.vue'
import MapPrograms from './MapPrograms.vue'
import MapTile from './MapTile.vue'
import { useMapState } from './state'

// The map drawn at its design size, then scaled to fit the space the view gives it, so the whole story shows
// without scrolling at any preview width.
const { story, layout, shown, layers } = useMapState()

/** How much bigger than its design size the map may grow on a wide preview. */
const MAX_SCALE = 1.25
/** Breathing room between the map and the canvas's edge once it is scaled. */
const FIT_MARGIN = 8

const frame = ref<HTMLElement>()
const space = reactive({ width: 0, height: 0 })
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

const scale = computed(() => {
  if (!space.width || !space.height) return 1
  const { width, height } = layout.value
  return Math.min((space.width - 2 * FIT_MARGIN) / width, (space.height - 2 * FIT_MARGIN) / height, MAX_SCALE)
})

const stageStyle = computed(() => {
  const { width, height } = layout.value
  const left = Math.max((space.width - width * scale.value) / 2, 0)
  const top = Math.max((space.height - height * scale.value) / 2, 0)
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${left}px, ${top}px) scale(${scale.value})`,
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
  <div ref="frame" class="canvas" role="region" aria-label="Roles map">
    <div class="stage" :style="stageStyle">
      <MapArea v-for="id in areas" :id="id" :key="id" />
      <MapArrows />
      <MapPrograms v-for="id in shelves" :key="id" :place="id" />
      <MapTile v-for="id in tiles" :id="id" :key="id" />
      <MapLegend />
    </div>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  overflow: hidden;
  background-color: var(--color-slate-50);
  background-image: radial-gradient(var(--color-slate-300) 1px, transparent 1.2px);
  background-size: 20px 20px;
}

.stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
</style>
