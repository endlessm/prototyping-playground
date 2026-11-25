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
  /**
   * The Lab's switch for the empty table: with no `data`, shows no rows, so the `empty` text shows, instead of the
   * sample cohorts.
   */
  noRows?: boolean;
}>();

const sampleData = [
  { cohortId: 1, name: 'Spring 2027 · Lincoln', mentor: 'Marco Lima', pre: 48, post: 81, band: 'Proficient' },
  { cohortId: 2, name: 'Spring 2027 · Riverside', mentor: 'Marco Lima', pre: 52, post: 74, band: 'Developing' },
  { cohortId: 3, name: 'Fall 2026 · Code Club', mentor: 'Ana Souza', pre: 61, post: 88, band: 'Advanced' },
];

type Cell = { row: { original: (typeof sampleData)[number] } };
const sampleColumns = [
  { accessorKey: 'name', header: 'Cohort' },
  { accessorKey: 'mentor', header: 'Mentor' },
  { accessorKey: 'pre', header: 'Pre-quiz', cell: ({ row }: Cell) => `${row.original.pre}%` },
  { accessorKey: 'post', header: 'Post-quiz', cell: ({ row }: Cell) => `${row.original.post}%` },
  { accessorKey: 'band', header: 'Performance' },
];

const forwarded = computed(() => {
  const { noRows: _noRows, data: _data, columns: _columns, ...rest } = props;
  return rest;
});
</script>

<template>
  <UTable v-bind="forwarded" :data="data ?? (noRows ? [] : sampleData)" :columns="columns ?? sampleColumns" />
</template>
