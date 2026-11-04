<!-- @studio-id yxw1apk88exqm997 -->
<!-- @lofi -->
<script setup lang="ts">
import AppPage from '../_wire/AppPage.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// The open class is created; the next step is bringing learners in.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" active="Cohorts" :links="{ 'Team Dashboard': '3 Create Team/3.4 With Cohort', Cohorts: '5 Invite Students/5.1 Class Link' }">
    <div :class="s.stack" style="align-items: center; text-align: center; padding: 100px 0 20px">
      <Badge>Open Class</Badge>
      <Title>Spring Game Makers is ready</Title>
      <Lead>Explore: Threadbare · Next, add your learners.</Lead>
      <div :class="s.row">
        <Button to="5 Invite Students/5.1 Class Link">Invite Learners</Button>
        <Button variant="ghost" to="3 Create Team/3.4 With Cohort">Later</Button>
      </div>
    </div>
    <div style="width: 440px; margin: 0 auto">
      <Logic title="Next stage" :rows="[{ label: 'Invite Learners → draft 5', to: '5 Invite Students/5.1 Class Link' }]" />
    </div>
  </AppPage>
</template>
