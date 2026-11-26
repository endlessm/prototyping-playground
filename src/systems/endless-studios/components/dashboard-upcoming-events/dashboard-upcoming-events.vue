<!--
  The dashboard's Upcoming events card: the app's own components/Dashboard/UpcomingEvents.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Dashboard/UpcomingEvents.vue` and answer its
  `UpcomingEventInstances` query with `system.sample.queries`. This file gives the component page and the Lab its
  examples and lets each one choose between the filled and the empty card.
-->
<script setup lang="ts">
import { provide } from 'vue';
import UpcomingEvents from '~/components/Dashboard/UpcomingEvents.vue';
import { createGraphQL } from '../../runtime/graphql';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /** How many events the card asks for. */
    limit?: number;
    /** Shows the card with no upcoming events, as a visitor sees it when nothing is scheduled. */
    empty?: boolean;
  }>(),
  { limit: 3, empty: false },
);

const events = [
  { id: '9701-2026-11-13', title: 'Studio Live', start: '2026-11-13T00:00:00.000Z', event: { id: 9701 } },
  { id: '9702-2026-11-18', title: 'Game jam kickoff', start: '2026-11-18T15:00:00.000Z', event: { id: 9702 } },
  { id: '9703-2026-11-25', title: 'Pixel art workshop', start: '2026-11-25T17:00:00.000Z', event: { id: 9703 } },
  { id: '9704-2026-12-02', title: 'Mentor office hours', start: '2026-12-02T16:00:00.000Z', event: { id: 9704 } },
];

// The card's own sample response, so a screen's samples never reach it. The query runs once per mount, so the card
// below remounts when `empty` changes.
const app = useNuxtApp();
const graphql = createGraphQL({
  UpcomingEventInstances: (variables) => {
    const limit = (variables.options as { limit?: number } | undefined)?.limit ?? events.length;
    return { upcomingEventInstances: props.empty ? [] : events.slice(0, limit) };
  },
});
provide(NUXT_APP_KEY, { ...app, graphql, $graphqlRequest: graphql.request });
</script>

<template>
  <UpcomingEvents :key="String(empty)" :limit="limit" />
</template>
