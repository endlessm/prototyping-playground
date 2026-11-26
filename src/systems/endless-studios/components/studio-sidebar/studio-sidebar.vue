<!--
  The Endless Studios sidebar: the app's own StudioSidebar (components/App/StudioSidebar.vue), copied unchanged.
  Screens don't use this file: they show the sidebar with `system: { shell: true }`, or import
  `~/components/App/StudioSidebar.vue` beside their own layout. This file gives the component page its examples and
  props table, and lets each example choose who is signed in.
-->
<script setup lang="ts">
import { provide } from 'vue';
import StudioSidebar from '~/components/App/StudioSidebar.vue';
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
     * How many notifications are unread, the `NOTIFICATIONS_COUNT` query's answer, shown beside Notifications. Zero
     * hides it. A view answers that query with `system.sample.queries`, not with this prop.
     */
    notificationsCount?: number;
  }>(),
  { user: undefined, notificationsCount: 3 },
);

// The copied sidebar reads `$auth` and its queries from useNuxtApp(), so a nearer app with its own sample user and
// unread count changes only this sidebar. The screen's other samples stay.
const app = useNuxtApp();
const graphql = createGraphQL({
  ...app.graphql.samples,
  NOTIFICATIONS_COUNT: () => ({ getUnreadNotificationsCount: { unread_notifications_count: props.notificationsCount } }),
});
provide(NUXT_APP_KEY, {
  ...app,
  ...(props.user !== undefined && { $auth: createAuth(props.user) }),
  graphql,
  $graphqlRequest: graphql.request,
});

// The component page's frames are narrower than the app's 1024px breakpoint, where USidebar turns into the mobile
// menu. Each example is a document of its own, so answering that one media query "not narrow" there shows the
// desktop sidebar, as the home page has it. `not all` never matches.
const MOBILE = '(max-width: 1023px)';
const matchMedia = window.matchMedia.bind(window);
window.matchMedia = (query: string) => matchMedia(query === MOBILE ? 'not all' : query);
</script>

<template>
  <div class="studio-sidebar-page">
    <!-- The count is read once per mount, so the sidebar remounts when it changes. -->
    <StudioSidebar :key="notificationsCount" />
  </div>
</template>

<!--
  The same for the `lg:` classes: the sidebar and its footer show, the mobile close button hides, and the panel,
  fixed to the frame's height, gets a page-like height to fill. A style block, since the system's Tailwind scans the
  copied app, not this folder.
-->
<style scoped>
.studio-sidebar-page {
  width: 100%;
  height: 720px;
}
.studio-sidebar-page :deep([data-slot='root']) {
  display: block !important;
}
.studio-sidebar-page :deep([data-slot='container']) {
  display: flex !important;
}
.studio-sidebar-page :deep([data-slot='footer'] > div:first-child) {
  display: contents !important;
}
.studio-sidebar-page :deep([data-slot='header'] button) {
  display: none !important;
}
.studio-sidebar-page :deep([data-slot='body']) {
  padding: 0 1rem !important;
}
</style>
