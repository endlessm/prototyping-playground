<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import Card from './Card.vue'
import Marker from './Marker.vue'
import Small from './Small.vue'
import Tip from './Tip.vue'
import {
  type Cohort,
  godotSessions,
  type Pace,
  springApproved,
  springProgress,
  springSubmissions,
  type Submission,
  type Update,
} from './team'
import s from './ui.module.css'

// Running: the join link has closed, so the page turns to the learners. On top, the class's journey through the
// sessions, with each learner standing on the one they're on and a count of updates waiting at each stop. Below,
// those updates as a review queue Maya works through in place (approve, or answer with feedback), and beside it
// whoever needs a nudge, or the learner she picked on the journey. Picking a stop or a learner narrows the queue.
const props = defineProps<{ cohort: Cohort; walkthrough?: boolean }>()

type Review = { state: 'approved' } | { state: 'feedback'; text: string }

const progress = props.cohort.progress ?? { at: 0, of: 0, unit: 'Session' }
const stops = Array.from({ length: progress.of }, (_, index) => index + 1)

const stop = ref<number | null>(null)
const learner = ref<string | null>(null)
const reviews = reactive<Record<string, Review>>({})
const writing = ref<string | null>(null)
const draft = ref('')
const reminded = reactive(new Set<string>())

const unit = progress.unit.toLowerCase()
const paces: Record<Pace, { label: string; hint: string; tone?: 'solid' | 'outline' }> = {
  ahead: { label: 'Ahead', hint: `Past the ${unit} most of the class is on` },
  'on track': { label: 'On track', hint: `On the ${unit} most of the class is on` },
  behind: { label: 'Behind', hint: `A ${unit} or more behind the class`, tone: 'outline' },
  inactive: { label: 'Inactive', hint: 'No work in over a week', tone: 'solid' },
}

