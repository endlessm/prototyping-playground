<!-- @studio-id 5z3wzapvhb6dbw3v -->
<script setup lang="ts">
import TeamDashboard from '../_ui/TeamDashboard.vue'
import { cohortsOverTime, TEAM } from '../_ui/team'

// The Team Dashboard's Cohorts tab, seen by Maya, the Team Leader: every cohort in the team, Dana's included.
// The team months on, with cohorts just created, starting soon, running and finished.
// Create Cohort opens the same Create a class page as the empty dashboard, here without a program link.
</script>

<template>
  <TeamDashboard
    :team="TEAM"
    :cohorts="cohortsOverTime"
    :tab-links="{ settings: 'Hi-Fi/3 Create Team/3.5 Team Settings' }"
    home="Hi-Fi/3 Create Team/3.4 Cohorts"
    walkthrough
  />
</template>
