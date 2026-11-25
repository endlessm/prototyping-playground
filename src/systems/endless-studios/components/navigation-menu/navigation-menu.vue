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
    /** The Lab's switch for the empty state: with no `items`, shows a menu without links instead of the sample tabs. */
    empty?: boolean;
  }>(),
  { color: 'primary', variant: 'pill', orientation: 'horizontal', empty: false },
);

const sampleItems = [
  { label: 'Overview', to: '/profile/ana.learner/', active: true },
  { label: 'Skills', to: '/profile/ana.learner/skills/' },
  { label: 'Certificates', to: '/profile/ana.learner/certificates/' },
  { label: 'Games', to: '/profile/ana.learner/games/' },
];

const forwarded = computed(() => {
  const { empty: _empty, items: _items, ...rest } = props;
  return rest;
});
</script>

<template>
  <UNavigationMenu v-bind="forwarded" :items="items ?? (empty ? [] : sampleItems)" />
</template>
