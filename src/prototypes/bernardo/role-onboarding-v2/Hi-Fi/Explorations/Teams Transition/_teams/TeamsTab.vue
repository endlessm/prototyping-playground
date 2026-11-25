<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { TEAM, type Person } from '../../../../_wire/world'
import EmptyStateHuddle from '../../../_ui/EmptyStateHuddle.vue'
import { emptyStates, type EmptyState } from '../../../_ui/emptyStates'
import CohortRun from '../../Org Chart/_chart/CohortRun.vue'
import { buildDistrict, occupantsOf, phaseOf, type Phase, type Place } from '../../Org Chart/_chart/district'
import FaceStack from '../../Org Chart/_chart/FaceStack.vue'
import SearchInput from '../../Org Chart/_structure/SearchInput.vue'
import AvatarPicker from './AvatarPicker.vue'
import Morph from './Morph.vue'
import TeamForm from './TeamForm.vue'

// The Teams & Cohorts tab once Structure is folded into it. With no Teams it is the kit's empty state; Create a Team
// turns that card into the form in place, and creating the Team turns the form into the Focus drawing: the Teams down
// the left, the picked one in full on the right, with the new Team picked. Once there are Teams, Create a Team turns
// only the right side into the form, with the Team being written already on the list. A position nobody holds yet
// shows its own empty state with the button that fills it.
const props = withDefaults(
  defineProps<{
    tab: { empty: EmptyState; owner: boolean; firstRoles: string; addFirst: () => void }
    start?: 'empty' | 'form' | 'populated' | 'created'
    /** Draws the form that replaces the empty state as one centered column. */
    centered?: boolean
  }>(),
  { start: 'empty' },
)

const newTeam = (name: string, owners: Person[], managers: Person[]): Place => {
  const member = (p: Person) => ({ ...p, invited: true, how: 'Invited by you just now' })
  return {
    id: `${name}-${Date.now()}`,
    level: 'Team',
    name,
    detail: 'No Cohorts yet',
    positions: [
      { id: `${name}/Team Owner`, role: 'Team Owner', title: 'Team Owners', add: 'Add Team Owner', members: owners.map(member) },
      {
        id: `${name}/Team Manager`,
        role: 'Team Manager',
        title: 'Team Managers',
        add: 'Add Team Managers',
        members: managers.map(member),
      },
    ],
    children: [],
  }
}

const teams = reactive<Place[]>(
  props.start === 'populated' ? buildDistrict().children : props.start === 'created' ? [newTeam(TEAM, [], [])] : [],
)
const picked = ref(teams[0]?.id)
const drafting = ref(props.start === 'form')
// The empty state's height when Create a Team was pressed, so the form takes exactly its place.
const emptyBox = ref<HTMLElement>()
const emptyHeight = ref<number>()
const draftName = ref('')
const fresh = ref<string>()

// The first Team is created in place of the form: for a few seconds the same soft card says the Team is being
// created, so the page answers the button before it turns into the Teams.
const pending = ref<{ name: string; owners: Person[] }>()
const CREATING_MS = 4000
// What the creating screen says it is doing, one line after another while the loader runs.
const step = ref(0)
const steps = computed(() => [
  'Setting up the Team',
  pending.value?.owners.length
    ? `Inviting ${pending.value.owners[0]!.name} as Team Owner`
    : 'Making you its Team Owner',
  'Getting its page ready',
])

const stage = computed(() =>
  teams.length ? 'focus' : pending.value ? 'creating' : drafting.value ? 'form' : 'empty',
)

const search = ref('')
const query = computed(() => search.value.trim().toLowerCase())
const found = (place: Place) =>
  `${place.name} ${occupantsOf(place)
    .map((o) => `${o.name} ${o.email}`)
    .join(' ')}`
    .toLowerCase()
    .includes(query.value)
const shown = computed(() =>
  teams
    .map((team) => ({ team, cohorts: !query.value || found(team) ? team.children : team.children.filter(found) }))
    .filter(({ team, cohorts }) => !query.value || found(team) || cohorts.length > 0),
)
const current = computed(() => shown.value.find(({ team }) => team.id === picked.value) ?? shown.value[0])

function create(team: { name: string; owners: Person[] }) {
  if (teams.length) return addTeam(team)
  pending.value = team
  step.value = 0
  setTimeout(() => (step.value = 1), CREATING_MS * 0.32)
  setTimeout(() => (step.value = 2), CREATING_MS * 0.66)
  setTimeout(() => {
    addTeam(team)
    pending.value = undefined
  }, CREATING_MS)
}

function addTeam(team: { name: string; owners: Person[] }) {
  const place = newTeam(team.name, team.owners, [])
  teams.unshift(place)
  search.value = ''
  picked.value = place.id
  fresh.value = place.id
  drafting.value = false
  draftName.value = ''
}

function startDraft() {
  if (emptyBox.value) emptyHeight.value = emptyBox.value.offsetHeight
  draftName.value = ''
  drafting.value = true
}

