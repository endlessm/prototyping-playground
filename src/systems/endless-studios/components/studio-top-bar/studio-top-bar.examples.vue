<!--
  The app's top bar for each kind of visitor. In a view, show it with `system: { shell: true }`, choose who is signed in
  with `system.user` and the unread count with `system.sample.queries.NOTIFICATIONS_COUNT`; the props here are only how
  one page shows several of them.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import StudioTopBar from './studio-top-bar.vue';
</script>

<template>
  <Example name="Default">
    <StudioTopBar user="learner" :unread-notifications="0" />
  </Example>
  <Example name="UnreadNotifications">
    <StudioTopBar user="learner" :unread-notifications="3" />
  </Example>
  <Example name="SignedOut">
    <StudioTopBar :user="null" />
  </Example>
</template>
