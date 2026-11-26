<!-- @studio-id 0drm0zyzsvhfwg05 -->
<!-- @studio-state z7y69mpdfdc21c4h List -->
<!-- @studio-state 9pdkw6cvhamf84bj Board -->
<!-- @studio-state qvwsvg87jcp55ywq Focus -->
<!-- @studio-state xex2b92454nj3gww Phases -->
<!-- @studio-state ytw9rk4y28d93sc1 Large district -->
<script setup lang="ts">
import { ref } from 'vue'
import VariantPicker from '../To-do Checklist/_present/VariantPicker.vue'
import OrgChartPage from './_chart/OrgChartPage.vue'
import StructureList from './_chart/StructureList.vue'
import StructureBoard from './_structure/StructureBoard.vue'
import StructureFocus from './_structure/StructureFocus.vue'
import StructurePhases from './_structure/StructurePhases.vue'

// Ways to draw the Structure tab, on the real Org page with the same district: today's list, a board of Team cards,
// one Team at a time beside the list of Teams, and the Cohorts sorted by where their run stands. The picker at the
// bottom flips between them (1 to 4, arrows, R replays); each named state shows one without the picker, for canvases.
const props = withDefaults(defineProps<{ variant?: number; picker?: boolean; scale?: 'sample' | 'large' }>(), {
  variant: 0,
  picker: true,
  scale: 'sample',
})

const variants = [
  { label: 'List', is: StructureList },
  { label: 'Board', is: StructureBoard },
  { label: 'Focus', is: StructureFocus },
  { label: 'Phases', is: StructurePhases },
]
const current = ref(props.variant)
const replays = ref(0)
</script>

<script lang="ts">
export const states = [
  { title: 'List', props: { variant: 0, picker: false } },
  { title: 'Board', props: { variant: 1, picker: false } },
  { title: 'Focus', props: { variant: 2, picker: false } },
  { title: 'Phases', props: { variant: 3, picker: false } },
  { title: 'Large district', props: { scale: 'large' } },
]
</script>

<template>
  <OrgChartPage :scale="scale">
    <template #structure="{ root }">
      <component :is="variants[current]!.is" :key="`${current}-${replays}`" :root="root" />
    </template>
  </OrgChartPage>
  <VariantPicker v-if="picker" v-model="current" :labels="variants.map((v) => v.label)" @replay="replays++" />
</template>
