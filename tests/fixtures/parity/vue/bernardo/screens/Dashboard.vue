<!-- @studio-id vdashbard0000001 -->
<!-- @studio-state sspan00000000001 Spanish learner -->
<!-- @studio-state ssgnd00000000001 Signed out -->
<!-- @studio-state snevents00000001 No events -->
<script setup lang="ts">
import UpcomingEvents from '~/components/Dashboard/UpcomingEvents.vue'
import UserProfileCard from '~/components/Profile/UserProfileCard.vue'

const { $auth } = useNuxtApp()
</script>

<script lang="ts">
// The React studio renders this screen with the same options as props of
// VueScreen (tests/fixtures/parity/react/bernardo/screens/Dashboard.tsx).
export const system = {
  user: 'admin',
  sample: {
    queries: {
      UpcomingEventInstances: {
        upcomingEventInstances: [
          {
            id: 1,
            title: 'Game jam kickoff',
            start: '2026-11-04T15:00:00Z',
            event: { id: 9 },
          },
        ],
      },
    },
  },
}

export const states = [
  { title: 'Spanish learner', system: { locale: 'es', user: 'learner' } },
  { title: 'Signed out', system: { user: null } },
  { title: 'No events', system: { sample: {} } },
]
</script>

<template>
  <main class="flex flex-col gap-6 p-6">
    <h1 class="font-heading text-2xl">{{ $t('welcome_back') }}</h1>
    <UserProfileCard
      v-if="$auth.loggedIn"
      :user="$auth.user"
      :can-edit="true"
    />
    <UButton v-else class="self-start" @click="$auth.requireLogin()">
      {{ $t('login') }}
    </UButton>
    <UpcomingEvents />
  </main>
</template>
