<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import s from './wire.module.css'

// A No / Yes switch whose options lead to other screens or change the current one.
defineProps<{ options: { label: string; on?: boolean; to?: string; onClick?: () => void }[] }>()
</script>

<template>
  <span :class="s.segmented">
    <template v-for="option in options" :key="option.label">
      <span v-if="option.on" :class="s.segmentOn">{{ option.label }}</span>
      <PrototypeLink v-else-if="option.to" :to="option.to">{{ option.label }}</PrototypeLink>
      <button v-else-if="option.onClick" type="button" @click="option.onClick">{{ option.label }}</button>
      <span v-else>{{ option.label }}</span>
    </template>
  </span>
</template>
