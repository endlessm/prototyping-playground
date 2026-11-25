<!-- @studio-id p337ma56hqfffb9z -->
<!-- @studio-state wg8nq62e43q8rha5 Form -->
<!-- @studio-state gkq8mwzd23vzywh6 Created, no one invited -->
<!-- @studio-state jztx54p4myxeshc6 With Teams -->
<script setup lang="ts">
import OrgPage from '../../_ui/OrgPage.vue'
import TeamsTab from './_teams/TeamsTab.vue'

// Proposed. Teams & Cohorts takes over the Structure tab: once the Organization has Teams it shows them the Focus way
// (the Teams down the left, the picked one in full on the right), so Structure is gone. With no Teams, Create a Team
// turns the empty state itself into the form, and creating the Team turns the form into the Focus drawing with the new
// Team picked; positions nobody was invited to show their own empty state. With Teams, Create a Team turns only the
// right side into the form. Grace, the Org Owner, after her first task.
defineProps<{ start?: 'empty' | 'form' | 'populated' | 'created' }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Form', props: { start: 'form' } },
  { title: 'Created, no one invited', props: { start: 'created' } },
  { title: 'With Teams', props: { start: 'populated' } },
]
</script>

<template>
  <OrgPage viewer="orgOwner" :step="5" no-structure members>
    <template #teams="{ tab }">
      <TeamsTab :tab="tab" :start="start" />
    </template>
  </OrgPage>
</template>
