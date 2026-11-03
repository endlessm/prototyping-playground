<script setup lang="ts">
import Lead from './Lead.vue'
import Marker from './Marker.vue'
import Subtitle from './Subtitle.vue'
import s from './wire.module.css'

defineProps<{ title: string; lead: string; note?: number }>()
</script>

<template>
  <div :class="[s.stack, s.tight]">
    <div :class="s.row">
      <Subtitle>{{ title }}</Subtitle>
      <Marker v-if="note" :flow="4" :n="note" />
    </div>
    <Lead>{{ lead }}</Lead>
  </div>
</template>
