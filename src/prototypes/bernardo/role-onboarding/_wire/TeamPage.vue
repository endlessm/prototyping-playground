<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { ref } from 'vue'
import AppPage from './AppPage.vue'
import AwardModal from './AwardModal.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import Crumbs from './Crumbs.vue'
import Field from './Field.vue'
import IconButton from './IconButton.vue'
import Input from './Input.vue'
import Marker from './Marker.vue'
import Modal from './Modal.vue'
import RoleSection from './RoleSection.vue'
import Select from './Select.vue'
import Subtitle from './Subtitle.vue'
import Tabs from './Tabs.vue'
import Title from './Title.vue'
import Welcome from './Welcome.vue'
import { cohort, COHORT, INDIE_TEAM, ORG, people, PROGRAM, roles, TEAM, view, type RoleKey } from './world'
import s from './wire.module.css'

// The Team's page as each Team role sees it. `viewer` orgEducator is Daniel right after creating the Team (flow 4's
// last screen), already its Team Owner. Step 3 is the welcome, step 4 the first task (a modal), step 5 after it.
// Daniel's steps 6 and 7 create an Independent Team from the switcher, then open it.
const props = defineProps<{ viewer: Extract<RoleKey, 'orgEducator' | 'teamOwner' | 'teamManager'>; step: 3 | 4 | 5 | 6 | 7 }>()

const indie = props.step === 7
const team = indie ? INDIE_TEAM : TEAM
const ownTeams =
  props.viewer !== 'orgEducator'
    ? undefined
    : [
        { name: TEAM, role: 'Team Owner', level: 'Team' as const },
        ...(indie ? [{ name: INDIE_TEAM, role: 'Team Owner', level: 'Team' as const, independent: true }] : []),
      ]

const navigate = usePrototypeNavigate()
const flow = roles[props.viewer].flow
const owner = props.viewer !== 'teamManager'

const tabs = owner ? ['Cohorts', 'People', 'Reports', 'Settings'] : ['Your Cohorts', 'People']
const tab = ref(props.viewer === 'teamOwner' && props.step > 3 ? 'People' : tabs[0])
const open = ref(props.step === 4 && props.viewer !== 'orgEducator')

// Daniel's Winter Godot Club is the Team's one Cohort when Aisha arrives; Daniel's own new Team has none yet, and
// a Team Manager sees only the Cohorts he owns.
const list = props.viewer === 'teamOwner' ? [{ name: 'Winter Godot Club', owners: 'Daniel Reyes', status: 'Session 2 of 10', learners: 17 }] : []

const me = { ...roles[props.viewer].person, you: true }
const sections = {
  owners: props.viewer === 'orgEducator' ? [me] : props.viewer === 'teamOwner' ? [people.daniel, me] : [people.daniel, people.aisha],
  managers: props.viewer === 'teamManager' ? [me] : props.step === 5 ? [{ ...people.ben, invited: true }] : [],
}

const gained = indie
  ? { label: 'Team Owner', lead: `You created ${INDIE_TEAM}, an Independent Team.`, steps: ['Create the first Cohort', 'Add Team Managers'] }
  : {
      label: 'Team Owner',
      lead: `You created ${TEAM}. It belongs to ${ORG}.`,
      steps: ['Add another Team Owner or Team Managers', 'Create the first Cohort'],
      to: view('teamOwner', 1),
    }
</script>

