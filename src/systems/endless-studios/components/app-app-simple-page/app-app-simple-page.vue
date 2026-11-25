<!--
  The simple page layout: the app's own components/App/AppSimplePage.vue, copied unchanged.
  Screens don't use this file: they import `~/components/App/AppSimplePage.vue` and fill its slots. This file fills
  them with sample content, so the component page and the Lab's Playground show the layout.
-->
<script setup lang="ts">
import AppSimplePage from '~/components/App/AppSimplePage.vue';

withDefaults(
  defineProps<{
    /** Fills the `header` slot with a sample banner, full width and flush to the top of the page. */
    header?: boolean;
    /** Fills the `hero` slot with a sample heading, inside the app's container. */
    hero?: boolean;
    /** Lets the main content span the full width instead of the app's container. */
    fullWidth?: boolean;
  }>(),
  { header: true, hero: true, fullWidth: false },
);
</script>

<template>
  <AppSimplePage :full-width="fullWidth">
    <template v-if="header" #header>
      <UAlert color="primary" variant="soft" icon="i-lucide-megaphone" title="Spring cohorts start March 3" description="Join a program before February 28 to save your place." />
    </template>
    <template v-if="hero" #hero>
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-bold">Make your first platformer</h1>
        <p class="text-base text-muted">An eight-week program with mentor Marco Lima.</p>
      </div>
    </template>
    <UCard>
      <p class="text-base font-bold">About this program</p>
      <p class="text-sm text-muted">Learners build a small platformer one mechanic at a time: running, jumping, enemies and a final level.</p>
    </UCard>
  </AppSimplePage>
</template>
