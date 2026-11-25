<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { computed, ref } from 'vue'
import { cohorts, firstSteps, optionalSteps, ORG, people, roleBriefs, roles, TEAM, teams, type Person, type RoleKey } from '../../_wire/world'
import { buildDistrict, type Place, type Position } from '../Explorations/Org Chart/_chart/district'
import FaceStack from '../Explorations/Org Chart/_chart/FaceStack.vue'
import StructureList from '../Explorations/Org Chart/_chart/StructureList.vue'
import AppFrame from './AppFrame.vue'
import AwardModal from './AwardModal.vue'
import CreateTeamModal from './CreateTeamModal.vue'
import EmptyStateHuddle from './EmptyStateHuddle.vue'
import { emptyStates } from './emptyStates'
import Marker from './Marker.vue'
import PeopleDirectory from './PeopleDirectory.vue'
import { directoryOf, removableBy } from './people'
import { hifi } from './paths'
import TeamsEmptyCrew from './TeamsEmptyCrew.vue'
import TeamsEmptyCrewOrbit from './TeamsEmptyCrewOrbit.vue'
import TeamsEmptyPath from './TeamsEmptyPath.vue'
import TeamsEmptyPreview from './TeamsEmptyPreview.vue'
import WelcomeCard from './WelcomeCard.vue'

// The Organization's page as each Organization role sees it, the Hi-Fi of the Lo-Fi OrgPage. Step 3 is the welcome,
// step 4 the role's first task (a modal over the page), step 5 the page after it. The Org Manager's steps 6 and 7 create
// the district's first Team and name its Team Owner (Create a Team open, then the Teams tab with it). The Org Reviewer
// sees Reports only, and their step 4 is one Team's report. The others see Teams & Cohorts and People; whether an Org
// Owner may rename the Organization is still open, so the pencil changes nothing yet.
const props = defineProps<{
  viewer: Extract<RoleKey, 'orgOwner' | 'orgManager' | 'orgReviewer'>
  step: 3 | 4 | 5 | 6 | 7
  /**
   * An exploration of the empty Teams tab, drawn inside its card in place of today's icon and line. For the Org
   * Reviewer, whose page is Reports, any value shows the reports of an Organization with no Teams yet.
   */
  teamsEmpty?: 'crew' | 'huddle' | 'orbit' | 'preview' | 'path'
  /** Art for the Crew exploration's middle tile, in place of the Team's own. */
  teamsEmptyHub?: string
  /** Leaves the Structure tab out, for explorations where Teams & Cohorts shows the structure itself. */
  noStructure?: boolean
  /** Shows the Organization's own people at the right of its title, the Org Chart's face stack. */
  members?: boolean
}>()

const teamsEmptyArt = {
  crew: TeamsEmptyCrew,
  huddle: EmptyStateHuddle,
  orbit: TeamsEmptyCrewOrbit,
  preview: TeamsEmptyPreview,
  path: TeamsEmptyPath,
}

const owner = props.viewer === 'orgOwner'
const manager = props.viewer === 'orgManager'
const reviewer = props.viewer === 'orgReviewer'
const role = roles[props.viewer]
const flow = role.flow
const teamReport = reviewer && props.step === 4
const created = manager && props.step === 7

type Tab = 'Teams & Cohorts' | 'People' | 'Reports' | 'Structure'
const tabs: Tab[] = (reviewer ? ['Reports', 'Structure'] : ['Teams & Cohorts', 'People', 'Structure']).filter(
  (t) => !(props.noStructure && t === 'Structure'),
) as Tab[]
// Teams & Cohorts opens the page on every step; a step's task modal opens over it. The Org Reviewer opens on Reports.
const tab = ref<Tab>(reviewer ? 'Reports' : 'Teams & Cohorts')
const tabItems = computed(() =>
  tabs.map((t) => ({ label: t, active: t === tab.value, onSelect: () => (tab.value = t) })),
)

