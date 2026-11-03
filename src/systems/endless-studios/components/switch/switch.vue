<!--
  The Endless Studios switch: Nuxt UI's USwitch as the frontend uses it. Screens write <USwitch> directly, with
  these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** On or off, bound with `v-model`. */
    modelValue?: boolean;
    /** The text beside the switch. Without it, give the switch an `aria-label`. */
    label?: string;
    /** A line under the label. */
    description?: string;
    /** A semantic role from the theme. `kids` marks a setting that needs a parent's consent. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name inside the thumb when on. */
    checkedIcon?: string;
    /** A Lucide icon name inside the thumb when off, such as `i-lucide-shield` for a gated setting. */
    uncheckedIcon?: string;
    /** Shows a spinner in the thumb while a change saves. */
    loading?: boolean;
    disabled?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, base, container, thumb, icon, wrapper, label, description. */
    ui?: Record<string, string>;
  }>(),
  { color: 'primary', size: 'md' },
);
</script>

<template>
  <USwitch v-bind="props" />
</template>
