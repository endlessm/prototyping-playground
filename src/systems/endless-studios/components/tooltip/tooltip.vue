<!--
  The Endless Studios tooltip: Nuxt UI's UTooltip as the frontend uses it. Screens write <UTooltip> directly around
  the element it describes, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = defineProps<{
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
  }>();
</script>

<template>
  <UTooltip v-bind="props"><slot /></UTooltip>
</template>
