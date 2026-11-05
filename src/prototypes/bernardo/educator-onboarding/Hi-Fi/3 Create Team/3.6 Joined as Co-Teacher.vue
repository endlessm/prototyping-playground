<!-- @studio-id djn2n91hn7f528xr -->
<script setup lang="ts">
import { ref } from 'vue'
import AppPage from '../_ui/AppPage.vue'
import Badge from '../_ui/Badge.vue'
import Button from '../_ui/Button.vue'
import CreateCohortWizard from '../_ui/CreateCohortWizard.vue'
import Icon from '../_ui/Icon.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Marker from '../_ui/Marker.vue'
import Placeholder from '../_ui/Placeholder.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

// Signed up from Maya's co-teacher invite: no team of her own is made; Dana lands on the team that invited her.
const banner = ref(true)
const creating = ref(false)
</script>

<template>
  <AppPage
    team="Okafor Homeschool Co-op"
    initials="DF"
    :links="{ 'Team Dashboard': 'Hi-Fi/3 Create Team/3.6 Joined as Co-Teacher', Cohorts: 'Hi-Fi/5 Invite Students/5.1 Class Link' }"
  >
    <div v-if="banner" :class="[s.panel, s.row]" style="border: 1px solid var(--es-border); border-radius: 16px; color: var(--es-text)">
      <Icon name="i-lucide-user-plus" />
      <span :class="s.grow">
        You joined <strong>Okafor Homeschool Co-op</strong> as a co-teacher. Maya Okafor invited you.
      </span>
      <Button variant="ghost" @click="banner = false">Dismiss</Button>
    </div>
    <div :class="[s.row, s.spread]" style="align-items: flex-start">
      <div :class="[s.stack, s.tight]">
        <div :class="s.row">
          <Title :flow="3" :note="6">Okafor Homeschool Co-op</Title>
          <Badge>Co-teacher</Badge>
        </div>
        <Lead>Team Dashboard</Lead>
      </div>
      <Button variant="secondary" @click="creating = true">Create Cohort</Button>
    </div>
    <strong>Cohorts</strong>
    <table :class="s.table">
      <thead>
        <tr>
          <th>Cohort</th>
          <th>Program</th>
          <th>Learners</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><TextLink to="Hi-Fi/5 Invite Students/5.1 Class Link">Spring Game Makers</TextLink></td>
          <td>Explore: Threadbare</td>
          <td>5 invited</td>
          <td><Badge>Starts Mar 2</Badge></td>
        </tr>
      </tbody>
    </table>
    <Placeholder :height="150">Cohort Dashboard</Placeholder>
    <Logic
      title="After sign-up from a co-teacher invite"
      :rows="[
        { label: 'No team is created for Dana; the invite already names the team' },
        { label: 'Same dashboard the owner sees, without Rename or Team Settings', to: 'Hi-Fi/3 Create Team/3.4 With Cohort' },
        { label: 'Invite expired or withdrawn → her own team, as any new educator', to: 'Hi-Fi/3 Create Team/3.2 Empty Dashboard' },
      ]"
    />

    <template #overlay>
      <CreateCohortWizard v-if="creating" start="choose" team="Okafor Homeschool Co-op" @close="creating = false" />
    </template>
  </AppPage>
</template>
