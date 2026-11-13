<script setup lang="ts">
import { computed } from 'vue'
import { computeArrows, type ArrowLook, type MapArrow as Arrow } from './arrows'
import MapArrow from './MapArrow.vue'
import { useMapState } from './state'

// Every arrow that exists at the current step and whose layer is on, routed once for the whole story so nothing moves
// as it plays. Lines and labels share one SVG under the tiles; routing keeps both clear of tiles and tabs.
const { story, layout, shown, layers } = useMapState()

const arrows = computed(() => computeArrows(story.value, layout.value))

function visible(arrow: Arrow): boolean {
  if (arrow.kind === 'invite') return layers.invitations && shown.value.nodes.has(arrow.to)
  if (arrow.kind === 'create') return layers.creations && shown.value.places.has(arrow.to)
  return layers.programs && shown.value.places.has(arrow.from)
}

/** How each arrow is drawn; the timeline makes the current step's arrow `now`. */
const look = (arrow: Arrow): ArrowLook => arrow.kind

const drawn = computed(() => arrows.value.filter(visible))
</script>

<template>
  <svg
    class="arrows"
    :width="layout.width"
    :height="layout.height"
    :viewBox="`0 0 ${layout.width} ${layout.height}`"
    aria-hidden="true"
  >
    <MapArrow v-for="arrow in drawn" :key="arrow.id" :arrow="arrow" :look="look(arrow)" />
  </svg>
</template>

<style scoped>
.arrows {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  overflow: visible;
  pointer-events: none;
}
</style>
