<!-- @studio-id tge3v77ye885gcmn -->
<!-- @studio-state 4gca34tn7q3c1yem Org Owner -->
<!-- @studio-state 3w8jyat29gayd4x7 Org Manager -->
<!-- @studio-state 2qpx3227pqp1ya8g Org Reviewer -->
<!-- @studio-state 0mpkcxk5zggp1e0p Team Owner -->
<!-- @studio-state xfvf0f3m43536s2a Team Manager -->
<!-- @studio-state 10q68geahayhpt8m Cohort Owner -->
<!-- @studio-state es9dfqf7hmedqrj3 Facilitator -->
<script setup lang="ts">
import type { RoleKey } from '../../../_wire/world'
import CohortPage from '../../_ui/CohortPage.vue'
import EmptyStateHuddle from '../../_ui/EmptyStateHuddle.vue'
import { emptyStates } from '../../_ui/emptyStates'
import OrgPage from '../../_ui/OrgPage.vue'
import TeamPage from '../../_ui/TeamPage.vue'

// The huddle empty state as one kit component, EmptyStateHuddle. With no state picked, the view shows the component
// on its own in the shapes it takes: two actions, one, none, and a narrow column. Each state is one role's page while
// its place is still empty, with that role's own line and buttons.
defineProps<{ viewer?: RoleKey }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Org Owner', props: { viewer: 'orgOwner' } },
  { title: 'Org Manager', props: { viewer: 'orgManager' } },
  { title: 'Org Reviewer', props: { viewer: 'orgReviewer' } },
  { title: 'Team Owner', props: { viewer: 'teamOwner' } },
  { title: 'Team Manager', props: { viewer: 'teamManager' } },
  { title: 'Cohort Owner', props: { viewer: 'cohortOwner' } },
  { title: 'Facilitator', props: { viewer: 'facilitator' } },
]
</script>

<template>
  <OrgPage
    v-if="viewer === 'orgOwner' || viewer === 'orgManager' || viewer === 'orgReviewer'"
    :viewer="viewer"
    :step="3"
    teams-empty="huddle"
  />
  <TeamPage v-else-if="viewer === 'teamOwner' || viewer === 'teamManager'" :viewer="viewer" :step="3" cohorts-empty="huddle" />
  <CohortPage v-else-if="viewer" :viewer="viewer" :step="3" learners-empty="huddle" />

  <div v-else class="mx-auto flex max-w-4xl flex-col gap-10 p-8">
    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold text-muted">Two actions</h2>
      <UCard variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
        <EmptyStateHuddle :title="emptyStates.orgManager.title" :crew="emptyStates.orgManager.crew">
          <template #lead>{{ emptyStates.orgManager.lead }}</template>
          <UButton icon="i-lucide-plus">Create a Team</UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-user-plus">Add Org Reviewers</UButton>
        </EmptyStateHuddle>
      </UCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold text-muted">One action</h2>
      <UCard variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
        <EmptyStateHuddle
          :title="emptyStates.teamManager.title"
          :crew="emptyStates.teamManager.crew"
          :hub="emptyStates.teamManager.hub"
        >
          <template #lead>{{ emptyStates.teamManager.lead }}</template>
          <UButton icon="i-lucide-plus">Create a Cohort</UButton>
        </EmptyStateHuddle>
      </UCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold text-muted">No action</h2>
      <UCard variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
        <EmptyStateHuddle :title="emptyStates.orgReviewer.title" :crew="emptyStates.orgReviewer.crew">
          <template #lead>{{ emptyStates.orgReviewer.lead }}</template>
        </EmptyStateHuddle>
      </UCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold text-muted">Narrow column</h2>
      <div class="grid grid-cols-2 gap-4">
        <UCard variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
          <EmptyStateHuddle
            :title="emptyStates.cohortOwner.title"
            :crew="emptyStates.cohortOwner.crew"
            :hub="emptyStates.cohortOwner.hub"
          >
            <template #lead>{{ emptyStates.cohortOwner.lead }}</template>
            <UButton color="neutral" variant="outline" icon="i-lucide-user-plus">Add Learners</UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-user-plus">Invite Facilitators</UButton>
          </EmptyStateHuddle>
        </UCard>
        <UCard variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
          <EmptyStateHuddle
            :title="emptyStates.facilitator.title"
            :crew="emptyStates.facilitator.crew"
            :hub="emptyStates.facilitator.hub"
          >
            <template #lead>{{ emptyStates.facilitator.lead }}</template>
            <UButton icon="i-lucide-user-plus">Add Learners</UButton>
          </EmptyStateHuddle>
        </UCard>
      </div>
    </section>
  </div>
</template>
