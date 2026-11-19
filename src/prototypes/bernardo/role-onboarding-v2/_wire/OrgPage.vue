<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { ref } from 'vue'
import AppPage from './AppPage.vue'
import AwardModal from './AwardModal.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import CreateTeamModal from './CreateTeamModal.vue'
import Crumbs from './Crumbs.vue'
import Field from './Field.vue'
import IconButton from './IconButton.vue'
import Input from './Input.vue'
import Marker from './Marker.vue'
import RoleSection from './RoleSection.vue'
import Small from './Small.vue'
import Subtitle from './Subtitle.vue'
import Tabs from './Tabs.vue'
import TextLink from './TextLink.vue'
import Title from './Title.vue'
import Welcome from './Welcome.vue'
import { cohorts, ORG, people, roles, TEAM, teams, view, type RoleKey } from './world'
import s from './wire.module.css'

// The Organization's page as each Organization role sees it. Step 3 is the welcome, step 4 the role's first task (a
// modal over the page), step 5 the page after it. The Org Reviewer's step 4 is a Team's report instead. The Org
// Manager's steps 6 and 7 create the district's first Team and name its Team Owner (Create a Team open, then the
// Teams tab with it).
const props = defineProps<{
  viewer: Extract<RoleKey, 'orgOwner' | 'orgManager' | 'orgReviewer'>
  step: 3 | 4 | 5 | 6 | 7
}>()

const flow = roles[props.viewer].flow

const tabsBy = {
  orgOwner: ['Teams', 'People', 'Programs', 'Settings'],
  orgManager: ['Teams', 'People', 'Programs'],
  orgReviewer: ['Reports'],
}
const tabs = tabsBy[props.viewer]
const peopleFirst = (props.step === 4 || props.step === 5) && (props.viewer === 'orgOwner' || props.viewer === 'orgManager')
const tab = ref(peopleFirst ? 'People' : tabs[0])
// Each add button opens the modal for its own role. Step 4 opens the role's first task with the flow's next person's
// name half typed, so the search dropdown shows: Marcus for the Org Owner, Linda for the Org Manager.
const firstRole = props.viewer === 'orgOwner' ? 'Org Manager' : 'Org Reviewer'
const adding = ref<string | null>(props.step === 4 && props.viewer !== 'orgReviewer' ? firstRole : null)
const queries: Record<string, string> = { 'Org Manager': 'mar', 'Org Reviewer': 'lin' }
const creating = ref(props.step === 6)
const created = props.viewer === 'orgManager' && props.step === 7

const owner = props.viewer === 'orgOwner'
const you = (key: RoleKey) => ({ ...roles[key].person, you: props.viewer === key })
const invited = (p: (typeof people)[keyof typeof people]) => ({ ...p, invited: true })

const sections = {
  owners: [you('orgOwner')],
  managers: owner ? (props.step === 5 ? [invited(people.marcus)] : []) : [you('orgManager')],
  reviewers: props.viewer === 'orgManager' && props.step >= 5 ? [invited(people.linda)] : [],
}
const holders: Record<string, { email: string }[]> = {
  'Org Owner': sections.owners,
  'Org Manager': sections.managers,
  'Org Reviewer': sections.reviewers,
}
const scripted = (role: string) => props.step === 4 && role === firstRole

// Reviewer reports: aggregated only, once the flows are done, with two Teams under way.
const reportTeams = teams
const sum = (key: 'cohorts' | 'learners' | 'certificates') => teams.reduce((total, t) => total + t[key], 0)
const totals = { teams: teams.length, cohorts: sum('cohorts'), learners: sum('learners'), certificates: sum('certificates') }
const reportTeam = teams.find((t) => t.name === TEAM)
const reportCohorts = cohorts.filter((c) => c.team === TEAM)
const programs = ['Explore: Threadbare', 'Explore: Godot', 'Core: Threadbare']
</script>

