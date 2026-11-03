<!--
  The Endless Studios alert: Nuxt UI's UAlert with the frontend's app.config alert settings. Screens write
  <UAlert> directly, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The alert's heading. */
    title?: string;
    /** A line under the title. The `#description` slot takes richer content. */
    description?: string;
    /** A Lucide icon name, such as `i-lucide-user-x`, shown before the text. */
    icon?: string;
    /** A semantic role from the theme. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'solid' | 'outline' | 'soft' | 'subtle';
    /** `horizontal` puts the actions beside the text; `vertical` puts them under it. */
    orientation?: 'vertical' | 'horizontal';
    /** Buttons, each given as UButton props, such as `{ label: 'Enable', color: 'warning' }`. */
    actions?: Record<string, unknown>[];
    /** Shows a close button; closing emits `update:open`. */
    close?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, wrapper, title, description, icon, actions, close. */
    ui?: Partial<Record<'root' | 'wrapper' | 'title' | 'description' | 'icon' | 'actions' | 'close', string>>;
  }>(),
  { color: 'primary', variant: 'solid', orientation: 'vertical' },
);
</script>

<template>
  <UAlert v-bind="props">
    <template v-if="$slots.description" #description><slot name="description" /></template>
  </UAlert>
</template>
