<script setup lang="ts">
import { computed, ref } from 'vue'
import AppPage from './AppPage.vue'
import AddManagersModal from './AddManagersModal.vue'
import Avatar from './Avatar.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import CohortFinished from './CohortFinished.vue'
import CohortRunning from './CohortRunning.vue'
import CohortStartingSoon from './CohortStartingSoon.vue'
import CreateCohort from './CreateCohort.vue'
import Crumbs from './Crumbs.vue'
import Field from './Field.vue'
import Input from './Input.vue'
import InviteFacilitatorsModal from './InviteFacilitatorsModal.vue'
import JoinLinkCard from './JoinLinkCard.vue'
import Lead from './Lead.vue'
import Marker from './Marker.vue'
import PageTabs from './PageTabs.vue'
import Small from './Small.vue'
import Subtitle from './Subtitle.vue'
import TextLink from './TextLink.vue'
import Title from './Title.vue'
import type { CsvStep } from './csv'
import { type Cohort, learners, members, springGameMakers, type Stage, TEAM } from './team'
import UploadCsvModal from './UploadCsvModal.vue'
import s from './ui.module.css'

type Tab = 'learners' | 'people' | 'settings'
type People = 'managers' | 'facilitators'

// One cohort, seen by someone who manages it, in three tabs. Learners: the join link with its seats and expiry,
// and who's in; anyone with the link joins straight away, with no approval step. Managers & Facilitators: the
// Team Members who manage it and the Facilitators who run it, each added in a modal. Settings: name, start date,
// seats and the link's expiry. Upload CSV opens the class-list modal over the Learners tab; `csv` starts with it
// open at that step. With a `stage`, the Learners tab is that stage's page (5.7 to 5.9) and the title says it.
const props = withDefaults(
  defineProps<{
    cohort?: Cohort
    stage?: Stage
    tab?: Tab
    /** Learners have joined, so the tab lists them. */
    joined?: boolean
    csv?: CsvStep
    /** A Managers & Facilitators modal already open. */
    people?: People
    /** Views the tabs open; a tab without one switches in place. */
    tabLinks?: Partial<Record<Tab, string>>
    walkthrough?: boolean
  }>(),
  { cohort: () => springGameMakers, tab: 'learners' },
)

const stages: Record<Stage, string> = { upcoming: 'Starting soon', running: 'Running', finished: 'Finished' }
const finished = computed(() => props.stage === 'finished')
const dates = computed(() => {
  if (props.stage === 'finished') return `${props.cohort.starts.split(',')[0]} to ${props.cohort.ended}`
  return `${props.stage === 'running' ? 'Started' : 'Starts'} ${props.cohort.starts}`
})
const managers = computed(() =>
  props.cohort.managers.map((name, index) => ({
    ...(members.find((member) => member.name === name) ?? { initials: '', email: '' }),
    name: name === 'Maya Okafor' ? `${name} (you)` : name,
    creator: index === 0,
  })),
)
const again = ref(false)

const tab = ref<Tab>(props.tab)
const csv = ref<CsvStep | null>(props.csv ?? null)
const people = ref<People | null>(props.people ?? null)
const taken = computed(() => (props.joined ? props.cohort.joined : 0))
const tabs = computed(() => [
  { id: 'learners', label: 'Learners', to: props.tabLinks?.learners },
  { id: 'people', label: 'Managers & Facilitators', to: props.tabLinks?.people },
  { id: 'settings', label: 'Settings', to: props.tabLinks?.settings },
])
</script>

