<!--
  The app's own CohortAdminWrapper (components/Cohort/Leader/CohortAdminWrapper.vue), copied unchanged: the frame of
  every page under a cohort in the leader area (the hub, Users, Codes, Task progress, Quizzes), with the breadcrumb,
  the cohort's name, status and dates, and room for the page's actions and content. It loads the cohort itself from
  the address (`GetCohortById`) and shows nothing when the visitor can't run it.

  A view passes the cohort with `system.sample.queries.GetCohortById` and a staff `system.user`. This file gives the
  component page its examples: it chooses a demo cohort by status and who is looking, and passes the slots on.
-->
<script setup lang="ts">
import { provide } from 'vue';
import CohortAdminWrapper from '~/components/Cohort/Leader/CohortAdminWrapper.vue';
import type { AdminCohort } from '~/types/cohort';
import { createAuth, type SampleUser } from '../../runtime/auth';
import { createGraphQL } from '../../runtime/graphql';
import { ROUTE_PARAMS_KEY } from '../../runtime/navigation';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /** The page's heading, such as `Codes`. Leave it empty on the cohort's hub, which shows the cohort's name. */
    title?: string;
    /** The cohort's status, shown as a badge: `not_started` reads Upcoming. */
    status?: 'not_started' | 'in_progress' | 'completed';
    /**
     * Who is looking: a platform `admin`, who may edit the cohort, or the cohort's `facilitator` (its Cohort Admin),
     * who only runs it. A view chooses this with `system.user` and the cohort's `role_id`.
     */
    viewer?: 'admin' | 'facilitator';
  }>(),
  { title: '', status: 'in_progress', viewer: 'admin' },
);

defineSlots<{
  /** Buttons at the right of the heading. `canEditCohort` is true for system and program admins. */
  actions?: (props: { cohort: AdminCohort; canEditCohort: boolean }) => unknown;
  /** The page's content, under the heading. */
  default?: (props: { cohort: AdminCohort; canEditCohort: boolean; refreshCohort: () => void }) => unknown;
}>();

// Demo cohorts, one for each status: Game Making 101's Maple Ridge cohort, Sound Design Studio's first session and
// Winter Game Jam's weekend.
const cohorts: Record<typeof props.status, AdminCohort> = {
  in_progress: {
    id: 12, name: 'Maple Ridge — Spring', cohort_status: 'in_progress', institution_id: 4,
    start_date: '2026-09-07T12:00:00Z', end_date: '2027-01-29T12:00:00Z', role_id: null,
    timezone: 'America/Vancouver', member_count: 4, cohort_admins: [{ id: 204 }],
    program: { id: 3, name: 'Game Making 101', role_id: null, institution_id: null, institution_name: null },
  },
  not_started: {
    id: 31, name: 'First Session', cohort_status: 'not_started', institution_id: null,
    start_date: '2026-12-14T12:00:00Z', end_date: '2027-02-26T12:00:00Z', role_id: null,
    timezone: 'America/New_York', member_count: 0, cohort_admins: [{ id: 202 }],
    program: { id: 7, name: 'Sound Design Studio', role_id: null, institution_id: null, institution_name: null },
  },
  completed: {
    id: 25, name: 'Jam Weekend', cohort_status: 'completed', institution_id: null,
    start_date: '2026-02-13T12:00:00Z', end_date: '2026-02-15T12:00:00Z', role_id: null,
    timezone: 'America/New_York', member_count: 4, cohort_admins: [{ id: 202 }],
    program: { id: 5, name: 'Winter Game Jam', role_id: null, institution_id: null, institution_name: null },
  },
};

// Evelyn Cho, Maple Ridge's Institution Admin, who facilitates its cohort; from the demo cast.
const facilitator: SampleUser = {
  id: 204, username: 'evelyn', first_name: 'Evelyn', last_name: 'Cho', email: 'evelyn@example.org',
  verified: true, disabled: false, public: true, age_category: 'adult', is_restricted_partner_account: false,
  roles: [{ id: 20, name: 'Institution admin' }, { id: 22, name: 'Cohort Admin' }],
  institutions: [{ name: 'Maple Ridge Secondary School' }], metadata: { image_url: null },
};

const base = cohorts[props.status];
// A facilitator reaches the cohort through their own cohort role, not the program's.
const cohort = props.viewer === 'facilitator' ? { ...base, role_id: 22 } : base;

// The copied wrapper reads the cohort and program from the address, the cohort from GetCohortById and the visitor
// from `$auth`, so a nearer app and route answer for this example alone.
provide(ROUTE_PARAMS_KEY, { programId: String(cohort.program.id), cohortId: String(cohort.id) });
const graphql = createGraphQL({ GetCohortById: { getCohortById: cohort } });
provide(NUXT_APP_KEY, {
  ...useNuxtApp(),
  $auth: createAuth(props.viewer === 'facilitator' ? facilitator : 'admin'),
  $graphqlRequest: graphql.request,
  graphql,
});
</script>

<template>
  <CohortAdminWrapper :title="title">
    <template #actions="slotProps">
      <slot name="actions" v-bind="slotProps" />
    </template>
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </CohortAdminWrapper>
</template>
