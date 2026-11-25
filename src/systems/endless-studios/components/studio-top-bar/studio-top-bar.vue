<!--
  The Endless Studios top bar: the app's own StudioTopBar (components/App/StudioTopBar.vue), copied unchanged.
  Screens don't use this file: they get the top bar with `system: { shell: true }`, or import
  `~/components/App/StudioTopBar.vue` beside their own layout. This file gives the component page its examples and
  props table, and lets each example choose who is signed in and how many notifications are unread.
-->
<script setup lang="ts">
import { provide } from 'vue';
import StudioTopBar from '~/components/App/StudioTopBar.vue';
import { createAuth, type UserOption } from '../../runtime/auth';
import { createGraphQL } from '../../runtime/graphql';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /**
     * Who is signed in: `learner`, `mentor`, `admin`, a user object, or `null` for signed out. Leave it out to use the
     * screen's own `system.user`. A view chooses this with `system.user`, not with this prop.
     */
    user?: UserOption;
    /**
     * Unread notifications, the app's NOTIFICATIONS_COUNT. Above 0, the bell shows an orange dot. A view answers it
     * with `system.sample.queries.NOTIFICATIONS_COUNT`.
     */
    unreadNotifications?: number;
  }>(),
  { user: undefined, unreadNotifications: 0 },
);

// The copied top bar reads `$auth` and its notification count from useNuxtApp(), so a nearer app with its own sample
// user and count changes only this top bar.
const app = useNuxtApp();
const graphql = createGraphQL({
  ...app.graphql.samples,
  NOTIFICATIONS_COUNT: { getUnreadNotificationsCount: { unread_notifications_count: props.unreadNotifications } },
});
provide(NUXT_APP_KEY, {
  ...app,
  ...(props.user !== undefined && { $auth: createAuth(props.user) }),
  graphql,
  $graphqlRequest: graphql.request,
});
</script>

<template>
  <div class="studio-top-bar-page">
    <StudioTopBar />
  </div>
</template>

<!--
  The app shows the top bar only below 1024px (`lg:hidden`), where the sidebar becomes a slide-over menu. The
  component page's frames can be wider, so this keeps it showing at every width. A style block, since the system's
  Tailwind scans the copied app, not this folder.
-->
<style scoped>
.studio-top-bar-page {
  width: 100%;
}
.studio-top-bar-page > :deep(div),
.studio-top-bar-page > :deep(div > div:first-child) {
  display: flex !important;
}
</style>
