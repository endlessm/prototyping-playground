<script setup lang="ts">
import { computed } from 'vue'
import { roleIllustrations } from './illustrations'
import { useMapState } from './state'
import { joinStep, mapRoles, nodeTitle, type NodeId, type PlaceKind } from './story'

// One person on the map, or a Cohort's learners as one tile: their illustration, name, role and the step they joined.
const props = defineProps<{ id: NodeId }>()

const { story, layout, selectedId, select } = useMapState()

const node = computed(() => story.value.nodes[props.id])
const role = computed(() => mapRoles[node.value.role])
const rect = computed(() => layout.value.nodes[props.id])
const step = computed(() => joinStep(story.value, props.id))
const title = computed(() => nodeTitle(node.value))
const selected = computed(() => selectedId.value === props.id)

const chipColor: Record<PlaceKind, 'neutral' | 'secondary' | 'primary' | 'info'> = {
  Platform: 'neutral',
  Organization: 'secondary',
  Team: 'primary',
  Cohort: 'info',
}
const color = computed(() => (node.value.role === 'learner' ? 'neutral' : chipColor[role.value.kind]))
</script>

<template>
  <button
    type="button"
    class="tile"
    :class="{ selected }"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
    :aria-pressed="selected"
    :aria-label="`${title}, ${role.label}, step ${step}`"
    @click="select(selected ? null : id)"
  >
    <span class="step" aria-hidden="true">{{ step }}</span>
    <img :src="roleIllustrations[node.role]" alt="" class="art" />
    <span class="name">{{ title }}</span>
    <UBadge :color="color" variant="soft" size="md" class="chip">{{ role.label }}</UBadge>
  </button>
</template>

<style scoped>
.tile {
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 14px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 0.08),
    0 1px 2px rgb(15 23 43 / 0.04);
  transition:
    box-shadow 150ms ease-out,
    border-color 150ms ease-out;
}

.tile:focus-visible {
  outline: 2px solid var(--ui-info);
  outline-offset: 2px;
}

.tile.selected {
  border: 2px solid var(--color-sky-500);
  box-shadow:
    0 0 0 5px color-mix(in oklab, var(--color-sky-500) 14%, transparent),
    0 25px 50px -12px rgb(0 0 0 / 0.08);
}

.step {
  position: absolute;
  top: 8px;
  left: 8px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-toned);
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
}

.art {
  width: 56px;
  height: 56px;
}

.name {
  margin-top: 8px;
  padding: 0 6px;
  color: var(--ui-text-highlighted);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}

.chip {
  margin-top: 6px;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }
}
</style>
