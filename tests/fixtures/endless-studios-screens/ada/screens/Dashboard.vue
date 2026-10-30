<!-- @studio-id dsbd00000000e001 -->
<!-- @studio-state st5p00000000e001 Spanish learner -->
<!-- @studio-state st5g00000000e001 Signed out -->
<!-- @studio-state st5e00000000e001 No events -->
<script setup lang="ts">
import UpcomingEvents from '~/components/Dashboard/UpcomingEvents.vue'

defineProps<{ note?: string }>()
const { $auth } = useNuxtApp()
const store = useStore()
store.dispatch('loadDashboard')
// Kept by the screen's app, so it survives a hot update but not a rebuild.
const count = useState('count', () => 0)
</script>

<script lang="ts">
const events = {
  upcomingEventInstances: [
    {
      id: 1,
      title: 'Game jam kickoff',
      start: '2026-11-04T15:00:00Z',
      event: { id: 9 },
    },
  ],
}

export const system = {
  user: 'admin',
  sample: {
    state: { systemNotificationCount: 5 },
    queries: { UpcomingEventInstances: events },
  },
}

export const states = [
  {
    title: 'Spanish learner',
    props: { note: 'From a state' },
    system: { locale: 'es', user: 'learner' },
  },
  { title: 'Signed out', system: { user: null } },
  { title: 'No events', system: { sample: {} } },
]
</script>

<template>
  <main class="m-6 flex flex-col gap-4">
    <h1>{{ $t('welcome_back') }}</h1>
    <p>User: {{ $auth.user?.first_name ?? 'nobody' }}</p>
    <p>Unread: {{ store.state.systemNotificationCount }}</p>
    <p>Note: {{ note ?? 'none' }}</p>
    <p>Missing: {{ $t('no_such.key') }} {{ $t('no_such.key') }}</p>
    <UButton @click="count++">Count {{ count }}</UButton>
    <UpcomingEvents />
  </main>
</template>
