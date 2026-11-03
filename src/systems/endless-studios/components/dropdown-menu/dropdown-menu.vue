<!--
  The Endless Studios dropdown menu: Nuxt UI's UDropdownMenu as the frontend uses it. Screens write <UDropdownMenu>
  directly around the button that opens it, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /**
     * The actions, each with `label`, `icon`, `color`, `to`, `onSelect`, `disabled`, or `type: 'separator'` /
     * `'label'`. An array of arrays makes groups with dividers between them.
     */
    items?: Record<string, unknown>[] | Record<string, unknown>[][];
    /** Where it opens. Row menus use `{ align: 'end' }` so they open toward the page. */
    content?: { side?: 'top' | 'right' | 'bottom' | 'left'; align?: 'start' | 'center' | 'end'; sideOffset?: number };
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Draws a small arrow toward the button. */
    arrow?: boolean;
    disabled?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: content, group, label, separator, item, itemLeadingIcon… */
    ui?: Record<string, string>;
  }>(),
  { size: 'md' },
);
</script>

<template>
  <UDropdownMenu v-bind="props"><slot /></UDropdownMenu>
</template>
