<!--
  The Endless Studios breadcrumb: Nuxt UI's UBreadcrumb with the frontend's app.config breadcrumb colours. Screens
  write <UBreadcrumb> directly, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The trail, each with `label`, `to` and `icon`. The last item is the current page. */
    items?: Record<string, unknown>[];
    /** The platform uses `neutral`, which the app customizes. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** A Lucide icon name for the separator. */
    separatorIcon?: string;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, list, item, link, separator, separatorIcon. */
    ui?: Record<string, string>;
    /** The Lab's switch for the empty state: with no `items`, shows an empty trail instead of the sample one. */
    empty?: boolean;
  }>(),
  { color: 'primary', separatorIcon: 'i-lucide-chevron-right', empty: false },
);

const sampleItems = [
  { label: 'Programs', icon: 'i-lucide-graduation-cap', to: '/leader/programs/' },
  { label: 'Game Design Foundations', to: '/leader/programs/12/' },
  { label: 'Cohorts' },
];

const forwarded = computed(() => {
  const { empty: _empty, items: _items, ...rest } = props;
  return rest;
});
</script>

<template>
  <UBreadcrumb v-bind="forwarded" :items="items ?? (empty ? [] : sampleItems)" />
</template>
