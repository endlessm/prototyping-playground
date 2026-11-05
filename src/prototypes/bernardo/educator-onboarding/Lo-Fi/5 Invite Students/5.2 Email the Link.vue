<!-- @studio-id 6gq48qgn142wvpye -->
<!-- @lofi -->
<script setup lang="ts">
import AppPage from '../_wire/AppPage.vue'
import Button from '../_wire/Button.vue'
import Chip from '../_wire/Chip.vue'
import Crumbs from '../_wire/Crumbs.vue'
import Lead from '../_wire/Lead.vue'
import Panel from '../_wire/Panel.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// For families outside the group chat: the same class link, sent by email.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" active="Cohorts" :links="{ 'Team Dashboard': 'Lo-Fi/5 Invite Students/5.5 Team Dashboard', Cohorts: 'Lo-Fi/5 Invite Students/5.1 Class Link' }">
    <div :class="[s.stack, s.tight]">
      <Crumbs>
        <TextLink to="Lo-Fi/5 Invite Students/5.5 Team Dashboard">Team Dashboard</TextLink> ›
        <TextLink to="Lo-Fi/5 Invite Students/5.1 Class Link">Spring Game Makers</TextLink>
      </Crumbs>
      <Title>Send the Link by Email</Title>
      <Lead>We'll send the class link. Learners or parents still choose to join.</Lead>
    </div>
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Emails</span>
      <div :class="[s.row, s.wrap]" style="border: 1px solid #ccc; padding: 8px; gap: 6px">
        <Chip>maya.okafor@gmail.com</Chip>
        <Chip>lena.fischer@outlook.com</Chip>
        <Chip>dana.hill@yahoo.com</Chip>
        <Chip error>r.raman.icloud.com</Chip>
        <input :class="s.grow" style="border: 0; outline: 0; font: inherit" aria-label="Email" />
      </div>
      <span :class="s.error">r.raman.icloud.com is missing an @. Fix it or remove it.</span>
    </div>
    <Panel>
      <span :class="s.label">Preview</span>
      <span :class="s.label">
        Maya Okafor invited you to <strong>Spring Game Makers</strong>, a class of Explore: Threadbare on Endless. Join
        with code SPRING-GM: [Join the Class]
      </span>
    </Panel>
    <div :class="s.row" style="justify-content: flex-end">
      <Button variant="ghost" to="Lo-Fi/5 Invite Students/5.1 Class Link">Back</Button>
      <Button to="Lo-Fi/5 Invite Students/5.5 Team Dashboard">Send 3 Emails</Button>
    </div>
  </AppPage>
</template>
