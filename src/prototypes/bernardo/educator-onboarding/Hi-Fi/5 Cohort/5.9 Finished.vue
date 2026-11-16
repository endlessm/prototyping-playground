<!-- @studio-id m7rdgq85c7cc5pzw -->
<script setup lang="ts">
import CohortPage from '../_ui/CohortPage.vue'
import { fallFinished } from '../_ui/team'

// Fall Game Makers after its last session, opened from its card on the Team Dashboard: the Running page's journey,
// now showing who earned the certificate and where the others stopped, with certificates to download and Run Again.
</script>

<template>
  <CohortPage :cohort="fallFinished" stage="finished" walkthrough />
</template>
