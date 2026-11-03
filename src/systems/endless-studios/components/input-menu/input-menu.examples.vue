<!--
  The Endless Studios input menu's examples, written as screens write it: <UInputMenu v-model="…" :items="…">.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const timezones = ['America/Los_Angeles', 'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Europe/Lisbon', 'Europe/London'];
const skills = ['Level design', 'Pixel art', 'Sound design', 'Storytelling', 'Programming', 'Playtesting'];

const timezone = ref();
const chosen = ref(['Level design', 'Storytelling']);
</script>

<template>
  <Example name="Default">
    <UFormField label="Time zone" class="w-full">
      <UInputMenu v-model="timezone" :items="timezones" placeholder="America/New_York" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Tags">
    <UFormField label="Skills" class="w-full">
      <UInputMenu v-model="chosen" :items="skills" multiple placeholder="Add a skill" class="w-full" />
    </UFormField>
  </Example>
</template>
