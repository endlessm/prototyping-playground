<!-- @studio-id rgef1dwzd46bkd1v -->
<!-- @lofi -->
<script setup lang="ts">
import AppPage from '../_wire/AppPage.vue'
import Avatar from '../_wire/Avatar.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import Chip from '../_wire/Chip.vue'
import Crumbs from '../_wire/Crumbs.vue'
import Marker from '../_wire/Marker.vue'
import Small from '../_wire/Small.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// Co-teachers live in Team Settings, outside onboarding. Learners are added inside each cohort.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op">
    <div :class="[s.stack, s.tight]">
      <Crumbs><TextLink to="3 Create Team/3.4 With Cohort">Team Dashboard</TextLink> › Team Settings</Crumbs>
      <Title>Team Settings</Title>
    </div>
    <div :class="s.row" style="gap: 20px; border-bottom: 1px solid #ccc; padding-bottom: 6px; font-size: 12px">
      <span style="color: #666">Name</span>
      <span style="text-decoration: underline">Co-Teachers</span>
    </div>
    <div :class="s.row" style="border: 1px solid #ccc; padding: 10px 12px">
      <Avatar>MO</Avatar>
      <div :class="s.grow">
        <div>Maya Okafor</div>
        <Small>maya.okafor@gmail.com</Small>
      </div>
      <Badge>Owner</Badge>
    </div>
    <div :class="[s.stack, s.tight]">
      <span :class="[s.row, s.label]">Invite Co-Teachers <Marker :flow="3" :n="5" /></span>
      <div :class="[s.row, s.wrap]" style="border: 1px solid #ccc; padding: 6px; gap: 6px">
        <Chip>dana.fischer@outlook.com</Chip>
        <Chip error>rob.hill@gmail</Chip>
        <input :class="s.grow" style="border: 0; outline: 0; font: inherit" aria-label="Email" />
      </div>
      <span :class="s.error">rob.hill@gmail isn't a complete email address.</span>
      <Small>
        Co-teachers can create cohorts and see all of this team's learners. Learners are added inside each cohort, not
        here.
      </Small>
    </div>
    <div :class="s.row" style="justify-content: flex-end">
      <Button variant="ghost" to="3 Create Team/3.4 With Cohort">Back</Button>
      <Button variant="disabled">Send Invites</Button>
    </div>
  </AppPage>
</template>
