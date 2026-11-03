<!--
  The Endless Studios progress bar's examples, written as screens write it: <UProgress :model-value="…">. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const categories = [
  { name: 'Prompting', pct: 82 },
  { name: 'Evaluating output', pct: 64 },
  { name: 'Ethics and safety', pct: 47 },
];
const sizes = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
</script>

<template>
  <Example name="ProgramProgress">
    <div class="flex w-full items-center gap-4">
      <UProgress :model-value="60" color="secondary" class="grow" aria-hidden="true" />
      <p class="shrink-0 text-sm text-muted">12 of 20 weeks complete</p>
    </div>
  </Example>

  <Example name="ScoreBars">
    <div class="flex w-full flex-col gap-3">
      <div v-for="category in categories" :key="category.name" class="flex items-center gap-4">
        <p class="w-40 shrink-0 text-sm text-default">{{ category.name }}</p>
        <UProgress :model-value="category.pct" color="secondary" size="sm" class="min-w-32 flex-1" aria-hidden="true" />
        <p class="w-10 shrink-0 text-right text-sm font-semibold text-highlighted">{{ category.pct }}%</p>
      </div>
    </div>
  </Example>

  <Example name="WithStatus">
    <UProgress :model-value="81" status color="secondary" class="w-full" aria-label="Average post-quiz score" />
  </Example>

  <Example name="Indeterminate">
    <UProgress color="secondary" class="w-full" aria-label="Loading the report" />
  </Example>

  <Example name="Sizes">
    <div class="grid w-full gap-4">
      <UProgress v-for="size in sizes" :key="size" :model-value="60" color="secondary" :size="size" aria-hidden="true" />
    </div>
  </Example>
</template>
