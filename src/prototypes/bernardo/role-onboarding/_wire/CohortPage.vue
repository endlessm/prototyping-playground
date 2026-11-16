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
import Small from './Small.vue'
import Subtitle from './Subtitle.vue'
import Tabs from './Tabs.vue'
import TextLink from './TextLink.vue'
import Title from './Title.vue'
import Welcome from './Welcome.vue'
import { cohort, COHORT, learners, ORG, people, roles, sessions, TEAM, view, type RoleKey } from './world'
import s from './wire.module.css'

// The Cohort's page, before it starts, as each Cohort role sees it. `viewer` teamManager is Ben right after creating
// it (flow 6's last screen), already its Cohort Owner. Step 3 is the welcome, step 4 the first task (a modal), step 5
// after it. Tabs follow the role: Facilitators get Learners and Sessions, Cohort Managers add People and Reports,
// Cohort Owners add Settings.
const props = defineProps<{
  viewer: Extract<RoleKey, 'teamManager' | 'cohortOwner' | 'cohortManager' | 'facilitator'>
  step: 3 | 4 | 5
}>()

const navigate = usePrototypeNavigate()
const flow = roles[props.viewer].flow
const owner = props.viewer === 'teamManager' || props.viewer === 'cohortOwner'
const manager = owner || props.viewer === 'cohortManager'

const tabs = owner
  ? ['Learners', 'Sessions', 'People', 'Reports', 'Settings']
  : manager
    ? ['Learners', 'Sessions', 'People', 'Reports']
    : ['Learners', 'Sessions']
const tab = ref(props.step > 3 && props.viewer !== 'facilitator' ? 'People' : 'Learners')
const open = ref(props.step === 4)

const me = { ...roles[props.viewer].person, you: true }
const invited = (p: (typeof people)[keyof typeof people]) => ({ ...p, invited: true })
const sections = {
  owners:
    props.viewer === 'teamManager' ? [me] : props.viewer === 'cohortOwner' ? [people.ben, me] : [people.ben, people.sofia],
  managers:
    props.viewer === 'cohortManager'
      ? [me]
      : props.viewer === 'cohortOwner' && props.step === 5
        ? [invited(people.tom)]
        : props.viewer === 'facilitator'
          ? [people.tom]
          : [],
  facilitators: props.viewer === 'cohortManager' && props.step === 5 ? [invited(people.sam)] : [],
}
const joined = props.viewer === 'facilitator' && props.step === 5 ? learners : []
const link = `endlessstudios.com/join?code=${cohort.code}`

const gained = {
  label: 'Cohort Owner',
  lead: `You created ${COHORT} in ${TEAM}.`,
  steps: ['Add another Cohort Owner or Cohort Managers', 'Invite the Facilitators'],
  to: view('cohortOwner', 1),
}
</script>

