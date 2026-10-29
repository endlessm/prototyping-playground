<script setup lang="ts">
// A test screen that reads seeded store state and calls an action the stand-in does not know.
import { useStore } from 'vuex'

const store = useStore()
store.dispatch('triggerSystemNotifications')
store.commit('OPEN_MODAL', { modalId: 'x' })
const { data } = await useGraphQLQuery('query Unmocked { nothing { id } }', {
  auth: 'optional',
})
</script>

<template>
  <p>Notifications: {{ $store.state.systemNotificationCount }}</p>
  <p>
    Onboarding done: {{ store.state.user.completedOnboarding ? 'yes' : 'no' }}
  </p>
  <p>Unmocked: {{ data.length }}</p>
  <p>{{ $t('no_such.key') }}</p>
</template>
