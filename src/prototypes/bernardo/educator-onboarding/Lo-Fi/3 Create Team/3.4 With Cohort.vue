<!-- @studio-id qfpxv529bg8qg357 -->
<!-- @lofi -->
<script setup lang="ts">
import { ref } from 'vue'
import AppPage from '../_wire/AppPage.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import CreateCohortWizard from '../_wire/CreateCohortWizard.vue'
import Placeholder from '../_wire/Placeholder.vue'
import RenameTeamModal from '../_wire/RenameTeamModal.vue'
import TeamTitle from '../_wire/TeamTitle.vue'
import TextLink from '../_wire/TextLink.vue'
import s from '../_wire/wire.module.css'

// The renamed team with its first cohort. Create Cohort opens the same wizard as the empty dashboard, here without a program link.
const team = ref('Okafor Homeschool Co-op')
const open = ref<'rename' | 'cohort' | null>(null)

function close() {
  open.value = null
}

function rename(name: string) {
  team.value = name
  close()
}
</script>

<template>
  <AppPage :team="team" :links="{ 'Team Dashboard': 'Lo-Fi/3 Create Team/3.4 With Cohort', Cohorts: 'Lo-Fi/5 Invite Students/5.1 Class Link' }">
    <div :class="[s.row, s.spread]" style="align-items: flex-start">
      <TeamTitle :team="team" @rename="open = 'rename'" />
      <Button variant="secondary" @click="open = 'cohort'">Create Cohort</Button>
    </div>
    <strong style="font-size: 14px">Cohorts</strong>
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
          <td><TextLink to="Lo-Fi/5 Invite Students/5.1 Class Link">Spring Game Makers</TextLink></td>
          <td>Explore: Threadbare</td>
          <td>5 invited</td>
          <td><Badge>Starts Mar 2</Badge></td>
        </tr>
      </tbody>
    </table>
    <Placeholder :height="150">Cohort Dashboard</Placeholder>
    <span :class="s.small" style="font-size: 12px">
      Teaching with other adults?
      <TextLink to="Lo-Fi/3 Create Team/3.5 Team Settings">Add co-teachers in Team Settings</TextLink>
    </span>

    <template #overlay>
      <RenameTeamModal v-if="open === 'rename'" :name="team" @save="rename" @close="close" />
      <CreateCohortWizard v-else-if="open === 'cohort'" start="choose" :team="team" @close="close" />
    </template>
  </AppPage>
</template>
