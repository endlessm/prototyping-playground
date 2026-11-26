<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { phaseOf, type Phase, type Place } from '../_chart/district'
import CohortRun from '../_chart/CohortRun.vue'
import FaceStack from '../_chart/FaceStack.vue'
import SearchInput from './SearchInput.vue'
import { useStructureSearch } from './search'

// Focus: one Team at a time. The Teams run down the left as a list you pick from (arrow keys too), each with a dot per
// Cohort in its phase's colour; the right shows the picked Team in full: who holds each position, by name, and its
// Cohorts as cards. Nothing folds and nothing grows sideways; a large district only makes the left list longer.
const props = defineProps<{ root: Place }>()
const { search, query, teams } = useStructureSearch(props.root)

const picked = ref(props.root.children[0]?.id)
watch(teams, (shown) => {
  if (!shown.some(({ team }) => team.id === picked.value)) picked.value = shown[0]?.team.id
})
const current = computed(() => teams.value.find(({ team }) => team.id === picked.value))

const DOT: Record<Phase, string> = { 'Under way': 'under-way', Upcoming: 'upcoming', Finished: 'finished' }
const dot = (cohort: Place) => (cohort.run ? DOT[phaseOf(cohort.run)] : 'finished')

const items = ref<HTMLButtonElement[]>([])
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const at = teams.value.findIndex(({ team }) => team.id === picked.value)
  const next = Math.min(teams.value.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)))
  picked.value = teams.value[next]?.team.id
  items.value[next]?.focus()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SearchInput v-model="search" />
      <p v-if="query" class="text-sm text-muted" aria-live="polite">
        Showing {{ teams.length }} of {{ root.children.length }} Teams
      </p>
    </div>

    <div class="overflow-hidden rounded-xl border border-default bg-default">
      <div class="flex items-center gap-4 border-b border-default px-4 py-3">
        <div class="flex min-w-0 flex-1 flex-col">
          <h3 class="truncate text-sm font-semibold text-highlighted">{{ root.name }}</h3>
          <p class="text-xs text-muted">{{ root.detail }}</p>
        </div>
        <FaceStack :place="root" align="end" />
      </div>

      <div v-if="teams.length" class="focus">
        <ul class="focus-nav border-r border-default bg-elevated/50 p-2" role="listbox" aria-label="Teams" @keydown="onKey">
          <li v-for="({ team, cohorts }, i) in teams" :key="team.id">
            <button
              :ref="(el) => el && (items[i] = el as HTMLButtonElement)"
              type="button"
              role="option"
              :aria-selected="team.id === picked"
              :tabindex="team.id === picked ? 0 : -1"
              class="focus-item flex w-full cursor-pointer flex-col gap-1.5 rounded-lg px-3 py-2.5 text-left"
              @click="picked = team.id"
            >
              <span class="line-clamp-2 text-sm font-medium text-highlighted">{{ team.name }}</span>
              <span class="flex items-center gap-2 text-xs text-muted">
                <span class="flex items-center gap-1" aria-hidden="true">
                  <span v-for="c in cohorts" :key="c.id" class="focus-dot" :data-tone="dot(c)" />
                </span>
                {{ team.detail }}
              </span>
            </button>
          </li>
        </ul>

        <section v-if="current" :key="current.team.id" class="focus-panel flex min-w-0 flex-col gap-6 p-6">
          <div class="flex flex-col gap-1">
            <h3 class="text-lg font-semibold text-highlighted">{{ current.team.name }}</h3>
            <p class="text-sm text-muted">{{ current.team.detail }}</p>
          </div>

          <div class="focus-positions">
            <div v-for="position in current.team.positions" :key="position.id" class="flex flex-col gap-2">
              <p class="text-xs font-medium text-muted">{{ position.title }}</p>
              <ul v-if="position.members.length" class="flex flex-wrap gap-1.5">
                <li
                  v-for="m in position.members"
                  :key="m.email"
                  class="flex items-center gap-2 rounded-full border border-default py-0.5 pe-3 focus-chip"
                  :class="{ 'border-dashed': m.invited }"
                >
                  <UAvatar
                    :text="m.initials"
                    :alt="m.name"
                    size="xs"
                    :ui="{ fallback: 'text-[10px]' }"
                    :class="m.invited ? 'bg-info-50 text-info-700' : 'bg-secondary-50 text-secondary-700'"
                  />
                  <span class="text-sm text-highlighted">{{ m.name }}</span>
                  <span v-if="m.invited" class="text-xs text-muted">Invited</span>
                </li>
              </ul>
              <p v-else class="text-sm text-dimmed">No one yet</p>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <p class="text-xs font-medium text-muted">
              Cohorts<template v-if="current.cohorts.length < current.team.children.length">
                · {{ current.cohorts.length }} of {{ current.team.children.length }} shown</template
              >
            </p>
            <ul v-if="current.cohorts.length" class="focus-cohorts">
              <li
                v-for="(cohort, i) in current.cohorts"
                :key="cohort.id"
                class="focus-cohort flex flex-col gap-3 rounded-lg border border-default p-4"
                :style="{ '--i': i }"
              >
                <div class="flex flex-col gap-0.5">
                  <p class="line-clamp-2 text-sm font-medium text-highlighted">{{ cohort.name }}</p>
                  <p class="text-xs text-muted">{{ cohort.detail }}</p>
                </div>
                <CohortRun v-if="cohort.run" :run="cohort.run" />
                <FaceStack :place="cohort" />
              </li>
            </ul>
            <p v-else class="rounded-lg border border-dashed border-default px-4 py-6 text-center text-sm text-dimmed">
              No Cohorts yet
            </p>
          </div>
        </section>
      </div>

      <div v-else class="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <UIcon name="i-lucide-search-x" class="size-8 text-dimmed" />
        <p class="text-sm font-medium text-highlighted">Nothing matches</p>
        <UButton color="neutral" variant="outline" @click="search = ''">Clear search</UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 360px;
}

.focus-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.focus-item {
  transition: background-color 150ms ease-out;
}
@media (hover: hover) and (pointer: fine) {
  .focus-item:hover {
    background: var(--ui-bg-accented);
  }
}
.focus-item[aria-selected='true'] {
  background: var(--ui-bg);
  box-shadow:
    0 0 0 1px var(--ui-border),
    0 1px 2px rgb(0 0 0 / 0.04);
}
.focus-item:focus-visible {
  outline: 2px solid var(--ui-secondary);
  outline-offset: -2px;
}

.focus-chip {
  padding-inline-start: 2px;
}

.focus-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
.focus-dot[data-tone='under-way'] {
  background: var(--ui-success);
}
.focus-dot[data-tone='upcoming'] {
  background: var(--ui-info);
}
.focus-dot[data-tone='finished'] {
  background: var(--ui-text-dimmed);
}

.focus-positions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.focus-cohorts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.focus-panel {
  animation: focus-in 180ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
.focus-cohort {
  animation: focus-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(60ms + var(--i) * 30ms);
}

@keyframes focus-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .focus-panel,
  .focus-cohort {
    animation: none !important;
  }
}
</style>
