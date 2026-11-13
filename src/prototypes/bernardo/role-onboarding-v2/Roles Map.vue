<!-- @studio-id qk1tmcfc407rxqnh -->
<!-- @studio-state vve0570c1fg11q8f Story -->
<!-- @studio-state fb8j64gpf1vk5bag Finished story -->
<script setup lang="ts">
import MapCanvas from './_map/MapCanvas.vue'
import MapHeader from './_map/MapHeader.vue'
import MapPanel from './_map/MapPanel.vue'
import MapTimeline from './_map/MapTimeline.vue'
import MapWhosWho from './_map/MapWhosWho.vue'
import { providePlayback } from './_map/playback'
import { provideMapState, type MapMode } from './_map/state'

// The whole role model on one map: where each role lives, who gave it and what came of it, told as the Brightwater
// story the seven flows follow. Proposed, like the flows. Opens at the end of the story.
const props = defineProps<{ mode?: MapMode; step?: number }>()

const state = provideMapState(() => ({ mode: props.mode, step: props.step }))
const { selectedId, story, mode } = state
providePlayback(state)
</script>

<script lang="ts">
export const states = [
  { title: 'Story', props: { step: 1 } },
  { title: 'Finished story', props: { step: 9 } },
]
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-default text-default">
    <MapHeader />
    <div class="flex min-h-0 flex-1">
      <!-- Left column: Who's who and the layer switches. -->
      <MapWhosWho />
      <main class="flex min-w-0 flex-1 flex-col">
        <MapCanvas class="min-h-0 flex-1" />
        <MapTimeline v-if="mode === 'story'" />
      </main>
      <!-- Right: the selected person's panel. -->
      <MapPanel v-if="selectedId && story.nodes[selectedId]" :id="selectedId" :key="selectedId" />
    </div>
  </div>
</template>
