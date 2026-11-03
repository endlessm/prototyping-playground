<!--
  The Endless Studios radio group's examples, written as screens write it: <URadioGroup v-model="…" :items="…">.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const answers = [
  { label: 'Jumping over a gap', value: 'a' },
  { label: 'The game\'s soundtrack', value: 'b' },
  { label: 'The color of the sky', value: 'c' },
];
const visibility = [
  { label: 'Everyone in the program', value: 'program', description: 'Learners and mentors in Game Design Foundations.' },
  { label: 'Only my mentors', value: 'mentors', description: 'Your work stays private to you and your mentors.' },
];
const covers = [
  { value: 'sunset', class: 'bg-orange-200' },
  { value: 'lavender', class: 'bg-cornflower-200' },
  { value: 'sky', class: 'bg-sky-200' },
  { value: 'meadow', class: 'bg-lime-200' },
];

const answer = ref('a');
const shared = ref('mentors');
const cover = ref('lavender');
</script>

<template>
  <Example name="Default">
    <URadioGroup v-model="answer" legend="1. Which of these is a game mechanic?" :items="answers" />
  </Example>

  <Example name="Card">
    <URadioGroup v-model="shared" variant="card" legend="Who can see this project?" :items="visibility" class="w-full" />
  </Example>

  <Example name="Horizontal">
    <URadioGroup v-model="answer" orientation="horizontal" legend="1. Which of these is a game mechanic?" :items="answers" />
  </Example>

  <Example name="PictureOptions">
    <URadioGroup
      v-model="cover"
      color="neutral"
      orientation="horizontal"
      indicator="hidden"
      variant="card"
      legend="Profile cover"
      :items="covers"
      :ui="{ item: 'items-center p-1' }"
    >
      <template #label="{ item }">
        <span class="block h-12 w-20 rounded-lg" :class="item.class" />
        <span class="sr-only">{{ item.value }}</span>
      </template>
    </URadioGroup>
  </Example>

  <Example name="Disabled">
    <URadioGroup v-model="answer" disabled legend="1. Which of these is a game mechanic?" :items="answers" />
  </Example>
</template>
