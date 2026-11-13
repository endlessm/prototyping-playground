<script setup lang="ts">
import { computed } from 'vue'
import { SPEEDS, stepLabel, usePlayback } from './playback'
import { useMapState } from './state'

// The story's timeline under the map: play, pause, previous and next, the current step's caption, the speed, and
// every step as a stop to jump to. It drives the playback; the map follows the step.
const { story, step, current, layers } = useMapState()
const { playing, speed, sequence, partial, upcoming, atStart, atEnd, toggle, previous, next, goTo } = usePlayback()

const total = computed(() => story.value.steps.length)
const stops = computed(() =>
  story.value.steps.map((_, index) => {
    const n = index + 1
    return {
      n,
      ...stepLabel(story.value, n),
      done: n < step.value,
      current: n === step.value,
      next: layers.next && n === upcoming.value,
      out: partial.value && !sequence.value.includes(n),
    }
  }),
)
/** How far along the track the orange line reaches, as a share of the line between the first and last stops. */
const progress = computed(() => (total.value > 1 ? Math.max(step.value - 1, 0) / (total.value - 1) : 1))
/** The start frame has no number: it is the story before step 1. */
const caption = computed(() =>
  step.value === 0
    ? { of: 'Start', text: story.value.start }
    : { of: `Step ${step.value} of ${total.value}`, text: current.value?.caption },
)
const speeds = SPEEDS.map((value) => ({ label: `${value}×`, value }))
</script>

<template>
  <section class="timeline" aria-label="Story timeline">
    <div class="flex items-center gap-3.5">
      <div class="flex items-center gap-1.5">
        <UButton
          icon="i-lucide-skip-back"
          color="neutral"
          variant="outline"
          aria-label="Previous step"
          :disabled="atStart"
          @click="previous"
        />
        <UButton
          :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
          color="primary"
          size="lg"
          :aria-label="playing ? 'Pause' : 'Play'"
          @click="toggle"
        />
        <UButton
          icon="i-lucide-skip-forward"
          color="neutral"
          variant="outline"
          aria-label="Next step"
          :disabled="atEnd"
          @click="next"
        />
      </div>
      <p class="caption min-w-0 flex-1 truncate" aria-live="polite">
        <span class="of">{{ caption.of }}</span>
        <span class="text">{{ caption.text }}</span>
      </p>
      <div class="flex flex-none items-center gap-2 text-xs text-dimmed">
        <span aria-hidden="true">Speed</span>
        <USelect v-model="speed" :items="speeds" size="xs" class="w-20" aria-label="Playback speed" />
      </div>
    </div>
    <ol class="track" :style="{ '--stops': total, '--progress': progress }">
      <li v-for="stop in stops" :key="stop.n">
        <button
          type="button"
          class="stop"
          :class="{ done: stop.done, current: stop.current, next: stop.next, out: stop.out }"
          :aria-current="stop.current ? 'step' : undefined"
          :aria-label="`Step ${stop.n}: ${stop.title} ${stop.by}`"
          @click="goTo(stop.n)"
        >
          <span class="dot" aria-hidden="true">{{ stop.n }}</span>
          <span class="title">{{ stop.title }}</span>
          <span class="by">{{ stop.by }}</span>
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline {
  flex: none;
  padding: 10px 24px 10px;
  background: var(--ui-bg);
  border-top: 1px solid var(--ui-border);
}

.caption {
  display: flex;
  align-items: center;
  gap: 8px;
}

.of {
  flex: none;
  padding: 1px 8px;
  color: var(--color-orange-900);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  background: var(--color-orange-50);
  border: 1px solid var(--color-orange-200);
  border-radius: 100px;
}

.text {
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-heading, Figtree, sans-serif);
  color: var(--ui-text-highlighted);
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.track {
  --inset: calc(50% / var(--stops));
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--stops), minmax(0, 1fr));
  margin-top: 10px;
}

.track::before,
.track::after {
  content: '';
  position: absolute;
  top: 11px;
  left: var(--inset);
  height: 2px;
}

.track::before {
  right: var(--inset);
  background: var(--ui-border-muted);
}

.track::after {
  width: calc((100% - 2 * var(--inset)) * var(--progress));
  background: var(--color-orange-200);
  transition: width 300ms ease-out;
}

.stop {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 2px 2px;
  text-align: center;
  cursor: pointer;
  border-radius: 10px;
  transition: opacity 200ms ease-out;
}

.stop:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}

.dot {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: var(--ui-text-dimmed);
  font-size: 11px;
  font-weight: 700;
  background: var(--ui-bg);
  border: 1.5px solid var(--ui-border-accented);
  border-radius: 50%;
  transition:
    background-color 200ms ease-out,
    border-color 200ms ease-out,
    box-shadow 200ms ease-out;
}

.stop:hover .dot {
  border-color: var(--color-orange-400);
}

.done .dot {
  color: var(--color-orange-900);
  background: var(--color-orange-50);
  border-color: var(--color-orange-200);
}

.current .dot {
  color: white;
  background: var(--color-orange-600);
  border-color: var(--color-orange-600);
  box-shadow: 0 0 0 5px color-mix(in oklab, var(--color-orange-500) 16%, transparent);
}

.next .dot {
  border-style: dashed;
}

.title {
  margin-top: 5px;
  overflow: hidden;
  max-width: 100%;
  color: var(--ui-text-toned);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.by {
  overflow: hidden;
  max-width: 100%;
  color: var(--ui-text-dimmed);
  font-size: 10.5px;
  line-height: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.done .title {
  color: var(--ui-text-highlighted);
}

.current .title {
  color: var(--color-orange-900);
}

.next .title {
  color: var(--ui-text-dimmed);
}

.out {
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  .track::after,
  .stop,
  .dot {
    transition: none;
  }
}
</style>
