<!-- @studio-id djn2n91hn7f528xr -->
<script setup lang="ts">
import Logic from '../_ui/Logic.vue'
import TeamDashboard from '../_ui/TeamDashboard.vue'
import { TEAM } from '../_ui/team'

// Signed up from Maya's invite: no team of her own is made; Dana lands on the team that invited her, as a Team
// Member. She sees only the cohorts she creates or is added to, so her Cohorts tab starts empty.
</script>

<template>
  <TeamDashboard :team="TEAM" viewer="member" banner="joined" home="Hi-Fi/3 Create Team/3.6 Joined as Team Member" walkthrough>
    <Logic
      title="After sign-up from a team invite"
      :rows="[
        { label: 'No team is created for Dana; the invite already names the team' },
        { label: 'Maya, the Team Leader, sees every cohort, Dana’s too', to: 'Hi-Fi/3 Create Team/3.4 Cohorts' },
        { label: 'Invite expired or withdrawn → her own team, as any new educator', to: 'Hi-Fi/3 Create Team/3.2 Empty Dashboard' },
      ]"
    />
  </TeamDashboard>
</template>
