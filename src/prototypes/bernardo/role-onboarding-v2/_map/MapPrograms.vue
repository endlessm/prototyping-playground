<script setup lang="ts">
import { computed } from 'vue'
import { programIllustration } from './illustrations'
import { shelfId, SHELF } from './layout'
import { accessLabel, cohortCount, cohortsRunning, shelfPrograms } from './programs'
import { useMapState } from './state'
import type { PlaceId } from './story'

// The Programs an Organization can run, on a shelf inside it: open to everyone, or custom through a Partnership,
// each with how many of the Cohorts on the map run it. Programs belong to the Organization's access, not to a Team.
const props = defineProps<{ place: PlaceId }>()

const { story, layout, shown } = useMapState()

const rect = computed(() => layout.value.boxes[shelfId(props.place)])
const name = computed(() => story.value.places[props.place]?.name ?? '')
const programs = computed(() =>
  shelfPrograms(story.value).map((program) => ({
    ...program,
    cohorts: cohortsRunning(story.value, program.name, shown.value.places).length,
  })),
)
const sizes = {
  '--shelf-top': `${SHELF.top}px`,
  '--shelf-header': `${SHELF.header}px`,
  '--shelf-row': `${SHELF.row}px`,
  '--shelf-gap': `${SHELF.rowGap}px`,
  '--shelf-bottom': `${SHELF.bottom}px`,
}
</script>

<template>
  <section
    v-if="rect"
    class="shelf"
    :style="{
      ...sizes,
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }"
    :aria-label="`Programs ${name} can run`"
  >
    <header class="head">
      <img :src="programIllustration" alt="" class="art" />
      <div>
        <h3 class="title">Programs</h3>
        <p class="sub">{{ name }} can run these</p>
      </div>
    </header>
    <ul>
      <li
        v-for="program in programs"
        :key="program.name"
        class="row"
        :class="{ running: program.cohorts > 0 }"
        :data-program="program.name"
      >
        <img :src="programIllustration" alt="" class="row-art" />
        <div class="text">
          <p class="name">{{ program.name }}</p>
          <p class="access" :class="program.access">{{ accessLabel[program.access] }}</p>
        </div>
        <span class="count">{{ cohortCount(program.cohorts) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.shelf {
  position: absolute;
  z-index: 4;
  padding: var(--shelf-top) 12px var(--shelf-bottom);
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 24px;
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 0.08),
    0 1px 2px rgb(15 23 43 / 0.04);
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  height: var(--shelf-header);
  padding: 0 4px;
}

.art {
  width: 30px;
  height: 30px;
}

.title {
  font-family: var(--font-heading, Figtree, sans-serif);
  color: var(--ui-text-highlighted);
  font-size: 14.5px;
  font-weight: 700;
  line-height: 18px;
}

.sub {
  color: var(--ui-text-dimmed);
  font-size: 11px;
  line-height: 14px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--shelf-row);
  margin-top: var(--shelf-gap);
  padding: 0 8px;
  border-radius: 12px;
}

.row.running {
  background: color-mix(in oklab, var(--color-cornflower-50) 40%, white);
  outline: 1.5px solid color-mix(in oklab, var(--color-cornflower-500) 35%, transparent);
}

.row-art {
  width: 28px;
  height: 28px;
}

.text {
  flex: 1;
  min-width: 0;
}

.name,
.access {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  color: var(--ui-text-highlighted);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 16px;
}

.access {
  color: var(--ui-text-dimmed);
  font-size: 11px;
  line-height: 14px;
}

.access.partnership {
  color: var(--color-cornflower-500);
  font-weight: 600;
}

.count {
  flex: none;
  padding: 1px 7px;
  color: var(--ui-text-dimmed);
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 100px;
}

.running .count {
  color: var(--color-cornflower-700);
  font-weight: 700;
  background: var(--ui-bg);
  border: 1px solid var(--color-cornflower-50);
}
</style>
