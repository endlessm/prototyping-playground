<!--
  The Endless Studios table's examples, written as screens write it: <UTable :data="…" :columns="…"> with
  #<column>-cell slots, in a bordered card as the leader dashboards show it. Each <Example name="…"> is one example
  on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const cohorts = [
  { cohortId: 1, name: 'Spring 2027 · Lincoln', pre: 48, post: 81, band: 'Proficient' },
  { cohortId: 2, name: 'Spring 2027 · Riverside', pre: 52, post: 74, band: 'Developing' },
  { cohortId: 3, name: 'Fall 2026 · Code Club', pre: 61, post: 88, band: 'Advanced' },
];
const bandColor = { Advanced: 'success', Proficient: 'info', Developing: 'warning' } as const;

const columns = [
  { accessorKey: 'name', header: 'Cohort' },
  { accessorKey: 'pre', header: 'Pre-quiz', cell: ({ row }: { row: { original: (typeof cohorts)[number] } }) => `${row.original.pre}%` },
  { id: 'score', header: 'Post-quiz' },
  { id: 'performance', header: 'Performance' },
  { id: 'view', header: 'Action' },
];

const page = ref(1);
</script>

<template>
  <Example name="Default">
    <UCard variant="bordered" class="w-full">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-highlighted">Cohort quiz breakdown</h2>
        <p class="mt-1 text-sm text-muted">Average scores for each cohort in this program.</p>
      </div>
      <UTable :data="cohorts" :columns="columns" empty="No cohorts yet">
        <template #score-cell="{ row }">
          <div class="flex items-center gap-3">
            <UProgress :model-value="row.original.post" color="secondary" size="sm" class="w-24" aria-hidden="true" />
            <span>{{ row.original.post }}%</span>
          </div>
        </template>
        <template #performance-cell="{ row }">
          <UBadge :color="bandColor[row.original.band as keyof typeof bandColor]" variant="soft">{{ row.original.band }}</UBadge>
        </template>
        <template #view-cell="{ row }">
          <UButton icon="i-lucide-arrow-right" color="neutral" variant="outline" :aria-label="`View ${row.original.name}`" />
        </template>
      </UTable>
      <div class="mt-5 flex justify-end">
        <UPagination v-model:page="page" :items-per-page="3" :total="12" />
      </div>
    </UCard>
  </Example>

  <Example name="Empty">
    <UCard variant="bordered" class="w-full">
      <UTable :data="[]" :columns="columns" empty="No cohorts yet" />
    </UCard>
  </Example>

  <Example name="Loading">
    <UCard variant="bordered" class="w-full">
      <UTable :data="cohorts" :columns="[{ accessorKey: 'name', header: 'Cohort' }, { accessorKey: 'band', header: 'Performance' }]" loading />
    </UCard>
  </Example>
</template>
