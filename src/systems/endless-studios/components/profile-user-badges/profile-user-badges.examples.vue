<!--
  The badge list's examples: a user's interests, and an empty list, which shows nothing.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import ProfileUserBadges from './profile-user-badges.vue';
</script>

<template>
  <Example name="Default">
    <ProfileUserBadges title="Interests" />
  </Example>

  <Example name="Empty">
    <ProfileUserBadges title="Interests" empty />
  </Example>
</template>
