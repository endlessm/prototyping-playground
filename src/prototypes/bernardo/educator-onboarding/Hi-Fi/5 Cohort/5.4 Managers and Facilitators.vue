<!-- @studio-id j49encebtzz2e3rt -->
<!-- @studio-state swj8zgc4p6qf5vtp Add Managers -->
<!-- @studio-state xvnv2f0ppjw2ydk3 Invite Facilitators -->
<script setup lang="ts">
import CohortPage from '../_ui/CohortPage.vue'

// The cohort's second tab: the Team Members who manage it, added by its creator, and the Facilitators who run it.
// Add Managers and Invite Facilitators each open a modal; the states show them open.
defineProps<{ people?: 'managers' | 'facilitators' }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Add Managers', props: { people: 'managers' } },
  { title: 'Invite Facilitators', props: { people: 'facilitators' } },
]
</script>

<template>
  <CohortPage
    tab="people"
    joined
    :people="people"
    :tab-links="{ learners: 'Hi-Fi/5 Cohort/5.5 Learners Joined', settings: 'Hi-Fi/5 Cohort/5.6 Cohort Settings' }"
    walkthrough
  />
</template>