// A Team with no Cohorts shows the kit's classroom huddle, in the words a Team's runners read.
const cohortsEmpty = emptyStates.teamManager

const DOT: Record<Phase, string> = { 'Under way': 'under-way', Upcoming: 'upcoming', Finished: 'finished' }
const dot = (cohort: Place) => (cohort.run ? DOT[phaseOf(cohort.run)] : 'finished')
const items = ref<HTMLButtonElement[]>([])
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const at = shown.value.findIndex(({ team }) => team.id === current.value?.team.id)
  const next = Math.min(shown.value.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)))
  picked.value = shown.value[next]?.team.id
  drafting.value = false
  items.value[next]?.focus()
}
</script>

<template>
  <div class="tt-card rounded-xl border" :data-stage="stage">
    <Morph :swap-key="stage">
      <div v-if="stage === 'empty'" ref="emptyBox" data-enter>
        <EmptyStateHuddle :title="tab.empty.title" :crew="tab.empty.crew">
          <template #lead>{{ tab.empty.lead }}</template>
          <UButton
            :color="tab.owner ? 'neutral' : 'primary'"
            :variant="tab.owner ? 'outline' : 'solid'"
            icon="i-lucide-plus"
            @click="startDraft"
          >
            Create a Team
          </UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-user-plus" @click="tab.addFirst()">
            Add {{ tab.firstRoles }}
          </UButton>
        </EmptyStateHuddle>
      </div>

      <TeamForm
        v-else-if="stage === 'form'"
        v-model:name="draftName"
        framed
        :centered="centered"
        :height="emptyHeight"
        @create="create"
        @cancel="drafting = false"
      />

      <div
        v-else-if="stage === 'creating'"
        class="tt-creating"
        :style="{ height: `${emptyHeight ?? 396}px` }"
        role="status"
        aria-live="polite"
        data-enter
      >
        <EmptyStateHuddle hub="loader" :title="`Creating ${pending?.name}`" :crew="tab.empty.crew">
          <template #lead>
            <Transition name="tt-step" mode="out-in">
              <span :key="step" class="inline-block">{{ steps[step] }}</span>
            </Transition>
          </template>
          <span class="tt-creating-bar" aria-hidden="true">
            <span :style="{ animationDuration: `${CREATING_MS}ms` }" />
          </span>
        </EmptyStateHuddle>
      </div>

      <div v-else class="flex flex-col">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3" data-enter style="--d: 0">
          <SearchInput v-model="search" />
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-plus"
            class="shrink-0 whitespace-nowrap"
            :disabled="drafting"
            @click="startDraft"
          >
            Create a Team
          </UButton>
        </div>

        <div class="tt-focus">
          <ul class="tt-nav border-r border-default bg-elevated/50 p-2" role="listbox" aria-label="Teams" data-enter style="--d: 1" @keydown="onKey">
            <li v-if="drafting">
              <div class="tt-item tt-draft flex flex-col gap-1 rounded-lg px-3 py-2.5" aria-selected="true" role="option">
                <span class="line-clamp-2 text-sm font-medium" :class="draftName.trim() ? 'text-highlighted' : 'text-dimmed'">
                  {{ draftName.trim() || 'New Team' }}
                </span>
                <span class="text-xs text-muted">Not created yet</span>
              </div>
            </li>
            <li v-for="({ team, cohorts }, i) in shown" :key="team.id">
              <button
                :ref="(el) => el && (items[i] = el as HTMLButtonElement)"
                type="button"
                role="option"
                :aria-selected="!drafting && team.id === current?.team.id"
                :tabindex="team.id === current?.team.id ? 0 : -1"
                class="tt-item flex w-full cursor-pointer flex-col gap-1.5 rounded-lg px-3 py-2.5 text-left"
                :class="{ 'tt-fresh': team.id === fresh }"
                @click="(picked = team.id), (drafting = false)"
              >
                <span class="line-clamp-2 text-sm font-medium text-highlighted">{{ team.name }}</span>
                <span class="flex items-center gap-2 text-xs text-muted">
                  <span v-if="cohorts.length" class="flex items-center gap-1" aria-hidden="true">
                    <span v-for="c in cohorts" :key="c.id" class="tt-dot" :data-tone="dot(c)" />
                  </span>
                  {{ team.detail }}
                </span>
              </button>
            </li>
            <li v-if="!shown.length && !drafting" class="px-3 py-6 text-center text-sm text-muted">Nothing matches</li>
          </ul>

          <div class="min-w-0">
            <Morph :swap-key="drafting ? 'draft' : (current?.team.id ?? 'none')">
              <TeamForm v-if="drafting" v-model:name="draftName" class="p-6" @create="create" @cancel="drafting = false" />

              <section v-else-if="current" class="flex flex-col gap-6 p-6">
                <div class="flex flex-col gap-1" data-enter style="--d: 2">
                  <h3 class="text-2xl font-semibold text-highlighted">{{ current.team.name }}</h3>
                  <p class="text-base text-muted">{{ current.team.detail }}</p>
                </div>

                <div class="tt-positions" data-enter style="--d: 3">
                  <div v-for="position in current.team.positions" :key="position.id" class="flex flex-col gap-2">
                    <p class="text-base font-semibold text-highlighted">{{ position.title }}</p>
                    <AvatarPicker v-model="position.members" :role="position.role" :title="position.title" />
                  </div>
                </div>

                <div class="flex flex-col gap-3" data-enter style="--d: 4">
                  <p class="text-base font-semibold text-highlighted">Cohorts</p>
                  <ul v-if="current.cohorts.length" class="tt-cohorts">
                    <li v-for="cohort in current.cohorts" :key="cohort.id" class="flex flex-col gap-3 rounded-lg border border-default p-4">
                      <div class="flex flex-col gap-0.5">
                        <p class="line-clamp-2 text-base font-semibold text-highlighted">{{ cohort.name }}</p>
                        <p class="text-sm text-muted">{{ cohort.detail }}</p>
                      </div>
                      <CohortRun v-if="cohort.run" :run="cohort.run" />
                      <FaceStack :place="cohort" />
                    </li>
                  </ul>
                  <div v-else class="overflow-hidden rounded-xl bg-elevated">
                    <EmptyStateHuddle
                      :title="cohortsEmpty.title"
                      :crew="cohortsEmpty.crew"
                      :hub="cohortsEmpty.hub"
                    >
                      <template #lead>{{ cohortsEmpty.lead }}</template>
                      <UButton icon="i-lucide-plus">Create a Cohort</UButton>
                    </EmptyStateHuddle>
                  </div>
                </div>
              </section>
            </Morph>
          </div>
        </div>
      </div>
    </Morph>
  </div>
