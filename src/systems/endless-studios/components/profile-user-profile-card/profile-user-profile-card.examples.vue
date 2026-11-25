<!--
  The profile card's examples: as a visitor sees it, as its owner sees it, and a private profile's minimal card.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import ProfileUserProfileCard from './profile-user-profile-card.vue';
</script>

<template>
  <Example name="Default">
    <ProfileUserProfileCard
      username="ana.learner"
      :joined-projects-count="4"
      :certificates-count="2"
      interests="Pixel art, Game design, Music"
      created-at="2025-03-14"
    />
  </Example>

  <Example name="Owner">
    <ProfileUserProfileCard username="ana.learner" :public="false" interests="Pixel art, Game design" can-edit />
  </Example>

  <Example name="Minimal">
    <ProfileUserProfileCard username="marco.mentor" minimal />
  </Example>
</template>
