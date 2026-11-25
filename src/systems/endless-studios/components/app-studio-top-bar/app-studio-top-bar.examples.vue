<!--
  The top bar's examples: with unread notifications, and with none.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import AppStudioTopBar from './app-studio-top-bar.vue';
</script>

<template>
  <Example name="Default">
    <AppStudioTopBar :notifications-count="3" />
  </Example>

  <Example name="NoUnread">
    <AppStudioTopBar :notifications-count="0" />
  </Example>
</template>
