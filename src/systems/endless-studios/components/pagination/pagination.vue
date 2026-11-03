<!--
  The Endless Studios pagination: Nuxt UI's UPagination as the frontend uses it. Screens write <UPagination>
  directly, with these props and v-model:page; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The current page, from 1, bound with `v-model:page`. */
    page?: number;
    /** How many items there are in all. */
    total?: number;
    /** How many items one page shows. */
    itemsPerPage?: number;
    /** How many page numbers show on each side of the current one before an ellipsis. */
    siblingCount?: number;
    /** Always shows the first and last page numbers. */
    showEdges?: boolean;
    /** Shows the first, previous, next and last buttons. */
    showControls?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** The other pages' buttons. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link';
    /** The current page's button. */
    activeColor?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    activeVariant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link';
    disabled?: boolean;
  }>(),
  {
    page: 1,
    total: 0,
    itemsPerPage: 10,
    siblingCount: 2,
    showControls: true,
    size: 'md',
    color: 'neutral',
    variant: 'outline',
    activeColor: 'primary',
    activeVariant: 'solid',
  },
);
</script>

<template>
  <UPagination v-bind="props" />
</template>
