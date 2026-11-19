<script setup lang="ts">
import FaceStack from './FaceStack.vue'
import type { Place } from './district'
import PlaceTag from './PlaceTag.vue'

// One place on the Organization's map: its name with a small tag saying whether it is a Team or a Cohort, what it
// holds, then the faces of its people underneath, so the cards stay narrow as the tree widens. Each card is as wide as
// its name or its spread faces, within a floor and a ceiling, so short names don't float in wide cards and long ones
// wrap rather than stretch the tree. People are added and removed elsewhere, so the card has no actions.
defineProps<{ place: Place }>()
</script>

<template>
  <article
    class="relative flex w-max max-w-64 min-w-44 flex-col gap-2.5 rounded-xl border border-default bg-default px-4 py-3"
  >
    <!-- Sits on the card's top edge with its first letter over the title's (16px padding less the tag's 6px); the solid
    backing hides the border under it. -->
    <span v-if="place.level !== 'Organization'" class="absolute top-0 left-2.5 flex -translate-y-1/2 rounded-md bg-default">
      <PlaceTag :level="place.level" />
    </span>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h3 class="line-clamp-2 text-sm font-medium text-highlighted">{{ place.name }}</h3>
      <p class="text-xs text-muted">{{ place.detail }}</p>
    </div>
    <FaceStack :place="place" />
  </article>
</template>
