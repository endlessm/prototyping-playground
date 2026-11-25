<!--
  The mobile top bar: the app's own components/App/StudioTopBar.vue, copied unchanged.
  Screens don't use this file: they show the top bar with `system: { shell: true }`, or import
  `~/components/App/StudioTopBar.vue`. This file answers its unread count, so the component page and the Lab's
  Playground show the bell's dot.
-->
<script setup lang="ts">
import { provide } from 'vue';
import StudioTopBar from '~/components/App/StudioTopBar.vue';
import { createGraphQL } from '../../runtime/graphql';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /** How many notifications are unread, the `NOTIFICATIONS_COUNT` query's answer. Zero hides the bell's dot. */
    notificationsCount?: number;
  }>(),
  { notificationsCount: 3 },
);

// The screen's own samples stay, with this count on top. The count is read once per mount, so the bar below
// remounts when it changes.
const app = useNuxtApp();
const graphql = createGraphQL({
  ...app.graphql.samples,
  NOTIFICATIONS_COUNT: () => ({ getUnreadNotificationsCount: { unread_notifications_count: props.notificationsCount } }),
});
provide(NUXT_APP_KEY, { ...app, graphql, $graphqlRequest: graphql.request });
</script>

<template>
  <StudioTopBar :key="notificationsCount" />
</template>
