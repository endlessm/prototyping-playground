<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import Marker from './Marker.vue'
import s from './ui.module.css'

// The walkthrough's grey routing boxes. Each outcome links to the screen it leads to.
// A disabled row is an outcome not built yet: greyed like a disabled field.
// A note's marker sits in the box's heading, so the box keeps the column's full width.
defineProps<{ title: string; rows: { label: string; to?: string; disabled?: boolean }[]; flow?: number; note?: number }>()
</script>

<template>
  <div :class="s.logic">
    <p>
      {{ title }}
      <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
    </p>
    <template v-for="row in rows" :key="row.label">
      <span v-if="row.disabled" :class="s.logicDisabled" aria-disabled="true">{{ row.label }}</span>
      <PrototypeLink v-else-if="row.to" :to="row.to">{{ row.label }}</PrototypeLink>
      <span v-else>{{ row.label }}</span>
    </template>
  </div>
</template>
