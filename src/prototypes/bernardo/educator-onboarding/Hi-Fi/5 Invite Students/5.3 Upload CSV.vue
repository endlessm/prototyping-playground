<!-- @studio-id s5c7fw2n7ddz4kz1 -->
<!-- @studio-state cdcb3rp98yaenj3t File ready -->
<!-- @studio-state kf3zs4wsgn0n1w4q Rows to fix -->
<script setup lang="ts">
import ClassLink from '../_ui/ClassLink.vue'
import type { CsvStep } from '../_ui/csv'

// Upload CSV from the class link page: the class-list modal over it, at the step each state names.
withDefaults(defineProps<{ step?: CsvStep }>(), { step: 'choose' })
</script>

<script lang="ts">
export const states = [
  { title: 'File ready', props: { step: 'ready' } },
  { title: 'Rows to fix', props: { step: 'errors' } },
]
</script>

<template>
  <ClassLink :csv="step" walkthrough />
</template>
