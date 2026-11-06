<script setup lang="ts">
import s from './wire.module.css'

// A provider or file icon stand-in.
defineProps<{ square?: boolean }>()
</script>

<template>
  <span :class="[s.icon, square && s.square]" />
</template>
