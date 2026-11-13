<script setup lang="ts">
import { computed } from 'vue'

// The floating zoom bar on the canvas: −, the scale as a percentage, + and fit, as in the concept.
const props = defineProps<{ scale: number; min: number; max: number }>()
const emit = defineEmits<{ out: []; in: []; fit: [] }>()

const percent = computed(() => `${Math.round(props.scale * 100)}%`)
/** Rounding keeps a scale a hair above the limit from leaving the button enabled. */
const atMin = computed(() => props.scale <= props.min + 0.001)
const atMax = computed(() => props.scale >= props.max - 0.001)
</script>

<template>
  <div
    class="zoom absolute top-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border border-default bg-default p-1"
    role="toolbar"
    aria-label="Zoom"
  >
    <UButton
      icon="i-lucide-minus"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Zoom out"
      :disabled="atMin"
      @click="emit('out')"
    />
    <span class="w-12 text-center text-xs font-semibold text-highlighted tabular-nums" aria-live="polite">
      {{ percent }}
    </span>
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Zoom in"
      :disabled="atMax"
      @click="emit('in')"
    />
    <UButton
      icon="i-lucide-maximize-2"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Fit the map"
      @click="emit('fit')"
    />
  </div>
</template>

<style scoped>
/* Floats over the dotted canvas like the tiles and tabs do, so it keeps their soft shadow. */
.zoom {
  box-shadow: 0 4px 12px -4px rgb(15 23 42 / 0.12);
}
</style>
