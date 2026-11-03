<!--
  The Endless Studios modal: Nuxt UI's UModal as the frontend uses it. Screens write <UModal> directly, with these
  props, v-model:open and the default (trigger), #body and #footer slots; this file gives the component page its
  props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Whether it shows, bound with `v-model:open`. Without it, the default slot's button opens it. */
    open?: boolean;
    /** The heading. Leave it out and empty the `#title` slot for a modal whose body has its own heading. */
    title?: string;
    /** A line under the title. */
    description?: string;
    /** The close button in the corner: `false` hides it, for a choice people must make. */
    close?: boolean;
    /** Closes on Escape and on a click outside. `false` keeps it open while something saves. */
    dismissible?: boolean;
    /** Fills the whole screen. */
    fullscreen?: boolean;
    /** Scrolls the overlay instead of the body, for content taller than the screen. */
    scrollable?: boolean;
    /** Dims the page behind it. */
    overlay?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop, such as `{ footer: 'justify-end' }`. */
    ui?: Record<string, string>;
  }>(),
  { close: true, dismissible: true, overlay: true },
);
</script>

<template>
  <UModal v-bind="props">
    <slot />
    <template v-if="$slots.body" #body><slot name="body" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </UModal>
</template>