// Each add button opens the modal for its own role. Step 4 opens the role's first task with the flow's next person's
// name half typed, so the search dropdown shows: Marcus for the Org Owner, Linda for the Org Manager.
const firstRole = owner ? 'Org Manager' : 'Org Reviewer'
const queries: Record<string, string> = { 'Org Manager': 'mar', 'Org Reviewer': 'lin' }
const adding = ref<string | null>(props.step === 4 && !reviewer ? firstRole : null)
const creating = ref(props.step === 6)

// The explored empty Teams tab offers the viewer's first task with people beside Create a Team, with the People tab's
// own words on its button.
const firstRoles = `${firstRole}s`
const empty = emptyStates[props.viewer]
// The huddle is the kit's own empty state and takes its title and crew; the other explorations take the middle art.
// An Organization with no Teams shows the huddle; the other drawings stay as explorations.
const teamsEmptyKey = props.teamsEmpty ?? 'huddle'
const teamsEmptyProps =
  teamsEmptyKey === 'huddle' ? { title: empty.title, crew: empty.crew } : { hub: props.teamsEmptyHub }

// The card says what the role is for and links its first step until it is done.
const welcome = {
  lead: roleBriefs[props.viewer],
  done: props.step >= 5 ? 1 : 0,
  to: props.step >= 5 ? undefined : hifi(props.viewer, 4),
}

// The Org Owner may start a Team themselves; the step opens Create a Team in place.
const welcomeActions = owner ? { 'Create a Team yourself': () => (creating.value = true) } : undefined

const you = (key: RoleKey) => ({ ...roles[key].person, you: props.viewer === key })
const invited = (p: (typeof people)[keyof typeof people]) => ({ ...p, invited: true })
const sections = {
  owners: [you('orgOwner')],
  managers: owner ? (props.step === 5 ? [invited(people.marcus)] : []) : [you('orgManager')],
  reviewers: manager && props.step >= 5 ? [invited(people.linda)] : [],
}
const holders: Record<string, { email: string }[]> = {
  'Org Owner': sections.owners,
  'Org Manager': sections.managers,
  'Org Reviewer': sections.reviewers,
}
// The People tab is the kit's directory: every Organization role in one grid of cards, and the Team Marcus creates in
// step 7 with Aisha invited as its Team Owner. Add people offers the roles the viewer awards; a card offers removing
// the positions the viewer may strip: an Org Owner removes Org Managers and Org Reviewers, an Org Manager Org
// Reviewers.
const directory = directoryOf([
  [{ role: 'Org Owner', place: ORG }, sections.owners],
  [{ role: 'Org Manager', place: ORG }, sections.managers],
  [{ role: 'Org Reviewer', place: ORG }, sections.reviewers],
  [{ role: 'Team Owner', place: TEAM, group: TEAM }, created ? [invited(people.aisha)] : []],
])
const teamGroups = created ? [{ name: TEAM, description: 'With its Cohorts' }] : []
const removable = removableBy(owner ? ['Org Manager', 'Org Reviewer'] : manager ? ['Org Reviewer'] : [])
const awards = owner
  ? { 'Org Owner': 'Add Org Owner', 'Org Manager': 'Add Org Managers', 'Org Reviewer': 'Add Org Reviewers' }
  : { 'Org Reviewer': 'Add Org Reviewers' }
const addItems = Object.entries(awards).map(([r, label]) => ({ label, onSelect: () => (adding.value = r) }))
const peopleNote = props.step === 5 ? 5 : undefined

const scripted = (r: string) => props.step === 4 && r === firstRole

// A new Organization has no Teams; the one Marcus creates in step 6 shows in step 7 with Aisha invited as its owner.
const teamRows = created ? [{ team: TEAM, owners: people.aisha.name, invited: true, cohorts: 0, learners: 0 }] : []

