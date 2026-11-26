<!--
  The page layout: the app's own components/App/AppPage.vue, copied unchanged.
  Screens don't use this file: they import `~/components/App/AppPage.vue` and fill its slots. This file fills them
  with sample content, so the component page and the Lab's Playground show the layout.
-->
<script setup lang="ts">
import AppPage from '~/components/App/AppPage.vue';

withDefaults(
  defineProps<{
    /** Fills the `header` slot with a sample banner, flush to the top of the page. */
    header?: boolean;
  }>(),
  { header: true },
);
</script>

<template>
  <AppPage>
    <template v-if="header" #header>
      <UAlert color="primary" variant="soft" icon="i-lucide-megaphone" title="Spring cohorts start March 3" description="Join a program before February 28 to save your place." />
    </template>
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold">My Programs</h1>
      <UCard>
        <p class="text-base font-bold">Make your first platformer</p>
        <p class="text-sm text-muted">Build a small platformer over eight weeks, one mechanic at a time.</p>
      </UCard>
      <UCard>
        <p class="text-base font-bold">Pixel art basics</p>
        <p class="text-sm text-muted">Draw, animate and export sprites for your games.</p>
      </UCard>
    </div>
  </AppPage>
</template>
