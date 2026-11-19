<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { computed, ref } from 'vue'
import { cohort, COHORT, firstSteps, learners, ORG, people, roleBriefs, roles, sessions, TEAM, type RoleKey } from '../../_wire/world'
import AppFrame from './AppFrame.vue'
import AwardModal from './AwardModal.vue'
import CohortJoinLink from './CohortJoinLink.vue'
import EmptyStateHuddle from './EmptyStateHuddle.vue'
import { emptyStates } from './emptyStates'
import Marker from './Marker.vue'
import { hifi } from './paths'
import PeopleDirectory from './PeopleDirectory.vue'
import { directoryOf, removableBy } from './people'
import WelcomeCard from './WelcomeCard.vue'

// The Cohort's page before it starts, as each Cohort role sees it: the Hi-Fi of the Lo-Fi CohortPage. `viewer`
// teamManager is Ben right after creating it (flow 5's last screen), already its Cohort Owner. Step 3 is the welcome,
// step 4 the first task (a modal), step 5 after it. Tabs follow the role: Facilitators get Learners and Sessions,
// Cohort Owners add People, Reports and Settings.
const props = defineProps<{
  viewer: Extract<RoleKey, 'teamManager' | 'cohortOwner' | 'facilitator'>
  step: 3 | 4 | 5
  /** Kept for the Huddle exploration; the Learners tab shows the kit's empty state whenever nobody has joined. */
  learnersEmpty?: 'huddle'
}>()

const navigate = usePrototypeNavigate()
const r = roles[props.viewer]
const flow = r.flow
const owner = props.viewer !== 'facilitator'

const tabs = owner ? (['Learners', 'Sessions', 'People', 'Reports', 'Settings'] as const) : (['Learners', 'Sessions'] as const)
type Tab = (typeof tabs)[number]
const tab = ref<Tab>(props.step > 3 && owner ? 'People' : 'Learners')
const tabItems = computed(() =>
  tabs.map((t) => ({ label: t, active: t === tab.value, onSelect: () => (tab.value = t) })),
)

const linkOpen = ref(props.step === 4 && props.viewer === 'facilitator')
// Each add button opens the modal for its own role. Sofia's step 4 opens Invite Facilitators with Sam's email typed:
// he comes from outside the district, so the dropdown offers to invite the email.
const adding = ref<string | null>(props.step === 4 && props.viewer === 'cohortOwner' ? 'Facilitator' : null)
const scripted = (role: string) => props.step === 4 && props.viewer === 'cohortOwner' && role === 'Facilitator'

const me = { ...r.person, you: true }
const sections = {
  owners:
    props.viewer === 'teamManager' ? [me] : props.viewer === 'cohortOwner' ? [people.ben, me] : [people.ben, people.sofia],
  facilitators: props.viewer === 'cohortOwner' && props.step === 5 ? [{ ...people.sam, invited: true }] : [],
}
const holders: Record<string, { email: string }[]> = { 'Cohort Owner': sections.owners, Facilitator: sections.facilitators }

// The People tab is the kit's directory: whoever sees it owns the Cohort, so they add Cohort Owners, invite
// Facilitators and remove Facilitators.
const directory = directoryOf([
  [{ role: 'Cohort Owner', place: COHORT }, sections.owners],
  [{ role: 'Facilitator', place: COHORT }, sections.facilitators],
])
const addItems = [
  { label: 'Add Cohort Owner', onSelect: () => (adding.value = 'Cohort Owner') },
  { label: 'Invite Facilitators', onSelect: () => (adding.value = 'Facilitator') },
]
const removable = removableBy(['Facilitator'])

const joined = props.viewer === 'facilitator' && props.step === 5 ? learners : []
// Ben, on the Cohort he has just created, reads what a Cohort Owner reads.
const empty = emptyStates[props.viewer === 'facilitator' ? 'facilitator' : 'cohortOwner']
const learnerColumns = [
  { accessorKey: 'name', header: 'Learner' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'joined', header: 'Joined' },
  { id: 'actions', header: '' },
]

