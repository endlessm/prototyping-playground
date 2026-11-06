<script setup lang="ts">
import { ref } from 'vue'
import AppPage from './AppPage.vue'
import Button from './Button.vue'
import Card from './Card.vue'
import type { CohortStart } from './cohort'
import CreateCohortWizard from './CreateCohortWizard.vue'
import Icon from './Icon.vue'
import Lead from './Lead.vue'
import Logic from './Logic.vue'
import Marker from './Marker.vue'
import RenameTeamModal from './RenameTeamModal.vue'
import Subtitle from './Subtitle.vue'
import TeamTitle from './TeamTitle.vue'
import s from './wire.module.css'

type Open = 'rename' | CohortStart | null

// The Team Dashboard before the first cohort. The banner's Rename and the title's edit button open the
// rename modal; Create Your First Cohort opens the cohort wizard. `open` starts with either one showing.
const props = withDefaults(
  defineProps<{
    team: string
    banner?: boolean
    open?: Open
    /** The name already typed in the rename modal, for its error state. */
    draft?: string
    /** Show the flow's design markers and routing box. */
    walkthrough?: boolean
  }>(),
  { banner: true, open: null },
)

const team = ref(props.team)
const banner = ref(props.banner)
const open = ref<Open>(props.open)
const draft = ref(props.draft)

function close() {
  open.value = null
  draft.value = undefined
}

function rename(name: string) {
  team.value = name
  banner.value = false
  close()
}
</script>

<template>
  <AppPage :team="team">
    <div
      v-if="banner"
      :class="[s.panel, s.row]"
      style="border: 1px solid #ccc; font-size: 12px; color: #333"
    >
      <Icon />
      <Marker v-if="walkthrough" :flow="3" :n="2" />
      <span :class="s.grow">
        We made a team for you: <strong>{{ team }}</strong>. It keeps your classes and learners in one place.
      </span>
      <Button variant="secondary" @click="open = 'rename'">Rename</Button>
    </div>
    <TeamTitle :team="team" @rename="open = 'rename'" />
    <Card style="align-items: center; text-align: center; padding: 32px 16px">
      <span style="width: 40px; height: 40px; background: #ccc" />
      <div :class="s.row">
        <Subtitle>No cohorts yet</Subtitle>
        <Marker v-if="walkthrough" :flow="3" :n="3" />
      </div>
      <Lead>
        A cohort is one class: a group of learners going through one
        <br />
        program together.
      </Lead>
      <Button @click="open = 'link'">Create Your First Cohort</Button>
    </Card>
    <Logic
      v-if="walkthrough"
      title="Team Dashboard routing"
      :rows="[
        { label: 'No cohorts → Create Cohort wizard (draft 4)', to: 'Lo-Fi/4 Create Cohort/4.1 From a Link' },
        { label: 'Has cohorts → Cohorts Dashboard', to: 'Lo-Fi/3 Create Team/3.4 With Cohort' },
      ]"
    />

    <template #overlay>
      <RenameTeamModal v-if="open === 'rename'" :name="draft ?? team" @save="rename" @close="close" />
      <CreateCohortWizard v-else-if="open" :start="open" :team="team" @close="close" />
    </template>
  </AppPage>
</template>
