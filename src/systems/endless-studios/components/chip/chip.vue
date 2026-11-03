<!--
  The Endless Studios chip: Nuxt UI's UChip as the frontend uses it. Screens write <UChip> directly around the
  element it marks, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** A number or short text inside the dot. Without it, the chip is a plain dot. */
    text?: string | number;
    /** A semantic role from the theme. Unread markers use `primary`. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    /** The corner of the wrapped element it sits on. */
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
    /** Moves the dot inside the corner, for round elements such as avatars. */
    inset?: boolean;
    /** A dot on its own, in the flow of text, with nothing wrapped. */
    standalone?: boolean;
    /** Shows the chip; bind it to the condition, such as unread notifications. */
    show?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, base. */
    ui?: Record<string, string>;
  }>(),
  { color: 'primary', size: 'md', position: 'top-right', show: true },
);
</script>

<template>
  <UChip v-bind="props"><slot /></UChip>
</template>