<template>
  <AppPage
    :viewer="viewer"
    :place="team"
    :extra="ownTeams"
    :creating="viewer === 'orgEducator' && step === 6 ? 'independent' : undefined"
    :created-to="view('orgEducator', 7)"
    :flow="4"
    :note="6"
  >
    <div :class="[s.stack, s.tight]">
      <Crumbs v-if="!indie">{{ ORG }}</Crumbs>
      <div :class="s.row">
        <Title>{{ team }}</Title>
        <IconButton v-if="owner" label="Rename">✎</IconButton>
        <Badge v-if="indie" tone="outline">Independent</Badge>
        <Marker v-if="indie" :flow="4" :n="7" />
      </div>
    </div>

    <Welcome
      :role="viewer"
      :done="viewer !== 'orgEducator' && step === 5"
      :note="viewer === 'orgEducator' && step === 5 ? 5 : step === 3 ? 3 : undefined"
      :gained="viewer === 'orgEducator' ? gained : undefined"
    />

    <Tabs v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'Cohorts' || tab === 'Your Cohorts'">
      <div v-if="!list.length" :class="s.roEmpty">
        <Subtitle>{{ viewer === 'teamManager' ? "You haven't created a Cohort yet" : 'No Cohorts yet' }}</Subtitle>
        <Button :variant="viewer === 'teamManager' ? 'primary' : 'secondary'" @click="viewer === 'teamManager' && (open = true)">
          Create a Cohort
        </Button>
      </div>
      <template v-else>
        <div :class="[s.row, s.spread]">
          <span />
          <Button variant="secondary">Create a Cohort</Button>
        </div>
        <table :class="s.table">
          <thead>
            <tr><th>Cohort</th><th>Program</th><th>Cohort Owners</th><th>Status</th><th>Learners</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in list" :key="c.name">
              <td :class="s.link">{{ c.name }}</td>
              <td>{{ PROGRAM }}</td>
              <td>{{ c.owners }}</td>
              <td><Badge>{{ c.status }}</Badge></td>
              <td>{{ c.learners }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </template>

    <div v-else-if="tab === 'People'" :class="s.roSections">
      <RoleSection title="Team Owners" :people="sections.owners" :add="owner ? 'Add Team Owner' : undefined" @add="open = true" />
      <RoleSection
        title="Team Managers"
        :people="sections.managers"
        :add="owner ? 'Add Team Managers' : undefined"
        :remove="owner"
        :flow="flow"
        :note="viewer === 'teamOwner' && step === 5 ? 5 : undefined"
        @add="open = true"
      />
    </div>

    <template v-else-if="tab === 'Reports'">
      <div :class="s.roStats">
        <div><span :class="s.small">Cohorts</span><strong>{{ list.length }}</strong></div>
        <div><span :class="s.small">Learners</span><strong>{{ list.length ? 17 : 0 }}</strong></div>
        <div><span :class="s.small">Average progress</span><strong>{{ list.length ? '18%' : '–' }}</strong></div>
        <div><span :class="s.small">Certificates</span><strong>0</strong></div>
      </div>
    </template>

    <div v-else-if="tab === 'Settings'" :class="s.stack">
      <Field label="Team name"><Input :value="team" /></Field>
      <Button variant="secondary" style="align-self: flex-start">Archive Team</Button>
    </div>

    <template #overlay>
      <template v-if="open && step === 4">
        <AwardModal
          v-if="viewer === 'teamOwner'"
          title="Add Team Managers"
          :roles="['Team Manager', 'Team Owner']"
          :emails="[people.ben.email]"
          :next="view('teamOwner', 5)"
          :flow="5"
          :note="4"
          @close="open = false"
        />
        <Modal v-else-if="viewer === 'teamManager'" title="Create a Cohort" :width="460" @close="open = false">
          <Field label="Cohort name">
            <template #note><Marker :flow="6" :n="4" /></template>
            <Input :value="COHORT" active />
          </Field>
          <Field label="Program">
            <Select :options="['Explore: Threadbare', 'Explore: Godot', 'Core: Threadbare']" :value="PROGRAM" />
          </Field>
          <div :class="s.columns">
            <Field label="Start date"><Input :value="cohort.starts" /></Field>
            <Field label="Seats"><Input :value="String(cohort.seats)" /></Field>
          </div>
          <template #footer>
            <Button variant="secondary" @click="open = false">Cancel</Button>
            <Button @click="navigate(view('teamManager', 5))">Create Cohort</Button>
          </template>
        </Modal>
      </template>
    </template>
  </AppPage>
</template>
