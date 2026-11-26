<script setup lang="ts">
import { computed } from 'vue'
import { phaseOf, type Place } from '../_chart/district'

// A Cohort's run as a thin bar in its phase's colour, the same colours as the list's ring and badge. The fill grows in
// from the left once, on mount.
const props = defineProps<{ run: NonNullable<Place['run']> }>()

const phase = computed(() => phaseOf(props.run))
const tone = computed(() => ({ 'Under way': 'under-way', Upcoming: 'upcoming', Finished: 'finished' })[phase.value])
</script>

<template>
  <div class="run-bar" :data-tone="tone" role="img" :aria-label="`${run.progress}% average progress, ${run.status}`">
    <span class="run-fill" :style="{ width: `${run.progress}%` }" />
  </div>
</template>

<style scoped>
.run-bar {
  position: relative;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ui-bg-accented);
}

.run-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  transform-origin: left center;
  animation: run-grow 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

[data-tone='under-way'] .run-fill {
  background: var(--ui-success);
}
[data-tone='upcoming'] .run-fill {
  background: var(--ui-info);
}
[data-tone='finished'] .run-fill {
  background: var(--ui-text-dimmed);
}

@keyframes run-grow {
  from {
    transform: scaleX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .run-fill {
    animation: none !important;
  }
}
</style>
