<script setup lang="ts">
import { computed } from 'vue'
import { LEGEND } from './layout'
import { arrowStroke, EYEBROW, strokeStyle } from './look'
import { useMapState } from './state'

// How to read the map: each kind of arrow, the current step and what comes next, in the arrows' own strokes. A story
// without a timeline (Explore) has no current or next step, so it leaves those two lines out.
const { layout, story } = useMapState()

const rect = computed(() => layout.value.boxes[LEGEND.id])

const lines = [
  { look: 'invite', text: 'invites to a role' },
  { look: 'create', text: 'creates a Team or Cohort' },
  { look: 'runs', text: 'runs a Program' },
  { look: 'now', text: 'happens in this step' },
] as const
const shown = computed(() => (story.value.timed ? lines : lines.filter((line) => line.look !== 'now')))
</script>

<template>
  <aside
    v-if="rect"
    class="absolute z-4 p-3.5"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
    aria-label="How to read"
  >
    <h3 class="mb-2 leading-3.5" :class="EYEBROW">How to read</h3>
    <ul>
      <li v-for="line in shown" :key="line.look" class="mt-[7px] flex items-center gap-2.5 text-xs leading-4 text-muted">
        <svg viewBox="0 0 34 10" class="h-2.5 w-[34px] flex-none" aria-hidden="true">
          <line x1="1" y1="5" x2="27" y2="5" stroke-linecap="round" :style="strokeStyle(line.look)" />
          <path d="M26 1.5 32 5l-6 3.5z" :style="{ fill: arrowStroke[line.look].color }" />
        </svg>
        {{ line.text }}
      </li>
      <li v-if="story.timed" class="mt-[7px] flex items-center gap-2.5 text-xs leading-4 text-muted">
        <span
          class="ghost h-3.5 w-[34px] flex-none rounded-[5px] border-[1.5px] border-dashed border-accented"
          aria-hidden="true"
        />
        comes next
      </li>
    </ul>
    <p class="mt-3 flex gap-2 text-xs leading-[15px] text-dimmed">
      <UIcon name="i-lucide-info" class="mt-px size-3.5 flex-none" />
      Click anyone to see what they can do and how they got there.
    </p>
  </aside>
</template>
