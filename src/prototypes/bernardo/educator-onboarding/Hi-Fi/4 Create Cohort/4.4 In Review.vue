<!-- @studio-id 5p4ym0gw6yhcmtwd -->
<script setup lang="ts">
import AppPage from '../_ui/AppPage.vue'
import Badge from '../_ui/Badge.vue'
import Bullets from '../_ui/Bullets.vue'
import Button from '../_ui/Button.vue'
import Card from '../_ui/Card.vue'
import Crumbs from '../_ui/Crumbs.vue'
import Lead from '../_ui/Lead.vue'
import Marker from '../_ui/Marker.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

// Pending review: learners can be added now; their invites wait for approval.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" active="Cohorts" :links="{ 'Team Dashboard': 'Hi-Fi/3 Create Team/3.4 With Cohort' }">
    <div :class="[s.stack, s.tight]">
      <Crumbs><TextLink to="Hi-Fi/3 Create Team/3.4 With Cohort">Team Dashboard</TextLink> › Period 3 Game Design</Crumbs>
      <div :class="[s.row, s.spread]">
        <Title>Period 3 Game Design</Title>
        <Badge tone="solid">In Review</Badge>
      </div>
      <Lead>Explore: Threadbare · Closed school class · Sent Oct 16, 2026</Lead>
    </div>
    <Card>
      <div :class="s.row">
        <strong>We're reviewing your class</strong>
        <Marker :flow="4" :n="7" />
      </div>
      <div :class="s.columns" style="gap: 24px">
        <div :class="[s.stack, s.tight]">
          <span :class="s.label">You can now</span>
          <Bullets :items="['Add learners; invites wait until approval', 'Read the teacher guide', 'Rename the class']" />
        </div>
        <div :class="[s.stack, s.tight]">
          <span :class="s.label">After approval</span>
          <Bullets :items="['Learners get their invites and can log in', 'Workshops open to them']" />
        </div>
      </div>
      <div :class="s.row">
        <Button to="Hi-Fi/5 Invite Students/5.1 Class Link">Add Learners</Button>
        <Button variant="ghost" to="Hi-Fi/4 Create Cohort/4.3 US School">Edit Request</Button>
      </div>
    </Card>
  </AppPage>
</template>
