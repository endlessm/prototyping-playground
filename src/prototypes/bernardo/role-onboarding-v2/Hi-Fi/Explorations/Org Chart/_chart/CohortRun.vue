<script setup lang="ts">
import { computed } from 'vue'
import { phaseOf, type Phase, type Place } from './district'

// A Cohort's run at a glance: a ring filled to its learners' average progress, the number beside it, and its phase as a
// badge in the Status filter's words, with the exact session or date in the badge's tooltip. The ring and the badge
// share the phase's colour (upcoming info, under way success, finished neutral), so a long list reads by colour first.
const props = defineProps<{ run: NonNullable<Place['run']> }>()

const R = 9
const CIRCUMFERENCE = 2 * Math.PI * R

const TONES = {
  'Under way': { color: 'success', stroke: 'text-success' },
  Upcoming: { color: 'info', stroke: 'text-info' },
  Finished: { color: 'neutral', stroke: 'text-muted' },
} as const satisfies Record<Phase, { color: string; stroke: string }>
const phase = computed(() => phaseOf(props.run))
const tone = computed(() => TONES[phase.value])
const dash = computed(() => `${(props.run.progress / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`)
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex w-14 items-center gap-1.5" :aria-label="`${run.progress}% average progress`">
      <svg viewBox="0 0 24 24" class="size-5 flex-none -rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" :r="R" fill="none" stroke-width="3" class="stroke-(--ui-border-accented)" />
        <circle
          cx="12"
          cy="12"
          :r="R"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          :stroke-linecap="run.progress ? 'round' : 'butt'"
          :stroke-dasharray="dash"
          :class="tone.stroke"
          class="transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <span class="text-xs font-medium text-highlighted tabular-nums">{{ run.progress }}%</span>
    </div>
    <UTooltip :text="run.status" :delay-duration="150">
      <UBadge :color="tone.color" variant="soft" tabindex="0" class="w-24 justify-center">{{ phase }}</UBadge>
    </UTooltip>
  </div>
</template>
