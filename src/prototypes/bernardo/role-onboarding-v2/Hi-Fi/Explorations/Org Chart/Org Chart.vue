<!-- @studio-id vb8trj3fnfy1k97g -->
<!-- @studio-state nbtwjebrjea0m46n Place cards -->
<!-- @studio-state be6388hszhkp3spz Person cards -->
<!-- @studio-state htrx8eamccfkqmbj Large district -->
<!-- @studio-state f5th2s6548m9k64e People -->
<!-- @studio-state 1etvrkybd5js9t4a Large district · People -->
<script setup lang="ts">
import OrgChartPage from './_chart/OrgChartPage.vue'

// Proposed. An exploration of the Organization's page split in two. Structure lists who holds what: the Organization
// on top, a row per Team and, folded under it, a row per Cohort, each with the faces of its people. People lists
// everyone in the Organization as cards with the positions they hold in it. "Large district" fills both well past the
// sample world, to test how they hold up. "Person cards" and "Place cards" keep the earlier drawings, where People
// itself was a tree and people were added and removed in place.
defineProps<{
  cards?: 'people' | 'places'
  tab?: 'structure' | 'people'
  scale?: 'sample' | 'large'
}>()
</script>

<script lang="ts">
export const states = [
  { title: 'People', props: { tab: 'people' } },
  { title: 'Large district', props: { scale: 'large' } },
  { title: 'Large district · People', props: { scale: 'large', tab: 'people' } },
  { title: 'Person cards', props: { cards: 'people' } },
  { title: 'Place cards', props: { cards: 'places' } },
]
</script>

<template>
  <OrgChartPage :cards="cards" :tab="tab" :scale="scale" />
</template>
