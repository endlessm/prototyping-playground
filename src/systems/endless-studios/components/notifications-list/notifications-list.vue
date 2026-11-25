<!--
  The notifications list: the app's own components/Notifications/List.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Notifications/List.vue` and answer its
  `NOTIFICATIONS_LIST` query with `system.sample.queries`. This file gives the component page and the Lab its
  examples and lets each one choose between the filled and the empty list.
-->
<script setup lang="ts">
import NotificationsList from '~/components/Notifications/List.vue';
import { provideNotificationSamples } from '../../runtime/notification-samples';

const props = withDefaults(
  defineProps<{
    /** How many notifications the list asks for at a time. */
    pageSize?: number;
    /** Shows the list with no notifications, as someone sees it before anything has happened. */
    empty?: boolean;
  }>(),
  { pageSize: 10, empty: false },
);

provideNotificationSamples(() => props.empty);
</script>

<template>
  <NotificationsList :key="String(empty)" :page-size="pageSize" />
</template>
