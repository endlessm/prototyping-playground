<script setup lang="ts">
import { computed, ref } from 'vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import Card from './Card.vue'
import Marker from './Marker.vue'
import Ring from './Ring.vue'
import Small from './Small.vue'
import TextLink from './TextLink.vue'
import Tip from './Tip.vue'
import { type Cohort, fallOutcomes, godotSessions } from './team'
import s from './ui.module.css'

// Finished: the Running page's layout, once the last session is over. On top, how the class came out (the ring,
// Download Certificates, Run Again). Then the same journey, with each learner standing where they ended: past the last
// session at the certificate, or on the session where they stopped. Below, every learner's outcome, and beside it
// those who stopped partway, or the learner picked on the journey. Picking a stop or a learner narrows the list.
const props = defineProps<{ cohort: Cohort; walkthrough?: boolean }>()
const emit = defineEmits<{ runAgain: [] }>()

type Outcome = (typeof fallOutcomes)[number]

const progress = props.cohort.progress ?? { at: 10, of: 10, unit: 'Session' }
const unit = progress.unit.toLowerCase()
const FINISH = progress.of + 1
const stops = Array.from({ length: progress.of }, (_, index) => index + 1)
// The finish line can't fit every certified learner, so past this many it shows a count instead.
const SHOWN = 2

const stop = ref<number | null>(null)
const learner = ref<string | null>(null)
const downloaded = ref(new Set<string>())

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
const first = (name: string) => name.split(' ')[0]
const shortDate = (date: string) => date.split(',')[0]
const stopName = (session: number) => `${progress.unit} ${session}: ${godotSessions[session - 1]}`
const listed = (numbers: number[]) => numbers.join(', ').replace(/, (\d+)$/, ' and $1')

const certified = fallOutcomes.filter((person) => person.certified)
const stopped = fallOutcomes.filter((person) => person.stoppedAt)
const endedAt = (person: Outcome) => person.stoppedAt ?? FINISH
const at = (where: number) => fallOutcomes.filter((person) => endedAt(person) === where)
const picked = computed(() => fallOutcomes.find((person) => person.name === learner.value))
const rows = computed(() =>
  fallOutcomes.filter(
    (person) => (!stop.value || endedAt(person) === stop.value) && (!learner.value || person.name === learner.value),
  ),
)

const stopHint = (session: number) =>
  [
    stopName(session),
    at(session).length && `${at(session).map((person) => first(person.name)).join(', ')} stopped here`,
    stop.value === session ? 'Click to show every learner' : at(session).length && 'Click to show only them',
  ]
    .filter(Boolean)
    .join(' · ')
const finishHint = computed(
  () =>
    `${certified.length} earned the certificate after ${progress.unit} ${progress.of} · ${
      stop.value === FINISH ? 'Click to show every learner' : 'Click to show only them'
    }`,
)
const filterLabel = computed(() =>
  stop.value === FINISH ? 'Earned the certificate' : `Stopped at ${progress.unit} ${stop.value}`,
)

const cellStates: Record<string, string> = {
  done: 'Approved',
  stopped: 'Stopped here',
  locked: 'Never reached',
}

function cell(person: Outcome, session: number) {
  if (!person.stoppedAt || session < person.stoppedAt) return 'done'
  return session === person.stoppedAt ? 'stopped' : 'locked'
}

function pickStop(where: number) {
  stop.value = stop.value === where ? null : where
}

function pickLearner(name: string) {
  learner.value = learner.value === name ? null : name
}

function download(name: string) {
  downloaded.value = new Set(downloaded.value).add(name)
}
</script>

