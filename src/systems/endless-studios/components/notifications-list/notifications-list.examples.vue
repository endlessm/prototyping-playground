<!--
  The notifications list's examples: filled with sample notifications, and empty.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import NotificationsList from './notifications-list.vue';
</script>

<template>
  <Example name="Default">
    <NotificationsList :page-size="10" />
  </Example>

  <Example name="Empty">
    <NotificationsList empty />
  </Example>
</template>
