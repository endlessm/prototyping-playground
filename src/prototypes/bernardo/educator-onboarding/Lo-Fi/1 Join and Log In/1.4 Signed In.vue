<!-- @studio-id sjphhzcp852yd175 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Subtitle from '../_wire/Subtitle.vue'
import s from '../_wire/wire.module.css'

// Signed in: the educator goes to their team, or to the team made for them.
</script>

<template>
  <AuthPage :header="false" centered>
    <div :class="[s.stack, s.tight]" style="align-items: center">
      <span :class="s.avatar" style="width: 28px; height: 28px; background: none; border: 1px solid #ccc" />
      <Subtitle>Signing you in…</Subtitle>
      <Lead>Taking you to your team.</Lead>
    </div>
    <Logic
      title="After log-in"
      :rows="[
        { label: 'Has a Team → Team Dashboard', to: 'Lo-Fi/5 Invite Students/5.5 Team Dashboard' },
        { label: 'No Team yet → Create Team (draft 3)', to: 'Lo-Fi/3 Create Team/3.1 After Sign-Up' },
        { label: 'Learner account (13 to 17) → learner home, outside this prototype' },
      ]"
    />
  </AuthPage>
</template>
