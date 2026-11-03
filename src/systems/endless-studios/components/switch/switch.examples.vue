<!--
  The Endless Studios switch's examples, written as screens write it: <USwitch v-model="…">. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const shuffleQuestions = ref(true);
const shuffleOptions = ref(false);
const quizResults = ref(true);
const isPublic = ref(false);
const saving = ref(true);
</script>

<template>
  <Example name="Default">
    <div class="flex flex-col gap-3">
      <USwitch v-model="shuffleQuestions" label="Shuffle questions" />
      <USwitch v-model="shuffleOptions" label="Shuffle answer options" />
    </div>
  </Example>

  <Example name="WithDescription">
    <USwitch
      v-model="shuffleQuestions"
      label="Shuffle questions"
      description="Each learner sees the questions in a different order."
    />
  </Example>

  <Example name="SettingsRow">
    <UCard variant="bordered" class="w-full">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-highlighted">Quiz results</p>
          <p class="text-sm text-muted">Count quiz scores toward this program's results.</p>
        </div>
        <USwitch v-model="quizResults" aria-label="Quiz results" />
      </div>
    </UCard>
  </Example>

  <Example name="ParentalConsent">
    <UCard variant="bordered" class="w-full">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-highlighted">Public profile</p>
          <p class="text-sm text-muted">A parent needs to approve this before others can see your profile.</p>
        </div>
        <USwitch v-model="isPublic" color="kids" unchecked-icon="i-lucide-shield" class="shrink-0 opacity-75" aria-label="Public profile" />
      </div>
    </UCard>
  </Example>

  <Example name="States">
    <div class="flex flex-col gap-3">
      <USwitch v-model="saving" label="Saving" loading />
      <USwitch :model-value="true" label="Disabled on" disabled />
      <USwitch :model-value="false" label="Disabled off" disabled />
    </div>
  </Example>
</template>
