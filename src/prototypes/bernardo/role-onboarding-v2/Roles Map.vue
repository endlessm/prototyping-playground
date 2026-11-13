<!-- @studio-id qk1tmcfc407rxqnh -->
<script setup lang="ts">
import MapCanvas from './_map/MapCanvas.vue'
import MapHeader from './_map/MapHeader.vue'
import MapPanel from './_map/MapPanel.vue'
import { provideMapState, type MapMode } from './_map/state'

// The whole role model on one map: where each role lives, who gave it and what came of it, told as the Brightwater
// story the seven flows follow. Proposed, like the flows. Opens at the end of the story.
const props = defineProps<{ mode?: MapMode; step?: number }>()

const { selectedId } = provideMapState(() => ({ mode: props.mode, step: props.step }))
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-default text-default">
    <MapHeader />
    <div class="flex min-h-0 flex-1">
      <!-- Left column: Who's who and the layer switches. -->
      <main class="flex min-w-0 flex-1 flex-col">
        <MapCanvas class="min-h-0 flex-1" />
        <!-- Bottom: the story timeline. -->
      </main>
      <!-- Right: the selected person's panel. -->
      <MapPanel v-if="selectedId" :id="selectedId" :key="selectedId" />
    </div>
  </div>
</template>
