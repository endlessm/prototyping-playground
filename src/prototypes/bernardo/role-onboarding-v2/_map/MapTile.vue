<script setup lang="ts">
import { computed } from 'vue'
import { roleIllustrations } from './illustrations'
import { usePathView } from './path'
import { useMapState } from './state'
import { joinStep, mapRoles, nodeTitle, type NodeId, type PlaceKind } from './story'

// One person on the map, or a Cohort's learners as one tile: their illustration, name, role and the step they joined
// (a story without a timeline, Explore, shows no steps).
const props = defineProps<{ id: NodeId }>()

const { story, layout, selectedId, select, mode, current } = useMapState()

const node = computed(() => story.value.nodes[props.id])
const role = computed(() => mapRoles[node.value.role])
const rect = computed(() => layout.value.nodes[props.id])
const step = computed(() => joinStep(story.value, props.id))
const title = computed(() => nodeTitle(node.value))
const selected = computed(() => selectedId.value === props.id)
const path = usePathView()
/** Whether a path is playing that this tile isn't on. */
const dim = computed(() => path.active.value && !path.nodes.value.has(props.id))
/** Whether this tile is what the story's current step adds. */
const now = computed(
  () => mode.value === 'story' && current.value?.kind === 'award' && current.value.node === props.id,
)

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
    :class="{ selected, now, dim }"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
    :aria-pressed="selected"
    :aria-label="`${title}, ${role.label}${story.timed ? `, step ${step}` : ''}${now ? ', new in this step' : ''}`"
    @click="select(selected ? null : id)"
  >
    <span v-if="story.timed" class="step" aria-hidden="true">{{ step }}</span>
    <span v-if="now" class="new" aria-hidden="true">New</span>
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
    border-color 150ms ease-out,
    filter 240ms ease-out;
  animation: tile-in 360ms ease-out both;
}

@keyframes tile-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

.tile:focus-visible {
  outline: 2px solid var(--ui-info);
  outline-offset: 2px;
}

.tile.now {
  border: 2px solid var(--color-orange-500);
  box-shadow:
    0 0 0 6px color-mix(in oklab, var(--color-orange-500) 16%, transparent),
    0 25px 50px -12px rgb(0 0 0 / 0.08);
}

.tile.selected {
  border: 2px solid var(--color-sky-500);
  box-shadow:
    0 0 0 5px color-mix(in oklab, var(--color-sky-500) 14%, transparent),
    0 25px 50px -12px rgb(0 0 0 / 0.08);
}

.tile.dim {
  filter: grayscale(0.7) opacity(0.32);
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

.now .step {
  color: white;
  background: var(--color-orange-600);
}

.new {
  position: absolute;
  top: -10px;
  right: -8px;
  padding: 1px 8px;
  color: var(--color-orange-900);
  font-size: 10.5px;
  font-weight: 700;
  line-height: 16px;
  background: var(--color-orange-100);
  border: 1px solid var(--color-orange-200);
  border-radius: 100px;
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
    animation: none;
  }
}
</style>
