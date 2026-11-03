<!--
  The Endless Studios navigation menu: Nuxt UI's UNavigationMenu with the frontend's app.config pill settings.
  Screens write <UNavigationMenu> directly, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The links, each with `label`, `to`, `icon`, `badge`, `active`, `exact` or `children`. An array of arrays makes groups. */
    items?: Record<string, unknown>[] | Record<string, unknown>[][];
    /** The platform's pills and tabs use `neutral`. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** `pill` is the platform's page tabs: muted links and a dark pill on the active one. */
    variant?: 'pill' | 'link';
    orientation?: 'horizontal' | 'vertical';
    /** Draws a line beside the active link, as under the leader dashboard's tabs. */
    highlight?: boolean;
    /** Shows only icons. Vertical only. */
    collapsed?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop, such as `{ link: 'no-underline' }`. */
    ui?: Record<string, string>;
  }>(),
  { color: 'primary', variant: 'pill', orientation: 'horizontal' },
);
</script>

<template>
  <UNavigationMenu v-bind="props" />
</template>
