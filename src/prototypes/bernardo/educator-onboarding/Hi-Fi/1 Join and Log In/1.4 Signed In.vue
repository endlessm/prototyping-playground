<!-- @studio-id hx8cj5m2mbdf111m -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Subtitle from '../_ui/Subtitle.vue'
import s from '../_ui/ui.module.css'

// Signed in: the educator goes to their team, or to the team made for them.
</script>

<template>
  <AuthPage :header="false" centered>
    <div :class="[s.stack, s.tight]" style="align-items: center">
      <UIcon name="i-lucide-loader-circle" class="size-8 text-orange-600 animate-spin motion-reduce:animate-none" />
      <Subtitle>Signing you in…</Subtitle>
      <Lead>Taking you to your team.</Lead>
    </div>
    <Logic
      title="After log-in"
      :rows="[
        { label: 'Has a Team → Team Dashboard', to: 'Hi-Fi/5 Invite Students/5.5 Team Dashboard' },
        { label: 'No Team yet → Create Team (draft 3)', to: 'Hi-Fi/3 Create Team/3.1 After Sign-Up' },
        { label: 'Learner account (13 to 17) → learner home, outside this prototype' },
      ]"
    />
  </AuthPage>
</template>
