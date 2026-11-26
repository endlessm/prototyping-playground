<script setup lang="ts">
import { computed } from 'vue'
import { phaseOf, type Place } from '../_chart/district'
import FaceStack from '../_chart/FaceStack.vue'
import RunBar from './RunBar.vue'
import SearchInput from './SearchInput.vue'
import { useStructureSearch } from './search'

// Board: the Organization as a wall of Team cards that wraps down the page. Each card is a Team with its staff on top
// and its Cohorts listed inside with a run bar, so the whole district reads at a glance without folding anything.
const props = defineProps<{ root: Place }>()
const { search, query, teams } = useStructureSearch(props.root)

const summary = (cohorts: Place[]) => {
  const counts = new Map<string, number>()
  for (const c of cohorts) if (c.run) counts.set(phaseOf(c.run), (counts.get(phaseOf(c.run)) ?? 0) + 1)
  return [...counts].map(([phase, n]) => `${n} ${phase.toLowerCase()}`).join(' · ')
}
const total = computed(() => props.root.children.length)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SearchInput v-model="search" />
      <p class="text-sm text-muted" aria-live="polite">
        <template v-if="query">Showing {{ teams.length }} of {{ total }} Teams</template>
        <template v-else>{{ total }} Teams</template>
      </p>
    </div>

    <div class="flex items-center gap-4 rounded-xl border border-default bg-elevated/50 px-4 py-3">
      <div class="flex min-w-0 flex-1 flex-col">
        <h3 class="truncate text-sm font-semibold text-highlighted">{{ root.name }}</h3>
        <p class="text-xs text-muted">{{ root.detail }}</p>
      </div>
      <FaceStack :place="root" align="end" />
    </div>

    <ul v-if="teams.length" class="board">
      <li
        v-for="({ team, cohorts }, i) in teams"
        :key="team.id"
        class="board-card flex flex-col rounded-xl border border-default bg-default"
        :style="{ '--i': i }"
      >
        <div class="flex items-start gap-3 px-4 pt-4 pb-3">
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <h4 class="line-clamp-2 text-sm font-semibold text-highlighted">{{ team.name }}</h4>
            <p class="text-xs text-muted">
              {{ team.detail }}<template v-if="cohorts.length && summary(cohorts)"> · {{ summary(cohorts) }}</template>
            </p>
          </div>
          <FaceStack :place="team" align="end" />
        </div>

        <ul v-if="cohorts.length" class="flex flex-col border-t border-default">
          <li v-for="cohort in cohorts" :key="cohort.id" class="board-cohort flex flex-col gap-2 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex min-w-0 flex-1 flex-col">
                <p class="truncate text-sm text-highlighted">{{ cohort.name }}</p>
                <p class="text-xs text-muted">{{ cohort.detail }}</p>
              </div>
              <FaceStack :place="cohort" align="end" />
            </div>
            <div v-if="cohort.run" class="flex items-center gap-2">
              <UTooltip :text="cohort.run.status" :delay-duration="150">
                <RunBar :run="cohort.run" class="flex-1" tabindex="0" />
              </UTooltip>
              <span class="board-percent text-xs font-medium text-highlighted tabular-nums">{{ cohort.run.progress }}%</span>
            </div>
          </li>
        </ul>
        <p v-else class="border-t border-default px-4 py-3 text-xs text-dimmed">No Cohorts yet</p>
      </li>
    </ul>

    <div v-else class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default px-6 py-12 text-center">
      <UIcon name="i-lucide-search-x" class="size-8 text-dimmed" />
      <p class="text-sm font-medium text-highlighted">Nothing matches</p>
      <UButton color="neutral" variant="outline" @click="search = ''">Clear search</UButton>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  align-items: start;
  gap: 16px;
}

.board-cohort + .board-cohort {
  border-top: 1px solid var(--ui-border);
}

.board-percent {
  width: 34px;
  text-align: right;
}

.board-card {
  animation: board-in 240ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(var(--i) * 35ms);
}

@keyframes board-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .board-card {
    animation: none !important;
  }
}
</style>
