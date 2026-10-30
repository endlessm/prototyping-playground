<script setup lang="ts">
import { OPENING_STATUS_DELAY_MS } from '../utils/opening'
import CanvasOpening from './CanvasOpening.vue'

// A canvas in a document while its code loads: the same quiet surface as
// its opening, with the status 200 ms after loading began. Bundled with the
// studio, so it imports nothing heavy.
const props = defineProps<{ startedAt: number }>()
const visible = ref(Date.now() - props.startedAt >= OPENING_STATUS_DELAY_MS)
const timer = window.setTimeout(
  () => (visible.value = true),
  Math.max(0, OPENING_STATUS_DELAY_MS - (Date.now() - props.startedAt)),
)
onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div class="relative h-full bg-muted/30" data-canvas-opening="loading">
    <CanvasOpening :visible="visible" />
  </div>
</template>