<template>
  <Card style="padding: 20px 24px">
    <div :class="[s.row, s.spread, s.wrap]" style="gap: 24px">
      <div :class="s.row" style="gap: 20px">
        <Ring :done="cohort.certified ?? 0" :rest="cohort.stopped ?? 0" />
        <span :class="[s.stack, s.tight]" style="gap: 4px">
          <span :class="s.row" style="gap: 8px">
            <span :class="s.figure" style="font-size: 18px">
              {{ cohort.certified }} of {{ cohort.joined }} earned the certificate
            </span>
            <Marker v-if="walkthrough" :flow="5" :n="11" />
          </span>
          <Small>
            {{ cohort.stopped }} stopped partway, at {{ unit }}s
            {{ listed(stopped.map((person) => person.stoppedAt as number)) }}. Ran 13 weeks.
          </Small>
        </span>
      </div>
      <span :class="s.row">
        <Tip :text="`One file with all ${certified.length} certificates`">
          <Button variant="secondary">Download Certificates</Button>
        </Tip>
        <Tip :text="`A new cohort of ${cohort.program}`">
          <Button @click="emit('runAgain')">Run Again</Button>
        </Tip>
      </span>
    </div>
  </Card>

  <Card>
    <div :class="[s.row, s.spread]">
      <span :class="s.label">Class journey</span>
      <span :class="s.row" style="gap: 20px">
        <span :class="s.legend"><i :class="[s.legendDot, s['pace-ahead']]" />Earned the certificate</span>
        <span :class="s.legend"><i :class="[s.legendDot, s['pace-inactive']]" />Stopped partway</span>
      </span>
    </div>

    <div :class="s.track" :style="{ '--stops': FINISH, '--reached': 1 }">
      <div v-for="session in stops" :key="session" :class="s.stop">
        <div :class="s.stopLearners">
          <Tip
            v-for="person in at(session)"
            :key="person.name"
            :text="`${person.name} · Stopped here, last active ${shortDate(person.lastActive)}`"
          >
            <button
              type="button"
              :class="[s.avatar, s.traveller, s['pace-inactive'], learner === person.name && s.travellerOn]"
              :aria-pressed="learner === person.name"
              :aria-label="person.name"
              @click="pickLearner(person.name)"
            >
              {{ initials(person.name) }}
            </button>
          </Tip>
        </div>
        <Tip :text="stopHint(session)">
          <button
            type="button"
            :class="[s.node, s.nodeReached, stop === session && s.nodeOn]"
            :aria-pressed="stop === session"
            :aria-label="stopName(session)"
            @click="pickStop(session)"
          >
            {{ session }}
          </button>
        </Tip>
      </div>

      <div :class="s.stop">
        <div :class="s.stopLearners">
          <Tip
            v-for="person in certified.slice(0, SHOWN)"
            :key="person.name"
            :text="`${person.name} · Earned it on ${shortDate(person.certified as string)}`"
          >
            <button
              type="button"
              :class="[s.avatar, s.traveller, s['pace-ahead'], learner === person.name && s.travellerOn]"
              :aria-pressed="learner === person.name"
              :aria-label="person.name"
              @click="pickLearner(person.name)"
            >
              {{ initials(person.name) }}
            </button>
          </Tip>
          <Tip
            v-if="certified.length > SHOWN"
            :text="
              certified
                .slice(SHOWN)
                .map((person) => person.name)
                .join(', ')
            "
          >
            <button type="button" :class="[s.avatar, s.traveller, s.travellerMore]" @click="pickStop(FINISH)">
              +{{ certified.length - SHOWN }}
            </button>
          </Tip>
        </div>
        <Tip :text="finishHint">
          <button
            type="button"
            :class="[s.node, s.nodeFinish, stop === FINISH && s.nodeOn]"
            :aria-pressed="stop === FINISH"
            aria-label="Earned the certificate"
            @click="pickStop(FINISH)"
          >
            <UIcon name="i-lucide-award" class="size-4" />
          </button>
        </Tip>
        <span :class="[s.stopTag, s.stopTagFinish]">Certificate</span>
      </div>
    </div>
  </Card>

  <div :class="s.runColumns">
    <div :class="[s.stack, s.tight]">
      <div :class="[s.row, s.spread]" style="min-height: 32px">
        <span :class="s.row">
          <span :class="s.label">Learners</span>
          <Badge>{{ rows.length }}</Badge>
        </span>
        <span :class="s.row" style="gap: 8px">
          <Tip v-if="stop" text="Show every learner">
            <button type="button" :class="s.filter" class="whitespace-nowrap" @click="stop = null">
              {{ filterLabel }}
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
          </Tip>
          <Tip v-if="learner" text="Show the whole class">
            <button type="button" :class="s.filter" class="whitespace-nowrap" @click="learner = null">
              {{ learner }}
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
          </Tip>
          <TextLink v-if="!stop && !learner">Export Results (CSV)</TextLink>
        </span>
      </div>

      <table :class="s.table">
        <thead>
          <tr>
            <th>Learner</th>
            <th>Outcome</th>
            <th>Certificate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in rows" :key="person.name">
            <td>
              <Tip :text="`See ${first(person.name)}'s path through the ${unit}s`">
                <button type="button" :class="[s.row, s.updateWho]" @click="pickLearner(person.name)">
                  <span :class="[s.avatar, s.outcomeAvatar, person.certified ? s['pace-ahead'] : s['pace-inactive']]">
                    {{ initials(person.name) }}
                  </span>
                  {{ person.name }}
                </button>
              </Tip>
            </td>
            <td>
              <span v-if="person.certified" :class="s.row" style="gap: 6px">
                <UIcon name="i-lucide-award" class="size-4 shrink-0" style="color: var(--es-lime-700)" />
                Earned it on {{ shortDate(person.certified) }}
              </span>
              <Tip v-else :text="stopName(person.stoppedAt as number)">
                <button type="button" :class="[s.row, s.updateWho]" style="gap: 6px" @click="pickStop(endedAt(person))">
                  <UIcon name="i-lucide-user-x" class="size-4 shrink-0 text-dimmed" />
                  Stopped at {{ progress.unit }} {{ person.stoppedAt }}
                </button>
              </Tip>
            </td>
            <td>
              <template v-if="person.certified">
                <span v-if="downloaded.has(person.name)" :class="[s.row, s.sent]">
                  <UIcon name="i-lucide-check" class="size-4" /> Downloaded
                </span>
                <Tip v-else :text="`${first(person.name)}'s certificate for ${cohort.program}`">
                  <TextLink @click="download(person.name)">Download</TextLink>
                </Tip>
              </template>
              <Small v-else>None</Small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition
      mode="out-in"
      :enter-from-class="s.fadeOut"
      :leave-to-class="s.fadeOut"
      :enter-active-class="s.fading"
      :leave-active-class="s.fading"
    >
      <Card v-if="picked" :key="picked.name" :class="s.side">
        <div :class="[s.row, s.spread]" style="align-items: flex-start">
          <span :class="s.row">
            <span :class="[s.avatar, s.avatarLarge, picked.certified ? s['pace-ahead'] : s['pace-inactive']]">
              {{ initials(picked.name) }}
            </span>
            <span>
              <span :class="s.subtitle" style="display: block; font-size: 18px">{{ picked.name }}</span>
              <Small>Last active {{ shortDate(picked.lastActive) }}</Small>
            </span>
          </span>
          <Tip text="Back to who stopped partway">
            <button type="button" :class="s.undo" aria-label="Close" @click="learner = null">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </Tip>
        </div>
        <div :class="s.row" style="gap: 8px">
          <Badge v-if="picked.certified" tone="outline">Earned the certificate</Badge>
          <Badge v-else>Stopped partway</Badge>
          <Small v-if="picked.certified">On {{ picked.certified }}</Small>
          <Small v-else>At {{ progress.unit }} {{ picked.stoppedAt }}</Small>
        </div>
        <div :class="s.learnerPath" :style="{ gridTemplateColumns: `repeat(${progress.of}, minmax(0, 1fr))` }">
          <Tip
            v-for="session in stops"
            :key="session"
            :text="`${stopName(session)} · ${cellStates[cell(picked, session)]}`"
          >
            <span :class="[s.pathCell, s[`cell-${cell(picked, session)}`]]" />
          </Tip>
        </div>
        <div :class="s.row" style="gap: 14px; flex-wrap: wrap">
          <span :class="s.legend"><i :class="s['cell-done']" />Approved</span>
          <template v-if="!picked.certified">
            <span :class="s.legend"><i :class="s['cell-stopped']" />Stopped here</span>
            <span :class="s.legend"><i :class="s['cell-locked']" />Never reached</span>
          </template>
        </div>
        <template v-if="picked.certified">
          <span v-if="downloaded.has(picked.name)" :class="[s.row, s.sent]">
            <UIcon name="i-lucide-check" class="size-4" /> Certificate downloaded
          </span>
          <Tip v-else :text="`${first(picked.name)}'s certificate for ${cohort.program}`">
            <Button
              variant="secondary"
              size="sm"
              class="shrink-0 self-start whitespace-nowrap"
              @click="download(picked.name)"
            >
              <UIcon name="i-lucide-download" class="size-4" /> Download Certificate
            </Button>
          </Tip>
        </template>
      </Card>

      <Card v-else key="stopped" :class="s.side">
        <span :class="s.row">
          <span :class="s.label">Stopped partway</span>
          <Tip :text="`Learners who never finished ${progress.unit} ${progress.of}`">
            <Badge>{{ stopped.length }}</Badge>
          </Tip>
        </span>
        <div :class="s.list">
          <div v-for="person in stopped" :key="person.name">
            <Tip :text="`See ${first(person.name)}'s path through the ${unit}s`">
              <button type="button" :class="[s.row, s.updateWho]" @click="pickLearner(person.name)">
                <span :class="[s.avatar, s['pace-inactive']]">{{ initials(person.name) }}</span>
                <span>
                  <span style="display: block">{{ person.name }}</span>
                  <Small>Last active {{ shortDate(person.lastActive) }}</Small>
                </span>
              </button>
            </Tip>
            <Tip :text="`${stopName(person.stoppedAt as number)} · Click to show who stopped here`">
              <button type="button" :class="s.updateTask" @click="pickStop(endedAt(person))">
                {{ progress.unit }} {{ person.stoppedAt }}
              </button>
            </Tip>
          </div>
        </div>
      </Card>
    </Transition>
  </div>
</template>
