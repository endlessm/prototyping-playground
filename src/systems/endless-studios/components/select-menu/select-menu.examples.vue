<!--
  The Endless Studios select menu's examples, written as screens write it: <USelectMenu v-model="…" :items="…">.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const timezones = [
  'America/Los_Angeles',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Recife',
  'Europe/Lisbon',
  'Europe/London',
  'Africa/Lagos',
  'Asia/Kolkata',
];
const learners = [
  { label: 'Ana Souza', avatar: { text: 'AS' } },
  { label: 'João Lima', avatar: { text: 'JL' } },
  { label: 'Carla Reis', avatar: { text: 'CR' } },
  { label: 'Marco Dias', avatar: { text: 'MD' } },
];

const timezone = ref('America/Sao_Paulo');
const mentees = ref([learners[0], learners[2]]);
</script>

<template>
  <Example name="Default">
    <UFormField label="Time zone" required class="w-full">
      <USelectMenu v-model="timezone" :items="timezones" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Multiple">
    <UFormField label="Learners" class="w-full">
      <USelectMenu
        v-model="mentees"
        :items="learners"
        multiple
        :search-input="{ placeholder: 'Search learners' }"
        placeholder="Choose learners"
        class="w-full"
      />
    </UFormField>
  </Example>
</template>
