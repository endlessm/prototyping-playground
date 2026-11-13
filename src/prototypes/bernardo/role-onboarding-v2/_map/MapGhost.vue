<script setup lang="ts">
import { computed } from 'vue'
import { placeIllustrations, roleIllustrations } from './illustrations'
import { tabRect } from './layout'
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
    .map((place) => ({ id: place.id, kind: place.kind.toLowerCase(), rect: layout.value.areas[place.id] }))
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
    class="ghost-area"
    :class="area.kind"
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
    class="ghost"
    :class="ghost.kind"
    :style="style"
    :data-ghost="ghost.step"
    aria-hidden="true"
  >
    <img :src="ghost.art" alt="" class="art" />
    <div class="text">
      <em class="tag">{{ ghost.tag }}</em>
      <b class="name">{{ ghost.name }}</b>
      <span class="role">{{ ghost.role }}</span>
    </div>
  </div>
</template>

<style scoped>
.ghost {
  position: absolute;
  z-index: 4;
  display: flex;
  pointer-events: none;
  background: color-mix(in oklab, var(--ui-bg) 55%, transparent);
  border: 1.5px dashed var(--ui-border-accented);
  animation: ghost-in 320ms ease-out both;
}

.as-tile {
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  border-radius: 20px;
}

.as-tab {
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 8px;
  white-space: nowrap;
  border-radius: 14px;
}

.art {
  opacity: 0.45;
  filter: grayscale(0.4);
}

.as-tile .art {
  width: 48px;
  height: 48px;
}

.as-tab .art {
  width: 26px;
  height: 26px;
}

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.as-tile .text {
  align-items: center;
  margin-top: 6px;
  padding: 0 6px;
  text-align: center;
}

.tag {
  color: var(--ui-text-dimmed);
  font-size: 9.5px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 12px;
  text-transform: uppercase;
}

.name {
  color: var(--ui-text-muted);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 16px;
}

.role {
  color: var(--ui-text-dimmed);
  font-size: 11px;
  line-height: 14px;
}

.as-tab .role {
  display: none;
}

.ghost-area {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  border: 1.5px dashed var(--ui-border-accented);
  border-radius: 32px;
  animation: ghost-in 320ms ease-out both;
}

.ghost-area.team {
  border-color: color-mix(in oklab, var(--color-orange-500) 28%, transparent);
  border-radius: 28px;
}

.ghost-area.cohort {
  border-color: color-mix(in oklab, var(--color-sky-500) 28%, transparent);
  border-radius: 24px;
}

@keyframes ghost-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ghost,
  .ghost-area {
    animation: none;
  }
}
</style>
