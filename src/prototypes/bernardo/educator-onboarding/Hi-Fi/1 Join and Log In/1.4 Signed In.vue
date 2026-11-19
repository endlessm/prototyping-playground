<!-- @studio-id hx8cj5m2mbdf111m -->
<script setup lang="ts">
import CircularLoading from '~/components/Generic/CircularLoading.vue'
import AuthPage from '../_ui/AuthPage.vue'
import Logic from '../_ui/Logic.vue'
import Subtitle from '../_ui/Subtitle.vue'
import s from '../_ui/ui.module.css'

// Signed in: an educator goes to their team, the team made for them or the team that invited them;
// someone under 18 who hasn't chosen a path yet goes to their Choose a Path.
</script>

<template>
  <AuthPage :header="false" centered>
    <div :class="[s.stack, s.tight]" style="align-items: center">
      <CircularLoading />
      <Subtitle>Signing you in…</Subtitle>
    </div>
    <Logic
      title="After log-in"
      :rows="[
        { label: 'Already chose Teach path → Has team', to: 'Hi-Fi/3 Create Team/3.4 Cohorts' },
        { label: 'Already chose Teach path → No team yet', to: 'Hi-Fi/3 Create Team/3.1 After Sign-Up' },
        { label: 'Joined from a team invite → that team’s dashboard', to: 'Hi-Fi/3 Create Team/3.6 Joined as Team Member' },
        { label: 'Under 18, no path chosen yet → Choose a Path', to: 'Hi-Fi/2 Sign Up/2.5 Choose a Path (Under 18)' },
      ]"
    />
  </AuthPage>
</template>
