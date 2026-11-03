<!--
  The Endless Studios progress bar: Nuxt UI's UProgress as the frontend uses it. Screens write <UProgress> directly,
  with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** How far along, from 0 to `max`. Leave it out for a bar that moves without a known end. */
    modelValue?: number | null;
    /** The value that fills the bar. */
    max?: number;
    /** Shows the percentage above the bar. */
    status?: boolean;
    /** The leader dashboard's bars use `secondary`. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** The dashboard's score bars use `sm`. */
    size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    orientation?: 'horizontal' | 'vertical';
    /** Fills from the other end. */
    inverted?: boolean;
    /** How a bar without a value moves. */
    animation?: 'carousel' | 'carousel-inverse' | 'swing' | 'elastic';
    /** Classes for each part, as Nuxt UI's `ui` prop: root, base, indicator, status, steps. */
    ui?: Record<string, string>;
  }>(),
  { max: 100, color: 'primary', size: 'md', orientation: 'horizontal', animation: 'carousel' },
);
</script>

<template>
  <UProgress v-bind="props" />
</template>
