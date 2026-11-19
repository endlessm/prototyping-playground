<script setup lang="ts">
import { computed, ref } from 'vue'
import { cohorts, firstSteps, ORG, people, roleBriefs, roles, TEAM, WINTER_COHORT, type RoleKey } from '../../_wire/world'
import AppFrame from './AppFrame.vue'
import AwardModal from './AwardModal.vue'
import CreateCohortModal from './CreateCohortModal.vue'
import EmptyStateHuddle from './EmptyStateHuddle.vue'
import { emptyStates } from './emptyStates'
import Marker from './Marker.vue'
import { hifi } from './paths'
import PeopleDirectory from './PeopleDirectory.vue'
import { directoryOf, removableBy } from './people'
import WelcomeCard from './WelcomeCard.vue'

// The Team's page as each Team role sees it, the Hi-Fi of the Lo-Fi TeamPage. Step 3 is the welcome, step 4 the first
// task (a modal over the page), step 5 the page after it. The Team Owner's task is Add Team Managers over People; the
// Team Manager's is Create a Cohort over Cohorts, whose step 5 is the new Cohort's own page.
const props = defineProps<{
  viewer: Extract<RoleKey, 'teamOwner' | 'teamManager'>
  step: 3 | 4 | 5
  /** An exploration: the Team has no Cohorts yet. A Team without Cohorts always shows the kit's empty state. */
  cohortsEmpty?: 'huddle'
}>()

const role = roles[props.viewer]
const flow = role.flow
const owner = props.viewer === 'teamOwner'

const tabs = owner ? (['Cohorts', 'People', 'Reports', 'Settings'] as const) : (['Cohorts', 'People'] as const)
type Tab = (typeof tabs)[number]
const tab = ref<Tab>(owner && props.step > 3 ? 'People' : 'Cohorts')
const tabItems = computed(() =>
  tabs.map((t) => ({ label: t, active: t === tab.value, onSelect: () => (tab.value = t) })),
)

// Each add button opens the modal for its own role. The Team Owner's step 4 opens Add Team Managers with Ben added and
// Daniel's name half typed, so the search dropdown shows. The Team Manager's step 4 opens Create a Cohort, filled in.
const adding = ref<string | null>(props.step === 4 && owner ? 'Team Manager' : null)
const scripted = (r: string) => props.step === 4 && r === 'Team Manager'
const creating = ref(props.step === 4 && !owner)

// Aisha arrives at a Team Marcus has just created, so it has no Cohorts yet. By the time Ben accepts, Daniel (the
// other Team Manager) has created Winter Godot Club, and Ben sees it too: a Team Manager sees every Cohort in the Team.
const winter = cohorts.find((c) => c.name === WINTER_COHORT)
const list = props.cohortsEmpty || owner || !winter ? [] : [{ ...winter, owners: winter.owners.join(', ') }]
const empty = emptyStates[props.viewer]
const cohortColumns = [
  { accessorKey: 'name', header: 'Cohort' },
  { accessorKey: 'program', header: 'Program' },
  { accessorKey: 'owners', header: 'Cohort Owners' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'learners', header: 'Learners' },
]
type BadgeColor = 'info' | 'success' | 'neutral'
const statusColor = (status: string): BadgeColor =>
  status.startsWith('Session') ? 'success' : status.startsWith('Starts') ? 'info' : 'neutral'

const welcome = {
  lead: roleBriefs[props.viewer],
  done: props.step === 5 ? 1 : 0,
  // An invited role's card links its first step until it is done.
  to: props.step === 5 ? undefined : hifi(props.viewer, 4),
}

const me = { ...role.person, you: true }
const invited = (p: (typeof people)[keyof typeof people]) => ({ ...p, invited: true })
const sections = {
  owners: owner ? [me] : [people.aisha],
  managers: owner ? (props.step === 5 ? [invited(people.ben), invited(people.daniel)] : []) : [people.daniel, me],
}
const holders: Record<string, { email: string }[]> = { 'Team Owner': sections.owners, 'Team Manager': sections.managers }

// The People tab is the kit's directory. A Team Owner adds Team Owners and Team Managers and removes Team Managers;
// a Team Manager only looks.
const directory = directoryOf([
  [{ role: 'Team Owner', place: TEAM }, sections.owners],
  [{ role: 'Team Manager', place: TEAM }, sections.managers],
])
const addItems = owner
  ? [
      { label: 'Add Team Owner', onSelect: () => (adding.value = 'Team Owner') },
      { label: 'Add Team Managers', onSelect: () => (adding.value = 'Team Manager') },
    ]
  : []
const removable = removableBy(owner ? ['Team Manager'] : [])

