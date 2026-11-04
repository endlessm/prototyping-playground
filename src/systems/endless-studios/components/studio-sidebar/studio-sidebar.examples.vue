<!--
  The app's sidebar for each kind of visitor. In a view, show it with `system: { shell: true }` and choose who is
  signed in with `system.user`; the `user` prop here is only how one page shows several of them.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import StudioSidebar from './studio-sidebar.vue';
</script>

<template>
  <Example name="Learner">
    <StudioSidebar user="learner" />
  </Example>
  <Example name="Admin">
    <StudioSidebar user="admin" />
  </Example>
  <Example name="SignedOut">
    <StudioSidebar :user="null" />
  </Example>
</template>
