<!--
  The page layout's examples: with a header banner, and without one.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import AppAppPage from './app-app-page.vue';
</script>

<template>
  <Example name="Default">
    <AppAppPage header />
  </Example>

  <Example name="WithoutHeader">
    <AppAppPage :header="false" />
  </Example>
</template>
