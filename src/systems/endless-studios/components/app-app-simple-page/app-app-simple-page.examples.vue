<!--
  The simple page layout's examples: header, hero and content; content alone; and full-width content.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import AppAppSimplePage from './app-app-simple-page.vue';
</script>

<template>
  <Example name="Default">
    <AppAppSimplePage header hero />
  </Example>

  <Example name="ContentOnly">
    <AppAppSimplePage :header="false" :hero="false" />
  </Example>

  <Example name="FullWidth">
    <AppAppSimplePage :header="false" full-width />
  </Example>
</template>