<template>
  <AppPage :team="TEAM" :links="{ 'Team Dashboard': 'Hi-Fi/3 Create Team/3.4 Cohorts' }">
    <div :class="[s.stack, s.tight]">
      <Crumbs><TextLink to="Hi-Fi/3 Create Team/3.4 Cohorts">Team Dashboard</TextLink> › {{ cohort.name }}</Crumbs>
      <div :class="s.row">
        <Title>{{ cohort.name }}</Title>
        <Badge v-if="stage" :tone="stage === 'running' ? 'outline' : undefined">{{ stages[stage] }}</Badge>
      </div>
      <Lead>{{ cohort.program }} · {{ dates }}</Lead>
    </div>

    <PageTabs :tabs="tabs" :active="tab" @select="tab = $event as Tab" />

    <CohortStartingSoon
      v-if="tab === 'learners' && stage === 'upcoming'"
      :cohort="cohort"
      :walkthrough="walkthrough"
      @invite-facilitators="people = 'facilitators'"
    />
    <CohortRunning v-else-if="tab === 'learners' && stage === 'running'" :cohort="cohort" :walkthrough="walkthrough" />
    <CohortFinished
      v-else-if="tab === 'learners' && stage === 'finished'"
      :cohort="cohort"
      :walkthrough="walkthrough"
      @run-again="again = true"
    />

    <template v-else-if="tab === 'learners'">
      <div v-if="!joined" :class="[s.stack, s.tight]">
        <div :class="s.row">
          <Subtitle>Bring your learners in</Subtitle>
          <Marker v-if="walkthrough" :flow="5" :n="1" />
        </div>
        <Lead>Share one link in your co-op group chat. Each learner makes their own account and joins right away.</Lead>
      </div>
      <JoinLinkCard :cohort="cohort" :taken="taken" :main="!joined" :walkthrough="walkthrough && !joined" />

      <div v-if="joined" :class="[s.stack, s.tight]">
        <div :class="s.row">
          <span :class="s.label">Who's in</span>
          <Marker v-if="walkthrough" :flow="5" :n="5" />
        </div>
        <div :class="s.list" style="border: 1px solid var(--es-border); border-radius: 16px; padding: 0 12px; background: #fff">
          <div v-for="learner in learners" :key="learner.name">
            {{ learner.name }}
            <Badge :tone="learner.tone">{{ learner.status }}</Badge>
          </div>
        </div>
        <Small>
          Marcus's email bounced: <TextLink to="Hi-Fi/5 Cohort/5.2 Email the Link">Fix Email</TextLink> or send him the
          link another way.
        </Small>
      </div>

      <span :class="s.label">
        Prefer email? <TextLink to="Hi-Fi/5 Cohort/5.2 Email the Link">Send the link by email</TextLink> ·
        <TextLink @click="csv = 'choose'">Upload CSV</TextLink>
      </span>
    </template>

    <template v-else-if="tab === 'people'">
      <div :class="s.stack" style="gap: 40px">
        <div :class="[s.stack, s.tight]">
          <div :class="[s.row, s.spread]">
            <span :class="s.row">
              <span :class="s.label">Managers</span>
              <Marker v-if="walkthrough && !stage" :flow="5" :n="6" />
            </span>
            <Button
              v-if="!finished"
              variant="secondary"
              size="sm"
              class="shrink-0 whitespace-nowrap"
              @click="people = 'managers'"
            >
              Add Managers
            </Button>
          </div>
          <div :class="s.list" style="border: 1px solid var(--es-border); border-radius: 16px; padding: 0 12px; background: #fff">
            <div v-for="manager in managers" :key="manager.name">
              <span :class="s.row">
                <Avatar>{{ manager.initials }}</Avatar>
                <span>
                  <span style="display: block">{{ manager.name }}</span>
                  <Small>{{ manager.email }}</Small>
                </span>
              </span>
              <Badge v-if="manager.creator" tone="outline">Created it</Badge>
            </div>
          </div>
        </div>

        <div :class="[s.stack, s.tight]">
          <div :class="[s.row, s.spread]">
            <span :class="s.row">
              <span :class="s.label">Facilitators</span>
              <Marker v-if="walkthrough && !stage" :flow="5" :n="7" />
            </span>
            <Button
              v-if="!finished"
              variant="secondary"
              size="sm"
              class="shrink-0 whitespace-nowrap"
              @click="people = 'facilitators'"
            >
              Invite Facilitators
            </Button>
          </div>
          <div :class="s.list" style="border: 1px solid var(--es-border); border-radius: 16px; padding: 0 12px; background: #fff">
            <div v-for="facilitator in cohort.facilitators" :key="facilitator.email">
              <span :class="s.row">
                <Avatar>{{ facilitator.initials }}</Avatar>
                <span>
                  <span style="display: block">{{ facilitator.name }}</span>
                  <Small>{{ facilitator.email }}</Small>
                </span>
              </span>
              <Badge v-if="facilitator.invited">Invited</Badge>
            </div>
            <div v-if="!cohort.facilitators?.length">
              <Small>No facilitators yet.</Small>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div :class="s.row">
        <Subtitle>Cohort settings</Subtitle>
        <Marker v-if="walkthrough && !stage" :flow="5" :n="8" />
      </div>
      <div :class="s.columns" style="gap: 14px; align-items: start">
        <Field label="Cohort name">
          <Input :value="cohort.name" :locked="finished" />
        </Field>
        <Field label="Program" hint="Chosen when the cohort was created.">
          <Input :value="cohort.program" locked />
        </Field>
        <Field label="Start date" :hint="stage === 'running' ? 'The cohort has started.' : undefined">
          <Input :value="cohort.starts" :locked="stage === 'running' || finished" />
        </Field>
        <Field label="Seats" hint="The link stops working when every seat is taken.">
          <Input :value="String(cohort.seats)" :locked="finished" />
        </Field>
        <Field label="Link expires" hint="A week after the start date. Nobody can join with the link after it.">
          <Input :value="cohort.linkExpires" :locked="finished" />
        </Field>
      </div>
      <Small v-if="finished">This cohort has ended, so its details are kept as they were.</Small>
      <div v-else :class="s.row" style="justify-content: flex-end">
        <Button>Save Changes</Button>
      </div>
    </template>

    <template #overlay>
      <UploadCsvModal v-if="csv" :step="csv" :walkthrough="walkthrough" @close="csv = null" />
      <AddManagersModal v-else-if="people === 'managers'" @close="people = null" />
      <InviteFacilitatorsModal v-else-if="people === 'facilitators'" @close="people = null" />
      <CreateCohort v-else-if="again" start="again" @close="again = false" />
    </template>
  </AppPage>
</template>
