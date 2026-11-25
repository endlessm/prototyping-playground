<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdminPageHeader from '~/components/Leader/Generic/AdminPageHeader.vue'
import { GET_COHORT_BY_ID } from '~/graphql_schemas/cohorts'
import {
  COHORT_STATUS_COLORS,
  COHORT_STATUS_LABEL_KEYS,
  type AdminCohort,
} from '~/types/cohort'
import { CohortRole } from '~/types/user'
import { userAdminsProgram } from '~/utils/program'

const props = withDefaults(
  defineProps<{
    /** Page heading. The hub leaves this out and shows the cohort name. */
    title?: string
  }>(),
  { title: '' },
)

const route = useRoute()
const { t } = useI18n()
const dayjs = useDayjs()

const programId = Number(route.params.programId)
const cohortId = Number(route.params.cohortId)

const { data: loadedCohort, refresh: refreshCohort } =
  await useGraphQLQuery<AdminCohort>(GET_COHORT_BY_ID, {
    variables: () => ({ input: { cohort_id: cohortId } }),
  })

const { $auth } = useNuxtApp()
const adminsProgram = userAdminsProgram($auth.user, loadedCohort.value?.program)

// A malformed link can pair one program's route with another program's
// cohort. The pair has to agree before the header, the actions and the
// child links tell one story about it. A facilitator is also held to the
// cohorts they run; one they only learn in answers to somebody else, so
// its address is turned away the same way.
const cohort = computed(() => {
  if (!loadedCohort.value || !loadedCohort.value.program) return null
  if (loadedCohort.value.program.id !== programId) return null
  if (
    !adminsProgram.value &&
    loadedCohort.value.role_id !== CohortRole.COHORT_ADMIN
  )
    return null
  return loadedCohort.value
})

const statusLabels = computed<Record<string, string>>(() =>
  Object.fromEntries(
    Object.entries(COHORT_STATUS_LABEL_KEYS).map(([status, key]) => [
      status,
      t(key),
    ]),
  ),
)

const statusColors = COHORT_STATUS_COLORS

function formatDate(value: string | null) {
  return value ? dayjs(value).format('D MMM YYYY') : ''
}

// Cohort settings are edited by system admins and the program's admins, the
// same rule the backend enforces. Facilitators only run the cohort.
const canEditCohort = adminsProgram

const heading = computed(() => props.title || cohort.value?.name || '')

// The trail always carries the program's own chain down to Cohorts. A page
// under the cohort continues it with the cohort itself, since that page's
// heading is its own title rather than the cohort's name. AdminPageHeader
// appends the active page (heading) itself, so this only lists ancestors.
const breadcrumbItems = computed(() => {
  const items = [
    { label: t('programs'), to: '/leader/programs/' },
    {
      label: cohort.value?.program.name ?? '',
      to: `/leader/programs/${programId}/`,
    },
    { label: t('cohort.plural'), to: `/leader/programs/${programId}/cohorts/` },
  ]
  if (props.title) {
    items.push({
      label: cohort.value?.name ?? '',
      to: `/leader/programs/${programId}/cohorts/${cohortId}/`,
    })
  }
  return items
})
</script>

<template>
  <div v-if="cohort" class="project-page">
    <AdminPageHeader :title="heading" :breadcrumb-items="breadcrumbItems">
      <template #title-suffix>
        <UBadge
          :color="statusColors[cohort.cohort_status] || 'neutral'"
          variant="soft"
        >
          {{ statusLabels[cohort.cohort_status] || cohort.cohort_status }}
        </UBadge>
      </template>

      <template #subtitle>
        {{ cohort.program.name }}
        <template v-if="cohort.start_date || cohort.end_date">
          · {{ formatDate(cohort.start_date) }} –
          {{ formatDate(cohort.end_date) }}
        </template>
      </template>

      <template #actions>
        <slot
          name="actions"
          :cohort="cohort"
          :can-edit-cohort="canEditCohort"
        />
      </template>
    </AdminPageHeader>

    <div class="mt-9">
      <slot
        :cohort="cohort"
        :can-edit-cohort="canEditCohort"
        :refresh-cohort="refreshCohort"
      />
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

/*
 * Matches the program page's frame, so moving from its Cohorts tab into a
 * cohort keeps the content in the same place. Style blocks are scoped, so
 * the class is defined per component.
 */
.project-page {
  @apply pb-10;
  @media screen and (min-width: 1441px) {
    max-width: 1336px;
    width: 100%;
    padding-right: 64px;
    margin: 0 auto;
  }
}
</style>
