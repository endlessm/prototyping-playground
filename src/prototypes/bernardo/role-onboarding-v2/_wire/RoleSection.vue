<script setup lang="ts">
import Avatar from './Avatar.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import Marker from './Marker.vue'
import Subtitle from './Subtitle.vue'
import TextLink from './TextLink.vue'
import s from './wire.module.css'

// One role's people on a People tab: the role as the section title, its add button at the right (only for viewers
// who award it), and a row per person with Invited until they accept and Remove for viewers who strip the role.
defineProps<{
  title: string
  people: { name: string; initials: string; email: string; invited?: boolean; you?: boolean }[]
  add?: string
  remove?: boolean
  flow?: number
  note?: number
}>()
defineEmits<{ add: [] }>()
</script>

<template>
  <section :class="[s.stack, s.tight]">
    <div :class="[s.row, s.spread]">
      <div :class="s.row">
        <Subtitle>{{ title }}</Subtitle>
        <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
      </div>
      <Button v-if="add" variant="secondary" @click="$emit('add')">{{ add }}</Button>
    </div>
    <div :class="s.roRows">
      <div v-if="!people.length" style="color: #999">Nobody yet</div>
      <div v-for="p in people" :key="p.email">
        <Avatar>{{ p.initials }}</Avatar>
        <div :class="s.grow">
          {{ p.name }}<template v-if="p.you"> (you)</template>
          <div :class="s.small">{{ p.email }}</div>
        </div>
        <Badge v-if="p.invited">Invited</Badge>
        <TextLink v-if="remove && !p.you">Remove</TextLink>
      </div>
    </div>
  </section>
</template>
