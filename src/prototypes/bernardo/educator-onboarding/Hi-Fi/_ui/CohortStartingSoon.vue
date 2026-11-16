<script setup lang="ts">
import Button from './Button.vue'
import Marker from './Marker.vue'
import Meter from './Meter.vue'
import Small from './Small.vue'
import { type Cohort, godotLearners } from './team'
import s from './ui.module.css'

// Starting soon: how long until the first session, what still needs doing before it (the join link is one of
// those things, so it lives there), and who's in so far, filling the seats.
const props = defineProps<{ cohort: Cohort; walkthrough?: boolean }>()
const emit = defineEmits<{ inviteFacilitators: [] }>()

const facilitators = props.cohort.facilitators ?? []
</script>

<template>
  <div :class="[s.panel, s.row]" style="gap: 16px">
    <UIcon name="i-lucide-calendar-clock" class="size-6 shrink-0" />
    <span :class="[s.stack, s.tight]" style="gap: 2px">
      <strong>Starts in 17 days, on Tuesday, Apr 6</strong>
      <span>The first session unlocks for every learner that day.</span>
    </span>
  </div>

  <div :class="[s.stack, s.tight]">
    <div :class="s.row">
      <span :class="s.label">Before Apr 6</span>
      <Marker v-if="walkthrough" :flow="5" :n="9" />
    </div>
    <div :class="s.list" style="border: 1px solid var(--es-border); border-radius: 16px; padding: 0 12px; background: #fff">
      <div>
        <span :class="s.row">
          <UIcon name="i-lucide-circle-check" class="size-5 shrink-0" style="color: var(--es-lime-700)" />
          <span>Program Selected: <strong>{{ cohort.program }}</strong></span>
        </span>
      </div>
      <div style="flex-direction: column; align-items: stretch; gap: 10px">
        <span :class="s.row">
          <UIcon name="i-lucide-circle-check" class="size-5 shrink-0" style="color: var(--es-lime-700)" />
          <span>Join link shared</span>
        </span>
        <div :class="[s.stack, s.tight]" style="padding-left: 32px">
          <div :class="s.row">
            <span :class="[s.input, s.grow]" style="display: flex; align-items: center; background: var(--es-elevated)">
              studio.endlessstudios.com/signup/?code={{ cohort.code }}
            </span>
            <Button variant="secondary">Copy Link</Button>
          </div>
          <Small>Enrollment code {{ cohort.code }} · Expires {{ cohort.linkExpires }}</Small>
        </div>
      </div>
      <div v-if="!facilitators.length">
        <span :class="s.row">
          <UIcon name="i-lucide-circle-dashed" class="size-5 shrink-0 text-dimmed" />
          <span>
            No facilitator yet
            <Small style="display: block">Optional: someone to run sessions with you.</Small>
          </span>
        </span>
        <Button variant="secondary" size="sm" class="shrink-0 whitespace-nowrap" @click="emit('inviteFacilitators')">
          Invite Facilitators
        </Button>
      </div>
    </div>
  </div>

  <div :class="[s.stack, s.tight]">
    <div :class="[s.row, s.spread, s.wrap]">
      <span :class="s.label">Who's in</span>
      <span :class="s.row" style="gap: 10px">
        <Meter
          :parts="[
            { value: cohort.joined, label: 'seats taken', tone: 'progress' },
            { value: cohort.seats - cohort.joined, label: 'seats free', tone: 'track' },
          ]"
          style="width: 160px"
        />
        <Small>{{ cohort.joined }} of {{ cohort.seats }} seats taken</Small>
      </span>
    </div>
    <table :class="s.table">
      <thead>
        <tr>
          <th>Learner</th>
          <th>Email</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="learner in godotLearners" :key="learner.name">
          <td>{{ learner.name }}</td>
          <td>{{ learner.email }}</td>
          <td>{{ learner.joined }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
