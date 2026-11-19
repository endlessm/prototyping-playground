<script setup lang="ts">
import { computed, ref } from 'vue'
import { occupantsOf, PHASES, phaseOf, type Phase, type Place } from './district'
import CohortRun from './CohortRun.vue'
import FaceStack from './FaceStack.vue'

// The Organization's structure as a list: the Organization on top, then each Team with its Cohorts under it, a row
// per place with what it holds and the faces of its people. A Team's name and its Cohorts' names start on the same
// line; what tells them apart is the branch that leaves the Team's chevron and turns into each Cohort. Teams fold
// away their Cohorts, so a large district reads as a list of Teams first.
// Above the list, the same toolbar as People: the quick search on the left, the filters on the right. The search finds
// a Team, a Cohort or someone in one; a Team that matches keeps all its Cohorts, and a Team with a matching Cohort
// opens to show only those. Status and staffing filter Cohorts, so a Team stays while any of its Cohorts fit.
const props = defineProps<{ root: Place }>()

const search = ref('')
const teams = ref<string[]>([])
const statuses = ref<Phase[]>([])
const staffing = ref<'all' | 'noFacilitators'>('all')

const teamItems = computed(() => props.root.children.map((team) => team.name))
const statusItems = PHASES
const staffingItems = [
  { label: 'Any staffing', value: 'all' },
  { label: 'No Facilitators', value: 'noFacilitators' },
]

const query = computed(() => search.value.trim().toLowerCase())
const found = (place: Place) =>
  !query.value ||
  `${place.name} ${occupantsOf(place)
    .map((o) => `${o.name} ${o.email}`)
    .join(' ')}`
    .toLowerCase()
    .includes(query.value)
const facilitated = (cohort: Place) =>
  cohort.positions.some((p) => p.role === 'Facilitator' && p.members.length > 0)
const cohortFilters = computed(() => !!statuses.value.length || staffing.value !== 'all')
const fits = (cohort: Place) =>
  (!statuses.value.length || (!!cohort.run && statuses.value.includes(phaseOf(cohort.run)))) &&
  (staffing.value === 'all' || !facilitated(cohort))

const filtering = computed(() => !!query.value || !!teams.value.length || cohortFilters.value)

// Each Team that stays, with the Cohorts it shows.
const shown = computed(() =>
  props.root.children
    .filter((team) => !teams.value.length || teams.value.includes(team.name))
    .map((team) => {
      const fitting = team.children.filter(fits)
      const cohorts = found(team) ? fitting : fitting.filter(found)
      return { team, cohorts }
    })
    .filter(({ team, cohorts }) =>
      cohortFilters.value || (query.value && !found(team)) ? cohorts.length > 0 : true,
    ),
)
const shownCohorts = computed(() => shown.value.reduce((sum, t) => sum + t.cohorts.length, 0))
const allCohorts = computed(() => props.root.children.reduce((sum, t) => sum + t.children.length, 0))

function clear() {
  search.value = ''
  teams.value = []
  statuses.value = []
  staffing.value = 'all'
}

const folded = ref(new Set<string>())
const toggle = (team: Place) =>
  folded.value.has(team.id) ? folded.value.delete(team.id) : folded.value.add(team.id)
