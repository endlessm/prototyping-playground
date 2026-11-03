<!--
  The Endless Studios slideover: Nuxt UI's USlideover as the frontend uses it. Screens write <USlideover> directly,
  with these props, v-model:open and the default (trigger), #body and #footer slots; this file gives the component
  page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Whether it shows, bound with `v-model:open`. Without it, the default slot's button opens it. */
    open?: boolean;
    /** The heading. */
    title?: string;
    /** A line under the title, such as the item's status. */
    description?: string;
    /** The edge it slides in from. */
    side?: 'right' | 'left' | 'top' | 'bottom';
    /** Floats it with a margin and rounded corners instead of touching the edge. */
    inset?: boolean;
    /** The close button in the corner. The quiz editor hides it while saving. */
    close?: boolean;
    /** Closes on Escape and on a click outside. `false` keeps it open while something saves. */
    dismissible?: boolean;
    /** Dims the page behind it. */
    overlay?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop, such as `{ content: 'max-w-4xl' }` for a wide editor. */
    ui?: Record<string, string>;
  }>(),
  { side: 'right', close: true, dismissible: true, overlay: true },
);
</script>

<template>
  <USlideover v-bind="props">
    <slot />
    <template v-if="$slots.body" #body><slot name="body" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </USlideover>
</template>
