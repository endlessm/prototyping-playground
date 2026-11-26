<!--
  The Endless Studios tabs: Nuxt UI's UTabs as the frontend uses it. Screens write <UTabs> directly, with these
  props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The tabs, each with `label`, `value`, `icon` and `content` (or a slot named by `slot`). */
    items?: Record<string, unknown>[];
    /** The chosen tab's `value`, bound with `v-model`. */
    modelValue?: string | number;
    /** `pill` is a segmented control; `link` is an underlined row. */
    variant?: 'pill' | 'link';
    /** A semantic role from the theme. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    orientation?: 'horizontal' | 'vertical';
    /** Renders each tab's panel under the list. `false` keeps only the list, as a switcher for content elsewhere. */
    content?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, list, indicator, trigger, content… */
    ui?: Record<string, string>;
    /** The Lab's switch for the empty state: with no `items`, shows tabs without any tab instead of the sample ones. */
    empty?: boolean;
  }>(),
  { variant: 'pill', color: 'primary', size: 'md', orientation: 'horizontal', content: true, empty: false },
);

const sampleItems = [
  { label: 'About', icon: 'i-lucide-info', content: 'Learners build a small platformer over eight weeks, one mechanic at a time.' },
  { label: 'Schedule', icon: 'i-lucide-calendar', content: 'Weekly sessions on Tuesdays, 4–5:30 pm, starting March 3.' },
  { label: 'Mentors', icon: 'i-lucide-users', content: 'Marco Lima and Ana Souza mentor this cohort.' },
];

const forwarded = computed(() => {
  const { empty: _empty, items: _items, ...rest } = props;
  return rest;
});
</script>

<template>
  <UTabs v-bind="forwarded" :items="items ?? (empty ? [] : sampleItems)" />
</template>
