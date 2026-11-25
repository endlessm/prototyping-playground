<script setup lang="ts">
import { computed, ref } from 'vue'
import { PHASES, phaseOf, type Phase, type Place } from '../_chart/district'
import FaceStack from '../_chart/FaceStack.vue'
import RunBar from './RunBar.vue'
import SearchInput from './SearchInput.vue'
import { useStructureSearch } from './search'

// Phases: the Cohorts sorted by where their run stands, Upcoming, Under way and Finished, instead of by Team. Each
// card names its Team; the Team chips above narrow the board to one or more Teams, each with its staff in the chip's
// tooltip. It answers "what is running right now" first and "how is this built" second.
const props = defineProps<{ root: Place }>()
const { search, query, teams } = useStructureSearch(props.root)

const picked = ref<string[]>([])
const toggle = (id: string) =>
  (picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id])

const ORDER: Phase[] = ['Upcoming', 'Under way', 'Finished']
const TONE: Record<Phase, string> = { 'Under way': 'under-way', Upcoming: 'upcoming', Finished: 'finished' }

const cards = computed(() =>
  teams.value
    .filter(({ team }) => !picked.value.length || picked.value.includes(team.id))
    .flatMap(({ team, cohorts }) => cohorts.map((cohort) => ({ team, cohort }))),
)
const columns = computed(() =>
  ORDER.filter((p) => PHASES.includes(p)).map((phase) => ({
    phase,
    cards: cards.value.filter(({ cohort }) => cohort.run && phaseOf(cohort.run) === phase),
  })),
)
const empty = computed(() => teams.value.filter(({ team }) => !team.children.length).map(({ team }) => team.name))
const staff = (team: Place) =>
  team.positions.map((p) => `${p.title}: ${p.members.map((m) => m.name).join(', ') || 'no one yet'}`)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SearchInput v-model="search" />
      <p class="text-sm text-muted" aria-live="polite">
        {{ cards.length }} Cohorts<template v-if="query || picked.length"> shown</template>
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

      <div class="flex flex-wrap items-center gap-2 border-b border-default bg-elevated/50 px-4 py-2.5" role="group" aria-label="Show Teams">
        <UButton
          size="sm"
          :color="picked.length ? 'neutral' : 'secondary'"
          :variant="picked.length ? 'ghost' : 'subtle'"
          :aria-pressed="!picked.length"
          @click="picked = []"
        >
          All Teams
        </UButton>
        <UTooltip v-for="{ team } in teams" :key="team.id" :delay-duration="250" :ui="{ content: 'h-auto py-1.5' }">
          <UButton
            size="sm"
            :color="picked.includes(team.id) ? 'secondary' : 'neutral'"
            :variant="picked.includes(team.id) ? 'subtle' : 'ghost'"
            :aria-pressed="picked.includes(team.id)"
            @click="toggle(team.id)"
          >
            {{ team.name }}
            <span class="text-dimmed tabular-nums">{{ team.children.length }}</span>
          </UButton>
          <template #content>
            <span class="flex flex-col">
              <span v-for="line in staff(team)" :key="line">{{ line }}</span>
            </span>
          </template>
        </UTooltip>
      </div>

      <div class="phases p-4">
        <section v-for="col in columns" :key="col.phase" class="flex min-w-0 flex-col gap-3" :aria-label="col.phase">
          <h4 class="flex items-center gap-2 px-1 text-xs font-medium text-muted">
            <span class="phase-dot" :data-tone="TONE[col.phase]" aria-hidden="true" />
            {{ col.phase }}
            <span class="text-dimmed tabular-nums">{{ col.cards.length }}</span>
          </h4>
          <TransitionGroup
            tag="ul"
            class="phase-list relative flex flex-col gap-2"
            enter-from-class="phase-enter-from"
            leave-to-class="phase-leave-to"
            enter-active-class="phase-enter-active"
            leave-active-class="phase-leave-active"
            move-class="phase-move"
          >
            <li
              v-for="{ team, cohort } in col.cards"
              :key="cohort.id"
              class="flex flex-col gap-2.5 rounded-lg border border-default bg-default p-3"
            >
              <div class="flex flex-col gap-0.5">
                <p class="line-clamp-2 text-sm font-medium text-highlighted">{{ cohort.name }}</p>
                <p class="truncate text-xs text-muted">{{ team.name }} · {{ cohort.detail }}</p>
              </div>
              <div v-if="cohort.run" class="flex flex-col gap-1">
                <RunBar :run="cohort.run" />
                <p class="flex justify-between text-xs text-muted">
                  <span>{{ cohort.run.status }}</span>
                  <span class="font-medium text-highlighted tabular-nums">{{ cohort.run.progress }}%</span>
                </p>
              </div>
              <FaceStack :place="cohort" />
            </li>
          </TransitionGroup>
          <p v-if="!col.cards.length" class="rounded-lg border border-dashed border-default px-3 py-6 text-center text-xs text-dimmed">
            None
          </p>
        </section>
      </div>

      <p v-if="empty.length" class="border-t border-default px-4 py-3 text-xs text-muted">
        No Cohorts yet in {{ empty.join(', ') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.phases {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}

.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
.phase-dot[data-tone='under-way'] {
  background: var(--ui-success);
}
.phase-dot[data-tone='upcoming'] {
  background: var(--ui-info);
}
.phase-dot[data-tone='finished'] {
  background: var(--ui-text-dimmed);
}

.phase-list > li {
  animation: phase-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

:deep(.phase-enter-active) {
  transition:
    opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
:deep(.phase-leave-active) {
  position: absolute;
  width: 100%;
  transition:
    opacity 120ms ease-out,
    transform 120ms ease-out;
}
:deep(.phase-enter-from),
:deep(.phase-leave-to) {
  opacity: 0;
  transform: scale(0.97);
}
:deep(.phase-move) {
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes phase-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .phase-list > li {
    animation: none !important;
    transition: none !important;
  }
}
</style>
