<!-- @studio-id 7ka739h9yt3903g2 -->
<script setup lang="ts">
import CohortPage from '../_ui/CohortPage.vue'
import { godotStartingSoon } from '../_ui/team'

// A cohort starting soon, opened from its card on the Team Dashboard: Godot After School, Dana's, seen by Maya as
// Team Leader 17 days before it starts. What's left to do before the first session, the join link and who's in.
</script>

<template>
  <CohortPage :cohort="godotStartingSoon" stage="upcoming" walkthrough />
</template>
