<!--
  The Endless Studios input menu: Nuxt UI's UInputMenu as the frontend uses it. Screens write <UInputMenu>
  directly, with these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The selected value, bound with `v-model`. */
    modelValue?: string | number | Record<string, unknown>;
    /** The suggestions: strings, or objects with `label` (and `icon`, `avatar`, `disabled`). */
    items?: (string | number | Record<string, unknown>)[];
    /** An example of the expected value, such as `America/New_York`. */
    placeholder?: string;
    /** Allows several values, shown as tags in the input; `modelValue` becomes an array. */
    multiple?: boolean;
    /** A semantic role from the theme; it colours the focus ring. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name shown before the text. */
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    required?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, base, content, item, tagsItem… */
    ui?: Record<string, string>;
  }>(),
  { color: 'primary', variant: 'outline', size: 'md' },
);
</script>

<template>
  <UInputMenu v-bind="props" />
</template>
