<!-- @studio-id xsvstvhz06mk33cj -->
<!-- @studio-state c8tzxfj4efphc3qn Crew -->
<!-- @studio-state dx5eebhd12g5yrcf Preview -->
<!-- @studio-state q3y4mej3ccqh0mtn Path -->
<!-- @studio-state pet3fantrkkkbqry Crew Orbit -->
<!-- @studio-state k9dq84236qvzayw4 Crew Huddle -->
<script setup lang="ts">
import OrgPage from '../../_ui/OrgPage.vue'

// Three explorations of the Teams tab while the Organization has no Team, each drawn inside the tab's own card around
// the same Create a Team button. With no state picked, the view shows the empty state as it is today, to compare.
defineProps<{ art?: 'crew' | 'huddle' | 'orbit' | 'preview' | 'path' }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Crew', props: { art: 'crew' } },
  { title: 'Crew Huddle', props: { art: 'huddle' } },
  { title: 'Crew Orbit', props: { art: 'orbit' } },
  { title: 'Preview', props: { art: 'preview' } },
  { title: 'Path', props: { art: 'path' } },
]
</script>

<template>
  <OrgPage viewer="orgManager" :step="3" :teams-empty="art" />
</template>
