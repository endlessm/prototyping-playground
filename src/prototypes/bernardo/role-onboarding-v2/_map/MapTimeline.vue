<script setup lang="ts">
import { computed } from 'vue'
import { NOW_HALO, NOW_TINT } from './look'
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
/** The line runs between the first and last stops' centres; the orange part grows by scaling, not by resizing. */
const line = computed(() => ({ left: `${50 / total.value}%`, right: `${50 / total.value}%` }))
const columns = computed(() => ({ gridTemplateColumns: `repeat(${total.value}, minmax(0, 1fr))` }))

interface StopState {
  done: boolean
  current: boolean
  next: boolean
}

function dotClass(stop: StopState) {
  const look = stop.current
    ? `border-primary-600 bg-primary-600 text-inverted ${NOW_HALO}`
    : stop.done
      ? NOW_TINT
      : 'border-accented bg-default text-dimmed group-hover:border-primary-400'
  return [look, { 'border-dashed': stop.next }]
}

function titleClass(stop: StopState) {
  if (stop.next) return 'text-dimmed'
  if (stop.current) return 'text-primary-900'
  return stop.done ? 'text-highlighted' : 'text-toned'
}

/** The start frame has no number: it is the story before step 1. */
const caption = computed(() =>
  step.value === 0
    ? { of: 'Start', text: story.value.start }
    : { of: `Step ${step.value} of ${total.value}`, text: current.value?.caption },
)
const speeds = SPEEDS.map((value) => ({ label: `${value}×`, value }))
</script>

<template>
  <section class="flex-none border-t border-default bg-default px-6 py-2.5" aria-label="Story timeline">
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
      <p class="flex min-w-0 flex-1 items-center gap-2 truncate" aria-live="polite">
        <UBadge color="primary" variant="soft" class="flex-none rounded-full font-semibold" :class="NOW_TINT">
          {{ caption.of }}
        </UBadge>
        <span class="truncate font-heading text-base font-bold tracking-tight text-highlighted">{{ caption.text }}</span>
      </p>
      <div class="flex flex-none items-center gap-2 text-xs text-dimmed">
        <span aria-hidden="true">Speed</span>
        <USelect v-model="speed" :items="speeds" size="xs" class="w-20" aria-label="Playback speed" />
      </div>
    </div>
    <div class="relative mt-2.5">
      <div class="absolute top-[11px] h-0.5 bg-(--ui-border-muted)" :style="line" aria-hidden="true" />
      <div
        class="absolute top-[11px] h-0.5 origin-left bg-primary-200 transition-transform duration-300 ease-out motion-reduce:transition-none"
        :style="{ ...line, transform: `scaleX(${progress})` }"
        aria-hidden="true"
      />
      <ol class="relative grid" :style="columns">
        <li v-for="stop in stops" :key="stop.n">
          <button
            type="button"
            class="group relative flex w-full cursor-pointer flex-col items-center rounded-[10px] px-0.5 pb-0.5 text-center transition-opacity duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
            :class="{ 'opacity-40': stop.out }"
            :aria-current="stop.current ? 'step' : undefined"
            :aria-label="`Step ${stop.n}: ${stop.title} ${stop.by}`"
            @click="goTo(stop.n)"
          >
            <span
              class="grid size-6 place-items-center rounded-full border-[1.5px] text-xs font-bold"
              :class="dotClass(stop)"
              aria-hidden="true"
            >
              {{ stop.n }}
            </span>
            <span class="mt-[5px] max-w-full truncate text-xs leading-3.5 font-semibold" :class="titleClass(stop)">
              {{ stop.title }}
            </span>
            <span class="max-w-full truncate text-xs leading-3.5 text-dimmed">{{ stop.by }}</span>
          </button>
        </li>
      </ol>
    </div>
  </section>
</template>
