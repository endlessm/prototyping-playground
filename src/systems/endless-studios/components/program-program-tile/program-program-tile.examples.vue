<!--
  The program tile's examples: one of the viewer's programs with several cohorts, with one, and the leaders' tile.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import ProgramProgramTile from './program-program-tile.vue';
</script>

<template>
  <Example name="Default">
    <ProgramProgramTile name="Make your first platformer" :tasks-count="12" program-status-id="inprogress" cohorts="several" is-mine />
  </Example>

  <Example name="OneCohort">
    <ProgramProgramTile name="Pixel art basics" :tasks-count="6" program-status-id="notstarted" cohorts="one" is-mine />
  </Example>

  <Example name="LeaderView">
    <ProgramProgramTile name="Make your first platformer" cohorts="none" :is-mine="false" is-leader-view />
  </Example>
</template>
