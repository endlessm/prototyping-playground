<script setup lang="ts">
import { computed } from 'vue'
import { computeArrows, type ArrowLook, type MapArrow as Arrow } from './arrows'
import MapArrow from './MapArrow.vue'
import { usePathView } from './path'
import { usePlayback } from './playback'
import { useMapState } from './state'

// Every arrow that exists at the current step and whose layer is on, routed once for the whole story so nothing moves
// as it plays. Lines and labels share one SVG under the tiles; routing keeps both clear of tiles and tabs.
const { story, layout, shown, layers, mode, step } = useMapState()
const { upcoming } = usePlayback()

const path = usePathView()

const arrows = computed(() => computeArrows(story.value, layout.value))

function visible(arrow: Arrow): boolean {
  if (arrow.kind === 'invite') return layers.invitations && shown.value.nodes.has(arrow.to)
  if (arrow.kind === 'create') return layers.creations && shown.value.places.has(arrow.to)
  return layers.programs && shown.value.places.has(arrow.from)
}

/** How each arrow is drawn: in Story mode, the current step's arrow is `now`. */
const look = (arrow: Arrow): ArrowLook =>
  mode.value === 'story' && arrow.id === `step-${step.value}` ? 'now' : arrow.kind

/** While a path plays, every arrow but its invitations fades. */
const dim = (arrow: Arrow): boolean =>
  path.active.value && !(arrow.kind === 'invite' && path.steps.value.has(arrow.step))

const drawn = computed(() => arrows.value.filter(visible))
/** Whether an arrow's own kind is switched on, whatever step it belongs to. */
const layerOn = (arrow: Arrow): boolean =>
  arrow.kind === 'invite' ? layers.invitations : arrow.kind === 'create' ? layers.creations : layers.programs

/** The next step's arrow, faded, reaching the ghost of what comes next; its kind's layer hides it too. */
const ghost = computed(() => {
  if (mode.value !== 'story' || !layers.next || upcoming.value === null) return null
  const arrow = arrows.value.find((candidate) => candidate.id === `step-${upcoming.value}`)
  if (!arrow || !layerOn(arrow) || !shown.value.nodes.has(arrow.from)) return null
  return arrow
})
</script>

<template>
  <svg
    class="arrows"
    :width="layout.width"
    :height="layout.height"
    :viewBox="`0 0 ${layout.width} ${layout.height}`"
    aria-hidden="true"
  >
    <MapArrow v-for="arrow in drawn" :key="arrow.id" :arrow="arrow" :look="look(arrow)" :dim="dim(arrow)" />
    <MapArrow v-if="ghost" :key="`next:${ghost.id}`" :arrow="ghost" look="next" />
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
