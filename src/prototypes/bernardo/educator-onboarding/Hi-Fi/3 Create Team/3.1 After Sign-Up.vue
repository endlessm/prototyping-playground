<!-- @studio-id vv1g7jwrbnx5sjr6 -->
<script setup lang="ts">
import CircularLoading from '~/components/Generic/CircularLoading.vue'
import AppPage from '../_ui/AppPage.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Subtitle from '../_ui/Subtitle.vue'
import s from '../_ui/ui.module.css'

// No Create Team step: the team is made for the educator while the dashboard loads.
const routes = [
  { label: "Create “Maya's Team” with Maya as Team Leader → Team Dashboard", to: 'Hi-Fi/3 Create Team/3.2 Empty Dashboard' },
]
</script>

<template>
  <AppPage team="Maya's Team">
    <div :class="[s.stack, s.tight]" style="align-items: center; padding: 110px 0 30px">
      <CircularLoading />
      <Subtitle>Setting up your space…</Subtitle>
      <Lead>This takes a second.</Lead>
    </div>
    <Logic title="After sign-up, no team yet" :flow="3" :note="1" :rows="routes" />
  </AppPage>
</template>