</template>

<style scoped>
/* The empty state and the form that takes its place sit in a soft card, as on every flow screen; the Teams in a
   bordered one. The card eases from one look to the other while its content swaps. */
.tt-card {
  transition:
    background-color 300ms ease-out,
    border-color 300ms ease-out;
}
.tt-card[data-stage='empty'],
.tt-card[data-stage='form'],
.tt-card[data-stage='creating'] {
  background: var(--ui-bg-elevated);
  border-color: transparent;
}
.tt-card[data-stage='focus'] {
  background: var(--ui-bg);
  border-color: var(--ui-border);
}

/* Creating: the empty state's huddle again, the loader in its tile, the line under the title stepping through what
   is being done and a thin bar filling over the same seconds. */
.tt-creating {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.tt-creating-bar {
  display: block;
  width: 200px;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ui-bg-accented);
}
.tt-creating-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ui-secondary);
  transform-origin: left;
  animation: tt-fill linear both;
}
@keyframes tt-fill {
  from {
    transform: scaleX(0);
  }
}
.tt-step-enter-active,
.tt-step-leave-active {
  transition:
    opacity 180ms ease-out,
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tt-step-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tt-step-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.tt-focus {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 360px;
}

.tt-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tt-item {
  transition: background-color 150ms ease-out;
}
@media (hover: hover) and (pointer: fine) {
  button.tt-item:hover {
    background: var(--ui-bg-accented);
  }
}
.tt-item[aria-selected='true'] {
  background: var(--ui-bg);
  box-shadow:
    0 0 0 1px var(--ui-border),
    0 1px 2px rgb(0 0 0 / 0.04);
}
.tt-item:focus-visible {
  outline: 2px solid var(--ui-secondary);
  outline-offset: -2px;
}

/* The Team being written: dashed, so it reads as not there yet. */
.tt-draft[aria-selected='true'] {
  box-shadow: none;
  outline: 1.5px dashed var(--ui-border-accented);
  outline-offset: -1.5px;
  animation: tt-pop 260ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

/* The Team just created lands on the list with a pop and a green wash that fades. */
.tt-fresh {
  animation:
    tt-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) 260ms both,
    tt-wash 1600ms ease-out 260ms both;
}

@keyframes tt-pop {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
}
@keyframes tt-wash {
  from {
    background: color-mix(in oklab, var(--ui-success) 18%, var(--ui-bg));
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--ui-success) 60%, transparent),
      0 0 0 6px color-mix(in oklab, var(--ui-success) 14%, transparent);
  }
}

.tt-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
.tt-dot[data-tone='under-way'] {
  background: var(--ui-success);
}
.tt-dot[data-tone='upcoming'] {
  background: var(--ui-info);
}
.tt-dot[data-tone='finished'] {
  background: var(--ui-text-dimmed);
}

.tt-positions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.tt-cohorts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .tt-card,
  .tt-draft,
  .tt-fresh,
  .tt-step-enter-active,
  .tt-step-leave-active {
    animation: none !important;
    transition: none !important;
  }
}
</style>
