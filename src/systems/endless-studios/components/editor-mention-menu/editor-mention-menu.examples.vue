<!--
  The Endless Studios mention menu's examples, written as screens write it: <UEditorMentionMenu> inside a
  <UEditor mention>'s default slot. Each example keeps room for the menu. Each <Example name="…"> is one example on
  the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const post = ref('<p>Great level! Type @ to thank someone. </p>');
const comment = ref('<p></p>');

const people = [
  { label: 'ana.souza', description: 'Ana Souza', avatar: { text: 'AS' } },
  { label: 'joao.lima', description: 'João Lima', avatar: { text: 'JL' } },
  { label: 'carla.reis', description: 'Carla Reis', avatar: { text: 'CR' } },
  { label: 'marco.dias', description: 'Marco Dias · Mentor', avatar: { text: 'MD' } },
];

// The app searches the server on each keystroke; this stands in for that request.
const results = ref(people);
async function search(term: string) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  results.value = people.filter((person) => `${person.label} ${person.description}`.toLowerCase().includes(term.toLowerCase()));
}
</script>

<template>
  <Example name="Default">
    <div class="h-72 w-full">
      <UEditor
        v-slot="{ editor }"
        v-model="post"
        content-type="html"
        :image="false"
        :ui="{ root: 'w-full rounded-lg border border-default', base: 'p-3 min-h-24' }"
      >
        <UEditorMentionMenu :editor="editor" :items="people" />
      </UEditor>
    </div>
  </Example>

  <Example name="ServerSearch">
    <div class="h-72 w-full">
      <UEditor
        v-slot="{ editor }"
        v-model="comment"
        content-type="html"
        placeholder="Write a comment… type @ to mention someone"
        :image="false"
        :ui="{ root: 'w-full rounded-lg border border-default', base: 'p-3 min-h-24' }"
      >
        <UEditorMentionMenu :editor="editor" :items="results" ignore-filter @update:search-term="search" />
      </UEditor>
    </div>
  </Example>
</template>
