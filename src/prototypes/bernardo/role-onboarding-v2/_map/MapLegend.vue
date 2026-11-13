<script setup lang="ts">
import { computed } from 'vue'
import { LEGEND } from './layout'
import { arrowStroke, strokeStyle } from './look'
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
    class="legend"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
    aria-label="How to read"
  >
    <h3 class="title">How to read</h3>
    <ul>
      <li v-for="line in shown" :key="line.look" class="entry" :class="line.look">
        <svg viewBox="0 0 34 10" class="sample" aria-hidden="true">
          <line x1="1" y1="5" x2="27" y2="5" stroke-linecap="round" :style="strokeStyle(line.look)" />
          <path d="M26 1.5 32 5l-6 3.5z" :style="{ fill: arrowStroke[line.look].color }" />
        </svg>
        {{ line.text }}
      </li>
      <li v-if="story.timed" class="entry">
        <span class="ghost" aria-hidden="true" />
        comes next
      </li>
    </ul>
    <p class="hint">
      <UIcon name="i-lucide-info" class="hint-icon" />
      Click anyone to see what they can do and how they got there.
    </p>
  </aside>
</template>

<style scoped>
.legend {
  position: absolute;
  z-index: 4;
  padding: 14px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 0.08),
    0 1px 2px rgb(15 23 43 / 0.04);
}

.title {
  margin-bottom: 8px;
  color: var(--ui-text-dimmed);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  line-height: 14px;
  text-transform: uppercase;
}

.entry {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
  color: var(--ui-text-muted);
  font-size: 12px;
  line-height: 16px;
}

.sample {
  flex: none;
  width: 34px;
  height: 10px;
}

.ghost {
  flex: none;
  width: 34px;
  height: 14px;
  border: 1.5px dashed var(--ui-border-accented);
  border-radius: 5px;
}

.hint {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  color: var(--ui-text-dimmed);
  font-size: 11.5px;
  line-height: 15px;
  border-top: 1px solid var(--ui-border-muted);
}

.hint-icon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}
</style>
