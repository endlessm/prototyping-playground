<!-- @studio-id s5c7fw2n7ddz4kz1 -->
<!-- @studio-state cdcb3rp98yaenj3t File ready -->
<!-- @studio-state kf3zs4wsgn0n1w4q Rows to fix -->
<script setup lang="ts">
import CohortPage from '../_ui/CohortPage.vue'
import type { CsvStep } from '../_ui/csv'

// Upload CSV from the Learners tab: the class-list modal over it, at the step each state names.
withDefaults(defineProps<{ step?: CsvStep }>(), { step: 'choose' })
</script>

<script lang="ts">
export const states = [
  { title: 'File ready', props: { step: 'ready' } },
  { title: 'Rows to fix', props: { step: 'errors' } },
]
</script>

<template>
  <CohortPage :csv="step" :tab-links="{ people: 'Hi-Fi/5 Cohort/5.4 Managers and Facilitators', settings: 'Hi-Fi/5 Cohort/5.6 Cohort Settings' }" walkthrough />
</template>
