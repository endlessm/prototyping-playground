<!--
  The Endless Studios tabs' examples, written as screens write it: <UTabs v-model="…" :items="…">. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const granularity = ref('daily');
const granularityTabs = [
  { label: 'Daily', value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
];

const sections = [
  { label: 'About', icon: 'i-lucide-info', content: 'Learners build a small platformer over eight weeks, one mechanic at a time.' },
  { label: 'Schedule', icon: 'i-lucide-calendar', content: 'Weekly sessions on Tuesdays, 4–5:30 pm, starting March 3.' },
  { label: 'Mentors', icon: 'i-lucide-users', content: 'Marco Dias and Carla Reis mentor this cohort.' },
];
</script>

<template>
  <Example name="Switcher">
    <div class="flex w-full items-center justify-between gap-4">
      <h3 class="text-base font-semibold text-highlighted">Active users</h3>
      <UTabs v-model="granularity" :items="granularityTabs" :content="false" size="sm" class="w-48" />
    </div>
  </Example>

  <Example name="WithContent">
    <UTabs :items="sections" class="w-full" />
  </Example>

  <Example name="Link">
    <UTabs :items="sections" variant="link" color="neutral" class="w-full" />
  </Example>
</template>