const updates: Record<Update, { label: string; icon: string }> = {
  inreview: { label: 'Submitted for Completion', icon: 'i-lucide-flag' },
  needhelp: { label: 'Need help', icon: 'i-lucide-life-buoy' },
  inprogress: { label: 'Progress Update', icon: 'i-lucide-message-circle' },
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
const paceClass = (pace: Pace) => s[`pace-${pace.replace(' ', '-')}`]

const farthest = Math.max(...springProgress.map((person) => person.at))
const pending = computed(() => springSubmissions.filter((item) => !reviews[item.id]))
const reviewed = computed(() => springSubmissions.filter((item) => reviews[item.id]))
const queue = computed(() =>
  pending.value.filter(
    (item) => (!stop.value || item.workshop === stop.value) && (!learner.value || item.learner === learner.value),
  ),
)
const waitingAt = (workshop: number) => pending.value.filter((item) => item.workshop === workshop).length
const at = (workshop: number) => springProgress.filter((person) => person.at === workshop)
const nudge = springProgress.filter((person) => person.pace === 'behind' || person.pace === 'inactive')
const picked = computed(() => springProgress.find((person) => person.name === learner.value))

const first = (name: string) => name.split(' ')[0]
const stopName = (workshop: number) => `${progress.unit} ${workshop}: ${godotSessions[workshop - 1]}`
const quiet = springProgress.filter((person) => person.pace === 'inactive')
const activeHint = quiet.length
  ? `Quiet this week: ${quiet.map((person) => `${person.name}, last active ${person.lastActive}`).join('; ')}`
  : 'Everyone worked on a session this week'
const classHint = `${stopName(progress.at)} · ${at(progress.at)
  .map((person) => first(person.name))
  .join(', ')}`
const waitingHint = computed(() => {
  const counts = (Object.keys(updates) as Update[])
    .map((type) => [type, pending.value.filter((item) => item.type === type).length] as const)
    .filter(([, count]) => count)
  return counts.length
    ? counts.map(([type, count]) => `${count} ${updates[type].label.toLowerCase()}`).join(', ')
    : 'Nothing waiting'
})
const stopHint = (workshop: number) =>
  [
    stopName(workshop),
    waitingAt(workshop) && `${waitingAt(workshop)} waiting for you`,
    stop.value === workshop ? 'Click to show every update' : 'Click to show only its updates',
  ]
    .filter(Boolean)
    .join(' · ')
const updateHints: Record<Update, (name: string) => string> = {
  inreview: (name) => `${name} says this ${unit} is done. Approve it, or give feedback to ask for changes.`,
  needhelp: (name) => `${name} is stuck and asked you for help.`,
  inprogress: (name) => `${name} shared how it's going. Nothing to approve; feedback is optional.`,
}
const cellStates: Record<string, string> = {
  done: 'Approved',
  waiting: 'Waiting for you',
  current: 'Working on it',
  locked: 'Not unlocked yet',
}

function cell(name: string, workshop: number, current: number) {
  const approved = (springApproved[name] ?? []).includes(workshop)
  const reviewedNow = springSubmissions.some(
    (item) =>
      item.learner === name &&
      item.workshop === workshop &&
      item.type === 'inreview' &&
      reviews[item.id]?.state === 'approved',
  )
  if (approved || reviewedNow) return 'done'
  if (pending.value.some((item) => item.learner === name && item.workshop === workshop)) return 'waiting'
  if (workshop <= current) return 'current'
  return 'locked'
}

function pickStop(workshop: number) {
  stop.value = stop.value === workshop ? null : workshop
}

function pickLearner(name: string) {
  learner.value = learner.value === name ? null : name
}

function approve(item: Submission) {
  reviews[item.id] = { state: 'approved' }
}

function openFeedback(item: Submission) {
  writing.value = item.id
  draft.value = ''
}

function sendFeedback(item: Submission) {
  reviews[item.id] = { state: 'feedback', text: draft.value.trim() }
  writing.value = null
}

function undo(item: Submission) {
  delete reviews[item.id]
}
</script>

<template>
  <Card>
    <div :class="[s.row, s.spread]">
      <span :class="s.row">
        <span :class="s.label">Class journey</span>
        <Marker v-if="walkthrough" :flow="5" :n="10" />
      </span>
      <span :class="s.row" style="gap: 20px">
        <Tip :text="activeHint">
          <Small>
            <b :class="s.figure">{{ cohort.active }} of {{ cohort.joined }}</b> active this week
          </Small>
        </Tip>
        <Tip :text="classHint">
          <Small>
            Most are on <b :class="s.figure">{{ progress.unit }} {{ progress.at }}</b> of {{ progress.of }}
          </Small>
        </Tip>
      </span>
    </div>

    <div :class="s.track" :style="{ '--stops': progress.of, '--reached': (farthest - 1) / (progress.of - 1) }">
      <div v-for="workshop in stops" :key="workshop" :class="s.stop">
        <div :class="s.stopLearners">
          <Tip
            v-for="person in at(workshop)"
            :key="person.name"
            :text="`${person.name} · ${paces[person.pace].label}, last active ${person.lastActive}`"
          >
            <button
              type="button"
              :class="[s.avatar, s.traveller, paceClass(person.pace), learner === person.name && s.travellerOn]"
              :aria-pressed="learner === person.name"
              :aria-label="person.name"
              @click="pickLearner(person.name)"
            >
              {{ initials(person.name) }}
            </button>
          </Tip>
        </div>
        <Tip :text="stopHint(workshop)">
          <button
            type="button"
            :class="[
              s.node,
              workshop <= farthest && s.nodeReached,
              workshop === progress.at && s.nodeClass,
              stop === workshop && s.nodeOn,
            ]"
            :aria-pressed="stop === workshop"
            :aria-label="stopName(workshop)"
            @click="pickStop(workshop)"
          >
            {{ workshop }}
            <span v-if="waitingAt(workshop)" :class="s.nodeCount">{{ waitingAt(workshop) }}</span>
          </button>
        </Tip>
        <Tip v-if="workshop === progress.at" :text="`Most of the class is on ${progress.unit} ${progress.at}`">
          <span :class="s.stopTag">Class</span>
        </Tip>
      </div>
    </div>
  </Card>

  <div :class="s.runColumns">
    <div :class="[s.stack, s.tight]">
      <div :class="[s.row, s.spread]" style="min-height: 32px">
        <span :class="s.row">
          <span :class="s.label">Waiting for you</span>
          <Tip :text="waitingHint">
            <Badge :tone="pending.length ? 'solid' : undefined">{{ pending.length }}</Badge>
          </Tip>
        </span>
        <span :class="s.row" style="gap: 8px">
          <Tip v-if="stop" :text="`Show updates from every ${unit}`">
            <button type="button" :class="s.filter" @click="stop = null">
              {{ progress.unit }} {{ stop }} · {{ godotSessions[stop - 1] }}
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
          </Tip>
          <Tip v-if="learner" text="Show updates from the whole class">
            <button type="button" :class="s.filter" @click="learner = null">
              {{ learner }}
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
          </Tip>
        </span>
      </div>

      <TransitionGroup
        tag="div"
        :class="s.queue"
        :enter-from-class="s.fadeOut"
        :leave-to-class="s.fadeOut"
        :enter-active-class="s.fading"
        :leave-active-class="s.fadingLeave"
        :move-class="s.fading"
      >
        <article v-for="item in queue" :key="item.id" :class="s.update">
          <div :class="[s.row, s.spread]" style="align-items: flex-start">
            <Tip :text="`See ${first(item.learner)}'s path through the ${unit}s`">
              <button type="button" :class="[s.row, s.updateWho]" @click="pickLearner(item.learner)">
                <span :class="s.avatar">{{ initials(item.learner) }}</span>
                <span>
                  <span :class="s.label" style="display: block">{{ item.learner }}</span>
                  <Small>{{ item.when }}</Small>
                </span>
              </button>
            </Tip>
            <Tip :text="updateHints[item.type](first(item.learner))">
              <span :class="[s.kind, s[`kind-${item.type}`]]">
                <UIcon :name="updates[item.type].icon" class="size-3.5" />
                {{ updates[item.type].label }}
              </span>
            </Tip>
          </div>
          <Tip :text="`Show only ${progress.unit} ${item.workshop}'s updates`">
            <button type="button" :class="s.updateTask" @click="pickStop(item.workshop)">
              {{ progress.unit }} {{ item.workshop }} · {{ godotSessions[item.workshop - 1] }}
            </button>
          </Tip>
          <p :class="s.updateNote">{{ item.note }}</p>

          <div v-if="writing === item.id" :class="[s.stack, s.tight]">
            <textarea
              v-model="draft"
              :class="s.input"
              rows="3"
              :placeholder="`Write to ${item.learner.split(' ')[0]}…`"
              style="height: auto; padding-top: 10px; resize: vertical"
            />
            <div :class="s.row" style="justify-content: flex-end; gap: 8px">
              <Button variant="ghost" size="sm" @click="writing = null">Cancel</Button>
              <Button variant="secondary" size="sm" class="shrink-0 whitespace-nowrap" @click="sendFeedback(item)">
                Send Feedback
              </Button>
            </div>
          </div>
          <div v-else :class="s.row" style="gap: 8px">
            <Tip
              v-if="item.type === 'inreview'"
              :text="`Marks ${progress.unit} ${item.workshop} done for ${first(item.learner)}`"
            >
              <Button variant="secondary" size="sm" class="shrink-0 whitespace-nowrap" @click="approve(item)">
                <UIcon name="i-lucide-check" class="size-4" /> Approve
              </Button>
            </Tip>
            <Tip
              :text="
                item.type === 'needhelp'
                  ? `Answer ${first(item.learner)} on ${progress.unit} ${item.workshop}`
                  : `${first(item.learner)} gets your note on ${progress.unit} ${item.workshop}`
              "
            >
              <Button
                :variant="item.type === 'inreview' ? 'ghost' : 'secondary'"
                size="sm"
                class="shrink-0 whitespace-nowrap"
                @click="openFeedback(item)"
              >
                {{ item.type === 'needhelp' ? 'Reply' : 'Give Feedback' }}
              </Button>
            </Tip>
          </div>
        </article>

        <div v-if="!queue.length" key="empty" :class="s.caughtUp">
          <span :class="s.caughtUpIcon"><UIcon name="i-lucide-party-popper" class="size-6" /></span>
          <span :class="s.label">{{ pending.length ? 'Nothing waiting here' : 'All caught up' }}</span>
          <Small v-if="pending.length">{{ pending.length }} more in the rest of the class.</Small>
        </div>
      </TransitionGroup>

      <div v-if="reviewed.length" :class="s.reviewed">
        <div v-for="item in reviewed" :key="item.id" :class="[s.row, s.spread]">
          <span :class="s.row" style="gap: 8px">
            <UIcon
              :name="reviews[item.id]?.state === 'approved' ? 'i-lucide-circle-check' : 'i-lucide-message-square-reply'"
              :class="['size-4 shrink-0', reviews[item.id]?.state === 'approved' ? 'text-success' : 'text-secondary']"
            />
            <Small>
              <template v-if="reviews[item.id]?.state === 'approved'">
                Approved {{ item.learner.split(' ')[0] }}'s {{ godotSessions[item.workshop - 1] }}
              </template>
              <template v-else>
                Answered {{ item.learner.split(' ')[0] }} on {{ godotSessions[item.workshop - 1] }}
              </template>
            </Small>
          </span>
          <Tip text="Put it back in the queue">
            <button type="button" :class="s.undo" @click="undo(item)">Undo</button>
          </Tip>
        </div>
      </div>
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
            <span :class="[s.avatar, s.avatarLarge, paceClass(picked.pace)]">{{ initials(picked.name) }}</span>
            <span>
              <span :class="s.subtitle" style="display: block; font-size: 18px">{{ picked.name }}</span>
              <Small>Last active {{ picked.lastActive }}</Small>
            </span>
          </span>
          <Tip text="Back to who needs a nudge">
            <button type="button" :class="s.undo" aria-label="Close" @click="learner = null">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </Tip>
        </div>
        <div :class="s.row" style="gap: 8px">
          <Tip :text="paces[picked.pace].hint">
            <Badge :tone="paces[picked.pace].tone">{{ paces[picked.pace].label }}</Badge>
          </Tip>
          <Small>On {{ progress.unit }} {{ picked.at }} · {{ godotSessions[picked.at - 1] }}</Small>
        </div>
        <div :class="s.learnerPath">
          <Tip
            v-for="workshop in stops"
            :key="workshop"
            :text="`${stopName(workshop)} · ${cellStates[cell(picked.name, workshop, picked.at)]}`"
          >
            <span :class="[s.pathCell, s[`cell-${cell(picked.name, workshop, picked.at)}`]]" />
          </Tip>
        </div>
        <div :class="s.row" style="gap: 14px; flex-wrap: wrap">
          <span :class="s.legend"><i :class="s['cell-done']" />Approved</span>
          <span :class="s.legend"><i :class="s['cell-waiting']" />Waiting for you</span>
          <span :class="s.legend"><i :class="s['cell-current']" />Working on it</span>
        </div>
        <Tip
          v-if="!reminded.has(picked.name)"
          :text="`Reminds ${first(picked.name)} to pick up ${progress.unit} ${picked.at}`"
        >
          <Button
            variant="secondary"
            size="sm"
            class="shrink-0 self-start whitespace-nowrap"
            @click="reminded.add(picked.name)"
          >
            <UIcon name="i-lucide-bell" class="size-4" /> Send Reminder
          </Button>
        </Tip>
        <span v-else :class="[s.row, s.sent]"><UIcon name="i-lucide-check" class="size-4" /> Reminder sent</span>
      </Card>

      <Card v-else key="nudge" :class="s.side">
        <span :class="s.row">
          <span :class="s.label">Needs a nudge</span>
          <Tip text="Learners who are behind the class or quiet for over a week">
            <Badge>{{ nudge.length }}</Badge>
          </Tip>
        </span>
        <div :class="s.list">
          <div v-for="person in nudge" :key="person.name">
            <Tip :text="`See ${first(person.name)}'s path through the ${unit}s`">
              <button type="button" :class="[s.row, s.updateWho]" @click="pickLearner(person.name)">
                <span :class="[s.avatar, paceClass(person.pace)]">{{ initials(person.name) }}</span>
                <span>
                  <span style="display: block">{{ person.name }}</span>
                  <Small v-if="person.pace === 'inactive'">Quiet since {{ person.lastActive }}</Small>
                  <Small v-else>One {{ unit }} behind the class</Small>
                </span>
              </button>
            </Tip>
            <Tip
              v-if="!reminded.has(person.name)"
              :text="`Reminds ${first(person.name)} to pick up ${progress.unit} ${person.at}`"
            >
              <Button
                variant="secondary"
                size="sm"
                class="shrink-0 whitespace-nowrap"
                @click="reminded.add(person.name)"
              >
                Send Reminder
              </Button>
            </Tip>
            <span v-else :class="[s.row, s.sent]"><UIcon name="i-lucide-check" class="size-4" /> Sent</span>
          </div>
        </div>
      </Card>
    </Transition>
  </div>
</template>
