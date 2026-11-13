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
import { cohort, COHORT, ORG, people, PROGRAM, roles, TEAM, view, type RoleKey } from './world'
import s from './wire.module.css'

// The Team's page as each Team role sees it. Step 3 is the welcome, step 4 the first task (a modal), step 5 after it.
const props = defineProps<{ viewer: Extract<RoleKey, 'teamOwner' | 'teamManager'>; step: 3 | 4 | 5 }>()

const navigate = usePrototypeNavigate()
const flow = roles[props.viewer].flow
const owner = props.viewer === 'teamOwner'

const tabs = owner ? ['Cohorts', 'People', 'Reports', 'Settings'] : ['Cohorts', 'People']
const tab = ref(owner && props.step > 3 ? 'People' : tabs[0])
const open = ref(props.step === 4)

// Aisha arrives at a Team Marcus has just created, so it has no Cohorts yet. By the time Ben accepts, Daniel (the
// other Team Manager) has created Winter Godot Club, and Ben sees it too: a Team Manager sees every Cohort in the Team.
const list = owner ? [] : [{ name: 'Winter Godot Club', owners: 'Daniel Reyes', status: 'Session 2 of 10', learners: 17 }]

const me = { ...roles[props.viewer].person, you: true }
const invited = (p: (typeof people)[keyof typeof people]) => ({ ...p, invited: true })
const sections = {
  owners: owner ? [me] : [people.aisha],
  managers: owner ? (props.step === 5 ? [invited(people.ben), invited(people.daniel)] : []) : [people.daniel, me],
}
</script>

<template>
  <AppPage :viewer="viewer" :place="TEAM">
    <div :class="[s.stack, s.tight]">
      <Crumbs>{{ ORG }}</Crumbs>
      <div :class="s.row">
        <Title>{{ TEAM }}</Title>
        <IconButton v-if="owner" label="Rename">✎</IconButton>
      </div>
    </div>

    <Welcome :role="viewer" :done="step === 5" :note="step === 3 ? 3 : undefined" />

    <Tabs v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'Cohorts'">
      <div v-if="!list.length" :class="s.roEmpty">
        <Subtitle>No Cohorts yet</Subtitle>
        <Button variant="secondary">Create a Cohort</Button>
      </div>
      <template v-else>
        <div :class="[s.row, s.spread]">
          <span />
          <Button @click="open = true">Create a Cohort</Button>
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
        :note="owner && step === 5 ? 5 : undefined"
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
      <Field label="Team name"><Input :value="TEAM" /></Field>
      <Button variant="secondary" style="align-self: flex-start">Archive Team</Button>
    </div>

    <template #overlay>
      <template v-if="open && step === 4">
        <AwardModal
          v-if="owner"
          title="Add Team Managers"
          :roles="['Team Manager', 'Team Owner']"
          :emails="[people.ben.email, people.daniel.email]"
          :next="view('teamOwner', 5)"
          :flow="flow"
          :note="4"
          @close="open = false"
        />
        <Modal v-else title="Create a Cohort" :width="460" @close="open = false">
          <Field label="Cohort name">
            <template #note><Marker :flow="flow" :n="4" /></template>
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
