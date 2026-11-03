<!--
  The Endless Studios container: Nuxt UI's UContainer with the frontend's app.config page padding. Screens write
  <UContainer> directly; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The root element. */
    as?: string;
    /** Replaces the base classes, as Nuxt UI's `ui` prop. */
    ui?: { base?: string };
  }>(),
  { as: 'div' },
);
</script>

<template>
  <UContainer v-bind="props"><slot /></UContainer>
</template>
