<!--
  The Endless Studios calendar: Nuxt UI's UCalendar as the frontend uses it. Screens write <UCalendar> directly,
  with these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /**
     * The chosen date, a `CalendarDate` from `@internationalized/date`, bound with `v-model`; with `range`,
     * `{ start, end }`.
     */
    modelValue?: object | null;
    /** Picks a start and an end date, as the analytics date range does. */
    range?: boolean;
    /** Picks several separate dates. */
    multiple?: boolean;
    /** How many months show side by side. */
    numberOfMonths?: number;
    /** The earliest date people can pick. */
    minValue?: object;
    /** The latest date people can pick, such as today for a report. */
    maxValue?: object;
    /** The first day of the week: 0 is Sunday, 1 is Monday. */
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    /** Shows the previous and next month buttons. */
    monthControls?: boolean;
    /** Shows the previous and next year buttons. */
    yearControls?: boolean;
    /** A semantic role from the theme, for the chosen dates. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  { numberOfMonths: 1, monthControls: true, yearControls: true, color: 'primary', size: 'md' },
);
</script>

<template>
  <UCalendar v-bind="props" />
</template>
