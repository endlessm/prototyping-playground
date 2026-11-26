<!-- @studio-id qd3zr2gxysnz676h -->
<!-- @lab-version 8x5spen6xtvp96a9 dashboard-upcoming-events 4a5087452 -->
<script setup lang="ts">
import { gql } from 'graphql-request'
import { QueryAuth } from '~/composables/useGraphQLQuery'

const { locale } = useI18n()

const props = withDefaults(
  defineProps<{
    limit?: number
  }>(),
  {
    limit: 3,
  },
)

const { data: events } = await useGraphQLQuery(
  gql`
    query UpcomingEventInstances($options: UpcomingEventInstancesOptions) {
      upcomingEventInstances(options: $options) {
        id
        title
        start
        event {
          id
        }
      }
    }
  `,
  {
    auth: QueryAuth.Optional,
    variables: () => ({ options: { limit: props.limit } }),
  },
)

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <UCard :title="$t('events.upcoming_events')" variant="outline" class="w-full">
    <UPageList v-if="events.length">
      <UPageCard
        v-for="event in events"
        :key="event.id"
        :title="event.title"
        :description="formatDate(event.start)"
        :to="`/live-event/${event.event.id}/`"
        variant="ghost"
        :ui="{ container: 'p-2 sm:p-2' }"
      />
    </UPageList>
    <p v-else class="text-dimmed">
      {{ $t('events.no_upcoming_events') }}
    </p>
  </UCard>
</template>