const learnerTotal = list.reduce((sum, c) => sum + c.learners, 0)
const stats = [
  { label: 'Cohorts', value: String(list.length) },
  { label: 'Learners', value: String(learnerTotal) },
  { label: 'Average progress', value: list.length ? '18%' : '–' },
  { label: 'Certificates', value: '0' },
]
const cohortCount = `${list.length} ${list.length === 1 ? 'Cohort' : 'Cohorts'}`
</script>

<template>
  <AppFrame :viewer="viewer" :place="TEAM">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-semibold text-highlighted">{{ TEAM }}</h1>
        <UTooltip v-if="owner" text="Rename" :delay-duration="150">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" aria-label="Rename" />
        </UTooltip>
      </div>
      <p class="text-sm text-muted">Team in {{ ORG }} · {{ cohortCount }}</p>
    </div>

    <WelcomeCard
      :name="role.person.name"
      :lead="welcome.lead"
      :steps="firstSteps[viewer]"
      :done="welcome.done"
      :to="welcome.to"
      :flow="flow"
      :note="step === 3 ? 3 : undefined"
    />

    <div class="flex flex-col gap-6">
      <div>
        <UNavigationMenu :items="tabItems" variant="pill" color="neutral" :ui="{ link: 'no-underline cursor-pointer' }" />
        <USeparator class="mt-2" />
      </div>

      <UCard v-if="tab === 'Cohorts' && !list.length" variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
        <EmptyStateHuddle :title="empty.title" :crew="empty.crew" :hub="empty.hub">
          <template #lead>{{ empty.lead }}</template>
          <UButton
            :color="owner ? 'neutral' : 'primary'"
            :variant="owner ? 'outline' : 'solid'"
            icon="i-lucide-plus"
            @click="creating = true"
          >
            Create a Cohort
          </UButton>
          <UButton
            v-if="owner"
            color="neutral"
            variant="outline"
            icon="i-lucide-user-plus"
            @click="adding = 'Team Manager'"
          >
            Add Team Managers
          </UButton>
        </EmptyStateHuddle>
      </UCard>

      <section v-else-if="tab === 'Cohorts'" class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-highlighted">Cohorts</h2>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-plus"
            class="shrink-0 whitespace-nowrap"
            @click="creating = true"
          >
            Create a Cohort
          </UButton>
        </div>
        <UCard variant="bordered" :ui="{ body: 'p-0 sm:p-0' }">
          <!-- The table's header line sits at z-index 1, which would paint over Create a Cohort's dialog. -->
          <UTable :data="list" :columns="cohortColumns" :ui="{ separator: 'z-0' }">
            <template #name-cell="{ row }">
              <span class="font-semibold text-secondary">{{ row.original.name }}</span>
            </template>
            <template #status-cell="{ row }">
              <UBadge :color="statusColor(row.original.status)" variant="soft">{{ row.original.status }}</UBadge>
            </template>
          </UTable>
        </UCard>
      </section>

      <PeopleDirectory
        v-else-if="tab === 'People'"
        :people="directory"
        :place="TEAM"
        :add="addItems"
        :removable="removable"
      >
        <template v-if="owner && step === 5" #note><Marker :flow="flow" :n="5" class="ms-1" /></template>
      </PeopleDirectory>

      <div v-else-if="tab === 'Reports'" class="grid grid-cols-4 gap-4">
        <UCard v-for="s in stats" :key="s.label" variant="bordered" :ui="{ body: 'flex flex-col gap-1 sm:p-5' }">
          <span class="text-sm text-muted">{{ s.label }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ s.value }}</span>
        </UCard>
      </div>

      <UCard v-else variant="bordered" :ui="{ body: 'flex items-center justify-between gap-4 sm:p-5' }">
        <span class="text-sm font-semibold text-highlighted">Archive this Team</span>
        <UButton color="error" variant="outline" size="sm" icon="i-lucide-archive" class="shrink-0 whitespace-nowrap">
          Archive
        </UButton>
      </UCard>
    </div>

    <template #overlay>
      <AwardModal
        v-if="adding"
        :key="adding"
        :role="adding"
        :holders="holders[adding]"
        :picked="scripted(adding) ? [people.ben.email] : undefined"
        :query="scripted(adding) ? 'dan' : undefined"
        :next="scripted(adding) ? hifi('teamOwner', 5) : undefined"
        :flow="flow"
        :note="scripted(adding) ? 4 : undefined"
        @close="adding = null"
      />
      <CreateCohortModal
        v-else-if="creating"
        :filled="step === 4 && !owner"
        :next="step === 4 && !owner ? hifi('teamManager', 5) : undefined"
        :flow="flow"
        :note="step === 4 && !owner ? 4 : undefined"
        @close="creating = false"
      />
    </template>
  </AppFrame>
</template>
