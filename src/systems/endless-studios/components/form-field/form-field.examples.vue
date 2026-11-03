<!--
  The Endless Studios form field's examples, written as screens write it: <UFormField> around one control. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const name = ref('');
const code = ref('SPRING-2025');
const bio = ref('');
const timezone = ref('America/Sao_Paulo');
</script>

<template>
  <Example name="Default">
    <UFormField label="Cohort name" required class="w-full">
      <UInput v-model="name" placeholder="Cohort name" class="w-full" />
    </UFormField>
  </Example>

  <Example name="HintAndHelp">
    <UFormField label="Bio" hint="Optional" help="Learners in your cohorts see this on your profile." class="w-full">
      <UTextarea v-model="bio" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Description">
    <UFormField
      label="Time zone"
      description="Events show in each person's own time, starting from this one."
      required
      class="w-full"
    >
      <USelect v-model="timezone" :items="['America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon']" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Error">
    <UFormField label="Enrollment code" error="That code has expired. Ask your mentor for a new one." class="w-full">
      <UInput v-model="code" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Horizontal">
    <UFormField label="Display name" orientation="horizontal" class="w-full">
      <UInput placeholder="Ana" />
    </UFormField>
  </Example>
</template>
