<!-- @studio-id m3ghhtmpby66j14c -->
<script setup lang="ts">
import TeamDashboard from '../_ui/TeamDashboard.vue'
import { godotAfterSchool, springGameMakers, TEAM } from '../_ui/team'

// The Team Dashboard's Team Settings tab, seen by the Team Leader: the members and inviting more.
// Learners and facilitators are added inside each cohort, not here.
</script>

<template>
  <TeamDashboard
    :team="TEAM"
    tab="settings"
    :cohorts="[springGameMakers, godotAfterSchool]"
    :tab-links="{ cohorts: 'Hi-Fi/3 Create Team/3.4 Cohorts' }"
    home="Hi-Fi/3 Create Team/3.4 Cohorts"
    walkthrough
  />
</template>
