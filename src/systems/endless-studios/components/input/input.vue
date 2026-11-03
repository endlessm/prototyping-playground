<!--
  The Endless Studios input: Nuxt UI's UInput as the frontend uses it. Screens write <UInput> directly, with
  these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The value, bound with `v-model`. */
    modelValue?: string | number;
    /** The native input type: `text`, `email`, `url`, `password`, `number`… */
    type?: string;
    placeholder?: string;
    /** A semantic role from the theme; it colours the focus ring. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** `none` drops the ring, for an input inside another control such as a popover. */
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name, such as `i-lucide-mail`, shown before the text. */
    icon?: string;
    leadingIcon?: string;
    trailingIcon?: string;
    /** Shows a spinner in place of the leading icon. */
    loading?: boolean;
    disabled?: boolean;
    required?: boolean;
    autofocus?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, base, leading, leadingIcon, trailing, trailingIcon. */
    ui?: Record<string, string>;
  }>(),
  { type: 'text', color: 'primary', variant: 'outline', size: 'md' },
);
</script>

<template>
  <UInput v-bind="props" />
</template>
