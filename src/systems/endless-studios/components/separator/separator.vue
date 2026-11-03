<!--
  The Endless Studios separator: Nuxt UI's USeparator as the frontend uses it. Screens write <USeparator> directly,
  with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Text in the middle of the line. The default slot takes a button instead, as "Show more" does. */
    label?: string;
    /** A Lucide icon name in the middle of the line. */
    icon?: string;
    /** A semantic role from the theme. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** The line's thickness. */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    type?: 'solid' | 'dashed' | 'dotted';
    /** `vertical` divides items in a row; give it a height, such as `h-6`. */
    orientation?: 'horizontal' | 'vertical';
    /** Hides it from screen readers, for a line that's only decoration. */
    decorative?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, border, container, icon, label. */
    ui?: Record<string, string>;
  }>(),
  { color: 'neutral', size: 'xs', type: 'solid', orientation: 'horizontal' },
);
</script>

<template>
  <USeparator v-bind="props"><slot /></USeparator>
</template>
