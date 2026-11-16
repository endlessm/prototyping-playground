<script setup lang="ts">
import { computed } from 'vue'
import Badge from './Badge.vue'
import Marker from './Marker.vue'
import Meter from './Meter.vue'
import Ring from './Ring.vue'
import TextLink from './TextLink.vue'
import type { Cohort, Stage } from './team'
import s from './ui.module.css'

// The Cohorts tab's list. With every cohort at one stage it's a table. Once they're at more than one, it's a board
// of three columns, Starting soon, Running and Finished, with a card per cohort that shows its stage at a glance:
// seats filling up, how far it has got, or how learners came out. Each list keeps the order it's given.
const props = defineProps<{ cohorts: Cohort[]; walkthrough?: boolean }>()

const stageOf = (cohort: Cohort): Stage => cohort.stage ?? 'upcoming'
const columns = computed(() =>
  (
    [
      { stage: 'upcoming', title: 'Starting soon', icon: 'i-lucide-calendar' },
      { stage: 'running', title: 'Running', icon: 'i-lucide-play' },
      { stage: 'finished', title: 'Finished', icon: 'i-lucide-flag' },
    ] as const
  )
    .map((column) => ({ ...column, cohorts: props.cohorts.filter((cohort) => stageOf(cohort) === column.stage) }))
    .filter((column) => column.cohorts.length),
)
const staged = computed(() => columns.value.length > 1)

const short = (date?: string) => date?.split(',')[0]
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
</script>

<template>
  <div v-if="staged" :class="s.board">
    <section v-for="column in columns" :key="column.stage" :class="s.boardColumn">
      <div :class="s.row">
        <UIcon :name="column.icon" class="size-4 text-dimmed" />
        <span :class="s.label">{{ column.title }}</span>
        <Badge>{{ column.cohorts.length }}</Badge>
        <Marker v-if="walkthrough && column.stage === 'finished'" :flow="3" :n="8" />
      </div>

      <article v-for="cohort in column.cohorts" :key="cohort.name" :class="s.cohortCard">
        <div :class="[s.row, s.spread]" style="align-items: flex-start">
          <div :class="[s.stack, s.tight]" style="gap: 0">
            <strong>
              <TextLink v-if="cohort.to" :to="cohort.to">{{ cohort.name }}</TextLink>
              <template v-else>{{ cohort.name }}</template>
            </strong>
            <span :class="s.small">{{ cohort.program }}</span>
          </div>
          <Badge v-if="cohort.justCreated" tone="solid">New</Badge>
        </div>

        <div v-if="column.stage === 'upcoming'" :class="[s.row, s.spread]">
          <Meter
            :parts="[
              { value: cohort.joined, label: 'seats taken', tone: 'progress' },
              { value: cohort.seats - cohort.joined, label: 'seats free', tone: 'track' },
            ]"
            style="flex: 1; max-width: 180px"
          />
          <span :class="s.figure">{{ cohort.joined }}/{{ cohort.seats }}</span>
        </div>

        <div v-else-if="column.stage === 'running' && cohort.progress" :class="[s.stack, s.tight]" style="gap: 6px">
          <div :class="[s.row, s.spread]">
            <span :class="s.small">{{ cohort.progress.unit }} {{ cohort.progress.at }}/{{ cohort.progress.of }}</span>
            <span
              :class="[s.row, s.figure]"
              style="gap: 4px"
              :title="`${cohort.active} of ${cohort.joined} learners active`"
            >
              <UIcon name="i-lucide-users" class="size-4 text-dimmed" />{{ cohort.active }}/{{ cohort.joined }}
            </span>
          </div>
          <Meter
            :parts="[
              { value: cohort.progress.at, label: 'done', tone: 'progress' },
              { value: cohort.progress.of - cohort.progress.at, label: 'to go', tone: 'track' },
            ]"
            style="max-width: none"
          />
        </div>

        <div v-else :class="s.row" style="gap: 14px">
          <Ring :done="cohort.certified ?? 0" :rest="cohort.stopped ?? 0" />
          <span :class="[s.stack, s.tight]" style="gap: 2px">
            <span :class="s.row" style="gap: 6px">
              <UIcon name="i-lucide-award" class="size-4" style="color: var(--es-lime-700)" />
              <span :class="s.figure">{{ cohort.certified }}</span>
              <span :class="s.small">certified</span>
            </span>
            <span :class="s.row" style="gap: 6px">
              <UIcon name="i-lucide-user-x" class="size-4 text-dimmed" />
              <span :class="s.figure">{{ cohort.stopped }}</span>
              <span :class="s.small">stopped</span>
            </span>
          </span>
        </div>

        <div :class="[s.row, s.spread]" style="border-top: 1px solid var(--es-border-muted); padding-top: 10px">
          <span :class="[s.row, s.small]" style="gap: 6px">
            <UIcon
              :name="column.stage === 'finished' ? 'i-lucide-flag' : 'i-lucide-calendar'"
              class="size-4 text-dimmed"
            />
            {{
              column.stage === 'finished'
                ? `Ended ${short(cohort.ended)}`
                : `${column.stage === 'running' ? 'Started' : 'Starts'} ${short(cohort.starts)}`
            }}
          </span>
          <span :class="s.avatars" :title="`Managed by ${cohort.managers.join(', ')}`">
            <span v-for="manager in cohort.managers" :key="manager" :class="s.avatar">{{ initials(manager) }}</span>
          </span>
        </div>
      </article>
    </section>
  </div>

  <table v-else :class="s.table">
    <thead>
      <tr>
        <th>Cohort</th>
        <th>Program</th>
        <th>Starts</th>
        <th>Learners</th>
        <th>Managed by</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="cohort in cohorts" :key="cohort.name">
        <td>
          <TextLink v-if="cohort.to" :to="cohort.to">{{ cohort.name }}</TextLink>
          <template v-else>{{ cohort.name }}</template>
        </td>
        <td>{{ cohort.program }}</td>
        <td>{{ cohort.starts }}</td>
        <td>{{ cohort.joined }} of {{ cohort.seats }} seats</td>
        <td>{{ cohort.managers.join(', ') }}</td>
      </tr>
    </tbody>
  </table>
</template>
