<!--
  The Endless Studios breadcrumb's examples, written as screens write it: <UBreadcrumb> with :items. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const trail = [
  { label: 'Users', to: '/leader/users/' },
  { label: 'Ana Souza', to: '/leader/users/ana/' },
  { label: 'Projects' },
];
</script>

<template>
  <Example name="Default">
    <UBreadcrumb color="neutral" :items="trail" />
  </Example>

  <Example name="WithIcon">
    <UBreadcrumb
      color="neutral"
      :items="[
        { label: 'Programs', icon: 'i-lucide-graduation-cap', to: '/leader/programs/' },
        { label: 'Game Design Foundations', to: '/leader/programs/12/' },
        { label: 'Cohorts' },
      ]"
    />
  </Example>

  <Example name="PageHeader">
    <div class="flex w-full flex-col gap-4 border-b border-default pb-8">
      <UBreadcrumb color="neutral" :items="trail" />
      <div class="flex items-center justify-between gap-5 max-sm:flex-col max-sm:items-start">
        <h1 class="font-heading truncate text-2xl font-semibold">Projects</h1>
        <UButton icon="i-lucide-plus">Add Project</UButton>
      </div>
    </div>
  </Example>
</template>
