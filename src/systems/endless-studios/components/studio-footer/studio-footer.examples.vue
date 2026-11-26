<!--
  The app's footer in each language. In a view, show it with `system: { shell: true }` and choose the language with
  `system.locale`; the `locale` prop here is only how one page shows both.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import StudioFooter from './studio-footer.vue';
</script>

<template>
  <Example name="Default">
    <StudioFooter locale="en" />
  </Example>
  <Example name="Spanish">
    <StudioFooter locale="es" />
  </Example>
</template>
