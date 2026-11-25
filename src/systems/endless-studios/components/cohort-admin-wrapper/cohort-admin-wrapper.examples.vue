<!--
  The frame of a cohort's leader pages, as the hub and the Codes page use it. In a view, the cohort comes from
  `system.sample.queries.GetCohortById` and the visitor from `system.user`; `status` and `viewer` here only let one
  page show several demo cohorts and visitors.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import CohortAdminWrapper from './cohort-admin-wrapper.vue';

const codeColumns = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'uses', header: 'Uses' },
  { accessorKey: 'expires', header: 'Expires' },
];
const codes = [
  { code: 'MAPLE-SPRING-7Q4', uses: '4 of 30', expires: '29 Jan 2027' },
  { code: 'MAPLE-LATE-2K9', uses: '0 of 5', expires: '14 Dec 2026' },
];
</script>

<template>
  <Example name="Default">
    <CohortAdminWrapper status="in_progress" viewer="admin" title="">
      <template #actions="{ canEditCohort }">
        <UButton v-if="canEditCohort" :label="$t('cohort.edit')" />
      </template>
      <template #default="{ cohort }">
        <div class="grid grid-cols-2 gap-6">
          <UCard>
            <p class="font-heading font-semibold">{{ $t('users') }}</p>
            <p class="text-muted">
              {{ $t('learners_count', cohort.member_count) }} · {{ $t('facilitators_count', cohort.cohort_admins.length) }}
            </p>
          </UCard>
          <UCard>
            <p class="font-heading font-semibold">{{ $t('codes') }}</p>
            <p class="text-muted">{{ $t('cohort_codes_description') }}</p>
          </UCard>
        </div>
      </template>
    </CohortAdminWrapper>
  </Example>

  <Example name="CodesPage">
    <CohortAdminWrapper :title="$t('codes')">
      <div class="p-6 bg-default border border-default rounded-3xl">
        <div class="flex justify-end mb-4">
          <UButton :label="$t('create_enrollment_code')" />
        </div>
        <UTable :data="codes" :columns="codeColumns" :empty="$t('no_codes_yet')" />
      </div>
    </CohortAdminWrapper>
  </Example>

  <Example name="Facilitator">
    <CohortAdminWrapper viewer="facilitator">
      <template #actions="{ canEditCohort }">
        <UButton v-if="canEditCohort" :label="$t('cohort.edit')" />
      </template>
      <p class="text-muted">{{ $t('cohort_codes_description') }}</p>
    </CohortAdminWrapper>
  </Example>

  <Example name="Upcoming">
    <CohortAdminWrapper status="not_started" />
  </Example>

  <Example name="Completed">
    <CohortAdminWrapper status="completed" />
  </Example>
</template>
