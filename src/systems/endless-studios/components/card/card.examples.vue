<!--
  The Endless Studios card's examples, written as screens write it: <UCard> with #header, the default slot and
  #footer. Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const variants = ['outline', 'bordered', 'soft', 'subtle', 'ghost', 'flat', 'solid'] as const;
const members = ['Ana Souza', 'João Lima', 'Carla Reis'];
</script>

<template>
  <Example name="Default">
    <UCard title="Game Design Foundations" description="Spring 2027 · 24 learners" class="w-full">
      <p class="text-sm">Learners build a small platformer over eight weeks, one mechanic at a time.</p>
    </UCard>
  </Example>

  <Example name="Variants">
    <div class="grid w-full grid-cols-2 gap-4">
      <UCard v-for="variant in variants" :key="variant" :variant="variant" :title="variant[0]!.toUpperCase() + variant.slice(1)">
        <p class="text-sm">Learners build a small platformer, one mechanic at a time.</p>
      </UCard>
    </div>
  </Example>

  <Example name="HeaderAndFooter">
    <UCard class="w-full">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-highlighted font-semibold">Archive this cohort?</h3>
            <p class="text-muted text-sm mt-1">Learners keep their projects, but nobody can join anymore.</p>
          </div>
        </div>
      </template>
      <p class="text-sm">24 learners and 3 facilitators are in this cohort.</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost">Cancel</UButton>
          <UButton color="error">Archive Cohort</UButton>
        </div>
      </template>
    </UCard>
  </Example>

  <Example name="SoftInsideOutline">
    <UCard title="Cohort leader" class="w-full">
      <UCard variant="soft">
        <p class="text-highlighted font-medium text-sm">maria.oliveira</p>
        <p class="text-toned text-xs">Maria Oliveira</p>
      </UCard>
    </UCard>
  </Example>

  <Example name="FlushBody">
    <UCard title="Members" :ui="{ body: 'p-0 sm:p-0' }" class="w-full">
      <ul class="divide-y divide-default">
        <li v-for="name in members" :key="name" class="flex items-center justify-between px-4 py-3 sm:px-6 text-sm">
          {{ name }}
          <span class="text-muted">Learner</span>
        </li>
      </ul>
    </UCard>
  </Example>
</template>
