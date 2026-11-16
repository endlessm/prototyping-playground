<script setup lang="ts">
import Button from './Button.vue'
import Card from './Card.vue'
import Marker from './Marker.vue'
import Meter from './Meter.vue'
import Small from './Small.vue'
import TextLink from './TextLink.vue'
import type { Cohort } from './team'
import s from './ui.module.css'

// A cohort's one join link and code, with its seats and the day it stops working. Before anyone joins, Copy Link
// is the page's main action; after, it steps back.
defineProps<{ cohort: Cohort; taken: number; main?: boolean; walkthrough?: boolean }>()
</script>

<template>
  <Card>
    <div :class="[s.stack, s.tight]">
      <span :class="s.small">Join link</span>
      <div :class="s.row">
        <span :class="[s.input, s.grow]" style="display: flex; align-items: center; background: var(--es-elevated)">
          studio.endlessstudios.com/signup/?code={{ cohort.code }}
        </span>
        <Button :variant="main ? 'primary' : 'secondary'">Copy Link</Button>
      </div>
    </div>
    <span :class="s.row">
      <span :class="s.label">Enrollment code</span>
      <strong style="font-size: 16px">{{ cohort.code }}</strong>
    </span>
    <div :class="[s.row, s.spread, s.wrap]" style="border-top: 1px solid var(--es-border-muted); padding-top: 12px">
      <span :class="s.row">
        <Meter
          :parts="[
            { value: taken, label: 'seats taken', tone: 'progress' },
            { value: cohort.seats - taken, label: 'seats free', tone: 'track' },
          ]"
          style="width: 120px"
        />
        <Small>{{ taken }} of {{ cohort.seats }} seats taken · Link expires {{ cohort.linkExpires }}</Small>
        <Marker v-if="walkthrough" :flow="5" :n="2" />
      </span>
      <TextLink to="Hi-Fi/5 Cohort/5.6 Cohort Settings">Change in Settings</TextLink>
    </div>
  </Card>
</template>
