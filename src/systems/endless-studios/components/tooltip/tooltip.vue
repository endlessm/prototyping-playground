<!--
  The Endless Studios tooltip: Nuxt UI's UTooltip as the frontend uses it. Screens write <UTooltip> directly around
  the element it describes, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Whether it shows, bound with `v-model:open`. Left out, it opens on hover and focus. */
    open?: boolean;
    /** The tooltip's text. */
    text?: string;
    /** Keyboard shortcut keys shown after the text, such as `['meta', 'k']`, from the `lg` breakpoint up. */
    kbds?: string[];
    /** Where it opens: `{ side: 'top' }`, the platform's usual choice, or `bottom`, `left`, `right`, with `align`. */
    content?: { side?: 'top' | 'right' | 'bottom' | 'left'; align?: 'start' | 'center' | 'end'; sideOffset?: number };
    /** Draws a small arrow toward the element. */
    arrow?: boolean;
    /** Milliseconds before it opens on hover. The restricted-feature tooltips use 0. */
    delayDuration?: number;
    /** Turns it off, for a tooltip that only applies in one state. */
    disabled?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: content, arrow, text, kbds. */
    ui?: Record<string, string>;
  }>(),
  // Undefined rather than Vue's false for a missing boolean, so the tooltip stays uncontrolled.
  { open: undefined },
);
</script>

<template>
  <UTooltip v-bind="props">
    <slot>
      <UButton color="neutral" variant="ghost" icon="i-lucide-trash-2" aria-label="Delete this comment" />
    </slot>
  </UTooltip>
</template>