// The Structure tab is the Org Chart exploration's list. Org Owners and Org Managers see the Organization as it stands
// at their step; the Org Reviewer comes in once the flows are done, so they see the whole district, read only.
const orgPosition = (r: string, title: string, members: { email: string }[]): Position => ({
  id: `${ORG}/${r}`,
  role: r,
  title,
  add: '',
  members: members.map((m) => ({ ...(m as Person), how: '' })),
})
const structure = computed<Place>(() => {
  if (reviewer) {
    const district = buildDistrict()
    return reportTeams.length ? district : { ...district, detail: 'No Teams yet', children: [] }
  }
  const team: Place[] = created
    ? [
        {
          id: TEAM,
          level: 'Team',
          name: TEAM,
          detail: 'No Cohorts yet',
          positions: [
            { id: `${TEAM}/Team Owner`, role: 'Team Owner', title: 'Team Owners', add: '', members: [{ ...invited(people.aisha), how: '' }] },
          ],
          children: [],
        },
      ]
    : []
  return {
    id: ORG,
    level: 'Organization',
    name: ORG,
    detail: team.length ? '1 Team' : 'No Teams yet',
    positions: [
      orgPosition('Org Owner', 'Org Owners', sections.owners),
      orgPosition('Org Manager', 'Org Managers', sections.managers),
      orgPosition('Org Reviewer', 'Org Reviewers', sections.reviewers),
    ],
    children: team,
  }
})

// Table cards are `isolate`: modals here have no z-index, so a table's z-1 header separator would draw over them.
const teamColumns = [
  { accessorKey: 'team', header: 'Team' },
  { accessorKey: 'owners', header: 'Team Owners' },
  { accessorKey: 'cohorts', header: 'Cohorts' },
  { accessorKey: 'learners', header: 'Learners' },
]

// Reviewer reports: aggregated only, once the flows are done, with two Teams under way.
const reportTeams = reviewer && props.teamsEmpty ? [] : teams
const sum = (key: 'cohorts' | 'learners' | 'certificates') => reportTeams.reduce((total, t) => total + t[key], 0)
const reportTeam = teams.find((t) => t.name === TEAM)
const stats = teamReport
  ? [
      { label: 'Cohorts', value: reportTeam?.cohorts },
      { label: 'Learners', value: reportTeam?.learners },
      { label: 'Average progress', value: `${reportTeam?.progress}%` },
      { label: 'Certificates', value: reportTeam?.certificates },
    ]
  : [
      { label: 'Teams', value: reportTeams.length },
      { label: 'Cohorts', value: sum('cohorts') },
      { label: 'Learners', value: sum('learners') },
      { label: 'Certificates', value: sum('certificates') },
    ]
const reportColumns = [
  { accessorKey: 'name', header: 'Team' },
  { accessorKey: 'cohorts', header: 'Cohorts' },
  { accessorKey: 'learners', header: 'Learners' },
  { accessorKey: 'progress', header: 'Average progress' },
  { accessorKey: 'certificates', header: 'Certificates' },
]
const cohortRows = cohorts.filter((c) => c.team === TEAM)
const cohortColumns = [
  { accessorKey: 'name', header: 'Cohort' },
  { accessorKey: 'program', header: 'Program' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'learners', header: 'Learners' },
  { accessorKey: 'progress', header: 'Average progress' },
  { accessorKey: 'certificates', header: 'Certificates' },
]
// The app's cohort status lookup: upcoming is info, in progress success, finished neutral.
const statusColor = (status: string) =>
  status.startsWith('Starts') ? 'info' : status.startsWith('Session') ? 'success' : 'neutral'

const title = teamReport ? TEAM : ORG
const teamCount = reviewer ? reportTeams.length : teamRows.length
const subtitle = teamReport
  ? `Team · ${reportTeam?.cohorts} Cohorts`
  : `Organization · ${teamCount} ${teamCount === 1 ? 'Team' : 'Teams'}`
</script>

