<!--
  The Endless Studios textarea's examples, written as screens write it: <UTextarea v-model="…">. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const description = ref('');
const notes = ref('Added the double jump and a checkpoint before the boss.');
const prompt = ref('Which of these is an example of a game mechanic?');
</script>

<template>
  <Example name="Default">
    <UFormField label="Event description" class="w-full">
      <UTextarea
        v-model="description"
        :rows="5"
        placeholder="What will happen, who it's for and what to bring"
        class="w-full"
      />
    </UFormField>
  </Example>

  <Example name="Autoresize">
    <UFormField label="Notes" help="Grows as you type, up to eight lines." class="w-full">
      <UTextarea v-model="notes" autoresize :maxrows="8" class="w-full" />
    </UFormField>
  </Example>

  <Example name="Disabled">
    <UTextarea v-model="prompt" aria-label="Question 1 prompt" disabled class="w-full" />
  </Example>
</template>
