<!-- @studio-id snnne5r1e593qgac -->
<!-- @lofi -->
<script setup lang="ts">
import AppPage from '../_wire/AppPage.vue'
import Badge from '../_wire/Badge.vue'
import Bullets from '../_wire/Bullets.vue'
import Button from '../_wire/Button.vue'
import Card from '../_wire/Card.vue'
import Crumbs from '../_wire/Crumbs.vue'
import Lead from '../_wire/Lead.vue'
import Marker from '../_wire/Marker.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// Pending review: learners can be added now; their invites wait for approval.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" active="Cohorts" :links="{ 'Team Dashboard': 'Lo-Fi/3 Create Team/3.4 With Cohort' }">
    <div :class="[s.stack, s.tight]">
      <Crumbs><TextLink to="Lo-Fi/3 Create Team/3.4 With Cohort">Team Dashboard</TextLink> › Period 3 Game Design</Crumbs>
      <div :class="[s.row, s.spread]">
        <Title>Period 3 Game Design</Title>
        <Badge tone="solid">In Review</Badge>
      </div>
      <Lead>Explore: Threadbare · Closed school class · Sent Oct 16, 2026</Lead>
    </div>
    <Card>
      <div :class="s.row">
        <strong style="font-size: 14px">We're reviewing your class</strong>
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
        <Button to="Lo-Fi/5 Invite Students/5.1 Class Link">Add Learners</Button>
        <Button variant="ghost" to="Lo-Fi/4 Create Cohort/4.3 US School">Edit Request</Button>
      </div>
    </Card>
  </AppPage>
</template>
