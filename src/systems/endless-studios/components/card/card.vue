<!--
  The Endless Studios card: Nuxt UI's UCard with the frontend's app.config card variants. Screens write <UCard>
  directly, with these props and the #header, default and #footer slots; this file gives the component page its
  props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Header title, shown when there is no `#header` content. */
    title?: string;
    /** Header line under the title. */
    description?: string;
    /** A white card with the soft wide shadow and no border by default. */
    variant?: 'outline' | 'bordered' | 'soft' | 'subtle' | 'solid' | 'flat' | 'ghost';
    /** Classes for each part, as Nuxt UI's `ui` prop: root, header, title, description, body, footer. */
    ui?: Partial<Record<'root' | 'header' | 'title' | 'description' | 'body' | 'footer', string>>;
    /** The root element. */
    as?: string;
  }>(),
  { variant: 'outline', as: 'div' },
);
</script>

<template>
  <UCard v-bind="props">
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </UCard>
</template>
