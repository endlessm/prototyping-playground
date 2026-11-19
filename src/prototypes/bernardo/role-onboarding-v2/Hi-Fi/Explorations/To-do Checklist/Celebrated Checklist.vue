<!-- @studio-id 54kcktjcy35xpe6t -->
<!-- @studio-state vv27b9tmca4wg50y Nothing ticked -->
<!-- @studio-state cg6xr79whah7sfqv One ticked -->
<script setup lang="ts">
import { firstSteps, roleBriefs, roles } from '../../../_wire/world'
import { hifi } from '../../_ui/paths'
import WelcomeCard from '../../_ui/WelcomeCard.vue'

// The Org Owner's welcome card from 1.3 on its own, to explore the celebrated checklist: tick a step to see the pop,
// the confetti and the strike-through; tick them all for the green wave. Untick one to pull it back.
const props = withDefaults(defineProps<{ done?: number }>(), { done: 0 })
</script>

<script lang="ts">
export const states = [
  { title: 'Nothing ticked', props: { done: 0 } },
  { title: 'One ticked', props: { done: 1 } },
]
</script>

<template>
  <div class="mx-auto max-w-4xl p-8">
    <WelcomeCard
      :name="roles.orgOwner.person.name"
      :lead="roleBriefs.orgOwner"
      :steps="firstSteps.orgOwner"
      :done="props.done"
      :to="props.done === 0 ? hifi('orgOwner', 4) : undefined"
    />
  </div>
</template>
