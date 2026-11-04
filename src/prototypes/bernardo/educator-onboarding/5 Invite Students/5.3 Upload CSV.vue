<!-- @studio-id qej955wcj7cjkwmq -->
<!-- @studio-state jga93x8d62e5zxem File ready -->
<!-- @studio-state qns4njd8nm01z6kr Rows to fix -->
<!-- @lofi -->
<script setup lang="ts">
import ClassLink from '../_wire/ClassLink.vue'
import type { CsvStep } from '../_wire/csv'

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
