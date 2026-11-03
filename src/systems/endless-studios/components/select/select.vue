<!--
  The Endless Studios select: Nuxt UI's USelect as the frontend uses it. Screens write <USelect> directly, with
  these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The selected value, bound with `v-model`. */
    modelValue?: string | number;
    /** The options: strings, or objects with `label` and `value` (and `disabled`, `icon`). */
    items?: (string | number | Record<string, unknown>)[];
    placeholder?: string;
    /** A semantic role from the theme; it colours the focus ring. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
    /** The leader dashboard's filters use `xs`. */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name shown before the value. */
    icon?: string;
    /** Allows several values; `modelValue` becomes an array. */
    multiple?: boolean;
    loading?: boolean;
    disabled?: boolean;
    required?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: base, value, placeholder, content, item… */
    ui?: Record<string, string>;
  }>(),
  { color: 'primary', variant: 'outline', size: 'md' },
);
</script>

<template>
  <USelect v-bind="props" />
</template>
