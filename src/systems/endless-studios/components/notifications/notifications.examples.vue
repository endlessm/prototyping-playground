<!--
  The Notifications panel's examples: filled with sample notifications, and empty.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import Notifications from './notifications.vue';
</script>

<template>
  <Example name="Default">
    <Notifications />
  </Example>

  <Example name="Empty">
    <Notifications empty />
  </Example>
</template>
