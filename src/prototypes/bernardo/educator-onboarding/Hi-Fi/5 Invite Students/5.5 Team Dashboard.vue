<!-- @studio-id qy9663912ff2zjwj -->
<script setup lang="ts">
import AppPage from '../_ui/AppPage.vue'
import Badge from '../_ui/Badge.vue'
import Button from '../_ui/Button.vue'
import Card from '../_ui/Card.vue'
import Lead from '../_ui/Lead.vue'
import Marker from '../_ui/Marker.vue'
import Placeholder from '../_ui/Placeholder.vue'
import Subtitle from '../_ui/Subtitle.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

const learners: [string, string, 'solid' | 'outline' | undefined][] = [
  ['Ada Okafor', 'Joined', 'solid'],
  ['Tobi Okafor', 'Joined', 'solid'],
  ['Lena Fischer', 'Joined', 'solid'],
  ['Priya Raman', 'Needs parent consent', undefined],
  ['Marcus Hill', 'Bounced', 'outline'],
]

// Back on the Team Dashboard, the cohort card tracks who's in.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" :links="{ 'Team Dashboard': 'Hi-Fi/5 Invite Students/5.5 Team Dashboard', Cohorts: 'Hi-Fi/5 Invite Students/5.1 Class Link' }">
    <div :class="[s.stack, s.tight]">
      <Title>Team Dashboard</Title>
      <Lead>Okafor Homeschool Co-op · 1 cohort</Lead>
    </div>
    <Card>
      <div :class="[s.row, s.spread]" style="align-items: flex-start">
        <div :class="[s.stack, s.tight]">
          <Subtitle><TextLink to="Hi-Fi/5 Invite Students/5.1 Class Link">Spring Game Makers</TextLink></Subtitle>
          <span :class="s.small">Explore: Threadbare · Starts Mon, Mar 2</span>
        </div>
        <div :class="s.row">
          <Button variant="secondary">Copy Class Link</Button>
          <Button to="Hi-Fi/3 Create Team/3.4 With Cohort">Open Workshop 1</Button>
        </div>
      </div>
      <div :class="s.columns" style="align-items: start; gap: 14px">
        <div :class="[s.stack, s.tight]">
          <div :class="s.row">
            <span :class="s.label">Who's In</span>
            <Marker :flow="5" :n="6" />
            <span :class="s.small">3 of 5 seats</span>
          </div>
          <div :class="s.seats">
            <span v-for="seat in [0, 1, 2, 3, 4]" :key="seat" :class="seat < 3 ? s.seatTaken : undefined" />
          </div>
          <div :class="s.list" style="border: 1px solid var(--es-border); border-radius: 16px; margin-top: 8px">
            <div v-for="[name, status, tone] in learners" :key="name">
              {{ name }}
              <Badge :tone="tone">{{ status }}</Badge>
            </div>
          </div>
        </div>
        <Placeholder :height="90">Cohort Dashboard</Placeholder>
      </div>
    </Card>
    <span :class="s.small">
      Marcus's email bounced: <TextLink to="Hi-Fi/5 Invite Students/5.2 Email the Link">Fix Email</TextLink> or send him the
      link another way.
    </span>
  </AppPage>
</template>
