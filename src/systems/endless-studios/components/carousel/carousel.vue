<!--
  The Endless Studios carousel: Nuxt UI's UCarousel with the frontend's app.config carousel settings. Screens write
  <UCarousel> directly, with these props and the default slot, which receives `{ item, index }`; this file gives
  the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The slides' data; the default slot renders each one. */
    items?: unknown[];
    /** Previous and next buttons. The app hides them below the `md` breakpoint. */
    arrows?: boolean;
    /** A dot per slide, to jump to it. */
    dots?: boolean;
    orientation?: 'horizontal' | 'vertical';
    /** Starts again from the first slide after the last. */
    loop?: boolean;
    /** Moves on by itself; `{ delay: 4000 }` sets the pause in milliseconds. */
    autoplay?: boolean | { delay?: number };
    /** Cross-fades between slides instead of sliding. */
    fade?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, viewport, container, item, controls, arrows, prev, next, dots, dot. */
    ui?: Record<string, string>;
    /** The Lab's switch for the empty state: with no `items`, shows a carousel without slides instead of the sample ones. */
    empty?: boolean;
  }>(),
  { orientation: 'horizontal', empty: false },
);

const sampleItems = [
  { id: 1, title: 'Lantern Keeper', author: 'ana.learner', color: 'bg-orange-100' },
  { id: 2, title: 'Moss Runner', author: 'marco.mentor', color: 'bg-cornflower-100' },
  { id: 3, title: 'Tide Pool', author: 'ana.learner', color: 'bg-sky-100' },
  { id: 4, title: 'Robo Garden', author: 'marco.mentor', color: 'bg-lime-100' },
];

const forwarded = computed(() => {
  const { empty: _empty, items: _items, ...rest } = props;
  return rest;
});
</script>

<template>
  <UCarousel v-slot="{ item, index }" v-bind="forwarded" :items="items ?? (empty ? [] : sampleItems)" class="w-96 max-w-full">
    <slot :item="item" :index="index">
      <div class="flex h-40 flex-col justify-end rounded-2xl p-4" :class="(item as (typeof sampleItems)[number]).color">
        <p class="text-sm font-semibold text-highlighted">{{ (item as (typeof sampleItems)[number]).title }}</p>
        <p class="text-xs text-muted">by {{ (item as (typeof sampleItems)[number]).author }}</p>
      </div>
    </slot>
  </UCarousel>
</template>