<template>
  <AppFrame :viewer="viewer" :place="ORG">
    <div class="flex flex-col gap-1">
      <nav v-if="teamReport" aria-label="Breadcrumb" class="mb-1">
        <ol class="flex items-center gap-1.5 text-sm">
          <li>
            <PrototypeLink :to="hifi('orgReviewer', 3)" class="font-medium text-toned no-underline hover:text-highlighted">
              Reports
            </PrototypeLink>
          </li>
          <li aria-hidden="true" class="flex"><UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" /></li>
          <li aria-current="page" class="font-medium text-dimmed">{{ TEAM }}</li>
        </ol>
      </nav>
      <div class="flex items-center gap-4">
        <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-center gap-2">
          <h1 class="text-3xl font-semibold text-highlighted">{{ title }}</h1>
          <UTooltip v-if="owner" text="Rename" :delay-duration="150">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" aria-label="Rename" />
          </UTooltip>
          <UBadge v-if="reviewer" color="neutral" variant="outline" icon="i-lucide-eye" class="ms-1">View only</UBadge>
          <Marker v-if="teamReport" :flow="flow" :n="4" />
        </div>
        <p class="text-sm text-muted">{{ subtitle }}</p>
        </div>
        <FaceStack v-if="members && !teamReport" :place="structure" align="end" size="3xl" class="ms-auto" />
      </div>
    </div>

    <!-- An exploration can draw the welcome its own way; every flow screen keeps the card. One object, since a slot's own name is taken. -->
    <slot
      v-if="!teamReport"
      name="welcome"
      :card="{
        name: role.person.name,
        lead: welcome.lead,
        steps: firstSteps[viewer],
        done: welcome.done,
        to: welcome.to,
        flow,
        note: step === 3 ? 3 : undefined,
        optional: optionalSteps[viewer],
        actions: welcomeActions,
      }"
    >
      <WelcomeCard
        :name="role.person.name"
        :lead="welcome.lead"
        :steps="firstSteps[viewer]"
        :done="welcome.done"
        :to="welcome.to"
        :flow="flow"
        :note="step === 3 ? 3 : undefined"
        :optional="optionalSteps[viewer]"
        :actions="welcomeActions"
      />
    </slot>

    <div class="flex flex-col gap-6">
      <div v-if="!teamReport">
        <UNavigationMenu :items="tabItems" variant="pill" color="neutral" :ui="{ link: 'no-underline cursor-pointer' }" />
        <USeparator class="mt-2" />
      </div>

      <StructureList v-if="!teamReport && tab === 'Structure'" :root="structure" />

      <div v-else-if="reviewer" class="flex flex-col gap-10">
        <div class="grid grid-cols-4 gap-4">
          <UCard v-for="s in stats" :key="s.label" variant="bordered" :ui="{ body: 'flex flex-col gap-1 sm:p-5' }">
            <span class="text-sm text-muted">{{ s.label }}</span>
            <span class="text-2xl font-semibold text-highlighted">{{ s.value }}</span>
          </UCard>
        </div>

        <UCard v-if="!teamReport && !reportTeams.length" variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
          <EmptyStateHuddle :title="empty.title" :crew="empty.crew">
            <template #lead>{{ empty.lead }}</template>
          </EmptyStateHuddle>
        </UCard>

        <section v-else-if="!teamReport" class="flex flex-col gap-3">
          <h2 class="text-lg font-semibold text-highlighted">Teams</h2>
          <UCard variant="bordered" class="isolate" :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="reportTeams" :columns="reportColumns">
              <template #name-cell="{ row }">
                <PrototypeLink
                  v-if="row.original.name === TEAM"
                  :to="hifi('orgReviewer', 4)"
                  class="font-semibold text-secondary no-underline hover:underline"
                >
                  {{ row.original.name }}
                </PrototypeLink>
                <span v-else class="font-semibold text-highlighted">{{ row.original.name }}</span>
              </template>
              <template #progress-cell="{ row }">
                <div class="flex items-center gap-3">
                  <UProgress :model-value="row.original.progress" color="secondary" size="sm" class="w-32" aria-hidden="true" />
                  <span class="text-sm text-muted">{{ row.original.progress }}%</span>
                </div>
              </template>
            </UTable>
          </UCard>
        </section>

        <section v-else class="flex flex-col gap-3">
          <h2 class="text-lg font-semibold text-highlighted">Cohorts</h2>
          <UCard variant="bordered" class="isolate" :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="cohortRows" :columns="cohortColumns">
              <template #name-cell="{ row }">
                <span class="font-semibold text-highlighted">{{ row.original.name }}</span>
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="statusColor(row.original.status)" variant="soft">{{ row.original.status }}</UBadge>
              </template>
              <template #progress-cell="{ row }">
                <div class="flex items-center gap-3">
                  <UProgress :model-value="row.original.progress" color="secondary" size="sm" class="w-32" aria-hidden="true" />
                  <span class="text-sm text-muted">{{ row.original.progress }}%</span>
                </div>
              </template>
              <template #certificates-cell="{ row }">{{ row.original.certificates || '–' }}</template>
            </UTable>
          </UCard>
        </section>
      </div>

      <section v-else-if="tab === 'Teams & Cohorts'" class="flex flex-col gap-3">
        <!-- An exploration can draw the tab its own way; it gets the empty state's words and the first task with people. -->
        <slot
          name="teams"
          :tab="{ empty, owner, firstRoles, addFirst: () => (adding = firstRole) }"
        >
        <template v-if="created">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-highlighted">Teams</h2>
              <Marker :flow="2" :n="7" />
            </div>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-plus"
              class="shrink-0 whitespace-nowrap"
              @click="creating = true"
            >
              Create a Team
            </UButton>
          </div>
          <UCard variant="bordered" class="isolate" :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="teamRows" :columns="teamColumns">
              <template #team-cell="{ row }">
                <span class="font-semibold text-secondary">{{ row.original.team }}</span>
              </template>
              <template #owners-cell="{ row }">
                {{ row.original.owners }}
                <UBadge v-if="row.original.invited" color="info" variant="soft" class="ms-2">Invited</UBadge>
              </template>
            </UTable>
          </UCard>
        </template>
        <UCard v-else variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
          <component :is="teamsEmptyArt[teamsEmptyKey]" v-bind="teamsEmptyProps">
            <template #lead>{{ empty.lead }}</template>
            <UButton
              :color="owner ? 'neutral' : 'primary'"
              :variant="owner ? 'outline' : 'solid'"
              icon="i-lucide-plus"
              @click="creating = true"
            >
              Create a Team
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-user-plus" @click="adding = firstRole">
              Add {{ firstRoles }}
            </UButton>
          </component>
        </UCard>
        </slot>
      </section>

      <PeopleDirectory
        v-else-if="tab === 'People'"
        :people="directory"
        :place="ORG"
        :groups="teamGroups"
        :add="addItems"
        :removable="removable"
      >
        <template v-if="peopleNote" #note><Marker :flow="flow" :n="peopleNote" class="ms-1" /></template>
      </PeopleDirectory>
    </div>

    <template #overlay>
      <AwardModal
        v-if="adding"
        :key="adding"
        :role="adding"
        :holders="holders[adding]"
        :query="scripted(adding) ? queries[adding] : undefined"
        :next="scripted(adding) ? hifi(viewer, 5) : undefined"
        :flow="flow"
        :note="scripted(adding) ? 4 : undefined"
        @close="adding = null"
      />
      <CreateTeamModal
        v-else-if="creating"
        :viewer="viewer"
        where="org"
        :name="manager ? TEAM : undefined"
        :owners="manager ? [people.aisha.email] : undefined"
        :next="manager ? hifi('orgManager', 7) : undefined"
        :flow="flow"
        :note="manager && step === 6 ? 6 : undefined"
        @close="creating = false"
      />
    </template>
  </AppFrame>
</template>
