<script setup lang="ts">
import './opening.css'

// The quiet surface over a canvas that is opening. Screen readers hear its
// status at once; it shows after a moment, so a quick opening shows nothing.
defineProps<{ visible: boolean }>()
const { t } = useI18n()
</script>

<template>
  <div
    role="status"
    class="absolute inset-0 flex items-center justify-center text-sm text-muted"
  >
    <span :class="visible ? 'canvas-opening-shimmer' : 'sr-only'">
      {{ t('canvas.opening') }}
    </span>
  </div>
</template>
