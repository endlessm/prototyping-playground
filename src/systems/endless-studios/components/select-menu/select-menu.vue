<!--
  The Endless Studios select menu: Nuxt UI's USelectMenu as the frontend uses it. Screens write <USelectMenu>
  directly, with these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The selected value, bound with `v-model`. */
    modelValue?: string | number | Record<string, unknown>;
    /** The options: strings, or objects with `label` (and `icon`, `avatar`, `disabled`). */
    items?: (string | number | Record<string, unknown>)[];
    placeholder?: string;
    /** A search box at the top of the list; `{ placeholder: '…' }` sets its text, `false` removes it. */
    searchInput?: boolean | { placeholder?: string };
    /** Allows several values; `modelValue` becomes an array. */
    multiple?: boolean;
    /** A semantic role from the theme; it colours the focus ring. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name shown before the value. */
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    required?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: base, value, content, input, item… */
    ui?: Record<string, string>;
  }>(),
  { searchInput: true, color: 'primary', variant: 'outline', size: 'md' },
);
</script>

<template>
  <USelectMenu v-bind="props" />
</template>
