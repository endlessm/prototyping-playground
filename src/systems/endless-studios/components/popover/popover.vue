<!--
  The Endless Studios popover: Nuxt UI's UPopover as the frontend uses it. Screens write <UPopover> directly around
  the element that opens it, with its panel in the #content slot; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Whether it shows, bound with `v-model:open`. */
    open?: boolean;
    /** `click` opens it on press; `hover` on pointer and focus, as the XP breakdown does. */
    mode?: 'click' | 'hover';
    /** Where it opens, such as `{ side: 'right', align: 'end', sideOffset: 8 }` for the sidebar's notifications. */
    content?: {
      side?: 'top' | 'right' | 'bottom' | 'left';
      align?: 'start' | 'center' | 'end';
      sideOffset?: number;
      collisionPadding?: number;
    };
    /** Draws a small arrow toward the element. */
    arrow?: boolean;
    /** Closes on Escape and on a click outside. */
    dismissible?: boolean;
    /** Milliseconds before it opens in `hover` mode. */
    openDelay?: number;
    /** Milliseconds before it closes in `hover` mode. */
    closeDelay?: number;
    /** Classes for each part, as Nuxt UI's `ui` prop: content, arrow. */
    ui?: Record<string, string>;
  }>(),
  { mode: 'click', dismissible: true, openDelay: 0, closeDelay: 0 },
);
</script>

<template>
  <UPopover v-bind="props">
    <slot />
    <template #content><slot name="content" /></template>
  </UPopover>
</template>