<template>
  <AppPage
    :viewer="viewer"
    :place="COHORT"
    :extra="viewer === 'teamManager' ? [{ name: COHORT, role: 'Cohort Owner', level: 'Cohort' }] : undefined"
  >
    <div :class="[s.stack, s.tight]">
      <Crumbs>{{ viewer === 'teamManager' || viewer === 'cohortOwner' ? TEAM : `${TEAM} · ${ORG}` }}</Crumbs>
      <div :class="s.row">
        <Title>{{ COHORT }}</Title>
        <IconButton v-if="owner" label="Rename">✎</IconButton>
        <Badge>Starts {{ cohort.starts }}</Badge>
      </div>
      <Small>{{ cohort.program }} · {{ cohort.seats }} seats</Small>
    </div>

    <Welcome
      :role="viewer"
      :done="viewer !== 'teamManager' && step === 5"
      :note="viewer === 'teamManager' ? 5 : step === 3 ? 3 : undefined"
      :gained="viewer === 'teamManager' ? gained : undefined"
    />

    <Tabs v-model="tab" :tabs="tabs" />

    <section v-if="tab === 'Learners'" :class="[s.stack, s.tight]">
      <div :class="[s.row, s.spread]">
        <div :class="s.row">
          <Subtitle>Who's in</Subtitle>
          <Marker v-if="viewer === 'facilitator' && step === 5" :flow="9" :n="5" />
        </div>
        <Button variant="secondary" @click="open = true">Add Learners</Button>
      </div>
      <div :class="[s.row, s.small]">
        {{ joined.length }} of {{ cohort.seats }} seats
        <div :class="[s.roBar, s.grow]"><span :style="{ width: `${(joined.length / cohort.seats) * 100}%` }" /></div>
      </div>
      <table v-if="joined.length" :class="s.table">
        <thead>
          <tr><th>Learner</th><th>Email</th><th>Joined</th><th /></tr>
        </thead>
        <tbody>
          <tr v-for="l in joined" :key="l.email">
            <td>{{ l.name }}</td>
            <td>{{ l.email }}</td>
            <td>{{ l.joined }}</td>
            <td><TextLink>Remove</TextLink></td>
          </tr>
        </tbody>
      </table>
      <div v-else :class="s.roEmpty">No learners yet</div>
    </section>

    <section v-else-if="tab === 'Sessions'" :class="s.roRows">
      <div v-for="session in sessions" :key="session.n">
        <span :class="s.small" style="width: 48px">{{ session.date }}</span>
        <span :class="s.grow"><b>Session {{ session.n }}</b> · {{ session.question }}</span>
        <TextLink>Open</TextLink>
      </div>
    </section>

    <div v-else-if="tab === 'People'" :class="s.roSections">
      <RoleSection title="Cohort Owners" :people="sections.owners" :add="owner ? 'Add Cohort Owner' : undefined" @add="open = true" />
      <RoleSection
        title="Cohort Managers"
        :people="sections.managers"
        :add="owner ? 'Add Cohort Managers' : undefined"
        :remove="owner"
        :flow="flow"
        :note="viewer === 'cohortOwner' && step === 5 ? 5 : undefined"
        @add="open = true"
      />
      <RoleSection
        title="Facilitators"
        :people="sections.facilitators"
        add="Invite Facilitators"
        remove
        :flow="flow"
        :note="viewer === 'cohortManager' && step === 5 ? 5 : undefined"
        @add="open = true"
      />
    </div>

    <div v-else-if="tab === 'Reports'" :class="s.roEmpty">Reports start on {{ cohort.starts }}, with the first session.</div>

    <div v-else-if="tab === 'Settings'" :class="s.stack">
      <Field label="Cohort name"><Input :value="COHORT" /></Field>
      <div :class="s.columns">
        <Field label="Start date"><Input :value="cohort.starts" /></Field>
        <Field label="Seats"><Input :value="String(cohort.seats)" /></Field>
      </div>
      <Field label="Join link expires"><Input :value="cohort.linkExpires" /></Field>
      <Button variant="secondary" style="align-self: flex-start">Archive Cohort</Button>
    </div>

    <template #overlay>
      <template v-if="open">
        <AwardModal
          v-if="viewer === 'cohortOwner'"
          title="Add Cohort Managers"
          :roles="['Cohort Manager', 'Cohort Owner']"
          :emails="[people.tom.email]"
          :next="view('cohortOwner', 5)"
          :flow="7"
          :note="4"
          @close="open = false"
        />
        <AwardModal
          v-else-if="viewer === 'cohortManager'"
          title="Invite Facilitators"
          :roles="['Facilitator']"
          :emails="[people.sam.email]"
          :next="view('cohortManager', 5)"
          :flow="8"
          :note="4"
          @close="open = false"
        />
        <Modal v-else-if="viewer === 'facilitator'" title="Add Learners" :width="480" @close="open = false">
          <div :class="s.row">
            <span :class="s.label">Join link</span>
            <Marker :flow="9" :n="4" />
          </div>
          <div :class="s.row">
            <Input :value="link" locked />
            <Button variant="secondary">Copy Link</Button>
          </div>
          <Small>Code {{ cohort.code }} · Works until {{ cohort.linkExpires }} or until the {{ cohort.seats }} seats are taken</Small>
          <Small>Have a class list? <TextLink>Upload CSV</TextLink></Small>
          <template #footer>
            <Button @click="navigate(view('facilitator', 5))">Done</Button>
          </template>
        </Modal>
      </template>
    </template>
  </AppPage>
</template>
