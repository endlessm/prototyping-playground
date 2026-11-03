<!--
  The Endless Studios textarea: Nuxt UI's UTextarea as the frontend uses it. Screens write <UTextarea> directly,
  with these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The text, bound with `v-model`. */
    modelValue?: string;
    placeholder?: string;
    /** The visible lines before it scrolls or grows. */
    rows?: number;
    /** Grows with its content, up to `maxrows`. */
    autoresize?: boolean;
    /** The most lines `autoresize` grows to; 0 is no limit. */
    maxrows?: number;
    /** A semantic role from the theme; it colours the focus ring. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    required?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, base. */
    ui?: Record<string, string>;
  }>(),
  { rows: 3, maxrows: 0, color: 'primary', variant: 'outline', size: 'md' },
);
</script>

<template>
  <UTextarea v-bind="props" />
</template>
