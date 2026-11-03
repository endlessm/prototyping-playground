<!--
  The Endless Studios table: Nuxt UI's UTable as the frontend uses it. Screens write <UTable> directly, with these
  props and #<column>-cell slots; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = defineProps<{
  /** The rows, one object each. */
  data?: Record<string, unknown>[];
  /**
   * The columns, TanStack Table column definitions: `{ accessorKey: 'name', header: 'Cohort' }`, or an `id` with a
   * `#<id>-cell` slot for a custom cell such as a button or a bar.
   */
  columns?: Record<string, unknown>[];
  /** What it says when there are no rows, such as "No cohorts yet". */
  empty?: string;
  /** Shows a loading bar under the header and keeps the rows. */
  loading?: boolean;
  /** Keeps the header row in view while the table scrolls. */
  sticky?: boolean;
  /** Classes for each part, as Nuxt UI's `ui` prop: root, base, thead, tbody, tr, th, td, empty, loading. */
  ui?: Record<string, string>;
}>();
</script>

<template>
  <UTable v-bind="props" />
</template>
