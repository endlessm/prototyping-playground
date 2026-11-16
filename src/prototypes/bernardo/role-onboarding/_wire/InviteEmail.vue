<script setup lang="ts">
import Bullets from './Bullets.vue'
import Button from './Button.vue'
import Lead from './Lead.vue'
import Marker from './Marker.vue'
import Small from './Small.vue'
import { ORG, roles, view, type RoleKey } from './world'
import s from './wire.module.css'

// The invite, as it arrives in the person's inbox: who gave which role in which place, what the role can do, and one
// button. Every role's invite has the same shape; only the words change.
const props = defineProps<{ role: RoleKey }>()

const r = roles[props.role]
const where = r.level === 'Organization' ? r.entity : `${r.entity}, ${ORG}`
</script>

<template>
  <div :class="s.page">
    <div :class="s.roEmail">
      <div :class="s.roEmailBar">● ● ●&nbsp;&nbsp;Inbox</div>
      <div :class="s.roEmailHead">
        <span>From</span>
        <span>{{ r.by.name }} via Endless Studios &lt;no-reply@endlessstudios.com&gt;</span>
        <span>To</span>
        <span>{{ r.person.email }}</span>
        <span>Subject</span>
        <strong>{{ r.by.name }} added you as {{ r.label }} of {{ r.entity }}</strong>
      </div>
      <div :class="s.roEmailBody">
        <span>∞ Endless</span>
        <div :class="s.heading">
          <h1 :class="s.title">You're invited to {{ r.entity }}</h1>
          <Marker :flow="r.flow" :n="1" />
        </div>
        <Lead>
          {{ r.by.name }} ({{ r.byRole }}{{ r.byRole === 'Endless Admin' ? ' at Endless Access' : '' }}) added you as
          <b>{{ r.label }}</b> of {{ where }}.
        </Lead>
        <div :class="[s.stack, s.tight]">
          <span :class="s.label">As {{ r.label }}, you can:</span>
          <Bullets :items="r.can" />
        </div>
        <Button :to="view(role, 2)" style="align-self: flex-start">Accept Invite</Button>
        <Small>This invite expires in 14 days. Didn't expect it? You can ignore this email.</Small>
      </div>
    </div>
  </div>
</template>
