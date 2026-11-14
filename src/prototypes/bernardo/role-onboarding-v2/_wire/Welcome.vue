<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import Lead from './Lead.vue'
import Marker from './Marker.vue'
import Subtitle from './Subtitle.vue'
import { firstSteps, roles, view, type RoleKey } from './world'
import s from './wire.module.css'

// The one-time card on top of the place a new role is about: the role, who added the person, and the first things to
// do. The first step leads to the flow's task screen; `done` ticks it once the task is finished.
const props = defineProps<{
  role: RoleKey
  done?: boolean
  note?: number
  /** A role gained by creating something, which has no invite: its label, its line and its steps. */
  gained?: { label: string; lead: string; steps: string[]; to?: string }
}>()

const r = roles[props.role]
const label = props.gained?.label ?? r.label
const lead = props.gained?.lead ?? `${r.by.name} added you on Nov 12. Welcome to ${r.entity}.`
const steps = props.gained?.steps ?? firstSteps[props.role]
const to = props.gained ? props.gained.to : view(props.role, 4)
</script>

<template>
  <div :class="s.roWelcome">
    <div :class="[s.stack, s.tight]">
      <div :class="s.row">
        <Subtitle>You're now {{ label }}</Subtitle>
        <Marker v-if="note" :flow="r.flow" :n="note" />
      </div>
      <Lead>{{ lead }}</Lead>
      <span :class="s.small" style="margin-top: auto"><button type="button" :class="s.link">Dismiss</button></span>
    </div>
    <ol :class="s.roSteps">
      <li v-for="(step, i) in steps" :key="step" :class="done && i === 0 && s.roStepDone">
        <span />
        <PrototypeLink v-if="i === 0 && !done && to" :to="to" :class="s.link">{{ step }}</PrototypeLink>
        <span v-else>{{ step }}</span>
      </li>
    </ol>
  </div>
</template>
