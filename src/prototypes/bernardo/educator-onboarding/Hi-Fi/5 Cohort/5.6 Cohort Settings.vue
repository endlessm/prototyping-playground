<!-- @studio-id advt3kyb6e2t71yr -->
<script setup lang="ts">
import CohortPage from '../_ui/CohortPage.vue'

// The cohort's Settings tab: its name, start date, seats and when the join link expires.
</script>

<template>
  <CohortPage
    tab="settings"
    joined
    :tab-links="{ learners: 'Hi-Fi/5 Cohort/5.5 Learners Joined', people: 'Hi-Fi/5 Cohort/5.4 Managers and Facilitators' }"
    walkthrough
  />
</template>
