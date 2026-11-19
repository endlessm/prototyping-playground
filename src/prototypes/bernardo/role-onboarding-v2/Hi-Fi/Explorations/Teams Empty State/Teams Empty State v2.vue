<!-- @studio-id ew94vkvepta209rj -->
<script setup lang="ts">
import OrgPage from '../../_ui/OrgPage.vue'
import { teamGroupIllustration } from '../../_ui/illustrations'

// Teams Empty State's Crew, with a Team drawn as three people in the middle tile instead of the game pad, so the
// empty tab reads as a group of people rather than as play.
</script>

<template>
  <OrgPage viewer="orgManager" :step="3" teams-empty="crew" :teams-empty-hub="teamGroupIllustration" />
</template>
