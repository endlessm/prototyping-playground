<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import s from './wire.module.css'

// The walkthrough's grey routing boxes. Each outcome links to the screen it leads to.
defineProps<{ title: string; rows: { label: string; to?: string }[] }>()
</script>

<template>
  <div :class="s.logic">
    <p>{{ title }}</p>
    <template v-for="row in rows" :key="row.label">
      <PrototypeLink v-if="row.to" :to="row.to">{{ row.label }}</PrototypeLink>
      <span v-else>{{ row.label }}</span>
    </template>
  </div>
</template>
