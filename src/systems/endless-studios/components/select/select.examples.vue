<!--
  The Endless Studios select's examples, written as screens write it: <USelect v-model="…" :items="…">. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const institutions = [
  { label: 'Lincoln Middle School', value: 1 },
  { label: 'Riverside Library', value: 2 },
  { label: 'Code Club Recife', value: 3 },
];
const statuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
];
const quizzes = ['AI Literacy: Pre', 'AI Literacy: Post'];

const institution = ref(1);
const status = ref('active');
const quiz = ref('AI Literacy: Post');
const comparison = ref('AI Literacy: Pre');
const empty = ref();
</script>

<template>
  <Example name="Default">
    <UFormField label="Institution" class="w-full">
      <USelect v-model="institution" :items="institutions" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Placeholder">
    <UFormField label="Status" class="w-full">
      <USelect v-model="empty" :items="statuses" placeholder="Choose a status" class="w-full" />
    </UFormField>
  </Example>

  <Example name="CompactFilters">
    <div class="flex w-full gap-2">
      <USelect v-model="quiz" :items="quizzes" size="xs" class="min-w-0 flex-1" />
      <USelect v-model="comparison" :items="quizzes" size="xs" class="min-w-0 flex-1" />
    </div>
  </Example>

  <Example name="States">
    <div class="grid w-full gap-3">
      <USelect v-model="status" :items="statuses" loading class="w-full" />
      <USelect v-model="status" :items="statuses" disabled class="w-full" />
    </div>
  </Example>
</template>
