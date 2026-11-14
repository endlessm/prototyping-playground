<script setup lang="ts">
import Marker from './Marker.vue'
import s from './wire.module.css'

defineProps<{ note?: number; flow?: number }>()
</script>

<template>
  <div :class="s.heading">
    <h1 :class="s.title"><slot /></h1>
    <Marker v-if="note && flow !== undefined" :flow="flow" :n="note" />
  </div>
</template>