// Ben's card is for the role he gained by creating the Cohort, so it says what a Cohort Owner does.
const welcome =
  props.viewer === 'teamManager'
    ? {
        name: r.person.name,
        lead: roleBriefs.cohortOwner,
        steps: ['Add another Cohort Owner', 'Invite the Facilitators'],
        done: 0,
        to: hifi('cohortOwner', 1),
      }
    : {
        name: r.person.name,
        lead: roleBriefs[props.viewer],
        steps: firstSteps[props.viewer],
        done: props.step === 5 ? 1 : 0,
        to: props.step === 5 ? undefined : hifi(props.viewer, 4),
      }

const crumbs = props.viewer === 'facilitator' ? [ORG, TEAM] : [TEAM]

function learnersDone() {
  if (props.viewer === 'facilitator') navigate(hifi('facilitator', 5))
  else linkOpen.value = false
}
</script>

<template>
  <AppFrame
    :viewer="viewer"
    :place="COHORT"
    :extra="viewer === 'teamManager' ? [{ name: COHORT, role: 'Cohort Owner', level: 'Cohort' }] : undefined"
  >
    <div class="flex flex-col gap-1">
      <p class="flex items-center gap-1.5 text-sm text-muted">
        <template v-for="(crumb, i) in crumbs" :key="crumb">
          <UIcon v-if="i" name="i-lucide-chevron-right" class="size-4 text-dimmed" />
          <span>{{ crumb }}</span>
        </template>
      </p>
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-semibold text-highlighted">{{ COHORT }}</h1>
        <UTooltip v-if="owner" text="Rename" :delay-duration="150">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" aria-label="Rename" />
        </UTooltip>
        <UBadge color="info" variant="soft">Starts {{ cohort.starts }}</UBadge>
      </div>
      <p class="text-sm text-muted">Cohort · {{ cohort.program }}</p>
    </div>

    <WelcomeCard
      :name="welcome.name"
      :lead="welcome.lead"
      :steps="welcome.steps"
      :done="welcome.done"
      :to="welcome.to"
      :flow="flow"
      :note="viewer === 'teamManager' ? 5 : step === 3 ? 3 : undefined"
    />

    <div class="flex flex-col gap-6">
      <div>
        <UNavigationMenu :items="tabItems" variant="pill" color="neutral" :ui="{ link: 'no-underline cursor-pointer' }" />
        <USeparator class="mt-2" />
      </div>

      <UCard v-if="tab === 'Learners' && !joined.length" variant="soft" :ui="{ body: 'p-0 sm:p-0' }">
        <EmptyStateHuddle :title="empty.title" :crew="empty.crew" :hub="empty.hub">
          <template #lead>{{ empty.lead }}</template>
          <UButton
            :color="owner ? 'neutral' : 'primary'"
            :variant="owner ? 'outline' : 'solid'"
            icon="i-lucide-user-plus"
            @click="linkOpen = true"
          >
            Add Learners
          </UButton>
          <UButton v-if="owner" color="neutral" variant="outline" icon="i-lucide-user-plus" @click="adding = 'Facilitator'">
            Invite Facilitators
          </UButton>
        </EmptyStateHuddle>
      </UCard>

      <section v-else-if="tab === 'Learners'" class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-highlighted">Who's in</h2>
            <UBadge color="neutral" variant="soft" size="sm">{{ joined.length }} of {{ cohort.seats }} seats</UBadge>
            <Marker v-if="viewer === 'facilitator' && step === 5" :flow="flow" :n="5" />
          </div>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-user-plus"
            class="shrink-0 whitespace-nowrap"
            @click="linkOpen = true"
          >
            Add Learners
          </UButton>
        </div>
        <UCard variant="bordered" :ui="{ body: 'p-0 sm:p-0' }">
          <UTable :data="joined" :columns="learnerColumns">
            <template #name-cell="{ row }">
              <span class="font-semibold text-highlighted">{{ row.original.name }}</span>
            </template>
            <template #email-cell="{ row }">
              <span class="text-muted">{{ row.original.email }}</span>
            </template>
            <template #joined-cell="{ row }">
              <span class="text-muted">{{ row.original.joined }}</span>
            </template>
            <template #actions-cell>
              <div class="flex justify-end">
                <UButton color="neutral" variant="ghost" size="sm">Remove</UButton>
              </div>
            </template>
          </UTable>
        </UCard>
      </section>

      <section v-else-if="tab === 'Sessions'" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-highlighted">Sessions</h2>
        <UCard variant="bordered" :ui="{ body: 'p-0 sm:p-0' }">
          <ul class="divide-y divide-default">
            <li v-for="session in sessions" :key="session.n" class="flex items-center gap-4 px-5 py-3">
              <span class="w-14 flex-none text-sm text-muted">{{ session.date }}</span>
              <p class="min-w-0 flex-1 truncate text-sm text-default">
                <span class="font-semibold text-highlighted">Session {{ session.n }}</span> · {{ session.question }}
              </p>
              <UButton color="neutral" variant="ghost" size="sm" trailing-icon="i-lucide-arrow-right">Open</UButton>
            </li>
          </ul>
        </UCard>
      </section>

      <PeopleDirectory
        v-else-if="tab === 'People'"
        :people="directory"
        :place="COHORT"
        :add="addItems"
        :removable="removable"
      >
        <template v-if="viewer === 'cohortOwner' && step === 5" #note>
          <Marker :flow="flow" :n="5" class="ms-1" />
        </template>
      </PeopleDirectory>

      <section v-else-if="tab === 'Reports'" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-highlighted">Reports</h2>
        <UCard variant="soft" :ui="{ body: 'py-6 text-center text-sm text-muted' }">Reports start on {{ cohort.starts }}</UCard>
      </section>

      <div v-else class="flex flex-col gap-10">
        <section class="flex flex-col gap-3">
          <h2 class="text-lg font-semibold text-highlighted">Details</h2>
          <UCard variant="bordered" :ui="{ body: 'flex flex-col gap-5 sm:p-6' }">
            <div class="grid grid-cols-3 gap-4">
              <UFormField label="Start date" name="starts">
                <UInput :default-value="cohort.starts" icon="i-lucide-calendar" class="w-full" />
              </UFormField>
              <UFormField label="Seats" name="seats">
                <UInput :default-value="String(cohort.seats)" type="number" class="w-full" />
              </UFormField>
              <UFormField label="Join link expires" name="expires">
                <UInput :default-value="cohort.linkExpires" icon="i-lucide-calendar" class="w-full" />
              </UFormField>
            </div>
            <div class="flex justify-end">
              <UButton>Save</UButton>
            </div>
          </UCard>
        </section>
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-lg font-semibold text-highlighted">Archive</h2>
            <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-archive" class="shrink-0 whitespace-nowrap">
              Archive Cohort
            </UButton>
          </div>
        </section>
      </div>
    </div>

    <template #overlay>
      <AwardModal
        v-if="adding"
        :key="adding"
        :role="adding"
        :title="adding === 'Facilitator' ? 'Invite Facilitators' : undefined"
        :holders="holders[adding]"
        :query="scripted(adding) ? people.sam.email : undefined"
        :next="scripted(adding) ? hifi('cohortOwner', 5) : undefined"
        :flow="flow"
        :note="scripted(adding) ? 4 : undefined"
        @close="adding = null"
      />
      <CohortJoinLink
        v-else-if="linkOpen"
        :flow="viewer === 'facilitator' ? flow : undefined"
        :note="viewer === 'facilitator' ? 4 : undefined"
        @done="learnersDone"
        @close="linkOpen = false"
      />
    </template>
  </AppFrame>
</template>