// While filtering, a Team opens on its own so what matched is in sight; folding it still works.
const open = (team: Place, cohorts: Place[]) => cohorts.length > 0 && !folded.value.has(team.id)
const allFolded = () => shown.value.every(({ team }) => folded.value.has(team.id))
const toggleAll = () =>
  (folded.value = allFolded() ? new Set() : new Set(props.root.children.map((team) => team.id)))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search Teams, Cohorts or people"
        aria-label="Search the structure"
        class="w-full sm:w-72"
        @update:model-value="folded = new Set()"
      >
        <template v-if="search" #trailing>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="sm"
            aria-label="Clear search"
            @click="search = ''"
          />
        </template>
      </UInput>

      <div class="flex flex-wrap items-center gap-2">
        <USelectMenu
          v-model="teams"
          :items="teamItems"
          multiple
          :search-input="{ placeholder: 'Find a Team' }"
          aria-label="Filter by Team"
          :ui="{ content: 'min-w-72' }"
          class="w-36"
        >
          <span class="flex items-center gap-1.5">
            Team
            <UBadge v-if="teams.length" color="neutral" variant="soft" size="sm">{{ teams.length }}</UBadge>
          </span>
        </USelectMenu>
        <USelectMenu
          v-model="statuses"
          :items="statusItems"
          multiple
          :search-input="false"
          aria-label="Filter Cohorts by status"
          class="w-36"
          @update:model-value="folded = new Set()"
        >
          <span class="flex items-center gap-1.5">
            Status
            <UBadge v-if="statuses.length" color="neutral" variant="soft" size="sm">{{ statuses.length }}</UBadge>
          </span>
        </USelectMenu>
        <USelect
          v-model="staffing"
          :items="staffingItems"
          aria-label="Filter Cohorts by staffing"
          :content="{ align: 'end' }"
          class="w-40"
          @update:model-value="folded = new Set()"
        />
      </div>
    </div>

    <div v-if="filtering" class="-my-1 flex items-center justify-between gap-3">
      <p class="text-sm text-muted" aria-live="polite">Showing {{ shown.length }} of {{ root.children.length }} Teams and {{ shownCohorts }} of {{ allCohorts }} Cohorts</p>
      <UButton color="neutral" variant="link" size="sm" class="-me-2" @click="clear">Clear filters</UButton>
    </div>

    <div class="overflow-hidden rounded-xl border border-default bg-default">
      <div class="flex items-center gap-4 border-b border-default px-4 py-3">
        <div class="flex min-w-0 flex-1 flex-col">
          <h3 class="truncate text-sm font-semibold text-highlighted">{{ root.name }}</h3>
          <p class="text-xs text-muted">{{ root.detail }}</p>
        </div>
        <FaceStack :place="root" align="end" />
      </div>

      <template v-if="shown.length">
        <div class="flex items-center justify-between border-b border-default bg-elevated/50 px-4 py-1.5">
          <span class="text-xs font-medium text-muted">{{ shown.length }} Teams</span>
          <UButton color="neutral" variant="link" size="xs" class="-me-2" @click="toggleAll">
            {{ allFolded() ? 'Expand all' : 'Collapse all' }}
          </UButton>
        </div>

        <ul class="divide-y divide-default">
          <li v-for="{ team, cohorts } in shown" :key="team.id">
            <div class="place">
              <div class="rail">
                <span class="rail-rest" />
                <UButton
                  :icon="open(team, cohorts) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :disabled="!cohorts.length"
                  :aria-expanded="open(team, cohorts)"
                  :aria-label="`${open(team, cohorts) ? 'Hide' : 'Show'} the Cohorts of ${team.name}`"
                  @click="toggle(team)"
                />
                <span class="rail-rest" :class="{ stem: open(team, cohorts) }" />
              </div>
              <div class="place-text team-text">
                <p class="truncate text-sm font-medium text-highlighted">{{ team.name }}</p>
                <p class="text-xs text-muted">
                  {{ team.detail }}
                  <template v-if="filtering && cohorts.length < team.children.length">
                    · {{ cohorts.length }} shown
                  </template>
                </p>
              </div>
              <div class="place-faces">
                <FaceStack :place="team" align="end" />
              </div>
            </div>

            <ul v-if="open(team, cohorts)" class="pb-2">
              <li v-for="cohort in cohorts" :key="cohort.id" class="place cohort">
                <span class="rail branch" aria-hidden="true" />
                <div class="place-text cohort-text">
                  <p class="truncate text-sm text-highlighted">{{ cohort.name }}</p>
                  <p class="text-xs text-muted">{{ cohort.detail }}</p>
                </div>
                <div v-if="cohort.run" class="place-run">
                  <CohortRun :run="cohort.run" />
                </div>
                <div class="place-faces">
                  <FaceStack :place="cohort" align="end" />
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </template>

      <p v-else-if="!filtering" class="px-4 py-8 text-center text-sm text-muted">No Teams yet</p>

      <div v-else class="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <UIcon name="i-lucide-search-x" class="size-8 text-dimmed" />
        <div class="flex flex-col gap-1">
          <p class="text-sm font-medium text-highlighted">Nothing matches</p>
          <p class="text-sm text-muted">Try another name, or clear the filters to see every Team.</p>
        </div>
        <UButton color="neutral" variant="outline" @click="clear">Clear filters</UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* A row is a rail, the place's text and its faces. The rail is as wide as the chevron and as tall as the row, and the
   row's padding sits on the text, so the branch runs unbroken from one row into the next and every text starts at the
   same distance from the edge. */
.place {
  --line: 1.5px;
  --ink: var(--ui-border-accented);
  --turn: 12px;
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 0 16px;
}

.rail {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  width: 24px;
  margin-left: -6px;
}

.rail-rest {
  flex: 1;
}

/* The branch leaves the chevron from below. */
.stem {
  margin-top: 2px;
  border-left: var(--line) solid var(--ink);
  border-radius: var(--line) var(--line) 0 0;
}

.place-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.team-text {
  padding: 12px 0;
}

.cohort-text {
  padding: 8px 0;
}

/* The faces keep the width of a full stack (five faces and the count), so each Cohort's run lines up with the next
   one's in the middle of the row. */
.place-faces {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  min-width: 164px;
}

.place-run {
  display: flex;
  flex: none;
  align-items: center;
}

/* The branch going on down to the next Cohort. */
.branch::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(50% - var(--line) / 2);
  border-left: var(--line) solid var(--ink);
}

.cohort:last-child .branch::before {
  display: none;
}

/* Its turn into this Cohort, a quarter circle that stops short of the name, level with the middle of the name's line
   (the text's 8px padding and half of its 20px line). */
.branch::after {
  content: '';
  position: absolute;
  top: 0;
  left: calc(50% - var(--line) / 2);
  width: 18px;
  height: 18px;
  border-bottom: var(--line) solid var(--ink);
  border-left: var(--line) solid var(--ink);
  border-bottom-left-radius: var(--turn);
}
</style>
