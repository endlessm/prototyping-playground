<!-- @studio-id abcmq42p9gqmey7x -->
<!-- @lofi -->
<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import AppPage from '../_wire/AppPage.vue'
import Button from '../_wire/Button.vue'
import Card from '../_wire/Card.vue'
import Checkbox from '../_wire/Checkbox.vue'
import Crumbs from '../_wire/Crumbs.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Marker from '../_wire/Marker.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// One class link and code for the co-op's group chat. Each learner makes their own account.
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" active="Cohorts">
    <div :class="[s.stack, s.tight]">
      <Crumbs>Team Dashboard › Spring Game Makers</Crumbs>
      <Title :flow="5" :note="1">Bring Your Learners In</Title>
      <Lead>Share one link in your co-op group chat. Each learner makes their own account.</Lead>
    </div>
    <Card>
      <div :class="[s.stack, s.tight]">
        <span :class="s.small" style="font-size: 12px">Class Link</span>
        <div :class="s.row">
          <PrototypeLink
            to="5 Invite Students/5.3 Learner Joins"
            :class="[s.input, s.grow]"
            style="display: flex; align-items: center; background: #eee; color: inherit; text-decoration: none"
            title="Open the link as a learner"
          >
            studio.endlessstudios.com/signup?code=SPRING-GM
          </PrototypeLink>
          <Button>Copy Link</Button>
        </div>
      </div>
      <div :class="[s.row, s.spread]">
        <span :class="s.row">
          <span :class="s.label">Class Code</span>
          <strong style="font-size: 16px">SPRING-GM</strong>
        </span>
        <span :class="s.row">
          <Button variant="secondary">Show QR</Button>
          <Button variant="ghost">Reset Link</Button>
        </span>
      </div>
    </Card>
    <div :class="s.columns" style="gap: 14px">
      <Field label="Seats" hint="Max Number Of Users. The link stops at 5.">
        <template #note><Marker :flow="5" :n="2" /></template>
        <Input value="5" />
      </Field>
      <Field label="Link Expires" hint="A week after the first class.">
        <Input value="Mar 9, 2027" />
      </Field>
    </div>
    <Checkbox label="Approve each learner before they see the class" checked />
    <span :class="s.label">
      Prefer email? <TextLink to="5 Invite Students/5.2 Email the Link">Send the link by email</TextLink> ·
      <TextLink>Upload CSV</TextLink>
    </span>
    <div :class="s.row" style="align-items: flex-start">
      <div :class="s.grow">
        <Logic
          title="NDPA - review checked?"
          :rows="[{ label: 'Yes → no open link. Upload a CSV and Endless creates restricted accounts after review' }]"
        />
      </div>
      <Marker :flow="5" :n="3" />
    </div>
  </AppPage>
</template>
