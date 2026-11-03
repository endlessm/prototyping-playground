<!--
  The Endless Studios radio group: Nuxt UI's URadioGroup as the frontend uses it. Screens write <URadioGroup>
  directly, with these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The chosen value, bound with `v-model`. */
    modelValue?: string | number;
    /** The options: strings, or objects with `label`, `value`, `description` and `disabled`. */
    items?: (string | number | Record<string, unknown>)[];
    /** The question the options answer, read out as the group's name. */
    legend?: string;
    /** `card` and `table` make each option a bordered box. */
    variant?: 'list' | 'card' | 'table';
    /** A semantic role from the theme. The app's cover picker uses `neutral`. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    orientation?: 'vertical' | 'horizontal';
    /** Where the dot sits; `hidden` leaves only the label, for options drawn in the `#label` slot. */
    indicator?: 'start' | 'end' | 'hidden';
    disabled?: boolean;
    required?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop, such as `{ item: 'items-center' }`. */
    ui?: Record<string, string>;
  }>(),
  { variant: 'list', color: 'primary', size: 'md', orientation: 'vertical', indicator: 'start' },
);
</script>

<template>
  <URadioGroup v-bind="props" />
</template>
