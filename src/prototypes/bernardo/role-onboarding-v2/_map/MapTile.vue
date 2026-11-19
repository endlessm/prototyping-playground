<script setup lang="ts">
import { computed } from 'vue'
import { roleIllustrations } from './illustrations'
import { usePathView } from './path'
import { useMapState } from './state'
import { FADE, FADED, FLOATING, NOW_HALO, NOW_TINT, roleColor, roleText, SELECTED_HALO } from './look'
import { heldRoles, joinStep, mapRoles, nodeTitle, type NodeId } from './story'

// One person on the map, or a Cohort's learners as one tile: their illustration, name, role and the step they joined
// (a story without a timeline, Explore, shows no steps).
const props = defineProps<{ id: NodeId }>()

const { story, layout, selectedId, select, mode, current, at } = useMapState()

const node = computed(() => story.value.nodes[props.id])
const role = computed(() => mapRoles[node.value.role])
/** Roles the person holds besides the tile's, by the step on show: one account can hold several. */
const more = computed(() => heldRoles(story.value, props.id).filter((held) => held.step <= at.value).length - 1)
const rect = computed(() => layout.value.nodes[props.id])
const step = computed(() => joinStep(story.value, props.id))
const title = computed(() => nodeTitle(node.value))
/** Tiles show the step that brought them in; the Endless Admin is there from the start frame, before step 1. */
const numbered = computed(() => story.value.timed && step.value > 0)
const selected = computed(() => selectedId.value === props.id)
const path = usePathView()
/** Whether a path is playing that this tile isn't on. */
const dim = computed(() => path.active.value && !path.nodes.value.has(props.id))
/** Whether this tile is what the story's current step adds. */
const now = computed(
  () => mode.value === 'story' && current.value?.kind === 'award' && current.value.node === props.id,
)
/** The selection's sky wins over the current step's orange, so a click always shows. */
const edge = computed(() =>
  selected.value
    ? `border-2 border-info-500 ${SELECTED_HALO}`
    : now.value
      ? `border-2 border-primary-500 ${NOW_HALO}`
      : 'border border-muted',
)
</script>

<template>
  <button
    type="button"
    class="tile absolute z-4 flex flex-col items-center rounded-[20px] bg-default pt-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
    :class="[edge, FLOATING, FADE, { [FADED]: dim }]"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
    :aria-pressed="selected"
    :aria-label="`${title}, ${role.label}${more > 0 ? `, and ${more} more ${more === 1 ? 'role' : 'roles'}` : ''}${numbered ? `, step ${step}` : ''}${now ? ', new in this step' : ''}`"
    @click="select(selected ? null : id)"
  >
    <span
      v-if="numbered"
      class="absolute top-2 left-2 grid size-5 place-items-center rounded-full text-xs leading-none font-bold"
      :class="now ? 'bg-primary-600 text-inverted' : 'text-dimmed'"
      aria-hidden="true"
    >
      {{ step }}
    </span>
    <UBadge
      v-if="now"
      color="primary"
      variant="soft"
      size="sm"
      class="absolute -top-2.5 -right-2 rounded-full font-bold"
      :class="NOW_TINT"
      aria-hidden="true"
    >
      New
    </UBadge>
    <img :src="roleIllustrations[node.role]" alt="" class="mt-1 size-12" />
    <span class="mt-2.5 px-1.5 text-center text-xs leading-4 font-semibold text-highlighted">{{ title }}</span>
    <span class="mt-0.5 text-xs leading-4 font-medium whitespace-nowrap" :class="roleText[roleColor(node.role)]">
      {{ role.label }}
    </span>
    <span v-if="more > 0" class="mt-0.5 text-xs leading-4 text-dimmed">+{{ more }} more {{ more === 1 ? 'role' : 'roles' }}</span>
  </button>
</template>

<style scoped>
.tile {
  animation: tile-in 360ms ease-out backwards;
}

@keyframes tile-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile {
    animation: none;
  }
}
</style>
