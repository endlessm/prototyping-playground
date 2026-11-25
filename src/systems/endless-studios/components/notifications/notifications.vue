<!--
  The Notifications panel: the app's own components/Notifications/index.vue, copied unchanged. It titles the list
  and links to the account settings, around Notifications/List.vue.
  Screens don't use this file: they import `~/components/Notifications/index.vue` and answer the list's
  `NOTIFICATIONS_LIST` query with `system.sample.queries`. This file gives the component page and the Lab its
  examples and lets each one choose between the filled and the empty panel.
-->
<script setup lang="ts">
import Notifications from '~/components/Notifications/index.vue';
import { provideNotificationSamples } from '../../runtime/notification-samples';

const props = withDefaults(
  defineProps<{
    /** Shows the panel with no notifications, as someone sees it before anything has happened. */
    empty?: boolean;
  }>(),
  { empty: false },
);

provideNotificationSamples(() => props.empty);
</script>

<template>
  <Notifications :key="String(empty)" />
</template>
