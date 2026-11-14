<script setup lang="ts">
import { computed } from 'vue'
import { placeIllustrations } from './illustrations'
import { tabSide } from './layout'
import { FADE, FADED, FLOATING, levelTint, NOW_HALO, NOW_TINT } from './look'
import { usePathView } from './path'
import { useMapState } from './state'
import { placeDetail, type PlaceId } from './story'

// An area on the map: a soft box in its level's colour, named by a tab on its top edge with its kind and story.
const props = defineProps<{ id: PlaceId }>()

const { story, layout, mode, current } = useMapState()

const place = computed(() => story.value.places[props.id])
const rect = computed(() => layout.value.areas[props.id])
const tint = computed(() => levelTint[place.value.kind])
/** Whether the story's current step creates this place. */
const now = computed(
  () => mode.value === 'story' && current.value?.kind === 'create' && current.value.place === props.id,
)

const path = usePathView()
/** Whether a path is playing that runs through none of this place. */
const dim = computed(() => path.active.value && !path.places.value.has(props.id))

/** After the kind: what the place is, or the step that made it and who did. */
const detail = computed(() => placeDetail(story.value, props.id))
</script>

<template>
  <div
    class="area absolute border-[1.5px] border-dashed"
    :class="[tint.area, FADE, { [FADED]: dim }]"
    :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
  >
    <div
      class="absolute top-0 z-3 flex -translate-y-1/2 items-center gap-2.5 rounded-[14px] bg-default py-1.5 pr-3.5 pl-2 whitespace-nowrap"
      :class="[FLOATING, tabSide(place.kind) === 'left' ? 'left-5' : 'right-5', { [`outline-2 outline-primary-500 ${NOW_HALO}`]: now }]"
    >
      <img
        :src="placeIllustrations[place.kind]"
        alt=""
        :class="place.kind === 'Platform' ? 'mx-0.5 h-auto w-[30px]' : 'size-[30px]'"
      />
      <div>
        <p class="font-heading text-sm leading-[18px] font-bold tracking-tight text-highlighted">{{ place.name }}</p>
        <p class="text-xs leading-3.5 text-dimmed">
          <span class="font-semibold" :class="tint.kind">{{ place.kind }}</span>
          <template v-if="detail"> · {{ detail }}</template>
        </p>
      </div>
      <UBadge
        v-if="now"
        color="primary"
        variant="soft"
        size="sm"
        class="absolute -top-2.5 -right-2 rounded-full font-bold"
        :class="NOW_TINT"
      >
        New
      </UBadge>
    </div>
  </div>
</template>

<style scoped>
.area {
  animation: area-in 360ms ease-out backwards;
}

@keyframes area-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .area {
    animation: none;
  }
}
</style>
