<script setup lang="ts">
// A test screen for the app's other helpers: dates, shared state, profile pictures, the unread count, backend
// errors, the infinite list and the app constants copied components import.
import InfiniteScroll from '~/components/Generic/InfiniteScroll.vue'
import { useBackendError } from '~/composables/useBackendError'
import { SET_NOTIFICATION_SEEN } from '~/graphql_schemas/notifications'
import { DASHBOARD_PATH } from '~/utils/dashboardRoute'

const { $dayjs } = useNuxtApp()
const first = useState('visits', () => 1)
first.value++
const second = useState('visits', () => 99)
const { data: unread } = await useNotificationsCount()
const { showBackendErrorToast } = useBackendError()
showBackendErrorToast('Server down')
const games = [{ id: 1, title: 'Pong' }]
const twoDaysAgo = Date.now() - 2 * 86_400_000
</script>

<template>
  <p>Date: {{ $dayjs('2026-11-04T12:00:00Z').format('MMMM D, YYYY') }}</p>
  <p>Ago: {{ $dayjs(twoDaysAgo).fromNow() }}</p>
  <p>Visits: {{ second }}</p>
  <p>
    Picture: {{ resolveProfilePic(null) ? 'default' : 'none' }}
    {{ resolveProfilePic('me.png') }}
  </p>
  <p>Unread: {{ unread }}</p>
  <p>Dashboard: {{ DASHBOARD_PATH }}</p>
  <p>Seen: {{ SET_NOTIFICATION_SEEN.includes('setUserNotificationSeen') }}</p>
  <InfiniteScroll :items="games" :fetch-next="() => false">
    <template #item="{ item }">
      <span>Game {{ item.item.title }}</span>
    </template>
  </InfiniteScroll>
  <InfiniteScroll :items="[]" :fetch-next="() => false">
    <template #empty>
      <span>No games</span>
    </template>
  </InfiniteScroll>
</template>
