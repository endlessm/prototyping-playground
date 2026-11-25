<!--
  The Upcoming events card's examples: filled with sample events, and empty.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import DashboardUpcomingEvents from './dashboard-upcoming-events.vue';
</script>

<template>
  <Example name="Default">
    <DashboardUpcomingEvents :limit="3" />
  </Example>

  <Example name="Empty">
    <DashboardUpcomingEvents empty />
  </Example>
</template>
