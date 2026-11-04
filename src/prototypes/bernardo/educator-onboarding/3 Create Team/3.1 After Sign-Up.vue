<!-- @studio-id z0b5efghd945136r -->
<!-- @lofi -->
<script setup lang="ts">
import AppPage from '../_wire/AppPage.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Subtitle from '../_wire/Subtitle.vue'
import s from '../_wire/wire.module.css'

// No Create Team step: the team is made for the educator while the dashboard loads.
const routes = [
  { label: "Create “Maya's Team” with Maya as owner → Team Dashboard", to: '3 Create Team/3.2 Empty Dashboard' },
  { label: "Joined from a co-teacher invite → that team's dashboard instead", to: '3 Create Team/3.6 Joined as Co-Teacher' },
]
</script>

<template>
  <AppPage team="Maya's Team">
    <div :class="[s.stack, s.tight]" style="align-items: center; padding: 110px 0 30px">
      <span :class="s.avatar" style="width: 28px; height: 28px; background: none; border: 1px solid #ccc" />
      <Subtitle>Setting up your space…</Subtitle>
      <Lead>This takes a second.</Lead>
    </div>
    <Logic title="After sign-up, no team yet" :flow="3" :note="1" :rows="routes" />
  </AppPage>
</template>
