<script setup lang="ts">
import { computed } from 'vue'
import { placeIllustrations, roleIllustrations } from './illustrations'
import { tabRect } from './layout'
import { levelTint } from './look'
import { usePlayback } from './playback'
import { useMapState } from './state'
import { ancestors, mapRoles, nodeTitle } from './story'

// What comes next, faded where it will appear: the next person's tile, or the tab of the next Team or Cohort. The
// timeline's next step decides it; nothing shows on the last step, outside Story mode or with the layer off.
const { story, layout, mode, layers, shown } = useMapState()
const { preview } = usePlayback()

const ghost = computed(() => {
  if (mode.value !== 'story' || !layers.next || preview.value === null) return null
  const event = story.value.steps[preview.value - 1]
  if (!event) return null
  const step = preview.value
  const tag = `Next · step ${step}`
  if (event.kind === 'award') {
    const node = story.value.nodes[event.node]
    const rect = layout.value.nodes[event.node]
    if (!node || !rect) return null
    const role = mapRoles[event.role]
    return { kind: 'as-tile', step, rect, tag, art: roleIllustrations[event.role], name: nodeTitle(node), role: role.label }
  }
  const place = story.value.places[event.place]
  const rect = tabRect(story.value, layout.value, event.place)
  if (!place || !rect) return null
  return { kind: 'as-tab', step, rect, tag, art: placeIllustrations[place.kind], name: place.name, role: place.kind }
})

/**
 * The areas around the next tile that don't exist yet, outermost first. A path replay skips the steps that create
 * them, so they are outlined faintly rather than leaving the ghost floating where no area is shown.
 */
const missing = computed(() => {
  if (ghost.value?.kind !== 'as-tile' || preview.value === null) return []
  const event = story.value.steps[preview.value - 1]
  if (event?.kind !== 'award') return []
  const around = ancestors(story.value, event.place)
  const shownAt = around.findIndex((place) => shown.value.places.has(place.id))
  return (shownAt < 0 ? around : around.slice(0, shownAt))
    .reverse()
    .map((place) => ({ id: place.id, tint: levelTint[place.kind].ghost, rect: layout.value.areas[place.id] }))
    .filter((area) => area.rect)
})

const style = computed(() => {
  const rect = ghost.value?.rect
  return rect ? { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` } : {}
})
</script>

<template>
  <div
    v-for="area in missing"
    :key="`area:${area.id}`"
    class="ghost-in pointer-events-none absolute z-1 border-[1.5px] border-dashed"
    :class="area.tint"
    :style="{
      left: `${area.rect.x}px`,
      top: `${area.rect.y}px`,
      width: `${area.rect.width}px`,
      height: `${area.rect.height}px`,
    }"
    :data-ghost-area="area.id"
    aria-hidden="true"
  />
  <div
    v-if="ghost"
    :key="ghost.tag"
    class="ghost-in pointer-events-none absolute z-4 flex border-[1.5px] border-dashed border-accented bg-default/55"
    :class="
      ghost.kind === 'as-tile'
        ? 'flex-col items-center rounded-[20px] pt-3'
        : 'items-center gap-2 rounded-[14px] pr-3 pl-2 whitespace-nowrap'
    "
    :style="style"
    :data-ghost="ghost.step"
    aria-hidden="true"
  >
    <img
      :src="ghost.art"
      alt=""
      class="opacity-45 grayscale-40"
      :class="ghost.kind === 'as-tile' ? 'size-12' : 'size-[26px]'"
    />
    <div class="flex min-w-0 flex-col" :class="{ 'mt-1.5 items-center px-1.5 text-center': ghost.kind === 'as-tile' }">
      <em class="text-xs leading-3 font-bold tracking-wider text-dimmed not-italic uppercase">{{ ghost.tag }}</em>
      <b class="text-xs leading-4 font-semibold text-muted">{{ ghost.name }}</b>
      <span v-if="ghost.kind === 'as-tile'" class="text-xs leading-3.5 text-dimmed">{{ ghost.role }}</span>
    </div>
  </div>
</template>

<style scoped>
.ghost-in {
  animation: ghost-in 320ms ease-out backwards;
}

@keyframes ghost-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ghost-in {
    animation: none;
  }
}
</style>
