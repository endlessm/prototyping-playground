<!--
  The user card's examples: a learner, the larger heading size, and a disabled account.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import GenericUserCard from './generic-user-card.vue';
</script>

<template>
  <Example name="Default">
    <GenericUserCard username="ana.learner" full-name="Ana Souza" />
  </Example>

  <Example name="Large">
    <GenericUserCard username="ana.learner" full-name="Ana Souza" size="lg" />
  </Example>

  <Example name="Disabled">
    <GenericUserCard username="marco.mentor" full-name="Marco Lima" disabled />
  </Example>
</template>
