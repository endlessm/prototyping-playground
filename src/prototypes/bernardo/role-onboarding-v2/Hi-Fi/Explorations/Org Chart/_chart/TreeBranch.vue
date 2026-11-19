<script setup lang="ts">
import type { Place } from './district'
import PlaceCard from './PlaceCard.vue'
import TreeCard from './TreeCard.vue'
import TreePlace from './TreePlace.vue'

// A place and everything under it. The lines are drawn by the list itself: a stem down from the parent, a bar across
// its children and a stem into each, so the tree needs no measuring and reflows as places are added. `cards` says
// what sits in a card: each place on one line with its people as a stack of faces (the structure), or, in the earlier
// drawings of People as a chart, each person or each place with its positions.
defineProps<{ place: Place; root?: boolean; cards?: 'people' | 'places' }>()
</script>

<template>
  <li class="branch">
    <TreeCard v-if="cards === 'places'" :place="place" :wide="root" />
    <TreePlace v-else-if="cards === 'people'" :place="place" :wide="root" />
    <PlaceCard v-else :place="place" />
    <ul v-if="place.children.length" class="children">
      <TreeBranch v-for="child in place.children" :key="child.id" :place="child" :cards="cards" />
    </ul>
  </li>
</template>

<style scoped>
.branch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.children {
  --stem: 28px;
  --gap: 16px;
  --line: 1.5px solid var(--ui-border-accented);
  position: relative;
  display: flex;
  justify-content: center;
  gap: var(--gap);
  margin: 0;
  padding: var(--stem) 0 0;
  list-style: none;
}

.children::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  height: var(--stem);
  border-left: var(--line);
}

.children > .branch {
  padding-top: var(--stem);
}

.children > .branch::before {
  content: '';
  position: absolute;
  top: 0;
  right: calc(var(--gap) / -2);
  left: calc(var(--gap) / -2);
  border-top: var(--line);
}

.children > .branch::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  height: var(--stem);
  border-left: var(--line);
}

.children > .branch:first-child::before {
  left: 50%;
  height: var(--stem);
  border-left: var(--line);
  border-top-left-radius: 12px;
}

.children > .branch:last-child::before {
  right: 50%;
  height: var(--stem);
  border-right: var(--line);
  border-top-right-radius: 12px;
}

.children > .branch:first-child::after,
.children > .branch:last-child::after,
.children > .branch:only-child::before {
  display: none;
}

.children > .branch:only-child::after {
  display: block;
}
</style>
