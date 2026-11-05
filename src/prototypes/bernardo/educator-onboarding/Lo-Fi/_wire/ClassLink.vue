<script setup lang="ts">
import { ref } from 'vue'
import AppPage from './AppPage.vue'
import Button from './Button.vue'
import Card from './Card.vue'
import Checkbox from './Checkbox.vue'
import Crumbs from './Crumbs.vue'
import Field from './Field.vue'
import Input from './Input.vue'
import Lead from './Lead.vue'
import Logic from './Logic.vue'
import Marker from './Marker.vue'
import TextLink from './TextLink.vue'
import Title from './Title.vue'
import type { CsvStep } from './csv'
import UploadCsvModal from './UploadCsvModal.vue'
import s from './wire.module.css'

// One class link and code for the co-op's group chat. Upload CSV opens the class-list modal over this page;
// `csv` starts with it open at that step.
const props = defineProps<{ csv?: CsvStep; walkthrough?: boolean }>()

const csv = ref<CsvStep | null>(props.csv ?? null)
</script>

<template>
  <AppPage team="Okafor Homeschool Co-op" active="Cohorts" :links="{ 'Team Dashboard': 'Lo-Fi/5 Invite Students/5.5 Team Dashboard', Cohorts: 'Lo-Fi/5 Invite Students/5.1 Class Link' }">
    <div :class="[s.stack, s.tight]">
      <Crumbs><TextLink to="Lo-Fi/5 Invite Students/5.5 Team Dashboard">Team Dashboard</TextLink> › Spring Game Makers</Crumbs>
      <Title :flow="walkthrough ? 5 : undefined" :note="1">Bring Your Learners In</Title>
      <Lead>Share one link in your co-op group chat. Each learner makes their own account.</Lead>
    </div>
    <Card>
      <div :class="[s.stack, s.tight]">
        <span :class="s.small" style="font-size: 12px">Class Link</span>
        <div :class="s.row">
          <span :class="[s.input, s.grow]" style="display: flex; align-items: center; background: #eee">
            studio.endlessstudios.com/signup?code=SPRING-GM
          </span>
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
        <template v-if="walkthrough" #note><Marker :flow="5" :n="2" /></template>
        <Input value="5" />
      </Field>
      <Field label="Link Expires" hint="A week after the first class.">
        <Input value="Mar 9, 2027" />
      </Field>
    </div>
    <Checkbox label="Approve each learner before they see the class" checked />
    <span :class="s.label">
      Prefer email? <TextLink to="Lo-Fi/5 Invite Students/5.2 Email the Link">Send the link by email</TextLink> ·
      <TextLink @click="csv = 'choose'">Upload CSV</TextLink>
    </span>
    <Logic
      v-if="walkthrough"
      title="NDPA - review checked?"
      :flow="5"
      :note="3"
      :rows="[
        {
          label: 'Yes → no open link. Upload a CSV and Endless creates restricted accounts after review',
          to: 'Lo-Fi/5 Invite Students/5.3 Upload CSV',
        },
      ]"
    />

    <template #overlay>
      <UploadCsvModal v-if="csv" :step="csv" :walkthrough="walkthrough" @close="csv = null" />
    </template>
  </AppPage>
</template>
