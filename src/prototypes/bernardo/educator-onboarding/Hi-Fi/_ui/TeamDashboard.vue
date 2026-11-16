<script setup lang="ts">
import { computed, ref } from 'vue'
import AppPage from './AppPage.vue'
import Avatar from './Avatar.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import Card from './Card.vue'
import Chip from './Chip.vue'
import CohortList from './CohortList.vue'
import type { CohortStart } from './cohort'
import CreateCohort from './CreateCohort.vue'
import Icon from './Icon.vue'
import IconButton from './IconButton.vue'
import Lead from './Lead.vue'
import Marker from './Marker.vue'
import PageTabs from './PageTabs.vue'
import RenameTeamModal from './RenameTeamModal.vue'
import Small from './Small.vue'
import Spot from './Spot.vue'
import Subtitle from './Subtitle.vue'
import Title from './Title.vue'
import { type Cohort, members, type Viewer } from './team'
import s from './ui.module.css'

type Tab = 'cohorts' | 'settings'
type Open = 'rename' | CohortStart | null

// The Team Dashboard: the team's name, then two tabs. Cohorts lists the cohorts this person can see: all of them
// for the Team Leader, only the ones they created or were added to for a Team Member. Team Settings lists the
// members; only the Team Leader renames the team or invites members. Rename and Create Cohort open over it.
const props = withDefaults(
  defineProps<{
    team: string
    viewer?: Viewer
    tab?: Tab
    /** The cohorts this viewer can see. */
    cohorts?: Cohort[]
    /** The one-time banner: the team made for a new educator, or the team a Team Member just joined. */
    banner?: 'made' | 'joined'
    open?: Open
    /** The name already typed in the rename modal, for its error state. */
    draft?: string
    /** Views the tabs open; a tab without one switches in place. */
    tabLinks?: Partial<Record<Tab, string>>
    /** A team of one, just made: Maya is its only member. */
    solo?: boolean
    /** Where the sidebar's Team Dashboard goes. */
    home?: string
    /** Show the flow's design markers. */
    walkthrough?: boolean
  }>(),
  { viewer: 'leader', tab: 'cohorts', cohorts: () => [], open: null },
)

const team = ref(props.team)
const tab = ref<Tab>(props.tab)
const banner = ref(props.banner)
const open = ref<Open>(props.open)
const draft = ref(props.draft)

const leader = computed(() => props.viewer === 'leader')
const people = computed(() => (props.solo ? members.slice(0, 1) : members))
const tabs = computed(() => [
  { id: 'cohorts', label: 'Cohorts', to: props.tabLinks?.cohorts },
  { id: 'settings', label: 'Team Settings', to: props.tabLinks?.settings },
])

function close() {
  open.value = null
  draft.value = undefined
}

function rename(name: string) {
  team.value = name
  if (banner.value === 'made') banner.value = undefined
  close()
}
</script>

<template>
  <AppPage :team="team" :initials="leader ? 'MO' : 'DF'" :links="home ? { 'Team Dashboard': home } : undefined">
    <div
      v-if="banner"
      :class="[s.panel, s.row]"
      style="border: 1px solid var(--es-border); border-radius: 16px; color: var(--es-text)"
    >
      <Icon :name="banner === 'made' ? 'i-lucide-sparkles' : 'i-lucide-user-plus'" />
      <Marker v-if="walkthrough && banner === 'made'" :flow="3" :n="2" />
      <span v-if="banner === 'made'" :class="s.grow">
        We made a team for you: <strong>{{ team }}</strong>. It keeps your cohorts in one place, and you lead it.
      </span>
      <Marker v-if="walkthrough && banner === 'joined'" :flow="3" :n="7" />
      <span v-if="banner === 'joined'" :class="s.grow">
        You joined <strong>{{ team }}</strong> as a Team Member. Maya Okafor invited you.
      </span>
      <Button v-if="banner === 'made'" variant="secondary" @click="open = 'rename'">Rename</Button>
      <Button v-else variant="ghost" @click="banner = undefined">Dismiss</Button>
    </div>

    <div :class="[s.row, s.spread]" style="align-items: flex-start">
      <div :class="[s.stack, s.tight]">
        <div :class="s.row">
          <Title>{{ team }}</Title>
          <IconButton v-if="leader" label="Rename team" icon="i-lucide-pencil" @click="open = 'rename'" />
        </div>
        <Lead>Team Dashboard</Lead>
      </div>
      <Button v-if="tab === 'cohorts' && cohorts.length" variant="secondary" @click="open = 'choose'">
        Create Cohort
      </Button>
    </div>

    <div :class="s.row">
      <PageTabs :tabs="tabs" :active="tab" @select="tab = $event as Tab" />
      <Marker v-if="walkthrough && tab === 'cohorts' && cohorts.length" :flow="3" :n="5" />
    </div>

    <template v-if="tab === 'cohorts'">
      <CohortList v-if="cohorts.length" :cohorts="cohorts" :walkthrough="walkthrough" />
      <Card v-else style="align-items: center; text-align: center; padding: 32px 16px">
        <Spot icon="i-lucide-users" />
        <div :class="s.row">
          <Subtitle>No cohorts yet</Subtitle>
          <Marker v-if="walkthrough && leader" :flow="3" :n="3" />
        </div>
        <Lead v-if="leader">
          A cohort is one class: a group of learners going through one
          <br />
          program together.
        </Lead>
        <Lead v-else>
          The cohorts you create show up here, and so do the ones
          <br />
          a teammate adds you to.
        </Lead>
        <Button @click="open = leader ? 'link' : 'choose'">Create Your First Cohort</Button>
      </Card>
    </template>

    <template v-else>
      <div :class="[s.stack, s.tight]">
        <span :class="s.label">Members</span>
        <div
          :class="s.list"
          style="border: 1px solid var(--es-border); border-radius: 16px; padding: 0 12px; background: #fff"
        >
          <div v-for="member in people" :key="member.email">
            <span :class="s.row">
              <Avatar>{{ member.initials }}</Avatar>
              <span>
                <span style="display: block">{{ member.name }}</span>
                <Small>{{ member.email }}</Small>
              </span>
            </span>
            <Badge tone="outline">{{ member.role }}</Badge>
          </div>
        </div>
      </div>

      <div v-if="leader" :class="[s.stack, s.tight]">
        <span :class="[s.row, s.label]">
          Invite Team Members
          <Marker v-if="walkthrough" :flow="3" :n="6" />
        </span>
        <div
          :class="[s.row, s.wrap]"
          style="border: 1px solid var(--es-border); border-radius: 16px; padding: 6px; gap: 6px"
        >
          <Chip>jo.park@gmail.com</Chip>
          <Chip error>rob.hill@gmail</Chip>
          <input :class="s.grow" style="border: 0; outline: 0; font: inherit" aria-label="Email" />
        </div>
        <span :class="s.error">rob.hill@gmail isn't a complete email address.</span>
        <div :class="s.row" style="justify-content: flex-end">
          <Button variant="disabled">Send Invites</Button>
        </div>
      </div>
      <Small v-else>Only Maya Okafor, the Team Leader, can rename the team or invite members.</Small>
    </template>

    <slot />

    <template #overlay>
      <RenameTeamModal v-if="open === 'rename'" :name="draft ?? team" @save="rename" @close="close" />
      <CreateCohort v-else-if="open" :start="open" @close="close" />
    </template>
  </AppPage>
</template>
