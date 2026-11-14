<!-- @studio-id qk1tmcfc407rxqnh -->
<!-- @studio-state vve0570c1fg11q8f Story -->
<!-- @studio-state fb8j64gpf1vk5bag Finished story -->
<!-- @studio-state m70w19rbb77qpge6 Explore -->
<script setup lang="ts">
import MapCanvas from './_map/MapCanvas.vue'
import MapHeader from './_map/MapHeader.vue'
import MapPanel from './_map/MapPanel.vue'
import MapTimeline from './_map/MapTimeline.vue'
import MapWhosWho from './_map/MapWhosWho.vue'
import { providePlayback } from './_map/playback'
import { provideMapState, type MapMode } from './_map/state'

// The whole role model on one map: where each role lives, who gave it and what came of it, told as the Brightwater
// story the seven flows follow, or (Explore) as the whole district at once. Proposed, like the flows. Opens at the end
// of the story.
const props = defineProps<{ mode?: MapMode; step?: number }>()

const state = provideMapState(() => ({ mode: props.mode, step: props.step }))
const { selectedId, story, mode } = state
providePlayback(state)

const modes: { label: string; value: MapMode }[] = [
  { label: 'Story', value: 'story' },
  { label: 'Explore', value: 'explore' },
]
</script>

<script lang="ts">
export const states = [
  { title: 'Story', props: { step: 0 } },
  { title: 'Finished story', props: { step: 9 } },
  { title: 'Explore', props: { mode: 'explore' } },
]
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-default text-default">
    <MapHeader>
      <UTabs v-model="mode" :items="modes" :content="false" size="sm" aria-label="Map mode" class="w-48 shrink-0" />
    </MapHeader>
    <div class="flex min-h-0 flex-1">
      <MapWhosWho />
      <main class="flex min-w-0 flex-1 flex-col">
        <MapCanvas class="min-h-0 flex-1" />
        <MapTimeline v-if="mode === 'story'" />
      </main>
      <MapPanel v-if="selectedId && story.nodes[selectedId]" :id="selectedId" :key="selectedId" />
    </div>
  </div>
</template>
