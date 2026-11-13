<script setup lang="ts">
import { computed } from 'vue'
import { placeIllustrations } from './illustrations'
import { tabSide } from './layout'
import { useMapState } from './state'
import { placeCreator, placeStep, type PlaceId } from './story'

// An area on the map: a soft box in its level's colour, named by a tab on its top edge with its kind and story.
const props = defineProps<{ id: PlaceId }>()

const { story, layout } = useMapState()

const place = computed(() => story.value.places[props.id])
const rect = computed(() => layout.value.areas[props.id])
const kindClass = computed(() => place.value.kind.toLowerCase())

/** After the kind: what the place is, or the step that made it and who did. */
const detail = computed(() => {
  if (place.value.note) return place.value.note
  const step = placeStep(story.value, props.id)
  const creator = placeCreator(story.value, props.id)?.person
  if (!step) return ''
  return creator ? `step ${step} · created by ${creator.name.split(' ')[0]}` : `step ${step}`
})
</script>

<template>
  <div
    class="area"
    :class="kindClass"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
  >
    <div class="tab" :class="tabSide(place.kind)">
      <img :src="placeIllustrations[place.kind]" alt="" :class="place.kind === 'Platform' ? 'logo' : 'art'" />
      <div>
        <p class="name">{{ place.name }}</p>
        <p class="meta">
          <span class="kind">{{ place.kind }}</span>
          <template v-if="detail"> · {{ detail }}</template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.area {
  position: absolute;
  border: 1.5px dashed;
  border-radius: 32px;
}

.platform {
  background: var(--color-slate-100);
  border-color: var(--color-slate-300);
}

.organization {
  background: color-mix(in oklab, var(--color-cornflower-50) 32%, white);
  border-color: color-mix(in oklab, var(--color-cornflower-500) 38%, transparent);
}

.team {
  background: var(--color-orange-50);
  border-color: color-mix(in oklab, var(--color-orange-500) 42%, transparent);
  border-radius: 28px;
}

.cohort {
  background: color-mix(in oklab, var(--color-sky-50) 45%, white);
  border-color: color-mix(in oklab, var(--color-sky-500) 42%, transparent);
  border-radius: 24px;
}

.tab {
  position: absolute;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 8px;
  white-space: nowrap;
  background: var(--ui-bg);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgb(15 23 43 / 0.12);
  transform: translateY(-50%);
}

.tab.left {
  left: 20px;
}

.tab.right {
  right: 20px;
}

.art {
  width: 30px;
  height: 30px;
}

.logo {
  width: 30px;
  height: auto;
  margin: 0 2px;
}

.name {
  font-family: var(--font-heading, Figtree, sans-serif);
  color: var(--ui-text-highlighted);
  font-size: 14.5px;
  font-weight: 700;
  line-height: 18px;
  letter-spacing: -0.2px;
}

.meta {
  color: var(--ui-text-dimmed);
  font-size: 11px;
  line-height: 14px;
}

.kind {
  font-weight: 600;
  color: var(--ui-text-toned);
}

.organization .kind {
  color: var(--color-cornflower-500);
}

.team .kind {
  color: var(--color-orange-600);
}

.cohort .kind {
  color: var(--color-sky-600);
}
</style>
