<!-- @studio-id kxjg7dy4hvvsfn9q -->
<!-- @studio-state q54wn3mysrg1evrz Form -->
<script setup lang="ts">
import OrgPage from '../../_ui/OrgPage.vue'
import TeamsTab from '../Teams Transition/_teams/TeamsTab.vue'

// Proposed, to compare with Teams Transition. The same flow, with a calmer Create a Team: one centered column (title,
// two lines, the name, the Team Owner card peeking up from the bottom edge) and the buttons in the corner, at the empty
// state's height. The card rises into view under the pointer, the second line says who will run the Team once someone
// is picked, and Create Team gives a small pop when a name makes it usable.
defineProps<{ start?: 'empty' | 'form' | 'populated' | 'created' }>()
</script>

<script lang="ts">
export const states = [{ title: 'Form', props: { start: 'form' } }]
</script>

<template>
  <OrgPage viewer="orgOwner" :step="5" no-structure members>
    <template #teams="{ tab }">
      <TeamsTab :tab="tab" :start="start" centered />
    </template>
  </OrgPage>
</template>
