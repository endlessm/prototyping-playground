<!-- @studio-id d55wyezyx89ktkgt -->
<script setup lang="ts">
import AppPage from '../_ui/AppPage.vue'
import Badge from '../_ui/Badge.vue'
import Button from '../_ui/Button.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Title from '../_ui/Title.vue'
import { TEAM } from '../_ui/team'
import s from '../_ui/ui.module.css'

// The open class is created with Maya as its first manager; the next step is bringing learners in.
</script>

<template>
  <AppPage :team="TEAM" :links="{ 'Team Dashboard': 'Hi-Fi/3 Create Team/3.4 Cohorts' }">
    <div :class="s.stack" style="align-items: center; text-align: center; padding: 100px 0 20px">
      <Badge>Open Class</Badge>
      <Title>Spring Game Makers is ready</Title>
      <Lead>Explore: Godot · Starts Mar 2, 2027 · 5 seats</Lead>
      <div :class="s.row">
        <Button to="Hi-Fi/5 Cohort/5.1 Class Link">Invite Learners</Button>
        <Button variant="ghost" to="Hi-Fi/3 Create Team/3.4 Cohorts">Later</Button>
      </div>
    </div>
    <div style="width: 440px; margin: 0 auto">
      <Logic
        title="Next stage"
        :rows="[{ label: 'Invite Learners → the cohort’s Learners tab (draft 5)', to: 'Hi-Fi/5 Cohort/5.1 Class Link' }]"
      />
    </div>
  </AppPage>
</template>