<template>
  <AppPage :viewer="viewer" :place="ORG">
    <div :class="[s.stack, s.tight]">
      <Crumbs v-if="viewer === 'orgReviewer' && step === 4">
        <TextLink :to="view('orgReviewer', 3)">Reports</TextLink> › {{ TEAM }}
      </Crumbs>
      <div :class="s.row">
        <Title>{{ viewer === 'orgReviewer' && step === 4 ? TEAM : ORG }}</Title>
        <IconButton v-if="owner" label="Rename">✎</IconButton>
        <Badge v-if="viewer === 'orgReviewer'" tone="outline">View only</Badge>
        <Marker v-if="viewer === 'orgReviewer' && step === 4" :flow="flow" :n="4" />
      </div>
    </div>

    <Welcome v-if="!(viewer === 'orgReviewer' && step === 4)" :role="viewer" :done="step >= 5" :note="step === 3 ? 3 : undefined" />

    <template v-if="viewer === 'orgReviewer'">
      <template v-if="step === 3">
        <Tabs v-model="tab" :tabs="tabs" />
        <div :class="s.roStats">
          <div><span :class="s.small">Teams</span><strong>{{ totals.teams }}</strong></div>
          <div><span :class="s.small">Cohorts</span><strong>{{ totals.cohorts }}</strong></div>
          <div><span :class="s.small">Learners</span><strong>{{ totals.learners }}</strong></div>
          <div><span :class="s.small">Certificates</span><strong>{{ totals.certificates }}</strong></div>
        </div>
        <table :class="s.table">
          <thead>
            <tr><th>Team</th><th>Cohorts</th><th>Learners</th><th>Average progress</th><th>Certificates</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in reportTeams" :key="t.name">
              <td>
                <PrototypeLink v-if="t.name === TEAM" :to="view('orgReviewer', 4)" :class="s.link">{{ t.name }}</PrototypeLink>
                <span v-else>{{ t.name }}</span>
              </td>
              <td>{{ t.cohorts }}</td>
              <td>{{ t.learners }}</td>
              <td><div :class="s.roBar"><span :style="{ width: `${t.progress}%` }" /></div></td>
              <td>{{ t.certificates }}</td>
            </tr>
          </tbody>
        </table>
      </template>
      <template v-else>
        <div :class="s.roStats">
          <div><span :class="s.small">Cohorts</span><strong>{{ reportTeam?.cohorts }}</strong></div>
          <div><span :class="s.small">Learners</span><strong>{{ reportTeam?.learners }}</strong></div>
          <div><span :class="s.small">Average progress</span><strong>{{ reportTeam?.progress }}%</strong></div>
          <div><span :class="s.small">Certificates</span><strong>{{ reportTeam?.certificates }}</strong></div>
        </div>
        <table :class="s.table">
          <thead>
            <tr><th>Cohort</th><th>Program</th><th>Status</th><th>Learners</th><th>Average progress</th><th>Certificates</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in reportCohorts" :key="c.name">
              <td>{{ c.name }}</td>
              <td>{{ c.program }}</td>
              <td>{{ c.status }}</td>
              <td>{{ c.learners }}</td>
              <td><div :class="s.roBar"><span :style="{ width: `${c.progress}%` }" /></div></td>
              <td>{{ c.certificates || '–' }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </template>

    <template v-else>
      <Tabs v-model="tab" :tabs="tabs" />

      <template v-if="tab === 'Teams'">
        <template v-if="created">
          <div :class="[s.row, s.spread]">
            <div :class="s.row">
              <Subtitle>Teams</Subtitle>
              <Marker :flow="2" :n="7" />
            </div>
            <Button variant="secondary" @click="creating = true">Create a Team</Button>
          </div>
          <table :class="s.table">
            <thead>
              <tr><th>Team</th><th>Team Owners</th><th>Cohorts</th><th>Learners</th></tr>
            </thead>
            <tbody>
              <tr>
                <td :class="s.link">{{ TEAM }}</td>
                <td>{{ people.aisha.name }} <Badge>Invited</Badge></td>
                <td>0</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </template>
        <div v-else :class="s.roEmpty">
          <Subtitle>No Teams yet</Subtitle>
          <Button :variant="viewer === 'orgOwner' ? 'secondary' : 'primary'" @click="creating = true">Create a Team</Button>
        </div>
      </template>

      <div v-else-if="tab === 'People'" :class="s.roSections">
        <RoleSection
          title="Org Owners"
          :people="sections.owners"
          :add="owner ? 'Add Org Owner' : undefined"
          @add="adding = 'Org Owner'"
        />
        <RoleSection
          title="Org Managers"
          :people="sections.managers"
          :add="owner ? 'Add Org Managers' : undefined"
          :remove="owner"
          :flow="flow"
          :note="owner && step === 5 ? 5 : undefined"
          @add="adding = 'Org Manager'"
        />
        <RoleSection
          title="Org Reviewers"
          :people="sections.reviewers"
          add="Add Org Reviewers"
          remove
          :flow="flow"
          :note="!owner && step === 5 ? 5 : undefined"
          @add="adding = 'Org Reviewer'"
        />
      </div>

      <div v-else-if="tab === 'Programs'" :class="s.roSections">
        <section :class="[s.stack, s.tight]">
          <Subtitle>Open to everyone</Subtitle>
          <div :class="s.roRows">
            <div v-for="p in programs" :key="p">{{ p }}</div>
          </div>
        </section>
        <section :class="[s.stack, s.tight]">
          <div :class="[s.row, s.spread]">
            <Subtitle>Custom Programs</Subtitle>
            <Button variant="secondary">Request a Partnership</Button>
          </div>
          <div :class="s.roRows"><div style="color: #999">None yet</div></div>
        </section>
      </div>

      <div v-else-if="tab === 'Settings'" :class="s.stack">
        <Field label="Organization name"><Input :value="ORG" /></Field>
        <Small>Only Endless Access archives an Organization.</Small>
      </div>
    </template>

    <template #overlay>
      <AwardModal
        v-if="adding"
        :key="adding"
        :role="adding"
        :holders="holders[adding]"
        :query="scripted(adding) ? queries[adding] : undefined"
        :next="scripted(adding) ? view(viewer, 5) : undefined"
        :flow="flow"
        :note="scripted(adding) ? 4 : undefined"
        @close="adding = null"
      />
      <CreateTeamModal
        v-else-if="creating"
        :viewer="viewer"
        where="org"
        :name="viewer === 'orgManager' ? TEAM : undefined"
        :owners="viewer === 'orgManager' ? [people.aisha.email] : undefined"
        :next="viewer === 'orgManager' ? view('orgManager', 7) : undefined"
        :flow="flow"
        :note="viewer === 'orgManager' && step === 6 ? 6 : undefined"
        @close="creating = false"
      />
    </template>
  </AppPage>
</template>
