<!-- @studio-id 2yf4sdveb26795g4 -->
<!-- @lofi -->
<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import Badge from './_wire/Badge.vue'
import Lead from './_wire/Lead.vue'
import Marker from './_wire/Marker.vue'
import Small from './_wire/Small.vue'
import Subtitle from './_wire/Subtitle.vue'
import Title from './_wire/Title.vue'
import { roleList, view, type Level } from './_wire/world'
import s from './_wire/wire.module.css'

// The nine roles by level, each with who receives it here, who awards it, and a link to its flow.
const levels: Level[] = ['Organization', 'Team', 'Cohort']
</script>

<template>
  <div :class="s.page">
    <div :class="[s.stack, s.roEmail]" style="padding: 28px 32px 32px">
      <div :class="s.row">
        <Title>Role Onboarding</Title>
        <Badge tone="outline">Proposed</Badge>
        <Marker :flow="0" :n="1" />
      </div>
      <div :class="s.row">
        <Lead>Invite → Accept → Welcome → First task, for each educator role.</Lead>
        <Marker :flow="0" :n="2" />
      </div>
      <div :class="s.columns3" style="align-items: start; gap: 16px">
        <section v-for="level in levels" :key="level" :class="[s.stack, s.tight]">
          <Subtitle>{{ level }}</Subtitle>
          <PrototypeLink
            v-for="r in roleList.filter((role) => role.level === level)"
            :key="r.key"
            :to="view(r.key, 1)"
            :class="[s.card, s.stack, s.tight]"
            style="color: inherit; text-decoration: none"
          >
            <span :class="s.row" style="justify-content: space-between">
              <b>{{ r.flow }}. {{ r.label }}</b>
              <span :class="s.small">{{ r.person.name }}</span>
            </span>
            <Small>Awarded by {{ r.awardedBy }}</Small>
            <Small>Here: {{ r.by.name }} ({{ r.byRole }})</Small>
          </PrototypeLink>
        </section>
      </div>
    </div>
  </div>
</template>
