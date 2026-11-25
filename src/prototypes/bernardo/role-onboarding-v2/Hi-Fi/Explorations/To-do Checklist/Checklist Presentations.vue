<!-- @studio-id znnarztdgg2z87ha -->
<!-- @studio-state tmk0bja4b5me2vh0 Card -->
<!-- @studio-state e3qpwfgner3q8w46 Dock -->
<!-- @studio-state kp0ejpj4je59hsfs Trail -->
<!-- @studio-state k6m7qfr7ya0zh84b Focus -->
<script setup lang="ts">
import { ref } from 'vue'
import OrgPage from '../../_ui/OrgPage.vue'
import WelcomeCard from '../../_ui/WelcomeCard.vue'
import DockChecklist from './_present/DockChecklist.vue'
import FocusChecklist from './_present/FocusChecklist.vue'
import TrailChecklist from './_present/TrailChecklist.vue'
import VariantPicker from './_present/VariantPicker.vue'

// Ways to present the celebrated checklist on the Org Owner's welcome (1.3), on the real page with its real steps:
// today's card, a dock in the corner, a trail across the page and a stack of one step at a time. The picker at the
// bottom flips between them (1 to 4, arrows, R replays); each named state shows one, without the picker, for canvases.
const props = withDefaults(defineProps<{ variant?: number; picker?: boolean }>(), { variant: 0, picker: true })

const variants = [
  { label: 'Card', is: WelcomeCard },
  { label: 'Dock', is: DockChecklist },
  { label: 'Trail', is: TrailChecklist },
  { label: 'Focus', is: FocusChecklist },
]
const current = ref(props.variant)
const replays = ref(0)
</script>

<script lang="ts">
export const states = [
  { title: 'Card', props: { variant: 0, picker: false } },
  { title: 'Dock', props: { variant: 1, picker: false } },
  { title: 'Trail', props: { variant: 2, picker: false } },
  { title: 'Focus', props: { variant: 3, picker: false } },
]
</script>

<template>
  <OrgPage viewer="orgOwner" :step="3">
    <template #welcome="{ card }">
      <component :is="variants[current]!.is" :key="`${current}-${replays}`" v-bind="card" />
    </template>
  </OrgPage>
  <VariantPicker v-if="picker" v-model="current" :labels="variants.map((v) => v.label)" @replay="replays++" />
</template>
