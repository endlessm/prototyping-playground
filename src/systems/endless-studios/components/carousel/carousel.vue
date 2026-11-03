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
  }>(),
  { orientation: 'horizontal' },
);
</script>

<template>
  <UCarousel v-slot="{ item, index }" v-bind="props">
    <slot :item="item" :index="index" />
  </UCarousel>
</template>
